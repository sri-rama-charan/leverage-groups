const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * WHATSAPP CLIENT SINGLETON
 * ==========================
 * Manages the single instance of the WhatsApp Web Client.
 * In a multi-tenant SaaS, we might eventually need one client per user,
 * but for this stage, we assume one active session (or switch sessions).
 *
 * DESIGN CHOICE:
 * We use 'LocalAuth' to save the session tokens to disk.
 * This ensures that if the server restarts, the phone stays connected.
 */
class WhatsAppService {
  constructor() {
    this.client = null;
    this.qrCodeUrl = null;
    this.status = "IDLE"; // IDLE, QR_READY, READY, DISCONNECTED
    this.userId = null;
  }

  /**
   * Initialize the Client
   * @param {string} userId - The user who is connecting
   */
  initialize(userId) {
    if (this.client) {
      console.log("[WA] Client already exists. Current status:", this.status);
      // If already initialized, still let the client emit its current state
      return;
    }

    this.userId = userId;
    this.status = "INITIALIZING";
    console.log("[WA] Status changed to INITIALIZING");

    console.log(`[WA] Initializing client for user: ${userId}`);

    // Session Path: ./sessions/user_id
    // This allows multiple users to have separate session folders eventually
    const sessionPath = path.join(__dirname, "../../../.wwebjs_auth");

    this.client = new Client({
      restartOnAuthFail: true, // Keep true for resilience
      puppeteer: {
        headless: true,
        protocolTimeout: 240000, // Fix for "Runtime.callFunctionOn timed out" (4 minutes)
        timeout: 60000, // Nagivation timeout
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      },
      authStrategy: new LocalAuth({
        clientId: userId,
        dataPath: sessionPath,
      }),
      // Fix for "Execution context destroyed" / Loading issues
      // Required for wwebjs v1.23+ stability
      webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      },
    });

    this.setupListeners();
    
    // Add a safety timeout check (60 seconds) to detect if initialization hangs
    const initTimeout = setTimeout(() => {
      if (this.status === "INITIALIZING") {
        console.error("[WA] CRITICAL: Client initialization timed out after 60s!");
        console.error("[WA] The client may be stuck. Check Puppeteer/Chrome logs.");
        console.error("[WA] Possible causes:");
        console.error("  - Chrome/Chromium not installed");
        console.error("  - Insufficient system resources");
        console.error("  - Network connectivity issues");
      }
    }, 60000);
    
    // Store timeout reference to clear it later
    this.initTimeout = initTimeout;
    
