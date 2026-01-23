const { verifyToken } = require("../utils/jwtUtils");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * AUTHENTICATION MIDDLEWARE
 * =========================
 * 1. Checks for the "Authorization" header (Bearer Token).
 * 2. Verifies the Token validity.
 * 3. Attach the User info to the Request object.
 *
 * Usage:
 * app.get('/protected-route', authenticateToken, (req, res) => { ... })
 */
const authenticateToken = async (req, res, next) => {
  try {
    // 1. Get the Header
    const authHeader = req.headers["authorization"];
    // Header format: "Bearer <token>"
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access Denied. No token provided." });
    }

    // 2. Verify Token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ error: "Invalid or Expired Token." });
    }

    // 3. (Optional but Safe) Check if user still exists in DB
    // This prevents banned/deleted users from acting if their token is still valid
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, name: true }, // Fetch minimal data
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 4. Attach to Request
    req.user = user;
    next(); // Pass to the next handler
  } catch (error) {
    console.error("[AUTH MIDDLEWARE] Error:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error during Authentication." });
  }
};

/**
 * ROLE AUTHORIZATION (Optional Helper)
 * Checks if the user has the required role.
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not have permission." });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
