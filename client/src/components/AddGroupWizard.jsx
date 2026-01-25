import { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  CheckCircle,
  Smartphone,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import api from "../api/axios";

/**
 * ADD GROUP WIZARD
 * ================
 * Step 1: Paste Group Link
 * Step 2: Connect WhatsApp (QR) & Auto-Scan
 * Step 3: Configure (Tags, Caps, Consent)
 */
const AddGroupWizard = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [link, setLink] = useState("");
  const [waStatus, setWaStatus] = useState("IDLE");
  const [qrCode, setQrCode] = useState(null);
  const [foundGroup, setFoundGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'not-admin', 'not-member', 'connection', 'general'
  const [showProgress, setShowProgress] = useState(false); // Show loading view after scan
  const [lookupAttempted, setLookupAttempted] = useState(false); // Prevent duplicate lookups
  const [qrSeen, setQrSeen] = useState(false); // Track if QR was displayed

  // Form Config
  const [config, setConfig] = useState({
    pricePerMessage: 3,
    monetizationEnabled: true,
    consentConfirmed: false,
    tags: "", // Comma separated
    dailyMessageCap: 1, // New: Daily message cap per member
  });

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLink("");
      setFoundGroup(null);
      setError(null);
      setErrorType(null);
      setQrCode(null);
      setWaStatus("IDLE");
      setShowProgress(false);
      setLookupAttempted(false);
      setQrSeen(false);
    }
  }, [isOpen]);

  const handleLookupGroup = useCallback(async () => {
    if (lookupAttempted) {
      console.log("Lookup already attempted, skipping...");
      return; // Prevent duplicate lookups
    }

    setLookupAttempted(true);
    setLoading(true);
    setError(null);
    setErrorType(null);
    try {
      console.log("Starting Lookup...");
      const res = await api.post("/whatsapp/lookup", { link });
      console.log("Lookup Success:", res.data);
      setFoundGroup(res.data.group);
      setStep(3); // Go to Config
    } catch (err) {
      console.error("Lookup failed:", err);
      const errorMsg = err.response?.data?.error || "";
      const statusCode = err.response?.status;

      // Determine error type and set appropriate message based on exact error text
      if (errorMsg.includes("NOT an Admin")) {
        setErrorType("not-admin");
        setError(
          "You are not an admin of this WhatsApp group. Only group admins can import groups to the platform.",
        );
      } else if (errorMsg.includes("not a member")) {
        setErrorType("not-member");
        setError(
          "You are not a member of this group. Please join the group first or verify you're using the correct WhatsApp account.",
        );
      } else if (
        errorMsg.includes("not READY") ||
        errorMsg.includes("not connected") ||
        statusCode === 503
      ) {
        setErrorType("connection");
        setError(
          "WhatsApp connection is not ready. Please scan the QR code and wait for connection to establish.",
        );
      } else if (errorMsg.includes("private chat")) {
        setErrorType("general");
        setError(
          "This link points to a private chat, not a group. Please use a valid group invite link.",
        );
      } else if (statusCode === 403) {
        // 403 means user permission issue (not admin or not member)
        setErrorType("not-member");
        setError(
          "You don't have access to this group. Make sure you're using the correct WhatsApp account.",
        );
      } else {
        setErrorType("general");
        setError(
          errorMsg ||
            "Could not verify group. Please check the link and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [link, lookupAttempted]);

  // Polling for WhatsApp status (Step 2)
  useEffect(() => {
    let timeout;
    if (isOpen && step === 2 && !lookupAttempted) {
      const poll = async () => {
        try {
          const res = await api.get("/whatsapp/status");
          const { status, qrCodeUrl } = res.data;
          setWaStatus(status);
          if (qrCodeUrl) {
            setQrCode(qrCodeUrl);
            if (!qrSeen) {
              setQrSeen(true);
            }
          } else {
            // QR was shown but now gone = user has scanned, show loading immediately!
            if (qrSeen && !showProgress) {
              console.log(
                "[AddGroupWizard] QR disappeared - scan detected, showing progress",
              );
              setShowProgress(true);
              setQrCode(null);
            }
          }

          // When status changes to AUTHENTICATED or READY, show progress and trigger lookup
          if (status === "READY" || status === "AUTHENTICATED") {
            setShowProgress(true);
            // Trigger lookup - it will check lookupAttempted flag to prevent duplicates
            handleLookupGroup();
            // Don't continue polling after this - lookup will handle the result
            return;
          } else {
            // Poll faster for better UX while waiting for scan
            timeout = setTimeout(poll, 300);
          }
        } catch (err) {
          console.error("Poll error", err);
          timeout = setTimeout(poll, 1000); // Slower retry on error
        }
      };
      poll();
    }
    return () => clearTimeout(timeout);
  }, [isOpen, step, handleLookupGroup, lookupAttempted]);

  const handleStartConnection = async () => {
    if (!link.includes("chat.whatsapp.com")) {
      setError("Please enter a valid WhatsApp Group Link.");
      setErrorType("general");
      return;
    }
    setError(null);
    setErrorType(null);
    setLoading(true);

    try {
      // OPTIMIZATION: First check if WhatsApp is already connected
      const statusRes = await api.get("/whatsapp/status");
      const currentStatus = statusRes.data.status;

      if (currentStatus === "READY") {
        // Already connected! Skip QR and go directly to lookup
        console.log("[AddGroupWizard] WhatsApp already READY, skipping QR");
        setWaStatus("READY");
        setShowProgress(true);
        setStep(2); // Show progress view
        // Trigger lookup directly
        handleLookupGroup();
        return;
      }

      // Not connected yet - start connection and show QR
      await api.post("/whatsapp/connect");
      setStep(2); // Go to QR/Scan mode
      // Keep showProgress false - we'll show QR first, then progress after scan
    } catch (err) {
      setErrorType("connection");
      setError(
        err.response?.data?.error ||
          "Could not start WhatsApp connection. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setErrorType(null);
    setLookupAttempted(false); // Allow retry
    setShowProgress(false); // Hide progress, show QR again
    setQrSeen(false);
    // Polling will restart automatically when lookupAttempted becomes false
  };

  const handleSaveGroup = async () => {
    if (!config.consentConfirmed) {
      setError("You must confirm that members have consented.");
      setErrorType("general");
      return;
    }

    setLoading(true);
    setError(null);
    setErrorType(null);
    try {
      await api.post("/groups/import", {
        ...foundGroup,
        whatsappGroupId: foundGroup.id,
        groupName: foundGroup.name,
        inviteLink: link,
        tags: config.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        pricePerMessage: Number(config.pricePerMessage) || 1,
        dailyMessageCap: Number(config.dailyMessageCap) || 1,
        monetizationEnabled: config.monetizationEnabled,
        consentConfirmed: config.consentConfirmed,
      });
      onSuccess();
      onClose();
      alert("Group Imported Successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "";
      setErrorType("general");
      if (errorMsg.includes("already exists")) {
        setError(
          "This group has already been imported. Please check your groups list.",
        );
      } else {
        setError(errorMsg || "Failed to save group. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-mvp-card border border-mvp-border rounded-xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-mvp-border flex justify-between items-center bg-mvp-bg/50">
          <h2 className="text-xl font-bold">Add Group</h2>
          <button onClick={onClose}>
            <X size={24} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="flex border-b border-mvp-border">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1 ${step >= i ? "bg-brand-accent" : "bg-mvp-border"}`}
            />
          ))}
        </div>

        <div className="p-8 overflow-y-auto">
          {/* Error Banner with Context */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1">
                  <h4 className="text-red-500 font-semibold text-sm mb-1">
                    {errorType === "not-admin" && "❌ Not an Admin"}
                    {errorType === "not-member" && "❌ Not a Member"}
                    {errorType === "connection" && "⚠️ Connection Issue"}
                    {errorType === "general" && "⚠️ Error"}
                  </h4>
                  <p className="text-red-400 text-sm leading-relaxed">
                    {error}
                  </p>

                  {/* Helpful actions based on error type */}
                  {errorType === "not-admin" && (
                    <div className="mt-3 p-3 bg-red-500/5 rounded border border-red-500/20">
                      <p className="text-xs text-red-300 mb-2">
                        💡 <strong>What can I do?</strong>
                      </p>
                      <ul className="text-xs text-red-300/80 space-y-1 list-disc list-inside">
                        <li>Ask a group admin to make you an admin</li>
                        <li>
                          Try scanning with a different WhatsApp account that's
                          an admin
                        </li>
                        <li>
                          Create or manage a group where you're already an admin
                        </li>
                      </ul>
                      <button
                        onClick={handleRetry}
                        className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded border border-red-500/30 transition-colors"
                      >
                        Try Another Group
                      </button>
                    </div>
                  )}

                  {errorType === "not-member" && (
                    <div className="mt-3 p-3 bg-red-500/5 rounded border border-red-500/20">
                      <p className="text-xs text-red-300 mb-2">
                        💡 <strong>What can I do?</strong>
                      </p>
                      <ul className="text-xs text-red-300/80 space-y-1 list-disc list-inside">
                        <li>Join the group using the invite link first</li>
                        <li>Ask the group admin to add you</li>
                        <li>Try scanning with a different WhatsApp account</li>
                      </ul>
                      <button
                        onClick={handleRetry}
                        className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded border border-red-500/30 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {errorType === "connection" && (
                    <div className="mt-3 p-3 bg-red-500/5 rounded border border-red-500/20">
                      <p className="text-xs text-red-300 mb-2">
                        💡 <strong>What can I do?</strong>
                      </p>
                      <ul className="text-xs text-red-300/80 space-y-1 list-disc list-inside">
                        <li>Scan the QR code again with WhatsApp</li>
                        <li>Wait for your phone to show "Logged in"</li>
                        <li>Check your internet connection</li>
                      </ul>
                      <button
                        onClick={handleRetry}
                        className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded border border-red-500/30 transition-colors"
                      >
                        Retry Connection
                      </button>
                    </div>
                  )}

                  {errorType === "general" && (
                    <button
                      onClick={handleRetry}
                      className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded border border-red-500/30 transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: LINK */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2">
                  Paste Group Invite Link
                </h3>
                <p className="text-mvp-sub text-sm">
                  We use this to identify the group.
                </p>
              </div>
              <input
                type="text"
                placeholder="https://chat.whatsapp.com/..."
                className="input-field w-full text-center"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <button
                onClick={handleStartConnection}
                disabled={loading || !link}
                className="btn-primary w-full"
              >
                {loading ? "Starting..." : "Next"} <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: CONNECT & SCAN */}
          {step === 2 && (
            <div className="text-center space-y-6">
              {/* Scenario 1: Progress view shown immediately after scan/auth */}
              {showProgress ||
              loading ||
              waStatus === "READY" ||
              waStatus === "AUTHENTICATED" ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h3 className="text-lg font-bold text-white">
                    Preparing Your Group
                  </h3>
                  <p className="text-mvp-sub text-sm">
                    This takes a moment. We'll handle everything for you.
                  </p>

                  {/* Progress checklist */}
                  <div className="mt-6 w-full max-w-sm text-left mx-auto space-y-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border ${waStatus === "AUTHENTICATED" || waStatus === "READY" ? "border-brand-accent" : "border-mvp-border"} ${waStatus === "AUTHENTICATED" ? "bg-brand-accent/40" : ""}`}
                      ></div>
                      <span className="text-sm text-gray-300">
                        Connecting to WhatsApp
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border ${loading ? "border-brand-accent" : "border-mvp-border"} ${loading ? "bg-brand-accent/40" : ""}`}
                      ></div>
                      <span className="text-sm text-gray-300">
                        Resolving invite link
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border ${loading ? "border-brand-accent" : "border-mvp-border"}`}
                      ></div>
                      <span className="text-sm text-gray-300">
                        Verifying admin access
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border ${loading ? "border-brand-accent" : "border-mvp-border"}`}
                      ></div>
                      <span className="text-sm text-gray-300">
                        Syncing participants
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Scenario 2: QR Code / Initializing */
                <>
                  <h3 className="text-lg font-bold">Connect WhatsApp</h3>

                  {waStatus === "INITIALIZING" && (
                    <div className="animate-pulse text-gray-400">
                      Initializing Client...
                    </div>
                  )}

                  {qrCode && waStatus === "QR_READY" && (
                    <div className="bg-white p-2 rounded-lg inline-block">
                      <img src={qrCode} alt="Scan QR" className="w-48 h-48" />
                    </div>
                  )}
                  <p className="text-xs text-mvp-sub">
                    Scan with the WhatsApp account that is Admin of the group.
                  </p>
                </>
              )}
            </div>
          )}

          {/* STEP 3: CONFIGURE */}
          {step === 3 && foundGroup && (
            <div className="space-y-4">
              <div className="bg-brand-accent/10 border border-brand-accent/20 p-4 rounded-lg flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl">
                  {foundGroup.name?.[0] || "?"}
                </div>
                <div>
                  <h3 className="font-bold">
                    {foundGroup.name || "Unnamed Group"}
                  </h3>
                  <p className="text-sm text-mvp-sub">
                    {foundGroup.memberCount} Members • You are Admin
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Group Tags{" "}
                    <span className="text-gray-500">
                      (e.g., city, interest, profession)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="Bangalore, Startups, Founders"
                    value={config.tags}
                    onChange={(e) =>
                      setConfig({ ...config, tags: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Separate multiple tags with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Daily Message Cap Per Member
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="input-field flex-1"
                      min="1"
                      max="10"
                      value={config.dailyMessageCap}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          dailyMessageCap: e.target.value,
                        })
                      }
                    />
                    <span className="text-sm text-gray-400">messages/day</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Maximum paid messages each member receives per day
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Price Per Message (₹)
                  </label>
                  <input
                    type="number"
                    className="input-field w-full"
                    min="0.1"
                    step="0.1"
                    value={config.pricePerMessage}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricePerMessage: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Amount brands pay per message sent to members
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-mvp-bg rounded border border-mvp-border mt-4">
                <input
                  type="checkbox"
                  id="consent"
                  className="mt-1"
                  checked={config.consentConfirmed}
                  onChange={(e) =>
                    setConfig({ ...config, consentConfirmed: e.target.checked })
                  }
                />
                <label
                  htmlFor="consent"
                  className="text-xs text-gray-400 leading-relaxed cursor-pointer"
                >
                  I confirm that members of this group have consented to receive
                  promotional messages via me, and I agree to the platform's
                  Anti-Spam Policy.
                </label>
              </div>

              <button
                onClick={handleSaveGroup}
                disabled={loading || !config.consentConfirmed}
                className="btn-primary w-full mt-4"
              >
                {loading ? "Importing Members..." : "Complete Import"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddGroupWizard;