    try {
      console.log("[WA] Calling client.initialize()...");
      this.client.initialize();
    } catch (err) {
      console.error("[WA] FATAL: Error during client.initialize():", err);
      this.status = "DISCONNECTED";
      throw err;
    }
  }

  setupListeners() {
    // 1. QR Code Generated
    this.client.on("qr", async (qr) => {
      clearTimeout(this.initTimeout); // Clear initialization timeout
      console.log("[WA] QR Code received!");
      this.status = "QR_READY";
      // Convert QR text to a Data URL (Image) for the frontend
      this.qrCodeUrl = await qrcode.toDataURL(qr);
    });

    // 2. Client is Ready (Phone connected)
    this.client.on("ready", () => {
      clearTimeout(this.initTimeout); // Clear initialization timeout
      console.log("[WA] Client is READY!");
      console.log("[WA] My ID:", this.client.info.wid._serialized);
      this.status = "READY";
      this.qrCodeUrl = null;
    });

    // 3. Authenticated (Saved session restored)
    this.client.on("authenticated", () => {
      clearTimeout(this.initTimeout); // Clear initialization timeout
      console.log("[WA] Client Authenticated!");
      this.status = "AUTHENTICATED";
      console.log("[WA] Waiting for 'ready' event after authentication...");
    });

    // 4. Auth Failure
    this.client.on("auth_failure", (msg) => {
      console.error("[WA] Auth Failure:", msg);
      this.status = "DISCONNECTED";
      console.error("[WA] Session may be corrupted. Try clearing .wwebjs_auth folder.");
    });

    // 5. Disconnected
    this.client.on("disconnected", (reason) => {
      console.log("[WA] Client Disconnected:", reason);
      this.status = "DISCONNECTED";
      this.client = null;
      this.qrCodeUrl = null;
      console.log("[WA] Status reset to DISCONNECTED. Ready for new connection.");
    });
  }

  /**
   * Get Current Status & QR
   */
  getStatus() {
    return {
      status: this.status,
      qrCodeUrl: this.qrCodeUrl,
    };
  }

  /**
   * Find a Group by Invite Link
   * @param {string} inviteLink - The full invite link or code
   */
  async getGroupFromInviteLink(inviteLink) {
    // 1. Wait for Client to be fully READY
    // The frontend might trigger this when 'AUTHENTICATED', but we need 'READY' for browser modules.
    if (this.status === "AUTHENTICATED") {
      console.log("[WA] Client is AUTHENTICATED but not READY. Waiting...");
      for (let i = 0; i < 60; i++) {
        // Wait up to 30s
        if (this.status === "READY") break;
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (this.status !== "READY") {
      throw new Error(
        "WhatsApp client is not ready (Status: " + this.status + ")",
      );
    }

    try {
      // 2. Extract the code (e.g., https://chat.whatsapp.com/XYZ -> XYZ)
      // Also strip query parameters (e.g., ?mode=gi_t)
      let code = inviteLink
        .replace("https://chat.whatsapp.com/", "")
        .replace("http://chat.whatsapp.com/", "");

      // Remove query parameters
      code = code.split("?")[0];

      console.log(`[WA] Resolving invite code: ${code}`);

      // 2. Resolve the Invite Code to get the Group ID directly with retry logic
      // getInviteInfo can fail with Puppeteer evaluation errors, so we retry
      let inviteInfo = null;
      let lastError = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[WA] Attempt ${attempt}/${maxRetries} to resolve invite...`);
          inviteInfo = await this.client.getInviteInfo(code);
          if (inviteInfo && inviteInfo.id) {
            console.log(`[WA] Successfully resolved invite on attempt ${attempt}`);
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`[WA] Attempt ${attempt} failed:`, err.message);
          if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            const waitTime = Math.min(1000 * attempt, 3000);
            console.log(`[WA] Waiting ${waitTime}ms before retry...`);
            await new Promise((r) => setTimeout(r, waitTime));
          }
        }
      }

      if (!inviteInfo || !inviteInfo.id) {
        const errorMsg = lastError 
          ? `Failed after ${maxRetries} attempts: ${lastError.message}`
          : "Invalid invite link or group does not exist.";
        throw new Error(errorMsg);
      }

      const groupId = inviteInfo.id._serialized;
      console.log(`[WA] Resolved to Group ID: ${groupId}`);

      // Experiment: Can we get admin status from inviteInfo?
      // console.log("[WA] Invite Info Dump:", JSON.stringify(inviteInfo, null, 2));

      // 3. OPTIMIZATION: Try to use Invite Info directly (Fast Mode)
      // This avoids the heavy getChatById() call which syncs history.
      let finalParticipants = [];
      let groupName = inviteInfo.subject || "Unknown Group";
      let isFastMode = false;

      // Check if inviteInfo has usable participant data
      // (It usually does if we are a member or it's a public group info fetch)
      if (inviteInfo.participants && inviteInfo.participants.length > 0) {
        console.log(
          `[WA] Fast Mode: Found ${inviteInfo.participants.length} participants in Invite Info.`,
        );
        finalParticipants = inviteInfo.participants;
        isFastMode = true;
      }

      // Helper to fetch full chat (Slow Mode)
      const fetchFullChat = async () => {
        console.log("[WA] Fetching full chat details (Slow Mode/Fallback)...");
        let chat = await this.client.getChatById(groupId);
        console.log("[WA] Chat details fetched via getChatById.");

        // Force Sync: Fetch 1 message to trigger metadata update instantly if empty
        if (!chat.participants || chat.participants.length === 0) {
          console.log("[WA] Participants list empty. Triggering sync...");
          await chat.fetchMessages({ limit: 1 });

          // Quick retry loop (Max 2s)
          for (let i = 0; i < 10; i++) {
            if (chat.participants && chat.participants.length > 0) break;
            await new Promise((r) => setTimeout(r, 200));
            // Re-fetch object
            chat = await this.client.getChatById(groupId);
          }
        }
        return chat;
      };

      // Attempt to resolve our number upfront for participant matching
      const myId = this.client.info.wid && this.client.info.wid._serialized;
      const myUser = this.client.info.wid && this.client.info.wid.user;
      let resolvedWid = null;

      // Build a helper to find our participant entry from a list
      const findParticipant = (participants = []) => {
        const candidateSerialized = [];
        if (myId) candidateSerialized.push(myId);
        if (resolvedWid?._serialized) candidateSerialized.push(resolvedWid._serialized);
        if (resolvedWid?.user && resolvedWid?.server)
          candidateSerialized.push(`${resolvedWid.user}@${resolvedWid.server}`);

        return participants.find((p) => {
          const sid = p?.id?._serialized;
          const userPart = p?.id?.user;

          // Direct match on serialized IDs
          if (sid && candidateSerialized.includes(sid)) return true;

          // Match using resolved WID user if available
          if (resolvedWid?.user && userPart === resolvedWid.user) return true;

          // Standard check with myUser
          if (myUser && userPart === myUser) return true;

          // Fuzzy check: endsWith (handle country code differences)
          if (myUser && (myUser.endsWith(userPart || "") || (userPart || "").endsWith(myUser)))
            return true;

          return false;
        });
      };

      // If Fast Mode returned only LID participants (no IDs), fallback to Slow Mode to hydrate
      const hasOnlyLidParticipants =
        isFastMode &&
        finalParticipants.length > 0 &&
        finalParticipants.every((p) => p.id?.server === "lid");

      if (hasOnlyLidParticipants) {
        console.log("[WA] Fast Mode participants are LID-only. Attempting fallback to hydrate IDs...");
        const chat = await fetchFullChat();
        if (chat?.participants?.length > 0) {
          console.log("[WA] Hydrated participants via Slow Mode fallback.");
          finalParticipants = chat.participants;
          isFastMode = false;
        } else {
          console.log("[WA] Hydration failed; proceeding with Fast Mode participants (may skip admin check).");
        }
      }

      if (!isFastMode) {
        console.log(
          "[WA] Fast Mode unavailable (no participants in invite). Falling back to full sync...",
        );
        const chat = await fetchFullChat();
        finalParticipants = chat.participants;
        groupName = chat.name;
        if (!chat.isGroup) {
          throw new Error("The link points to a private chat, not a group.");
        }
      }

      // 4. Check Admin Permissions & Existence

      // Fetch the platform user's registered phone and ensure it matches the scanned WhatsApp account
      let registeredPhone = null;
      try {
        const userRecord = await prisma.user.findUnique({
          where: { id: this.userId },
          select: { phone: true },
        });
        registeredPhone = userRecord?.phone || null;
      } catch (e) {
        console.warn("[WA] Could not fetch registered phone for user:", this.userId, e.message);
      }

      const normalizePhone = (p) => (p || "").replace(/[^0-9]/g, "");
      const phonesMatch = (a, b) => {
        const na = normalizePhone(a);
        const nb = normalizePhone(b);
        if (!na || !nb) return false;
        return na === nb || na.endsWith(nb) || nb.endsWith(na);
      };

      // Try to resolve the registered phone to a WhatsApp WID (may return lid or c.us)
      if (registeredPhone) {
        try {
          resolvedWid = await this.client.getNumberId(normalizePhone(registeredPhone));
          if (resolvedWid) {
            console.log("[WA] Resolved registered phone to WID:", resolvedWid?._serialized);
          }
        } catch (e) {
          console.warn("[WA] getNumberId failed for registered phone:", registeredPhone, e.message);
        }
      }

      if (registeredPhone && !phonesMatch(myUser, registeredPhone)) {
        throw new Error(
          "WhatsApp number mismatch: The scanned WhatsApp account does not match the phone registered to your platform user.",
        );
      }

      console.log(`[WA] My ID: ${myId} (User: ${myUser})`);

      let participant = findParticipant(finalParticipants);

      // RETRY LOGIC: Only fall back to Slow Mode if Fast Mode returned very few participants
      // (indicating incomplete/cached data), NOT if user simply wasn't found
      const MIN_PARTICIPANTS_FOR_CONFIDENCE = 3; // If we got at least 3 participants, trust the list
      
      if (!participant && isFastMode && finalParticipants.length < MIN_PARTICIPANTS_FOR_CONFIDENCE) {
        console.warn(
          "[WA] Fast Mode returned very few participants (" + finalParticipants.length + "). Likely incomplete data. Switching to Slow Mode...",
        );
        try {
          const chat = await fetchFullChat();
          finalParticipants = chat.participants;
          groupName = chat.name;
          isFastMode = false; // We are now in slow mode
          participant = findParticipant(finalParticipants);
        } catch (err) {
          console.error("[WA] Slow Mode Fallback failed:", err);
        }
      }

      if (!participant) {
        console.error(
          `[WA] Could not find ${myId} in group participants. Dumping first 5 participants:`,
        );
        console.error(
          finalParticipants
            .slice(0, 5)
            .map((p) => `${p.id.user} (${p.id._serialized})`)
            .join(", "),
        );
        throw new Error(
          "You are not a member of this group. (Are you scanning with the correct phone?)",
        );
      }

      if (!participant.isAdmin && !participant.isSuperAdmin) {
        throw new Error("You are NOT an Admin of this group. Access denied.");
      }

      console.log(
        `[WA] Verified Admin status for: ${groupName} (${isFastMode ? "Fast Mode" : "Slow Mode"})`,
      );

      return {
        id: groupId,
        name: groupName,
        memberCount: finalParticipants.length,
        // Sanitized Participants to avoid Circular JSON errors or "undefined" internal fields
        participants: finalParticipants.map((p) => ({
          // Preserve both the serialized id and the bare user for downstream import logic
          id: {
            _serialized: p.id._serialized,
            user: p.id.user,
          },
          isAdmin: p.isAdmin,
          isSuperAdmin: p.isSuperAdmin,
        })),
        isVerifiedAdmin: true,
      };
    } catch (error) {
      console.error("[WA] Group Lookup Error:", error);
      // Return null or throw specific message
      throw new Error(error.message || "Failed to find group.");
    }
  }

  /**
   * Logout / Disconnect
   */
  async logout() {
    // If client already null, just reset status and return gracefully
    if (!this.client) {
      this.status = "IDLE";
      this.qrCodeUrl = null;
      console.log("[WA] Logout called but client was null. Status reset to IDLE.");
      return;
    }

    try {
      await this.client.logout();
    } catch (err) {
      console.warn("[WA] Logout warning:", err.message || err);
    }

    try {
      await this.client.destroy();
    } catch (err) {
      console.warn("[WA] Destroy warning:", err.message || err);
    }

    this.client = null;
    this.status = "IDLE";
    this.qrCodeUrl = null;
    console.log("[WA] Logged out.");
  }
}

// Export a single instance (Singleton)
module.exports = new WhatsAppService();
