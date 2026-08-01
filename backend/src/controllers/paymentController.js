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
  totalBillAfterDiscountPaise < amountPaidAfterPaymentPaise
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

// -------------------------------------------------------
// EDIT AN EXISTING PAYMENT
// Adjusts service.amountPaid by the DIFFERENCE between the
// old and new amount (not a blind overwrite), keeps a log
// of what changed on the payment itself, and re-runs the
// service's own recalculate() so pending amount / status
// stay correct everywhere else in the app.
// -------------------------------------------------------
exports.updatePayment = async (req, res) => {
  try {
    const { amount, mode, note } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (payment.type === "Discount") {
      return res.status(400).json({
        message:
          "Discounts cannot be edited here. Delete and re-apply instead.",
      });
    }

    const newAmountPaise = toPaise(amount);
    const newAmount = fromPaise(newAmountPaise);

    if (!newAmountPaise || newAmountPaise <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const service = await ServiceRecord.findById(
      payment.serviceRecord
    );

    if (!service) {
      return res.status(404).json({
        message: "Linked service record not found",
      });
    }

    const oldAmountPaise = toPaise(payment.amount);
    const currentPaidPaise = toPaise(service.amountPaid);
    const currentBillPaise = toPaise(service.totalBill);

    // Remove the old amount, then add the new amount, to get
    // the correct new total paid on the service record.
    const newPaidPaise =
      currentPaidPaise - oldAmountPaise + newAmountPaise;

    if (newPaidPaise < 0) {
      return res.status(400).json({
        message: "Resulting paid amount cannot be negative",
      });
    }

    if (newPaidPaise > currentBillPaise) {
      return res.status(400).json({
        message: "Edited amount would exceed the total bill",
      });
    }

    // Keep a log of what changed, for the payment history display.
    payment.editHistory = payment.editHistory || [];
    payment.editHistory.push({
      previousAmount: payment.amount,
      previousMode: payment.mode,
      previousNote: payment.note,
      editedAt: new Date(),
      editedBy: req.user?._id,
    });

    payment.amount = newAmount;
    payment.mode = mode || payment.mode;
    payment.note = note !== undefined ? note : payment.note;

    await payment.save();

    service.amountPaid = fromPaise(newPaidPaise);
    service.paymentMode = mode || service.paymentMode;
    service.recalculate();

    await service.save();

    await payment.populate("receivedBy", "name role");

    res.json({
      message: "Payment updated",
      payment,
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

// -------------------------------------------------------
// PENDING PAYMENTS — supports an optional flexible date range
// (?from=YYYY-MM-DD&to=YYYY-MM-DD) instead of rigid calendar
// years, since a spraying season can span across two calendar
// years (e.g. Nov to March) and year-based buckets caused
// confusion. With no range given, returns everything pending.
// -------------------------------------------------------
exports.getPendingPayments = async (req, res) => {
  try {
    const { from, to } = req.query;

    const query = {
      paymentStatus: { $in: ["Unpaid", "Partially Paid"] },
    };

    if (from || to) {
      query.serviceDate = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) query.serviceDate.$gte = fromDate;
      }
      if (to) {
        // include the entire "to" day, not just midnight
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          query.serviceDate.$lte = toDate;
        }
      }
    }

    const records = await ServiceRecord.find(query)
      .populate("farmer", "fullName mobile village")
      .populate("createdBy", "name role")
      .sort({ updatedAt: -1 });

    res.json({ records });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPendingYears = async (req, res) => {
  try {
    const years = await ServiceRecord.aggregate([
      { $match: { paymentStatus: { $in: ["Unpaid", "Partially Paid"] } } },
      { $group: { _id: { $year: "$serviceDate" } } },
      { $sort: { _id: -1 } },
    ]);
    res.json(years.map((y) => y._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
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

// -------------------------------------------------------
// CLEAR ALL PENDING (settle-all) — now supports the same
// optional discount flow as bulk payment. Discount is applied
// FIFO (oldest service first) to reduce each bill before the
// remaining pending on that service is paid off in full.
// -------------------------------------------------------
exports.settleAllForFarmer = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const {
      paidOn,
      mode,
      note,
      applyDiscount,
      discountAmount,
      discountReason,
    } = req.body;

    // Parse the date the user picked; fall back to now if not provided/invalid.
    const paidOnDate = paidOn ? new Date(paidOn) : new Date();
    const resolvedPaidOn = isNaN(paidOnDate.getTime()) ? new Date() : paidOnDate;

    const services = await ServiceRecord.find({
      farmer: farmerId,
      paymentStatus: { $in: ['Unpaid', 'Partially Paid'] },
    }).sort({ serviceDate: 1 }); // oldest first — FIFO, matches bulk payment

    if (services.length === 0) {
      return res.status(400).json({ message: 'No pending services to settle' });
    }

    const shouldApplyDiscount =
      applyDiscount === true || applyDiscount === 'true';

    let remainingDiscountPaise = shouldApplyDiscount
      ? toPaise(discountAmount)
      : 0;

    if (shouldApplyDiscount && (!remainingDiscountPaise || remainingDiscountPaise <= 0)) {
      return res.status(400).json({ message: 'Discount amount must be greater than 0' });
    }

    const totalPendingPaise = services.reduce((sum, s) => sum + toPaise(s.pendingAmount), 0);
    if (remainingDiscountPaise > totalPendingPaise) {
      return res.status(400).json({
        message: `Discount exceeds total pending (₹${fromPaise(totalPendingPaise)})`,
      });
    }

    const settledServices = [];

    for (const service of services) {
      const pendingPaise = toPaise(service.pendingAmount);
      if (pendingPaise <= 0) continue;

      // Discount portion first (reduces this service's bill, FIFO)
      const discountForThis = Math.min(remainingDiscountPaise, pendingPaise);
      if (discountForThis > 0) {
        service.totalBill = fromPaise(toPaise(service.totalBill) - discountForThis);

        const discountNote = `Discount of ₹${fromPaise(discountForThis)} applied (settle all)${
          discountReason ? `: ${discountReason}` : ''
        }`;
        service.notes = service.notes
          ? `${service.notes}\n${discountNote}`
          : discountNote;

        await Payment.create({
          serviceRecord: service._id,
          farmer: service.farmer,
          amount: fromPaise(discountForThis),
          type: 'Discount',
          mode: 'Cash',
          note: discountReason || 'Discount applied (settle all)',
          receivedBy: req.user?._id,
        });

        remainingDiscountPaise -= discountForThis;
      }

      // Pay off whatever's left on this service, in full
      const remainingPendingPaise =
        toPaise(service.totalBill) - toPaise(service.amountPaid);

      if (remainingPendingPaise > 0) {
        await Payment.create({
          serviceRecord: service._id,
          farmer: service.farmer,
          amount: fromPaise(remainingPendingPaise),
          mode: mode || 'Cash',
          type: 'Payment',
          note: note || 'Settled in full (bulk clear)',
          paidOn: resolvedPaidOn,
          receivedBy: req.user?._id,
        });

        service.amountPaid = service.totalBill;
        service.paymentMode = mode || service.paymentMode;
      }

      service.recalculate();
      await service.save();
      settledServices.push(service);
    }

    res.json({
      message: `${settledServices.length} service(s) settled`,
      services: settledServices,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------
// BULK PAYMENT ACROSS MULTIPLE SERVICES (FIFO)
// Applies oldest-service-first, same as before. Now also
// supports an optional single discount applied the same
// way — FIFO across services, discount portion first on
// each service, then payment portion — using the same
// paise-safe math as addPayment's discount logic.
// -------------------------------------------------------
exports.recordBulkPayment = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const {
      amount,
      mode,
      note,
      paidOn,
      applyDiscount,
      discountAmount,
      discountReason,
    } = req.body;

    // Parse the date the user picked; fall back to now if not provided/invalid.
    const paidOnDate = paidOn ? new Date(paidOn) : new Date();
    const resolvedPaidOn = isNaN(paidOnDate.getTime()) ? new Date() : paidOnDate;

    let remainingPaise = toPaise(amount);
    if (!remainingPaise || remainingPaise <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const shouldApplyDiscount =
      applyDiscount === true || applyDiscount === 'true';

    let remainingDiscountPaise = shouldApplyDiscount
      ? toPaise(discountAmount)
      : 0;

    if (shouldApplyDiscount && (!remainingDiscountPaise || remainingDiscountPaise <= 0)) {
      return res.status(400).json({ message: 'Discount amount must be greater than 0' });
    }

    // Oldest unpaid service first — clears older debts before newer ones
    const services = await ServiceRecord.find({
      farmer: farmerId,
      paymentStatus: { $in: ['Unpaid', 'Partially Paid'] },
    }).sort({ serviceDate: 1 });

    if (services.length === 0) {
      return res.status(400).json({ message: 'No pending services for this farmer' });
    }

    const totalPendingPaise = services.reduce((sum, s) => sum + toPaise(s.pendingAmount), 0);
    if (remainingPaise + remainingDiscountPaise > totalPendingPaise) {
      return res.status(400).json({
        message: `Payment and discount together exceed total pending (₹${fromPaise(totalPendingPaise)})`,
      });
    }

    const updatedServices = [];

    for (const service of services) {
      if (remainingPaise <= 0 && remainingDiscountPaise <= 0) break;

      const pendingPaise = toPaise(service.pendingAmount);
      if (pendingPaise <= 0) continue;

      // Discount portion first (reduces this service's bill), then payment — both FIFO
      const discountForThis = Math.min(remainingDiscountPaise, pendingPaise);
      const pendingAfterDiscount = pendingPaise - discountForThis;
      const applyPaise = Math.min(pendingAfterDiscount, remainingPaise);

      if (discountForThis > 0) {
        service.totalBill = fromPaise(toPaise(service.totalBill) - discountForThis);

        const discountNote = `Discount of ₹${fromPaise(discountForThis)} applied (bulk payment)${
          discountReason ? `: ${discountReason}` : ''
        }`;
        service.notes = service.notes
          ? `${service.notes}\n${discountNote}`
          : discountNote;

        await Payment.create({
          serviceRecord: service._id,
          farmer: service.farmer,
          amount: fromPaise(discountForThis),
          type: 'Discount',
          mode: 'Cash',
          note: discountReason || 'Discount applied (bulk payment)',
          receivedBy: req.user?._id,
        });

        remainingDiscountPaise -= discountForThis;
      }

      if (applyPaise > 0) {
        const applyAmount = fromPaise(applyPaise);

        await Payment.create({
          serviceRecord: service._id,
          farmer: service.farmer,
          amount: applyAmount,
          mode: mode || 'Cash',
          type: 'Payment',
          note: note || 'Bulk payment across multiple services',
          paidOn: resolvedPaidOn,
          receivedBy: req.user?._id,
        });

        service.amountPaid = fromPaise(toPaise(service.amountPaid) + applyPaise);
        service.paymentMode = mode || service.paymentMode;
        remainingPaise -= applyPaise;
      }

      service.recalculate();
      await service.save();
      updatedServices.push(service);
    }

    res.json({
      message: `Payment applied across ${updatedServices.length} service(s)`,
      services: updatedServices,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};