// One-off script to create (or reset) an admin account directly in the
// database — bypasses the app entirely, so it works even if you're
// completely locked out. Run with: node scripts/seedAdmin.js
//
// Reads credentials from environment variables instead of hardcoding
// them here, so this file is safe to commit to git even with real
// values sitting in your .env (which is gitignored).

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const User = require(path.join(__dirname, "..", "src", "models", "User"));

const ADMIN_NAME = process.env.SEED_ADMIN_NAME;
const ADMIN_MOBILE = process.env.SEED_ADMIN_MOBILE;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;

async function seedAdmin() {
  if (!ADMIN_MOBILE || !ADMIN_PASSWORD) {
    console.error(
      "Missing SEED_ADMIN_MOBILE or SEED_ADMIN_PASSWORD in .env — add them before running this script."
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ mobile: ADMIN_MOBILE });

  if (existing) {
    existing.password = ADMIN_PASSWORD; // pre('save') hook re-hashes it
    existing.role = "admin";
    await existing.save();
    console.log(`Existing user reset to admin: ${ADMIN_MOBILE}`);
  } else {
    await User.create({
      name: ADMIN_NAME || "Admin",
      mobile: ADMIN_MOBILE,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
    });
    console.log(`New admin created: ${ADMIN_MOBILE}`);
  }

  await mongoose.disconnect();
  console.log("Done. Log in with the mobile/password above, then change the password.");
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
