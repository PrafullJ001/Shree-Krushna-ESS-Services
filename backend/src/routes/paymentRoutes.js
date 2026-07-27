const express = require('express');
const router = express.Router();
const {
  addPayment,
  getPaymentsForService,
  getPaymentsForFarmer,
  getPendingPayments,
  deletePayment,
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', addPayment);
router.get('/service/:serviceRecordId', getPaymentsForService);
router.get('/farmer/:farmerId', getPaymentsForFarmer);
router.get('/pending', getPendingPayments);
router.delete('/:id', adminOnly, deletePayment);

module.exports = router;