/**
 * ==============================================================================
 * AUTH ROUTES (The "Menu")
 * ==============================================================================
 * This file lists all the options available in the Auth section.
 * It maps the URL (e.g., /register) to the Controller function.
 */

const express = require("express");
const router = express.Router();
const authController = require("../services/auth/authController");

// 1. Start Registration (Name, Phone, Password -> OTP)
// POST /api/auth/register
router.post("/register", authController.initiateRegister);

// 2. Verify OTP (Phone, OTP -> Verified)
// POST /api/auth/verify-otp
router.post("/verify-otp", authController.verifyOtp);

// 3. Complete Profile (Phone, Role -> Token)
// POST /api/auth/complete-profile
router.post("/complete-profile", authController.completeProfile);

// 4. Login (Phone, Password -> Token)
// POST /api/auth/login
router.post("/login", authController.login);

module.exports = router;
