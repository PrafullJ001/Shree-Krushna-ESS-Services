const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    serviceRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRecord",
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment or Discount history entry
    type: {
      type: String,
      enum: ["Payment", "Discount"],
      default: "Payment",
    },

    mode: {
      type: String,
      enum: ["Cash", "UPI", "Bank"],
      default: "Cash",
    },
    paidOn: {
      type: Date,
      default: Date.now,
    },
    receiptImage: String,
    note: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

paymentSchema.index({ farmer: 1, paidOn: -1 });

module.exports = mongoose.model("Payment", paymentSchema);