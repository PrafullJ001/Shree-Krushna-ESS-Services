const express = require('express');
const router = express.Router();
const { getStaffPerformance, getAllStaff } = require('../controllers/staffController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getAllStaff);
router.get('/performance', protect, adminOnly, getStaffPerformance);

module.exports = router;