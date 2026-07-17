const https = require('https');

/**
 * Send an email using Brevo Transactional Email HTTP API (v3)
 * Avoids outbound SMTP port blocking on cloud servers like Render.
 * @param {Object} options - Email options (to, subject, text, html)
 */
const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER || 'contact.nexlance1@gmail.com';

  if (!apiKey) {
    console.error('ERROR: BREVO_API_KEY is not defined in environment variables.');
    return; // Silent fail in background to prevent crashing the server
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
