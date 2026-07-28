const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateOtp = require('../utils/generateOtp');
const sendEmail = require('../utils/sendEmail');

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// @desc  Register a staff/admin account
// @route POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      role,
    } = req.body;

    const cleanMobile = String(
      mobile || ''
    ).trim();

    const cleanEmail = String(
      email || ''
    )
      .trim()
      .toLowerCase();

    if (!cleanMobile) {
      return res.status(400).json({
        message:
          'Mobile number is required',
      });
    }

    // Admin must have an email address
    if (
      role === 'admin' &&
      !cleanEmail
    ) {
      return res.status(400).json({
        message:
          'Email is required for admin accounts',
      });
    }

    const existing =
      await User.findOne({
        mobile: cleanMobile,
      });

    if (existing) {
      return res.status(409).json({
        message:
          'User with this mobile already exists',
      });
    }

    const user = await User.create({
      name,
      email:
        cleanEmail || undefined,
      mobile: cleanMobile,
      password,
      role,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    if (err.code === 11000) {
      const duplicateField =
        Object.keys(
          err.keyValue || {}
        )[0];

      if (
        duplicateField === 'mobile'
      ) {
        return res.status(409).json({
          message:
            'User with this mobile already exists',
        });
      }

      if (
        duplicateField === 'email'
      ) {
        return res.status(409).json({
          message:
            'User with this email already exists',
        });
      }

      return res.status(409).json({
        message:
          'User already exists',
      });
    }

    res.status(500).json({
      message: err.message,
    });
  }
};

