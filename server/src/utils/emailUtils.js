/**
 * ==============================================================================
 * EMAIL UTILITIES (The "Postman")
 * ==============================================================================
 * This file handles sending emails using Gmail.
 */

const nodemailer = require("nodemailer");

// 1. Configure the Postman (Transporter)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS, // Your App Password
  },
});

/**
 * Sends an OTP email to the user.
 * @param {string} toEmail - The user's email address.
 * @param {string} otp - The 6-digit code.
 */
const sendEmailOtp = async (toEmail, otp) => {
  try {
    const mailOptions = {
      from: `"LeverageGroups" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Your Verification Code - LeverageGroups",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome to LeverageGroups!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #01010c; letter-spacing: 5px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
          <hr/>
          <p style="font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] OTP sent to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[EMAIL] Error sending OTP:", error);
    throw new Error("Failed to send email. Check your credentials.");
  }
};

module.exports = { sendEmailOtp };
