const express = require('express');
const router = express.Router();
const {
  addExpense,
  getExpenses,
  getStaffList,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/staff-list', protect, getStaffList);
router.get('/', protect, getExpenses);
router.post('/', protect, addExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

module.exports = router;