// 6-digit numeric OTP, e.g. "042917"
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = generateOtp;
