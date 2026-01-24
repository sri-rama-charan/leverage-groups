const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Ensure a wallet exists for the user and return it
async function ensureWallet(userId) {
  let wallet = await prisma.wallet.findFirst({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId, balance: 0 } });
  }
  return wallet;
}

// ============ BRAND WALLET SUMMARY ============
// Returns: currentBalance, totalAdded, totalSpend, lastTopUpDate
exports.getBrandWalletSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await ensureWallet(userId);

    const txs = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "asc" },
      select: { type: true, amount: true, createdAt: true },
    });

    let totalAdded = 0;
    let totalSpend = 0;
    let lastTopUpDate = null;

    txs.forEach((t) => {
      const amt = parseFloat(t.amount);
      if (t.type === "TOPUP" || t.type === "CREDIT" || t.type === "REFUND") {
        totalAdded += amt;
        if (t.type === "TOPUP") {
          lastTopUpDate = t.createdAt; // last loop value will be latest due to asc order
        }
      } else if (t.type === "DEBIT") {
        totalSpend += amt;
      }
    });

    res.status(200).json({
      success: true,
      summary: {
        currentBalance: parseFloat(wallet.balance),
        totalAdded: parseFloat(totalAdded.toFixed(2)),
        totalSpend: parseFloat(totalSpend.toFixed(2)),
        lastTopUpDate,
      },
    });
  } catch (error) {
    console.error("Error fetching brand wallet summary:", error);
    res.status(500).json({ success: false, message: "Failed to fetch wallet summary", error: error.message });
  }
};

// ============ BRAND WALLET TRANSACTIONS ============
// Returns: transactions with date, type, reference, amountSigned, balanceAfter
exports.getBrandTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const wallet = await ensureWallet(userId);

    // Fetch all transactions to compute running balance; okay for Phase-1 scale
    const allTxs = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, type: true, amount: true, referenceId: true, createdAt: true },
    });

    let running = 0;
    const computed = allTxs.map((t) => {
      const amt = parseFloat(t.amount);
      const sign = t.type === "DEBIT" ? -1 : 1;
      running += sign * amt;
      return {
        id: t.id,
        date: t.createdAt,
        type: t.type,
        reference: t.referenceId || null,
        amount: sign * amt,
        balanceAfter: parseFloat(running.toFixed(2)),
      };
    });

    // Latest first
    const desc = computed.reverse();
    const p = parseInt(page);
    const l = parseInt(limit);
    const slice = desc.slice((p - 1) * l, p * l);

    res.status(200).json({
      success: true,
      transactions: slice,
      pagination: { page: p, limit: l, total: computed.length, pages: Math.ceil(computed.length / l) },
    });
  } catch (error) {
    console.error("Error fetching brand transactions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transactions", error: error.message });
  }
};

// ============ BRAND CAMPAIGN SPEND BREAKDOWN ============
// Returns per-campaign spend: campaign name, status, messages, amountSpent, costPerMessage
exports.getBrandCampaignSpend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fromDate, toDate } = req.query;

    const whereEarnings = { campaign: { brandId: userId } };
    if (fromDate || toDate) {
      whereEarnings.createdAt = {};
      if (fromDate) whereEarnings.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        whereEarnings.createdAt.lte = end;
      }
    }

    const earnings = await prisma.earning.findMany({
      where: whereEarnings,
      select: {
        campaignId: true,
        adminAmount: true,
        platformAmount: true,
        campaign: { select: { name: true, status: true } },
      },
    });

    const messagesByCampaign = await prisma.message.groupBy({
      by: ["campaignId"],
      where: { campaign: { brandId: userId } },
      _count: { id: true },
    });

    const countMap = new Map(messagesByCampaign.map((m) => [m.campaignId, m._count.id]));
    const agg = new Map();
    earnings.forEach((e) => {
      const key = e.campaignId;
      const prev = agg.get(key) || { amount: 0, name: e.campaign?.name || "Unknown", status: e.campaign?.status || "DRAFT" };
      const adminAmt = parseFloat(e.adminAmount || 0);
      const platformAmt = parseFloat(e.platformAmount || 0);
      prev.amount += adminAmt + platformAmt;
      agg.set(key, prev);
    });

    const breakdown = Array.from(agg.entries()).map(([campaignId, val]) => {
      const messages = countMap.get(campaignId) || 0;
      const amountSpent = parseFloat((val.amount || 0).toFixed(2));
      const cpm = messages > 0 ? parseFloat((amountSpent / messages).toFixed(2)) : 0;
      return { campaignId, campaignName: val.name, status: val.status, messagesSent: messages, amountSpent, costPerMessage: cpm };
    });

    // Sort by amount spent desc
    breakdown.sort((a, b) => b.amountSpent - a.amountSpent);

    res.status(200).json({ success: true, breakdown });
  } catch (error) {
    console.error("Error fetching brand campaign spend:", error);
    res.status(500).json({ success: false, message: "Failed to fetch campaign spend", error: error.message });
  }
};

// ============ ADD MONEY (TEST MODE OR SIMPLE CREDIT) ============
// Phase-1: In test mode (no Razorpay keys), directly credit wallet and log TOPUP
exports.addMoney = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, referenceId } = req.body;
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const wallet = await ensureWallet(userId);

    // Update balance and create transaction atomically
    const updated = await prisma.$transaction(async (tx) => {
      const createdTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "TOPUP",
          amount: amtNum,
          referenceId: referenceId || null,
        },
        select: { id: true, createdAt: true },
      });

      const newBal = parseFloat(wallet.balance) + amtNum;
      const savedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBal } });
      return { tx: createdTx, wallet: savedWallet };
    });

    res.status(201).json({ success: true, message: "Wallet credited", balance: parseFloat(updated.wallet.balance), transactionId: updated.tx.id, date: updated.tx.createdAt });
  } catch (error) {
    console.error("Error adding money:", error);
    res.status(500).json({ success: false, message: "Failed to add money", error: error.message });
  }
};

module.exports = exports;
