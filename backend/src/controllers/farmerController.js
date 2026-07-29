const Farmer = require("../models/Farmer");
const generateFarmerCode = require("../utils/generateFarmerCode");
const ServiceRecord = require("../models/ServiceRecord");

exports.searchFarmers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const farmers = await Farmer.find({
      $or: [
        {
          fullName: {
            $regex: q,
            $options: "i",
          },
        },
        {
          mobile: {
            $regex: q,
            $options: "i",
          },
        },
        {
          village: {
            $regex: q,
            $options: "i",
          },
        },
      ],
    })
      .select(
        "farmerCode fullName mobile village"
      )
      .limit(10);

    const results = farmers.map((f) => ({
      _id: f._id,
      label: `${f.fullName} - ${f.village} - ${f.mobile} (${f.farmerCode})`,
      fullName: f.fullName,
      village: f.village,
      mobile: f.mobile,
      farmerCode: f.farmerCode,
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.checkDuplicate = async (req, res) => {
  try {
    const { mobile } = req.query;

    if (!mobile) {
      return res.status(400).json({
        message: "Mobile number required",
      });
    }

    const existing = await Farmer.findOne({
      mobile,
    });

    if (existing) {
      return res.json({
        duplicate: true,
        farmer: existing,
      });
    }

    res.json({
      duplicate: false,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.registerFarmer = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      altMobile,
      village,
      notes,
    } = req.body;

    const existing = await Farmer.findOne({
      mobile,
    });

    if (existing) {
      return res.status(409).json({
        message:
          "Farmer with this mobile number already exists",
        farmer: existing,
      });
    }

    let farmer = null;
    let attempts = 0;

    // Retry farmerCode generation up to 3 times in case of a
    // near-simultaneous collision — this is the real fix, since
    // countDocuments()-based codes could collide under concurrent writes.
    while (!farmer && attempts < 3) {
      attempts += 1;
      const farmerCode = await generateFarmerCode();

      try {
        farmer = await Farmer.create({
          farmerCode,
          fullName,
          mobile,
          altMobile,
          village,
          notes,
        });
      } catch (createErr) {
        if (
          createErr.code === 11000 &&
          createErr.keyPattern?.farmerCode
        ) {
          // farmerCode collision specifically — retry with a fresh code
          continue;
        }
        throw createErr;
      }
    }

    if (!farmer) {
      return res.status(500).json({
        message:
          "Could not generate a unique farmer code — please try again",
      });
    }

    res.status(201).json(farmer);
  } catch (err) {
    if (err.code === 11000) {
      // Report the ACTUAL colliding field instead of always blaming mobile
      const field = err.keyPattern
        ? Object.keys(err.keyPattern)[0]
        : "field";

      return res.status(409).json({
        message: `Duplicate ${field} — a record with this ${field} already exists`,
      });
    }

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getFarmerProfile = async (req, res) => {
  try {
    const farmer = await Farmer.findById(
      req.params.id
    );

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    res.json(farmer);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.updateFarmer = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      altMobile,
      village,
      notes,
    } = req.body;

    const farmer = await Farmer.findById(
      req.params.id
    );

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    if (
      mobile &&
      mobile !== farmer.mobile
    ) {
      const existing = await Farmer.findOne({
        mobile,
      });

      if (existing) {
        return res.status(409).json({
          message:
            "Another farmer already uses this mobile number",
        });
      }
    }

    const oldVillage = farmer.village;

    if (fullName !== undefined) {
      farmer.fullName = fullName;
    }

    if (mobile !== undefined) {
      farmer.mobile = mobile;
    }

    if (altMobile !== undefined) {
      farmer.altMobile = altMobile;
    }

    if (village !== undefined) {
      farmer.village = village;
    }

    if (notes !== undefined) {
      farmer.notes = notes;
    }

    await farmer.save();

    if (
      village !== undefined &&
      village !== oldVillage
    ) {
      await ServiceRecord.updateMany(
        {
          farmer: farmer._id,
        },
        {
          $set: {
            village: farmer.village,
          },
        }
      );
    }

    res.json(farmer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Duplicate mobile number",
      });
    }

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deleteFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findById(
      req.params.id
    );

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    const serviceCount =
      await ServiceRecord.countDocuments({
        farmer: farmer._id,
      });

    if (serviceCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: this farmer has ${serviceCount} service record(s). Delete those first.`,
      });
    }

    await farmer.deleteOne();

    res.json({
      message: "Farmer deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @desc Check for farmers with similar name in the same village
// @route GET /api/farmers/check-similar?fullName=&village=
exports.checkSimilarFarmers = async (
  req,
  res
) => {
  try {
    const {
      fullName,
      village,
    } = req.query;

    if (!fullName || !village) {
      return res.json([]);
    }

    const similar = await Farmer.find({
      fullName: {
        $regex: fullName.trim(),
        $options: "i",
      },
      village: {
        $regex: village.trim(),
        $options: "i",
      },
    }).select(
      "farmerCode fullName mobile village"
    );

    res.json(similar);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
