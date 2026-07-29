const Farmer = require("../models/Farmer");

async function generateFarmerCode() {
  const lastFarmer = await Farmer.findOne({ farmerCode: { $regex: /^FARM\d+$/ } })
    .sort({ farmerCode: -1 })
    .collation({ locale: "en_US", numericOrdering: true });

  let nextNumber = 1;
  if (lastFarmer && lastFarmer.farmerCode) {
    const match = lastFarmer.farmerCode.match(/\d+/);
    if (match) nextNumber = parseInt(match[0], 10) + 1;
  }

  return `FARM${String(nextNumber).padStart(4, "0")}`;
}

module.exports = generateFarmerCode;
