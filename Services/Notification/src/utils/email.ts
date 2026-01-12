import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// check if all env variables are present
const {EMAIL_USER, CLIENT_ID, CLIENT_SECRET,REFRESH_TOKEN } = process.env;

if (!EMAIL_USER || !CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("❌ Missing Gmail OAuth2 credentials in .env file");
}

// Create the transporter with OAuth2
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: EMAIL_USER,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email notification via Gmail OAuth2
 */
export const sendNotification = async ({ to, subject, text, html }: EmailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: `"AI E-commerce" <${EMAIL_USER}>`, // Custom sender name
      to,
      subject,
      text, // Plain text version
      html, // HTML version (optional, but good for styling)
    });

    console.log(`✅ Email sent to ${to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error("❌ Error sending email:", error.message);
    return false;
  }
};