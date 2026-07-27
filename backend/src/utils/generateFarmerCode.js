const Farmer = require('../models/Farmer');

async function generateFarmerCode() {
  const count = await Farmer.countDocuments();
  const next = (count + 1).toString().padStart(4, '0');
  return `FARM${next}`;
}

module.exports = generateFarmerCode;
