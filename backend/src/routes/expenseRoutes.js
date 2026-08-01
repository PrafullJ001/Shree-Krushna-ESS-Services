const express = require('express');
const router = express.Router();
const {
  addExpense,
  getExpenses,
  getStaffList,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/staff-list', protect, getStaffList);
router.get('/', protect, getExpenses);
router.post('/', protect, addExpense);

module.exports = router;