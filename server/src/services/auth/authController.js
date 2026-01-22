/**
 * ==============================================================================
 * AUTH CONTROLLER (The "Waiter")
 * ==============================================================================
 * This file handles the requests from the user (Frontend).
 * It listens for "Register", "Login", etc., and tells the database what to do.
 */

const { PrismaClient } = require("@prisma/client");
const { hashPassword, comparePassword } = require("../../utils/passwordUtils");
const { generateToken } = require("../../utils/jwtUtils");

// Connect to the Database
const prisma = new PrismaClient();

const { sendEmailOtp } = require("../../utils/emailUtils");

/**
 * STEP 1: INITIATE REGISTRATION
 * User sends: { name, email, phone, password }
 * We do:
 * 1. Check if phone/email exists.
 * 2. Hash password.
 * 3. Generate OTP & Send via Email.
 * 4. Save user as "UNVERIFIED".
 */
const initiateRegister = async (req, res) => {
  try {
    // 1. Get data from Request
    const { name, email, phone, password } = req.body;

    // 2. Check duplicates
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone)
      return res
        .status(400)
        .json({ error: "Phone number already registered!" });

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail)
        return res.status(400).json({ error: "Email already registered!" });
    }

    // 3. Secure the password
    const hashedPassword = await hashPassword(password);

    // 4. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 5. Send Email (Fail fast if email is bad)
    await sendEmailOtp(email, otp);

    // 6. Save User
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        otpCode: otp,
        otpExpiresAt: otpExpires,
        phoneVerified: false,
      },
    });

    console.log(`[AUTH] User created: ${name}. Waiting for OTP via Email.`);

    res.status(201).json({
      message: `OTP sent to ${email}!`,
      phone: newUser.phone,
    });
  } catch (error) {
    console.error("Initiate Register Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong." });
  }
};

/**
 * STEP 2: VERIFY OTP
 * User sends: { phone, otp }
 * We do:
 * 1. Find user by phone.
 * 2. Check if OTP matches and hasn't expired.
 * 3. Mark user as "VERIFIED".
 */
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 2. Check if OTP is correct
    if (user.otpCode !== otp) {
      return res.status(400).json({ error: "Invalid OTP. Try again." });
    }

    // 3. Check if OTP is expired (Time check)
    if (new Date() > user.otpExpiresAt) {
      return res
        .status(400)
        .json({ error: "OTP has expired. Please request a new one." });
    }

    // 4. Mark as Verified!
    // We also clear the OTP so it can't be used again.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    res
      .status(200)
      .json({ message: "Phone verified! Please select your role." });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ error: "Verification failed." });
  }
};

/**
 * STEP 3: COMPLETE PROFILE (SELECT ROLE)
 * User sends: { phone, role }
 * We do:
 * 1. Find user.
 * 2. Update their role (Group Admin or Brand).
 * 3. Give them their final Login Token.
 */
const completeProfile = async (req, res) => {
  try {
    const { phone, role } = req.body;

    // Validate Role (Must be GA or BR)
    if (!["GA", "BR"].includes(role)) {
      return res.status(400).json({ error: "Invalid role selected." });
    }

    // 1. Update the user
    const user = await prisma.user.update({
      where: { phone },
      data: { role: role },
    });

    // 2. Generate the VIP Pass (Token)
    const token = generateToken({ id: user.id, role: user.role });

    res.status(200).json({
      message: "Account fully created! Welcome aboard.",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Complete Profile Error:", error);
    res.status(500).json({ error: "Could not complete profile." });
  }
};

/**
 * LOGIN
 * User sends: { phone, password }
 * We do:
 * 1. Find user.
 * 2. Check password.
 * 3. Give Token.
 */
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 1. Find user
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: "Invalid phone or password." });
    }

    // 2. Check Password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid phone or password." });
    }

    // 3. Generate Token
    const token = generateToken({ id: user.id, role: user.role });

    res.status(200).json({
      message: "Welcome back!",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed." });
  }
};

module.exports = {
  initiateRegister,
  verifyOtp,
  completeProfile,
  login,
};
