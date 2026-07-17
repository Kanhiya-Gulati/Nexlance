const nodemailer = require('nodemailer');

/**
 * Send an email using Nodemailer
 * @param {Object} options - Email options (to, subject, text, html)
 */
const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'nexlance.marketplace@gmail.com', // placeholder / fallback
      pass: process.env.EMAIL_PASS || 'jpxd kfui nrvd jvzn', // App Password (if provided, otherwise env)
    },
  });

  // Define email options
  const mailOptions = {
    from: `"NEXLANCE Marketplace" <${process.env.EMAIL_USER || 'nexlance.marketplace@gmail.com'}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // Send mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
