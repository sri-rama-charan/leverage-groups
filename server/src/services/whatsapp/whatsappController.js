const whatsappService = require("./whatsappClient");

/**
 * CONNECT WHATSAPP
 * Starts the client and prepares the QR code.
 */
const connect = async (req, res) => {
  try {
    const userId = req.user.id;

    // Start the service for this user
    whatsappService.initialize(userId);

    res.status(200).json({ message: "Initializing WhatsApp..." });
  } catch (error) {
    console.error("WA Connect Error:", error);
    res.status(500).json({ error: "Failed to initialize." });
  }
};

/**
 * GET STATUS
 * Frontend polls this to get the QR code or check if connected.
 */
const getStatus = async (req, res) => {
  const status = whatsappService.getStatus();
  console.log("[API] Status request - Current state:", status.status, status.qrCodeUrl ? "(has QR)" : "(no QR)");
  res.status(200).json(status);
};

/**
 * LOOKUP GROUP
 * Finds a group by invite link.
 */
const lookupGroup = async (req, res) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ error: "Link is required" });

  try {
    const group = await whatsappService.getGroupFromInviteLink(link);
    if (!group) {
      return res
        .status(404)
        .json({ error: "Group not found or you are not an admin." });
    }

    // Success Response (This was missing!)
    console.log("[API] Sending group details to frontend...");
    res.status(200).json({ group });
  } catch (error) {
    console.error("Lookup Error:", error.message);
    const msg = error.message;

    // Specific error messages
    if (
      msg.includes("not a member") ||
      msg.includes("NOT an Admin") ||
      msg.includes("private chat")
    ) {
      return res.status(403).json({ error: msg });
    }

    // Phone mismatch between platform account and scanned WhatsApp
    if (msg.includes("WhatsApp number mismatch")) {
      return res.status(403).json({ error: msg });
    }

    // Puppeteer/WhatsApp-web.js errors
    if (
      msg.includes("Puppeteer") ||
      msg.includes("Evaluation") ||
      msg.includes("timed out") ||
      msg.includes("context destroyed")
    ) {
      return res.status(503).json({ 
        error: "WhatsApp connection unstable. Please try again in a few seconds.",
        details: msg
      });
    }

    // Failed after retries
    if (msg.includes("Failed after")) {
      return res.status(503).json({
        error: "Unable to resolve the invite link. Please ensure:\n1) The link is valid\n2) Your WhatsApp connection is stable\n3) You are an admin of the group",
        details: msg
      });
    }

    res.status(500).json({ error: "Failed to lookup group. " + msg });
  }
};

/**
 * DISCONNECT
 */
const disconnect = async (req, res) => {
  try {
    await whatsappService.logout();
    res.status(200).json({ message: "Disconnected." });
  } catch (err) {
    console.error("[API] Disconnect error:", err);
    res.status(500).json({ error: "Failed to disconnect cleanly." });
  }
};

module.exports = { connect, getStatus, disconnect, lookupGroup };
