import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "./env.js";

let transporter: Transporter | null = null;

/**
 * Initialize email transporter with SMTP configuration
 */
export function initializeEmailTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send OTP email to user
 * @param email - Recipient email address
 * @param otp - One-time password
 */
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const transport = initializeEmailTransporter();

  const mailOptions = {
    from: env.SMTP_FROM || env.SMTP_USER,
    to: email,
    subject: "Password Reset OTP - Book Shop",
    text: `Your OTP for password reset is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${otp}
        </div>
        <p style="margin-top: 20px;">This OTP will expire in 10 minutes.</p>
        <p style="color: #666;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  await transport.sendMail(mailOptions);
}
