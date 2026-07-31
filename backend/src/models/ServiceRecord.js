const mongoose = require("mongoose");

const serviceRecordSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    serviceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Bill number - optional (farmer can choose "No" on the Bill No. toggle)
    billNo: {
      type: String,
      trim: true,
      default: "",
    },

    village: String,
    kshetra: String,
    acres: Number,
    are: Number,
    cropName: String,
    plotName: String,
    serviceType: String,
    ratePerAcre: Number,

    totalBill: {
      type: Number,
      required: true,
      min: 0,
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    pendingAmount: {
      type: Number,
      default: function () {
        return this.totalBill;
      },
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Bank"],
    },

    billImage: String,
    notes: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

serviceRecordSchema.methods.recalculate = function () {
  // Convert money to integer paise before calculation.
  // This prevents floating-point precision problems.
  const totalBillPaise = Math.round(
    Number(this.totalBill) * 100
  );

  const amountPaidPaise = Math.round(
    Number(this.amountPaid) * 100
  );

  const pendingPaise = Math.max(
    totalBillPaise - amountPaidPaise,
    0
  );

  // Store normalized rupee values.
  this.totalBill = totalBillPaise / 100;
  this.amountPaid = amountPaidPaise / 100;
  this.pendingAmount = pendingPaise / 100;

  if (amountPaidPaise <= 0) {
    this.paymentStatus = "Unpaid";
  } else if (amountPaidPaise >= totalBillPaise) {
    this.paymentStatus = "Paid";
  } else {
    this.paymentStatus = "Partially Paid";
  }
};

serviceRecordSchema.index({
  farmer: 1,
  serviceDate: -1,
});

module.exports = mongoose.model(
  "ServiceRecord",
  serviceRecordSchema
);