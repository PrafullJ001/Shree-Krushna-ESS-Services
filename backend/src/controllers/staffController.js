const ServiceRecord = require('../models/ServiceRecord');
const User = require('../models/User');

// @desc  Per-staff totals: acres sprayed, entries added. Admin-only.
//        Optionally filtered by service date range via ?from=&to=
// @route GET /api/staff/performance
exports.getStaffPerformance = async (req, res) => {
  try {
    const { from, to } = req.query;

    const match = { createdBy: { $ne: null } };

    if (from || to) {
      match.serviceDate = {};
      if (from) match.serviceDate.$gte = new Date(from);
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        match.serviceDate.$lte = toEnd;
      }
    }

    const summary = await ServiceRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$createdBy',
          totalAcres: { $sum: { $ifNull: ['$acres', 0] } },
          totalEntries: { $sum: 1 },
          totalBillAmount: { $sum: '$totalBill' },
        },
      },
    ]);

    const userIds = summary.map((s) => s._id);

    const users = await User.find({
      _id: { $in: userIds },
    }).select('name mobile role');

    const merged = summary
      .map((s) => {
        const user = users.find(
          (u) => u._id.toString() === s._id.toString()
        );

        // If the user has been deleted, don't show
        // their old performance as "Unknown"
        if (!user) {
          return null;
        }

        return {
          userId: s._id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          totalAcres: s.totalAcres,
          totalEntries: s.totalEntries,
          totalBillAmount: s.totalBillAmount,
        };
      })
      .filter(Boolean);

    merged.sort((a, b) => b.totalEntries - a.totalEntries);

    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Per-staff totals for ONE user, optionally filtered by service date
//        range via ?from=&to= — used by the individual filter on each
//        staff card so it can be recalculated independently of the others.
// @route GET /api/staff/performance/:userId
exports.getStaffPerformanceForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    const user = await User.findById(userId).select('name mobile role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const match = { createdBy: user._id };

    if (from || to) {
      match.serviceDate = {};
      if (from) match.serviceDate.$gte = new Date(from);
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        match.serviceDate.$lte = toEnd;
      }
    }

    const [summary] = await ServiceRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$createdBy',
          totalAcres: { $sum: { $ifNull: ['$acres', 0] } },
          totalEntries: { $sum: 1 },
          totalBillAmount: { $sum: '$totalBill' },
        },
      },
    ]);

    res.json({
      userId: user._id,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      totalAcres: summary?.totalAcres || 0,
      totalEntries: summary?.totalEntries || 0,
      totalBillAmount: summary?.totalBillAmount || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  List all staff/admin accounts — lightweight, for pickers like
//        Add Service's "Added By" dropdown (no performance aggregation).
//        Now also includes trustedDevices so the Manage Staff Login page
//        can show how many devices a staff member is currently trusted on.
// @route GET /api/staff
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({})
      .select("name role mobile trustedDevices")
      .sort({ name: 1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Sign out a staff member INSTANTLY from all devices, even mid-session.
//        Bumping tokenVersion invalidates every existing token for this user
//        right away — `protect` rejects any request whose token carries an
//        older tokenVersion, on the very next API call they make. Clearing
//        trustedDevices additionally means their next fresh login also
//        requires a new OTP device approval, same as before.
// @route POST /api/staff/:id/signout
exports.signOutStaff = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'staff') {
      return res.status(400).json({
        message: 'Only staff accounts can be signed out this way',
      });
    }

    user.trustedDevices = [];
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({
      message: `${user.name} has been signed out immediately`,
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};