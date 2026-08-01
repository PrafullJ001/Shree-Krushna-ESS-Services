const Farmer = require('../models/Farmer');
const ServiceRecord = require('../models/ServiceRecord');

// @desc  Aggregated stats for the dashboard home screen
// @route GET /api/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalFarmers, totals, recentServices] = await Promise.all([
      Farmer.countDocuments(),

      ServiceRecord.aggregate([
        {
          $group: {
            _id: null,
            totalServiceRecords: { $sum: 1 },
            totalAcres: { $sum: { $ifNull: ['$acres', 0] } },
            totalBillAmount: { $sum: '$totalBill' },
            totalAmountReceived: { $sum: '$amountPaid' },
            totalPendingAmount: { $sum: '$pendingAmount' },
          },
        },
      ]),

      ServiceRecord.find()
  .populate('farmer', 'fullName village mobile')
  .populate('createdBy', 'name role')
  .sort({ updatedAt: -1 }) // most recently added/edited first
  .limit(15),
    ]);

    const summary = totals[0] || {
      totalServiceRecords: 0,
      totalAcres: 0,
      totalBillAmount: 0,
      totalAmountReceived: 0,
      totalPendingAmount: 0,
    };

    res.json({
      totalFarmers,
      totalAcres: summary.totalAcres,
      totalServiceRecords: summary.totalServiceRecords,
      totalBillAmount: summary.totalBillAmount,
      totalAmountReceived: summary.totalAmountReceived,
      totalPendingAmount: summary.totalPendingAmount,
      recentServices,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