// @desc Login with mobile OR email + password
// @route POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const {
      identifier,
      password,
      deviceId,
    } = req.body;

    const cleanIdentifier =
      identifier
        ?.trim()
        .toLowerCase();

    const user =
      await User.findOne({
        $or: [
          {
            mobile:
              cleanIdentifier,
          },
          {
            email:
              cleanIdentifier,
          },
        ],
      });

    if (
      !user ||
      !(await user.matchPassword(
        password
      ))
    ) {
      return res
        .status(401)
        .json({
          message:
            'Invalid credentials',
        });
    }

    // ORIGINAL STAFF DEVICE APPROVAL LOGIC
    if (user.role === 'staff') {
      const trustedDevices =
        user.trustedDevices || [];

      const isTrustedDevice =
        deviceId &&
        trustedDevices.includes(
          deviceId
        );

      if (!isTrustedDevice) {
        user.otp =
          generateOtp();

        user.otpExpires =
          new Date(
            Date.now() +
              OTP_EXPIRY_MS
          );

        user.otpPurpose =
          'device';

        await user.save();

        return res
          .status(403)
          .json({
            requiresDeviceApproval:
              true,
            message:
              'New device. Ask your admin for the approval code, then verify below.',
          });
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      businessName:
        user.businessName,
      token: generateToken(
        user._id
      ),
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @desc Request password reset
// Staff -> OTP available to admin
// Admin -> OTP sent to registered email
// @route POST /api/auth/forgot-password
exports.forgotPassword = async (
  req,
  res
) => {
  try {
    const { mobile } = req.body;

    const cleanMobile =
      String(
        mobile || ''
      ).trim();

    if (!cleanMobile) {
      return res
        .status(400)
        .json({
          message:
            'Mobile number required',
        });
    }

    const user =
      await User.findOne({
        mobile: cleanMobile,
      });

    if (!user) {
      return res.json({
        message:
          'If this account exists, password reset instructions have been created.',
      });
    }

    // ORIGINAL OTP GENERATION LOGIC
    user.otp =
      generateOtp();

    user.otpExpires =
      new Date(
        Date.now() +
          OTP_EXPIRY_MS
      );

    user.otpPurpose =
      'reset';

    await user.save();

    // Admin gets OTP on registered email
    if (
      user.role === 'admin'
    ) {
      if (!user.email) {
        user.otp =
          undefined;
        user.otpExpires =
          undefined;
        user.otpPurpose =
          undefined;

        await user.save();

        return res
          .status(400)
          .json({
            message:
              'No email is registered for this admin account.',
          });
      }

      try {
        await sendEmail({
          to: user.email,

          subject:
            'Password Reset OTP - Shree Krushna ESS',

          text:
            `Your password reset OTP is ${user.otp}. ` +
            `This OTP is valid for 10 minutes. ` +
            `Do not share this OTP with anyone.`,
        });
      } catch (
        emailError
      ) {
        console.error(
          'Admin OTP email error:',
          emailError
        );

        user.otp =
          undefined;
        user.otpExpires =
          undefined;
        user.otpPurpose =
          undefined;

        await user.save();

        return res
          .status(500)
          .json({
            message:
              'Could not send OTP email. Please try again.',
          });
      }

      // ONLY CHANGE:
      // Mask admin email in success message.
      const [
        emailName,
        emailDomain,
      ] = user.email.split('@');

      const maskedEmail =
        emailName.length <= 3
          ? `${emailName[0]}***@${emailDomain}`
          : `${emailName.slice(
              0,
              3
            )}***@${emailDomain}`;

      return res.json({
        message:
          `OTP sent successfully to ${maskedEmail}`,
      });
    }

    // ORIGINAL STAFF LOGIC
    return res.json({
      message:
        'OTP requested. Contact your admin for the code.',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @desc Complete password reset
// @route POST /api/auth/reset-password
exports.resetPassword = async (
  req,
  res
) => {
  try {
    const {
      mobile,
      otp,
      newPassword,
    } = req.body;

    const cleanMobile =
      String(
        mobile || ''
      ).trim();

    if (
      !cleanMobile ||
      !otp ||
      !newPassword
    ) {
      return res
        .status(400)
        .json({
          message:
            'Mobile, OTP, and new password are required',
        });
    }

    const user =
      await User.findOne({
        mobile: cleanMobile,
      });

    if (
      !user ||
      user.otpPurpose !==
        'reset' ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires <
        new Date()
    ) {
      return res
        .status(400)
        .json({
          message:
            'Invalid or expired OTP',
        });
    }

    user.password =
      newPassword;

    user.otp = undefined;
    user.otpExpires =
      undefined;
    user.otpPurpose =
      undefined;

    await user.save();

    res.json({
      message:
        'Password reset successful. Please log in.',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @desc Verify new staff device
// @route POST /api/auth/verify-device
exports.verifyDevice = async (
  req,
  res
) => {
  try {
    const {
      mobile,
      otp,
      deviceId,
    } = req.body;

    const cleanMobile =
      String(
        mobile || ''
      ).trim();

    if (
      !cleanMobile ||
      !otp ||
      !deviceId
    ) {
      return res
        .status(400)
        .json({
          message:
            'Mobile, OTP, and deviceId are required',
        });
    }

    const user =
      await User.findOne({
        mobile: cleanMobile,
      });

    if (
      !user ||
      user.otpPurpose !==
        'device' ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires <
        new Date()
    ) {
      return res
        .status(400)
        .json({
          message:
            'Invalid or expired OTP',
        });
    }

    if (
      !user.trustedDevices
    ) {
      user.trustedDevices =
        [];
    }

    if (
      !user.trustedDevices.includes(
        deviceId
      )
    ) {
      user.trustedDevices.push(
        deviceId
      );
    }

    user.otp = undefined;
    user.otpExpires =
      undefined;
    user.otpPurpose =
      undefined;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      businessName:
        user.businessName,
      token: generateToken(
        user._id
      ),
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @desc Admin-only: see pending STAFF OTPs only
// @route GET /api/auth/pending-approvals
exports.pendingApprovals =
  async (req, res) => {
    try {
      const pending =
        await User.find({
          // ONLY STAFF OTPs ARE SHOWN
          role: 'staff',

          otp: {
            $exists: true,
            $ne: null,
          },

          otpExpires: {
            $gt: new Date(),
          },
        }).select(
          'name mobile role otp otpPurpose otpExpires'
        );

      res.json(pending);
    } catch (err) {
      res
        .status(500)
        .json({
          message:
            err.message,
        });
    }
  };

// @desc Get logged-in user's profile
// @route GET /api/auth/me
exports.getMe = async (
  req,
  res
) => {
  res.json(req.user);
};

// @desc Update logged-in user's profile
// @route PUT /api/auth/me
exports.updateProfile = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      businessName,
      sprayingUnitDetails,
    } = req.body;

    const user =
      await User.findById(
        req.user._id
      );

    if (
      name !== undefined
    ) {
      user.name = name;
    }

    if (
      email !== undefined
    ) {
      user.email =
        email || undefined;
    }

    if (
      businessName !==
      undefined
    ) {
      user.businessName =
        businessName;
    }

    if (
      sprayingUnitDetails !==
      undefined
    ) {
      user.sprayingUnitDetails =
        sprayingUnitDetails;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      businessName:
        user.businessName,
      sprayingUnitDetails:
        user.sprayingUnitDetails,
    });
  } catch (err) {
    if (
      err.code === 11000
    ) {
      return res
        .status(409)
        .json({
          message:
            'Email already in use',
        });
    }

    res.status(500).json({
      message: err.message,
    });
  }
};
