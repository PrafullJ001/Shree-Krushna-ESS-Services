const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    farmerCode: {
      type: String,
      unique: true,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    altMobile: {
      type: String,
      trim: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    notes: String,
    registeredOn: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

farmerSchema.index({ fullName: 'text', village: 'text' });

module.exports = mongoose.model('Farmer', farmerSchema);
