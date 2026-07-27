const Payment = require("../models/Payment");
const ServiceRecord = require("../models/ServiceRecord");

// Convert rupees to integer paise for safe money calculations.
const toPaise = (value) => {
  return Math.round(Number(value) * 100);
};

// Convert integer paise back to rupees.
const fromPaise = (value) => {
  return value / 100;
};

exports.addPayment = async (req, res) => {
  try {
    const {
      serviceRecordId,
      amount,
      mode,
      note,

      // Optional discount fields
      applyDiscount,
      discountAmount,
      discountReason,
    } = req.body;

    const service = await ServiceRecord.findById(
      serviceRecordId
    );

    if (!service) {
      return res.status(404).json({
        message: "Service record not found",
      });
    }

    // Safely normalize entered payment amount.
    const paymentAmountPaise = toPaise(amount);
    const paymentAmount = fromPaise(
      paymentAmountPaise
    );

    if (
      !paymentAmountPaise ||
      paymentAmountPaise <= 0
    ) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const currentBillPaise = toPaise(
      service.totalBill
    );

    const currentPaidPaise = toPaise(
      service.amountPaid
    );

    // Existing payment validation, now using paise.
    if (
      currentPaidPaise + paymentAmountPaise >
      currentBillPaise
    ) {
      return res.status(400).json({
        message: "Payment exceeds pending amount",
      });
    }

    // ---------------------------------------------
    // DISCOUNT VALIDATION
    // ---------------------------------------------

    const shouldApplyDiscount =
      applyDiscount === true ||
      applyDiscount === "true";

    const discountPaise = shouldApplyDiscount
      ? toPaise(discountAmount)
      : 0;

    const discount = fromPaise(
      discountPaise
    );

    if (shouldApplyDiscount) {
      if (
        !discountPaise ||
        discountPaise <= 0
      ) {
        return res.status(400).json({
          message:
            "Discount amount must be greater than 0",
        });
      }

      const amountPaidAfterPaymentPaise =
        currentPaidPaise +
        paymentAmountPaise;

      const totalBillAfterDiscountPaise =
        currentBillPaise -
        discountPaise;

      if (
        totalBillAfterDiscountPaise <
        amountPaidAfterPaymentPaise
      ) {
        return res.status(400).json({
          message:
            "Discount is too high. Final bill cannot be less than the total amount paid.",
        });
      }
    }

    // ---------------------------------------------
    // CREATE NORMAL PAYMENT
    // ---------------------------------------------

    const payment = await Payment.create({
      serviceRecord: service._id,
      farmer: service.farmer,
      amount: paymentAmount,
      mode,
      note,
      type: "Payment",
      receivedBy: req.user?._id,
    });

    // Existing payment logic using safe integer arithmetic.
    service.amountPaid = fromPaise(
      currentPaidPaise +
      paymentAmountPaise
    );

    service.paymentMode = mode;

    // ---------------------------------------------
    // APPLY OPTIONAL DISCOUNT
    // ---------------------------------------------

    let discountEntry = null;

    if (shouldApplyDiscount) {
      // Reduce total bill safely.
      service.totalBill = fromPaise(
        currentBillPaise -
        discountPaise
      );

      // Existing notes logic unchanged.
      const discountNote =
        `Discount of ₹${discount} applied${
          discountReason
            ? `: ${discountReason}`
            : ""
        }`;

      service.notes = service.notes
        ? `${service.notes}\n${discountNote}`
        : discountNote;

      // Existing discount history entry.
      discountEntry = await Payment.create({
        serviceRecord: service._id,
        farmer: service.farmer,
        amount: discount,
        type: "Discount",

        // Kept for compatibility with existing schema.
        mode: "Cash",

        note:
          discountReason ||
          "Discount applied",

        receivedBy: req.user?._id,
      });
    }

    // Existing recalculation logic.
    service.recalculate();

    await service.save();

    res.status(201).json({
      payment,
      discount: discountEntry,
      service,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPaymentsForService = async (
  req,
  res
) => {
  try {
    const payments = await Payment.find({
      serviceRecord:
        req.params.serviceRecordId,
    })
      .populate(
        "receivedBy",
        "name role"
      )
      .sort({ paidOn: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPaymentsForFarmer = async (
  req,
  res
) => {
  try {
    const payments = await Payment.find({
      farmer: req.params.farmerId,
    })
      .populate(
        "serviceRecord",
        "serviceDate cropName totalBill"
      )
      .sort({ paidOn: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPendingPayments = async (
  req,
  res
) => {
  try {
    const records =
      await ServiceRecord.find({
        paymentStatus: {
          $in: [
            "Unpaid",
            "Partially Paid",
          ],
        },
      })
        .populate(
          "farmer",
          "fullName mobile village"
        )
        .populate(
          "createdBy",
          "name role"
        )
        .sort({ updatedAt: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deletePayment = async (
  req,
  res
) => {
  try {
    const payment =
      await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const service =
      await ServiceRecord.findById(
        payment.serviceRecord
      );

    if (service) {
      if (payment.type === "Discount") {
        // Restore discount safely.
        service.totalBill = fromPaise(
          toPaise(service.totalBill) +
          toPaise(payment.amount)
        );
      } else {
        // Remove payment safely.
        service.amountPaid = fromPaise(
          Math.max(
            0,
            toPaise(service.amountPaid) -
              toPaise(payment.amount)
          )
        );
      }

      service.recalculate();

      await service.save();
    }

    await payment.deleteOne();

    res.json({
      message:
        payment.type === "Discount"
          ? "Discount deleted"
          : "Payment deleted",
      service,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};