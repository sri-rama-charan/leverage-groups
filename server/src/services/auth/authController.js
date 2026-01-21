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

/**
 * STEP 1: INITIATE REGISTRATION
 * User sends: { name, phone, password }
 * We do:
 * 1. Check if phone exists (Error if yes).
 * 2. Hash the password (Make it secure).
 * 3. Generate a magical 6-digit OTP (Mock for now).
 * 4. Save user as "UNVERIFIED" in database.
 */
const initiateRegister = async (req, res) => {
  try {
    // 1. Get data from the "Order" (Request Body)
    const { name, phone, password } = req.body;

    // 2. Check if this phone number is already used
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Phone number already registered!" });
    }

    // 3. Secure the password
    const hashedPassword = await hashPassword(password);

    // 4. Create a Fake OTP (In real life, we would text this)
    const mockOtp = "123456";
    // Set expiry to 10 minutes from now
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // 5. Save the user to the "Kitchen" (Database)
    // We don't ask for Role yet. Role comes in Step 3.
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash: hashedPassword,
        otpCode: mockOtp,
        otpExpiresAt: otpExpires,
        phoneVerified: false, // NOT VERIFIED YET
      },
    });

    console.log(`[AUTH] OTP for ${phone} is ${mockOtp}`); // Log it so we can see it

    // 6. Tell the user "Okay, check your phone!"
    res.status(201).json({
      message: "OTP sent successfully! (Check console for code in dev)",
      phone: newUser.phone, // Send back phone so frontend knows who to verify
    });
  } catch (error) {
    console.error("Initiate Register Error:", error);
    res.status(500).json({ error: "Something went wrong in the kitchen." });
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
