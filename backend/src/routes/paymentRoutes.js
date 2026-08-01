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

router.post('/', adminOnly, addPayment);
router.get('/service/:serviceRecordId', adminOnly, getPaymentsForService);
router.get('/farmer/:farmerId', adminOnly, getPaymentsForFarmer);
router.get('/pending', adminOnly, getPendingPayments);
router.put('/:id', adminOnly, updatePayment);
router.delete('/:id', adminOnly, deletePayment);
router.post('/settle-all/:farmerId', adminOnly, settleAllForFarmer);
router.post('/bulk/:farmerId', adminOnly, recordBulkPayment);

module.exports = router;