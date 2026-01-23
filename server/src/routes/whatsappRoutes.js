const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  connect,
  getStatus,
  disconnect,
  lookupGroup, // Added lookupGroup
} = require("../services/whatsapp/whatsappController");

// Protected Routes
router.post("/connect", authenticateToken, connect);
router.get("/status", authenticateToken, getStatus);
router.post("/lookup", authenticateToken, lookupGroup); // Exposed the new endpoint
router.post("/disconnect", authenticateToken, disconnect);

module.exports = router;
