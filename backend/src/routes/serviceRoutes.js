const express = require("express");
const router = express.Router();

const {
  addService,
  getServicesByFarmer,
  getServiceById,
  updateService,
  applyDiscount,
  deleteService,
} = require("../controllers/serviceController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const upload = require(
  "../middleware/uploadMiddleware"
);

router.post(
  "/",
  protect,
  upload.single("billImage"),
  addService
);

router.get(
  "/farmer/:farmerId",
  protect,
  getServicesByFarmer
);

// Discount route
router.post(
  "/:id/discount",
  protect,
  applyDiscount
);

router.get(
  "/:id",
  protect,
  getServiceById
);

router.put(
  "/:id",
  protect,
  upload.single("billImage"),
  updateService
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteService
);

module.exports = router;