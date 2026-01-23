import { useState, useEffect } from "react";
import { X, Smartphone, CheckCircle, Loader } from "lucide-react";
import api from "../api/axios";

/**
 * CONNECT WHATSAPP MODAL
 * ======================
 * Pops up to show the QR Code.
 * 1. Calls /api/whatsapp/connect to start initialization.
 * 2. Polls /api/whatsapp/status every 2 seconds.
 * 3. Shows QR Code when ready.
 * 4. Closes automatically on success.
 */
const ConnectWhatsappModal = ({ isOpen, onClose, onConnected }) => {
  const [status, setStatus] = useState("IDLE"); // IDLE, INITIALIZING, QR_READY, READY
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [error, setError] = useState(null);

  const startConnection = async () => {
    try {
      setStatus("INITIALIZING");
      setQrCodeUrl(null);
      setError(null);
      // Only call connect if we are truly starting fresh
      await api.post("/whatsapp/connect");
    } catch (err) {
      console.error("Connect Error:", err);
      // Don't show error immediately, polling might pick up status
      // If the server is down, polling will eventually catch it.
      // setError("Failed to initialize WhatsApp service."); // Uncomment if you want immediate error feedback
    }
  };

  // Poll for status (Polite Polling)
  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    let initTimeout;

    const pollStatus = async () => {
      if (!isOpen || !isMounted) return;

      try {
        const res = await api.get("/whatsapp/status");
        const { status: newStatus, qrCodeUrl: newQrCodeUrl } = res.data;

        setStatus(newStatus);

        if (newQrCodeUrl) {
          setQrCodeUrl(newQrCodeUrl);
        }

        if (newStatus === "READY" || newStatus === "AUTHENTICATED") {
          setTimeout(() => {
            if (isMounted) {
              // Ensure component is still mounted before calling callbacks
              onConnected();
              onClose();
            }
          }, 2000); // Wait 2s to show success message
          return; // Stop polling if connected
        } else if (newStatus === "DISCONNECTED") {
          // Handle disconnection if needed, perhaps show an error or restart
          setError("WhatsApp client disconnected. Please try again.");
          return; // Stop polling
        }
      } catch (err) {
        console.error("Status Poll Error:", err);
        // Optionally set an error state here if polling consistently fails
      }

      // Schedule next poll only after current one finishes, and if not connected/disconnected
      if (isMounted) {
        timeoutId = setTimeout(pollStatus, 1000);
      }
    };

    if (isOpen) {
      // Start the connection process via setTimeout to avoid synchronous state update in effect
      initTimeout = setTimeout(() => {
        if (isMounted) {
            startConnection();
            pollStatus();
        }
      }, 0);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearTimeout(initTimeout);
    };
  }, [isOpen]); // We only trigger this when Modal opens

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-mvp-card border border-mvp-border p-8 rounded-xl shadow-2xl max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-center">
          Connect WhatsApp
        </h2>
        <p className="text-mvp-sub text-center mb-6">
          Scan the QR code to link your phone.
        </p>

        {/* Content Area */}
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-mvp-bg rounded-lg border border-mvp-border p-4">
          {error ? (
            <div className="text-red-500 text-center">
              <p className="mb-2">⚠️ {error}</p>
              <button onClick={startConnection} className="text-sm underline">
                Retry
              </button>
            </div>
          ) : (
            <>
              {status === "INITIALIZING" && (
                <div className="text-center animate-pulse">
                  <Smartphone className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Initializing Client...</p>
                  <p className="text-xs text-gray-600 mt-2">
                    This may take a few seconds
                  </p>
                </div>
              )}

              {status === "QR_READY" && qrCodeUrl && (
                <div className="text-center animate-fade-in">
                  <div className="bg-white p-2 rounded-lg mb-4 inline-block">
                    <img
                      src={qrCodeUrl}
                      alt="Scan QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-brand-accent animate-pulse">
                    Waiting for scan...
                  </p>
                </div>
              )}

              {(status === "READY" || status === "AUTHENTICATED") && (
                <div className="text-center animate-scale-in">
                  <CheckCircle className="h-20 w-20 text-brand-green mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white">Connected!</h3>
                  <p className="text-gray-400">Redirecting...</p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-xs text-center text-gray-600 mt-4">
          We use secure local authentication. Your session is saved safely.
        </p>
      </div>
    </div>
  );
};

export default ConnectWhatsappModal;
