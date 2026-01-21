/**
 * ==============================================================================
 * JWT UTILITIES (The "VIP Pass" Maker)
 * ==============================================================================
 * JSON Web Tokens (JWT) are like digital ID cards.
 * When a user logs in, we give them a Token.
 * They show this Token to access protected pages (like "My Profile").
 */

const jwt = require("jsonwebtoken");

/**
 * SECRET KEY
 * This is the secret stamp we put on every token.
 * Only we know this key, so if a hacker tries to fake a token,
 * the stamp won't match, and we'll know it's fake.
 */
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";

/**
 * Creates a new JWT Token for a user.
 * @param {object} payload - Info to hide inside the token (e.g., { id: "123", role: "admin" })
 * @returns {string} - The long text string token.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h", // The token stops working after 24 hours. User must login again.
  });
};

/**
 * Checks if a token is valid.
 * @param {string} token - The token sent by the user.
 * @returns {object|null} - The hidden info (payload) if valid, or null if fake/expired.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // If the token is fake, expired, or tampered with, this error happens.
    return null;
  }
};

module.exports = { generateToken, verifyToken };
