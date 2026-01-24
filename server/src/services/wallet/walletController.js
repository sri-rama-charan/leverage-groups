/**
 * Wallet Controller for Group Admin
 * Handles:
 * - Wallet summary (total earnings, available balance, pending payouts)
 * - Earnings by group
 * - Earnings timeline (read-only log)
 * - Payout requests (manual processing)
 * - Payout history
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============ WALLET SUMMARY ============
// Returns: total lifetime earnings, available balance, pending payouts, last payout date
exports.getWalletSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all earnings for this admin
    const earnings = await prisma.earning.findMany({
      where: { adminId: userId },
      select: { adminAmount: true, createdAt: true },
    });

    // Calculate total lifetime earnings
    const totalEarnings = earnings.reduce((sum, e) => {
      return sum + (parseFloat(e.adminAmount) || 0);
    }, 0);

    // Get all payout requests to calculate pending amount
    const payoutRequests = await prisma.payoutRequest.findMany({
      where: { adminId: userId },
      select: { amount: true, status: true, processedAt: true },
    });

    // Calculate available balance (total earnings - paid payouts)
    const paidAmount = payoutRequests
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const availableBalance = totalEarnings - paidAmount;

    // Calculate pending payout amount
    const pendingPayoutAmount = payoutRequests
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Get last payout date (most recent PAID payout)
    const lastPaidPayout = payoutRequests
      .filter((p) => p.status === "PAID")
      .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt))[0];

    const lastPayoutDate = lastPaidPayout?.processedAt || null;

    res.status(200).json({
      success: true,
      summary: {
        totalLifetimeEarnings: parseFloat(totalEarnings.toFixed(2)),
        availableBalance: parseFloat(availableBalance.toFixed(2)),
        pendingPayoutAmount: parseFloat(pendingPayoutAmount.toFixed(2)),
        lastPayoutDate: lastPayoutDate,
      },
    });
  } catch (error) {
    console.error("Error fetching wallet summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wallet summary",
      error: error.message,
    });
  }
};

// ============ EARNINGS BY GROUP ============
// Returns: group name, messages sent, amount earned, grouped by group
// Optional: date filter (from/to)
exports.getEarningsByGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fromDate, toDate } = req.query;

    // Build date filter
    let whereClause = { adminId: userId };
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    // Get earnings grouped by group
    const earnings = await prisma.earning.findMany({
      where: whereClause,
      select: {
        groupId: true,
        adminAmount: true,
        group: {
          select: {
            groupName: true,
          },
        },
      },
    });

    // Count messages sent per group (from Message table)
    const messageStats = await prisma.message.groupBy({
      by: ["groupId"],
      where: {
        campaign: {
          brand: { id: userId },
        },
        group: {
          adminId: userId,
        },
      },
      _count: {
        id: true,
      },
    });

    // Combine data
    const earningsByGroupMap = {};
    earnings.forEach((e) => {
      if (!earningsByGroupMap[e.groupId]) {
        earningsByGroupMap[e.groupId] = {
          groupId: e.groupId,
          groupName: e.group?.groupName || "Unknown",
          messagesSent: 0,
          amountEarned: 0,
        };
      }
      earningsByGroupMap[e.groupId].amountEarned += parseFloat(e.adminAmount) || 0;
    });

    // Add message counts
    messageStats.forEach((stat) => {
      if (earningsByGroupMap[stat.groupId]) {
        earningsByGroupMap[stat.groupId].messagesSent = stat._count.id;
      }
    });

    const earningsByGroup = Object.values(earningsByGroupMap)
      .map((item) => ({
        ...item,
        amountEarned: parseFloat(item.amountEarned.toFixed(2)),
      }))
      .sort((a, b) => b.amountEarned - a.amountEarned); // Sort by earnings DESC

    res.status(200).json({
      success: true,
      earningsByGroup,
    });
  } catch (error) {
    console.error("Error fetching earnings by group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch earnings by group",
      error: error.message,
    });
  }
};

// ============ EARNINGS TIMELINE ============
// Returns: read-only log of all earnings
// Shows: date, campaign/brand reference, group name, messages count, amount credited
exports.getEarningsTimeline = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fromDate, toDate, page = 1, limit = 20 } = req.query;

    // Build date filter
    let whereClause = { adminId: userId };
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.earning.count({
      where: whereClause,
    });

    // Get earnings with related data
    const earnings = await prisma.earning.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        adminAmount: true,
        group: {
          select: {
            groupName: true,
            groupId: true,
          },
        },
        campaign: {
          select: {
            name: true,
            brand: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    // Count messages per earning (per campaign + group combo)
    const earningsWithMessageCount = await Promise.all(
      earnings.map(async (e) => {
        const messageCount = await prisma.message.count({
          where: {
            campaignId: e.campaign?.id,
            groupId: e.group?.groupId,
          },
        });

        return {
          id: e.id,
          date: e.createdAt,
          campaignName: e.campaign?.name || "Unknown",
          brandName: e.campaign?.brand?.name || "Unknown",
          groupName: e.group?.groupName || "Unknown",
          messagesCount: messageCount,
          amountCredited: parseFloat(e.adminAmount || 0).toFixed(2),
        };
      })
    );

    res.status(200).json({
      success: true,
      timeline: earningsWithMessageCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching earnings timeline:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch earnings timeline",
      error: error.message,
    });
  }
};

// ============ REQUEST PAYOUT ============
// Creates a payout request with PENDING status
// Manual processing in Phase-1
exports.requestPayout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Please provide a positive number.",
      });
    }

    // Get wallet summary to check available balance
    const earnings = await prisma.earning.findMany({
      where: { adminId: userId },
      select: { adminAmount: true },
    });

    const totalEarnings = earnings.reduce((sum, e) => {
      return sum + (parseFloat(e.adminAmount) || 0);
    }, 0);

    const payoutRequests = await prisma.payoutRequest.findMany({
      where: { adminId: userId, status: "PAID" },
      select: { amount: true },
    });

    const paidAmount = payoutRequests.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const availableBalance = totalEarnings - paidAmount;

    // Check if user has sufficient balance
    if (parseFloat(amount) > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}, Requested: ₹${parseFloat(amount).toFixed(2)}`,
      });
    }

    // Create payout request
    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        adminId: userId,
        amount: parseFloat(amount),
        status: "PENDING",
      },
      select: {
        id: true,
        amount: true,
        status: true,
        requestedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Payout request submitted successfully. Our team will process it within 2-3 business days.",
      payoutRequest,
    });
  } catch (error) {
    console.error("Error requesting payout:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit payout request",
      error: error.message,
    });
  }
};

// ============ PAYOUT HISTORY ============
// Returns: all payout requests with status
// Shows: request date, amount, status (Pending/Paid/Rejected)
exports.getPayoutHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Get total count
    const totalCount = await prisma.payoutRequest.count({
      where: { adminId: userId },
    });

    // Get payout requests
    const payouts = await prisma.payoutRequest.findMany({
      where: { adminId: userId },
      select: {
        id: true,
        amount: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        notes: true,
      },
      orderBy: {
        requestedAt: "desc",
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const formattedPayouts = payouts.map((p) => ({
      id: p.id,
      requestDate: p.requestedAt,
      amount: parseFloat(p.amount).toFixed(2),
      status: p.status,
      processedDate: p.processedAt,
      notes: p.notes,
    }));

    res.status(200).json({
      success: true,
      payouts: formattedPayouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching payout history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payout history",
      error: error.message,
    });
  }
};
