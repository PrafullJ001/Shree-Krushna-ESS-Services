const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,

    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });

  await transporter.sendMail({
    from: `"Shree Krishna ESS" <${process.env.OTP_FROM_EMAIL}>`,
    to,
    subject,
    text,
  });
};

module.exports = sendEmail;