/**
 * ==============================================================================
 * PASSWORD UTILITIES
 * ==============================================================================
 * This file handles keeping user passwords safe.
 * We NEVER store plain passwords (like "secret123") in the database.
 * If we did, a hacker stealing our database would know everyone's password!
 * Instead, we "Hash" them: turn "secret123" into "d83jsd923kjs...".
 */

const bcrypt = require("bcryptjs");

/**
 * Turns a plain text password into a secure hash.
 * @param {string} password - The password the user typed (e.g., "password123")
 * @returns {Promise<string>} - The scrambled hash (e.g., "$2a$10$...")
 */
const hashPassword = async (password) => {
  // 1. Generate a "Salt"
  // A salt is random data added to the password to make it unique.
  // "10" is the cost factor (how hard the computer has to work).
  const salt = await bcrypt.genSalt(10);

  // 2. Hash the password with the salt
  const hashedPassword = await bcrypt.hash(password, salt);

  return hashedPassword;
};

/**
 * Checks if a password matches a hash.
 * @param {string} password - The password the user is trying to login with.
 * @param {string} hash - The saved hash from the database.
 * @returns {Promise<boolean>} - True if they match, False if not.
 */
const comparePassword = async (password, hash) => {
  // bcrypt does the math to see if the password fits the hash.
  return await bcrypt.compare(password, hash);
};

module.exports = { hashPassword, comparePassword };
