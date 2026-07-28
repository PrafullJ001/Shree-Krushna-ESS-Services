const axios = require('axios');

async function sendOtpEmail(toEmail, otp, purpose) {
  const subject = purpose === 'reset' ? 'Password Reset Code' : 'Login Verification Code';

  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Spraying Service Admin' },
      to: [{ email: toEmail }],
      subject,
      textContent: `Your code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, ignore this email.`,
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );
}

module.exports = sendOtpEmail;
