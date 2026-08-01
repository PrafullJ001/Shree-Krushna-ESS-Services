const express = require('express');
const router = express.Router();
const {
  addPayment,
  getPaymentsForService,
  getPaymentsForFarmer,
  getPendingPayments,
  updatePayment,
  deletePayment,
  settleAllForFarmer,
  recordBulkPayment,
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

// Staff need to record a payment collected on-site during their own
// service entry (AddService.jsx calls this when "Bill Paid?" = Yes),
// so this one is intentionally NOT admin-only.
router.post('/', addPayment);

router.get('/service/:serviceRecordId', adminOnly, getPaymentsForService);
router.get('/farmer/:farmerId', adminOnly, getPaymentsForFarmer);
router.get('/pending', adminOnly, getPendingPayments);
router.put('/:id', adminOnly, updatePayment);
router.delete('/:id', adminOnly, deletePayment);
router.post('/settle-all/:farmerId', adminOnly, settleAllForFarmer);
router.post('/bulk/:farmerId', adminOnly, recordBulkPayment);

module.exports = router;