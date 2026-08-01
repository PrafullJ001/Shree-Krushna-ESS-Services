const ServiceRecord = require('../models/ServiceRecord');
const User = require('../models/User');

// @desc  Per-staff totals: acres sprayed, entries added. Admin-only.
// @route GET /api/staff/performance
exports.getStaffPerformance = async (req, res) => {
  try {
    const summary = await ServiceRecord.aggregate([
      { $match: { createdBy: { $ne: null } } },
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
