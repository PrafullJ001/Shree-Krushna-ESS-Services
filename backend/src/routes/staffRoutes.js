const express = require('express');
const router = express.Router();
const { getStaffPerformance } = require('../controllers/staffController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/performance', protect, adminOnly, getStaffPerformance);

module.exports = router;