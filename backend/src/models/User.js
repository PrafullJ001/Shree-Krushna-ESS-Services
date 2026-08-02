const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ['admin', 'staff'],
      default: 'staff',
    },

    businessName: String,
    profilePhoto: String,
    sprayingUnitDetails: String,

    // Trusted devices for staff login
    trustedDevices: {
      type: [String],
      default: [],
    },

    // Bumped whenever an admin force-signs-out this user. Every JWT
    // embeds the tokenVersion that was current when it was issued;
    // `protect` compares that against this live value on every request,
    // so incrementing this instantly invalidates all existing tokens
    // for this user — not just future logins.
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // OTP for password reset / device approval
    otp: {
      type: String,
    },

    otpExpires: {
      type: Date,
    },

    otpPurpose: {
      type: String,
      enum: ['reset', 'device'],
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);