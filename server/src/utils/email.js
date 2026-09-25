import nodemailer from "nodemailer";

/**
 * Creates a nodemailer transporter based on environment configuration.
 * In development without EMAIL_HOST, uses ethereal.email fake SMTP for testing.
 * In production, requires real SMTP credentials.
 */
async function createTransporter() {
  const isProduction = process.env.NODE_ENV === "production";
  const hasEmailConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

  if (hasEmailConfig) {
    // Real SMTP configuration from environment
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  if (isProduction) {
    throw new Error("Email configuration is required in production (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)");
  }

  // Development: use ethereal.email test account
  console.warn("⚠️  No email configuration found. Using ethereal.email test account for development.");
  console.warn("⚠️  Emails will NOT be delivered. Check console for preview URLs.");

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

/**
 * Sends an email using the configured transporter.
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version of email
 * @param {string} options.html - HTML version of email
 * @returns {Promise<Object>} - Nodemailer result object
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    const transporter = await createTransporter();
    const from = process.env.EMAIL_FROM || "FixIt Local <noreply@fixitlocal.com>";

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    // In development with ethereal, log the preview URL
    if (process.env.NODE_ENV !== "production" && nodemailer.getTestMessageUrl(info)) {
      console.log("📧 Email preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw new Error("Failed to send email. Please try again later.");
  }
}

/**
 * Sends email verification email to user
 *
 * @param {string} email - Recipient email address
 * @param {string} name - User's name
 * @param {string} verificationToken - Raw verification token (not hashed)
 * @returns {Promise<Object>}
 */
export async function sendVerificationEmail(email, name, verificationToken) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

  const subject = "Verify your FixIt Local account";

  const text = `
Hello ${name},

Welcome to FixIt Local! We're excited to have you join our community of customers and trusted service providers.

To complete your registration and verify your email address, please click the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with FixIt Local, you can safely ignore this email.

Best regards,
The FixIt Local Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your FixIt Local account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🔧 FixIt Local
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
                Hello ${name}!
              </h2>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Welcome to <strong>FixIt Local</strong>! We're excited to have you join our community of customers and trusted service providers.
              </p>

              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                To complete your registration and verify your email address, please click the button below:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>

              <p style="margin: 0 0 30px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; color: #666666; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>

              <div style="padding: 20px; background-color: #fff9e6; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  ⏰ <strong>Important:</strong> This verification link will expire in 24 hours.
                </p>
              </div>

              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't create an account with FixIt Local, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                Best regards,<br>
                <strong>The FixIt Local Team</strong>
              </p>
              <p style="margin: 0; color: #cccccc; font-size: 12px;">
                © 2026 FixIt Local. Quality service, just a click away.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmail({ to: email, subject, text, html });
}
