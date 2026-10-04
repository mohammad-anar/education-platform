import nodemailer from "nodemailer";
import env from "../config/env.js";
import logger from "./logger.js";

type ISendEmail = {
  to: string;
  subject: string;
  html: string;
};

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: Number(env.email.port),
  secure: Number(env.email.port) === 465,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async (values: ISendEmail): Promise<boolean> => {
  try {
    if (!env.email.user || !env.email.pass) {
      logger.warn("⚠️ Email credentials not provided in .env, email not sent");
      return false;
    }

    await transporter.sendMail({
      from: `"${env.email.from || 'Backend Starter'}" <${env.email.user}>`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    });

    logger.info(`📧 Email sent successfully to ${values.to}`);
    return true;
  } catch (error: any) {
    logger.error(`❌ Email send failed to ${values.to}:`, error.message);
    return false;
  }
};

/**
 * Reusable HTML Email Template Generators
 */
export const emailTemplates = {
  /**
   * Generates a modern branded HTML wrapper
   */
  baseWrapper: (title: string, contentHtml: string): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333333; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #1e293b; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; }
          .body { padding: 32px 24px; line-height: 1.6; }
          .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px; }
          .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; padding: 12px; text-align: center; background: #eff6ff; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="body">
            ${contentHtml}
          </div>
          <div class="footer">
            <p>If you didn't request this, please ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} Backend Template. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  otpEmail: (otp: string, validMinutes = 5): string => {
    const body = `
      <h2>Verification Code</h2>
      <p>Use the following One-Time Password (OTP) to complete your verification. This code is valid for <strong>${validMinutes} minutes</strong>.</p>
      <div class="otp-code">${otp}</div>
      <p>Never share this code with anyone.</p>
    `;
    return emailTemplates.baseWrapper("Verification Code", body);
  },

  passwordResetEmail: (resetLink: string, validMinutes = 15): string => {
    const body = `
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to choose a new password. This link is valid for <strong>${validMinutes} minutes</strong>.</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      <p>Or paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #2563eb; font-size: 13px;">${resetLink}</p>
    `;
    return emailTemplates.baseWrapper("Reset Your Password", body);
  },

  welcomeEmail: (name: string): string => {
    const body = `
      <h2>Welcome aboard, ${name}!</h2>
      <p>Thank you for joining our platform. Your account is active and ready to use.</p>
      <p>If you have any questions or feedback, feel free to reply to this email.</p>
    `;
    return emailTemplates.baseWrapper("Welcome to Platform", body);
  },
};

export const emailHelper = {
  sendEmail,
  emailTemplates,
};

export default emailHelper;
