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
// @route GET /api/staff
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({}).select("name role mobile").sort({ name: 1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};