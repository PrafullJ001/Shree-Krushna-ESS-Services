const express = require('express');
const router = express.Router();
const {
  getStaffPerformance,
  getStaffPerformanceForUser,
  getAllStaff,
  signOutStaff,
} = require('../controllers/staffController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getAllStaff);
router.get('/performance', protect, adminOnly, getStaffPerformance);
router.get('/performance/:userId', protect, adminOnly, getStaffPerformanceForUser);
router.post('/:id/signout', protect, adminOnly, signOutStaff);

module.exports = router;