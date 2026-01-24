/**
 * Wallet Routes for Group Admin
 * All routes require authentication
 */

const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const walletController = require("../services/wallet/walletController");

const router = express.Router();

// ============ PROTECTED ROUTES (Auth Required) ============

// GET wallet summary (total earnings, available balance, pending payouts)
router.get("/summary", authenticateToken, walletController.getWalletSummary);

// GET earnings by group (with optional date filter)
router.get("/earnings-by-group", authenticateToken, walletController.getEarningsByGroup);

// GET earnings timeline (read-only log, paginated)
router.get("/earnings-timeline", authenticateToken, walletController.getEarningsTimeline);

// GET payout history (paginated)
router.get("/payout-history", authenticateToken, walletController.getPayoutHistory);

// POST request payout (manual processing)
router.post("/request-payout", authenticateToken, walletController.requestPayout);

module.exports = router;
