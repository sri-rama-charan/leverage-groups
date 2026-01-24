/**
 * Wallet Routes for Group Admin
 * All routes require authentication
 */

const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const walletController = require("../services/wallet/walletController");
const brandWalletController = require("../services/wallet/brandWalletController");

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

// ============ BRAND WALLET ROUTES (Auth Required) ============
// Placed after export so existing imports continue to work; Express router can still attach
router.get("/brand/summary", authenticateToken, brandWalletController.getBrandWalletSummary);
router.get("/brand/transactions", authenticateToken, brandWalletController.getBrandTransactions);
router.get("/brand/campaign-spend", authenticateToken, brandWalletController.getBrandCampaignSpend);
router.post("/brand/add-money", authenticateToken, brandWalletController.addMoney);
