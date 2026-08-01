const Expense = require('../models/Expense');
const User = require('../models/User');

const CATEGORIES = [
  'ESS Machine Maintenance',
  'Tractor Maintenance',
  'Pickup Maintenance',
  'Diesel',
  'Staff Expense',
];

// @desc  Add a new expense entry
// @route POST /api/expenses
// @access Admin only
exports.addExpense = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add expenses' });
    }

    const { category, amount, date, staffMember, note } = req.body;

    if (!category || !CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid or missing category' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    if (category === 'Staff Expense' && !staffMember) {
      return res
        .status(400)
        .json({ message: 'Select a staff member for staff expenses' });
    }

    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'Note is required' });
    }

    const expense = await Expense.create({
      category,
      amount: Number(amount),
      date,
      staffMember: category === 'Staff Expense' ? staffMember : null,
      note: note.trim(),
      createdBy: req.user._id,
    });

    const populated = await expense.populate('staffMember', 'name mobile role');

    res.status(201).json({ expense: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  List expenses + per-category totals + staff-wise breakdown,
//        scoped to an optional date range (?from=YYYY-MM-DD&to=YYYY-MM-DD).
//        Falls back to ?year=YYYY if from/to aren't given, for backward
//        compatibility. No range at all returns everything.
// @route GET /api/expenses
// @access Admin only
exports.getExpenses = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view expenses' });
    }

    const { year, from, to } = req.query;
    const filter = {};

    if (from || to) {
      filter.date = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) filter.date.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          filter.date.$lte = toDate;
        }
      }
    } else if (year) {
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);
      filter.date = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(filter)
      .populate('staffMember', 'name mobile role')
      .populate('createdBy', 'name role')
      .sort({ date: -1 });

    const totals = CATEGORIES.reduce((acc, cat) => {
      acc[cat] = 0;
      return acc;
    }, {});

    let grandTotal = 0;
    const staffTotalsMap = {};

    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
      grandTotal += e.amount;

      if (e.category === 'Staff Expense' && e.staffMember) {
        const key = e.staffMember._id.toString();
        if (!staffTotalsMap[key]) {
          staffTotalsMap[key] = {
            staffId: e.staffMember._id,
            name: e.staffMember.name,
            mobile: e.staffMember.mobile,
            total: 0,
            count: 0,
          };
        }
        staffTotalsMap[key].total += e.amount;
        staffTotalsMap[key].count += 1;
      }
    });

    const staffTotals = Object.values(staffTotalsMap).sort((a, b) => b.total - a.total);

    res.json({ expenses, totals, grandTotal, categories: CATEGORIES, staffTotals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  List all staff users, for the Staff Expense picker
// @route GET /api/expenses/staff-list
// @access Admin only
exports.getStaffList = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view staff list' });
    }

    const staff = await User.find({ role: 'staff' }).select('name mobile role');

    res.json({ staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
