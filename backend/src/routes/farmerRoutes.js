const express = require('express');
const router = express.Router();
const {
  searchFarmers, checkDuplicate, checkSimilarFarmers, registerFarmer,
  getFarmerProfile, updateFarmer, deleteFarmer,
} = require('../controllers/farmerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/search', searchFarmers);
router.get('/check-duplicate', checkDuplicate);
router.get('/check-similar', checkSimilarFarmers);
router.post('/', registerFarmer);
router.get('/:id', getFarmerProfile);
router.put('/:id', updateFarmer); // staff + admin can edit
router.delete('/:id', adminOnly, deleteFarmer); // delete stays admin-only

module.exports = router;