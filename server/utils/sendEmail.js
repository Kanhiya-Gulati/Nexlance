const nodemailer = require('nodemailer');

/**
 * Send an email using Nodemailer Gmail SMTP
 * @param {Object} options - Email options (to, subject, text, html)
 */
const sendEmail = async (options) => {
  // Create transporter with Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `"NEXLANCE Marketplace" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // Send mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
