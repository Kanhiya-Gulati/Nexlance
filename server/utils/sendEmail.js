const nodemailer = require('nodemailer');

/**
 * Send an email using Nodemailer
 * @param {Object} options - Email options (to, subject, text, html)
 */
const sendEmail = async (options) => {
  // Create transporter with explicit Gmail SMTP and timeouts to prevent hanging
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER || 'nexlance.marketplace@gmail.com',
      pass: process.env.EMAIL_PASS || 'jpxd kfui nrvd jvzn',
    },
    connectionTimeout: 5000, // 5 seconds connection timeout
    greetingTimeout: 5000,
    socketTimeout: 5000,
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
