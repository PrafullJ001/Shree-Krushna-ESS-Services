const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        'ESS Machine Maintenance',
        'Tractor Maintenance',
        'Pickup Maintenance',
        'Diesel',
        'Staff Expense',
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    date: {
      type: Date,
      required: true,
    },

    // Only set when category === 'Staff Expense'
    staffMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    note: {
      type: String,
      trim: true,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
