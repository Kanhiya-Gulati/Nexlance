const nodemailer = require('nodemailer');
const https = require('https');

/**
 * Send an email using Nodemailer (Gmail SMTP) or Brevo API fallback.
 * @param {Object} options - Email options (to, subject, text, html)
 */
const sendEmail = async (options) => {
  // Option 1: Gmail SMTP via Nodemailer (EMAIL_USER & EMAIL_PASS)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `NEXLANCE <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html || options.text,
    };

    return await transporter.sendMail(mailOptions);
  }

  // Option 2: Brevo Transactional Email HTTP API (BREVO_API_KEY)
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER || 'contact.nexlance1@gmail.com';

  if (!apiKey) {
    console.error('Notice: Neither EMAIL_USER/EMAIL_PASS nor BREVO_API_KEY is configured in server/.env.');
    return;
  }

  const postData = JSON.stringify({
    sender: {
      name: 'NEXLANCE',
      email: senderEmail,
    },
    to: [
      {
        email: options.to,
      },
    ],
    subject: options.subject,
    htmlContent: options.html || options.text,
  });

  const requestOptions = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Brevo API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

module.exports = sendEmail;
