const Farmer = require('../models/Farmer');
const ServiceRecord = require('../models/ServiceRecord');

// @desc  Aggregated stats for the dashboard home screen
// @route GET /api/dashboard
// @query from, to     — optional date range filter on serviceDate (YYYY-MM-DD)
// @query search       — optional text match against farmer name / village
exports.getDashboardStats = async (req, res) => {
  try {
    const { from, to, search } = req.query;

    const hasDateFilter = Boolean(from || to);
    const hasSearch = Boolean(search && search.trim());

    const serviceRecordFilter = {};

    if (hasDateFilter) {
      serviceRecordFilter.serviceDate = {};
      if (from) serviceRecordFilter.serviceDate.$gte = new Date(from);
      if (to) {
        // Include the entire "to" day rather than cutting off at midnight
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        serviceRecordFilter.serviceDate.$lte = toDate;
      }
    }

    if (hasSearch) {
      const searchRegex = new RegExp(search.trim(), 'i');

      // Farmer name/village live on the Farmer collection, so resolve
      // matching farmer ids first, then filter ServiceRecord by them.
      const matchingFarmers = await Farmer.find({
        $or: [{ fullName: searchRegex }, { village: searchRegex }],
      }).select('_id');

      serviceRecordFilter.farmer = { $in: matchingFarmers.map((f) => f._id) };
    }

    const [totalFarmers, totals, recentServicesQuery] = await Promise.all([
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

      (() => {
        let query = ServiceRecord.find(serviceRecordFilter)
          .populate('farmer', 'fullName village mobile')
          .populate('createdBy', 'name role')
          .sort({ updatedAt: -1 }); // most recently added/edited first

        // Only cap at 15 for the default, unfiltered view — date-range
        // or search results are returned in full so nothing is hidden.
        if (!hasDateFilter && !hasSearch) {
          query = query.limit(15);
        }

        return query;
      })(),
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
      recentServices: recentServicesQuery,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};