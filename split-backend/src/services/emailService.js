import nodemailer from 'nodemailer';

// Email templates
const emailTemplates = {
  friendRequest: (senderName, receiverName, appUrl) => ({
    subject: `${senderName} sent you a friend request on Debtox`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
            .header { border-bottom: 3px solid #e94560; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #e94560; }
            .content { color: #333; line-height: 1.6; }
            .action-btn { background-color: #e94560; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0; }
            .footer { border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">💸 Debtox</div>
            </div>
            <div class="content">
              <p>Hi ${receiverName},</p>
              <p><strong>${senderName}</strong> sent you a friend request on Debtox!</p>
              <p>Accept this request to start splitting expenses together.</p>
              <a href="${appUrl}/friends" class="action-btn">View Friend Request</a>
              <p>If you didn't recognize this request, you can ignore it.</p>
            </div>
            <div class="footer">
              <p>© 2024 Debtox. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  friendAccepted: (senderName, receiverName, appUrl) => ({
    subject: `${senderName} accepted your friend request`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
            .header { border-bottom: 3px solid #00c853; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #00c853; }
            .content { color: #333; line-height: 1.6; }
            .action-btn { background-color: #00c853; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0; }
            .footer { border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">💸 Debtox</div>
            </div>
            <div class="content">
              <p>Hi ${receiverName},</p>
              <p><strong>${senderName}</strong> accepted your friend request! 🎉</p>
              <p>You can now split expenses together.</p>
              <a href="${appUrl}/friends" class="action-btn">View Your Friends</a>
            </div>
            <div class="footer">
              <p>© 2024 Debtox. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Initialize transporter - will be configured with environment variables
let transporter = null;

function initializeTransporter() {
  // Gmail configuration (most common)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App password for Gmail
      },
    });
  }
  // Generic SMTP configuration
  else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  // SendGrid configuration
  else if (process.env.SENDGRID_API_KEY) {
    const sgTransport = require('nodemailer-sendgrid-transport');
    transporter = nodemailer.createTransport(
      sgTransport({
        apiKey: process.env.SENDGRID_API_KEY,
      })
    );
  }

  if (!transporter) {
    console.warn('⚠️ Email service not configured. Emails will not be sent.');
  }

  return transporter;
}

async function sendFriendRequestEmail(receiverEmail, senderName, receiverName) {
  try {
    if (!transporter) {
      initializeTransporter();
    }

    if (!transporter) {
      console.warn('Email service not configured, skipping email');
      return;
    }

    const appUrl = process.env.APP_URL || 'https://debtox.app';
    const template = emailTemplates.friendRequest(senderName, receiverName, appUrl);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@debtox.app',
      to: receiverEmail,
      subject: template.subject,
      html: template.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Friend request email sent to ${receiverEmail}`);
    return result;
  } catch (error) {
    console.error('Failed to send friend request email:', error.message);
    // Don't throw - email failure shouldn't block the request
    return null;
  }
}

async function sendFriendAcceptedEmail(receiverEmail, senderName, receiverName) {
  try {
    if (!transporter) {
      initializeTransporter();
    }

    if (!transporter) {
      console.warn('Email service not configured, skipping email');
      return;
    }

    const appUrl = process.env.APP_URL || 'https://debtox.app';
    const template = emailTemplates.friendAccepted(senderName, receiverName, appUrl);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@debtox.app',
      to: receiverEmail,
      subject: template.subject,
      html: template.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Friend accepted email sent to ${receiverEmail}`);
    return result;
  } catch (error) {
    console.error('Failed to send friend accepted email:', error.message);
    return null;
  }
}

// Initialize on module load
initializeTransporter();

export {
  sendFriendRequestEmail,
  sendFriendAcceptedEmail,
  initializeTransporter,
};
