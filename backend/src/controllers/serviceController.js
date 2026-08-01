const ServiceRecord = require("../models/ServiceRecord");
const Farmer = require("../models/Farmer");
const Payment = require("../models/Payment");
const User = require("../models/User");

const addService = async (req, res, next) => {
  try {
    const {
      farmer,
      serviceDate,
      billNo,
      village,
      kshetra,
      acres,
      are,
      cropName,
      plotName,
      serviceType,
      ratePerAcre,
      totalBill,
      notes,
      paymentMode,
      assignedStaffId, // admin-only override: which staff this service is credited to
    } = req.body;

    // Farmer and Total Bill are compulsory. Bill No. is optional —
    // the Add Service form lets the user say "No" if there's no bill.
    if (
      !farmer ||
      totalBill === undefined ||
      totalBill === null
    ) {
      return res.status(400).json({
        message:
          "Farmer and Total Bill are required",
      });
    }

    if (Number(totalBill) < 0) {
      return res.status(400).json({
        message: "totalBill cannot be negative",
      });
    }

    const farmerExists =
      await Farmer.findById(farmer);

    if (!farmerExists) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    // Default: whoever is actually logged in (staff or admin) gets credit,
    // exactly as before. Only an admin can override this to attribute the
    // service to a different staff member.
    let createdBy = req.user._id;

    if (req.user.role === "admin" && assignedStaffId) {
      const assignedUser = await User.findById(assignedStaffId);
      if (!assignedUser) {
        return res.status(400).json({
          message: "Selected staff member not found",
        });
      }
      createdBy = assignedUser._id;
    }

    const billImage = req.file
      ? req.file.path
      : undefined;

    const service = new ServiceRecord({
      farmer,
      serviceDate: serviceDate || Date.now(),

      // Save Bill No. in MongoDB (may be empty if not provided)
      billNo: billNo ? String(billNo).trim() : "",

      village,
      kshetra,
      acres,
      are,
      cropName,
      plotName,
      serviceType,
      ratePerAcre,
      totalBill,
      paymentMode,
      billImage,
      notes,
      createdBy,
    });

    service.recalculate();

    await service.save();

    await service.populate(
      "createdBy",
      "name role"
    );

    res.json({
      message: "Service updated",
      service,
    });
  } catch (error) {
    next(error);
  }
};

const getServicesByFarmer = async (
  req,
  res,
  next
) => {
  try {
    const { farmerId } = req.params;

    const farmerExists =
      await Farmer.findById(farmerId);

    if (!farmerExists) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    const services = await ServiceRecord.find({
      farmer: farmerId,
    })
      .populate("createdBy", "name role")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      count: services.length,
      services,
    });
  } catch (error) {
    next(error);
  }
};

const getServiceById = async (
  req,
  res,
  next
) => {
  try {
    const service =
      await ServiceRecord.findById(req.params.id)
        .populate(
          "farmer",
          "name farmerCode village"
        )
        .populate("createdBy", "name role");

    if (!service) {
      return res.status(404).json({
        message: "Service record not found",
      });
    }

    res.status(200).json(service);
  } catch (error) {
    next(error);
  }
};

const updateService = async (
  req,
  res,
  next
) => {
  try {
    const service =
      await ServiceRecord.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Service record not found",
      });
    }

    const isOwner =
      service.createdBy &&
      service.createdBy.toString() ===
        req.user._id.toString();

    const isAdmin =
      req.user.role === "admin";

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message:
          "You can only edit service records you created",
      });
    }

    // If Bill No. is sent while editing,
    // it cannot be empty.
    if (
      req.body.billNo !== undefined &&
      !String(req.body.billNo).trim()
    ) {
      return res.status(400).json({
        message: "Bill No. is required",
      });
    }

    const editableFields = [
      "serviceDate",
      "billNo",
      "village",
      "kshetra",
      "acres",
      "are",
      "cropName",
      "plotName",
      "serviceType",
      "ratePerAcre",
      "totalBill",
      "notes",
      "paymentMode",
    ];

    editableFields.forEach((field) => {
      if (
        req.body[field] !== undefined &&
        req.body[field] !== ""
      ) {
        service[field] = req.body[field];
      }
    });

    // Trim and save edited Bill No. in MongoDB
    if (req.body.billNo !== undefined) {
      service.billNo =
        String(req.body.billNo).trim();
    }

    if (req.file) {
      service.billImage = req.file.path;
    }

    if (
  Number(service.totalBill) < Number(service.amountPaid)
) {
  return res.status(400).json({
    message: `Total bill cannot be less than amount already paid (₹${service.amountPaid})`,
  });
}
    service.recalculate();

    await service.save();

    res.json({
      message: "Service updated",
      service,
    });
  } catch (error) {
    next(error);
  }
};

/*
  Apply discount and create a discount history entry.
  Existing payment logic is not changed.
*/
const applyDiscount = async (
  req,
  res,
  next
) => {
  try {
    const service =
      await ServiceRecord.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Service record not found",
      });
    }

    // Same ownership permission as Edit
    const isOwner =
      service.createdBy &&
      service.createdBy.toString() ===
        req.user._id.toString();

    const isAdmin =
      req.user.role === "admin";

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message:
          "You can only discount service records you created",
      });
    }

    const discountAmount =
      Number(req.body.amount);

    const reason =
      req.body.reason || "";

    if (
      !discountAmount ||
      discountAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Discount amount must be greater than 0",
      });
    }

    const newTotalBill =
      Number(service.totalBill) -
      discountAmount;

    if (
  newTotalBill < Number(service.amountPaid)
) {
  return res.status(400).json({
    message: `New bill cannot be less than amount already paid (₹${service.amountPaid})`,
  });
}

    if (newTotalBill < 0) {
      return res.status(400).json({
        message:
          "Discount cannot exceed the total bill",
      });
    }

    // Reduce service bill
    service.totalBill = newTotalBill;

    // Keep existing notes behavior
    const noteAddition =
      `Discount of ₹${discountAmount} applied${
        reason ? `: ${reason}` : ""
      }`;

    service.notes = service.notes
      ? `${service.notes}\n${noteAddition}`
      : noteAddition;

    // Existing recalculation method
    service.recalculate();

    await service.save();

    // Add discount entry to payment history
    await Payment.create({
      serviceRecord: service._id,
      farmer: service.farmer,
      amount: discountAmount,
      type: "Discount",

      // Required by existing Payment schema structure
      mode: "Cash",

      note:
        reason || "Discount applied",

      receivedBy: req.user?._id,
    });

    await service.populate(
      "createdBy",
      "name role"
    );

    res.json({
      message:
        "Discount applied successfully",
      service,
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (
  req,
  res,
  next
) => {
  try {
    const service =
      await ServiceRecord.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Service record not found",
      });
    }

    const paymentCount =
      await Payment.countDocuments({
        serviceRecord: service._id,
      });

    if (paymentCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${paymentCount} payment(s) recorded against this service. Delete those first.`,
      });
    }

    await service.deleteOne();

    res.json({
      message: "Service deleted",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addService,
  getServicesByFarmer,
  getServiceById,
  updateService,
  applyDiscount,
  deleteService,
};