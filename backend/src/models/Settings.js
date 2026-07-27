const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    ratePerAcre: { type: Number, required: true, default: 800 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);