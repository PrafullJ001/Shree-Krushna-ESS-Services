const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { ratePerAcre } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    if (ratePerAcre !== undefined) settings.ratePerAcre = ratePerAcre;
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};