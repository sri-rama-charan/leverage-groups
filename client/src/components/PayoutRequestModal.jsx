import { useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import api from "../api/axios";

/**
 * PayoutRequestModal Component
 * Allows GA to request manual payout
 * Shows confirmation with processing timeline notice
 */
const PayoutRequestModal = ({
  isOpen,
  onClose,
  availableBalance,
  onSuccess,
}) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState(null);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const requestAmount = parseFloat(amount);
    if (requestAmount > availableBalance) {
      setError(
        `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`
      );
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/wallet/request-payout", {
        amount: requestAmount,
      });

      if (response.data.success) {
        setSuccess(true);
        setSubmittedAmount(requestAmount);
        setAmount("");

        // Close modal and refresh after 3 seconds
        setTimeout(() => {
          onClose();
          setSuccess(false);
          if (onSuccess) onSuccess();
        }, 3000);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Failed to submit payout request. Please try again.";
      setError(errorMsg);
      console.error("Payout request error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-mvp-card border border-mvp-border rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-mvp-border">
          <h2 className="text-lg font-bold text-white">Request Payout</h2>
          <button
            onClick={onClose}
            disabled={loading || success}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            // Success Message
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Payout Request Submitted!
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Amount: <span className="font-bold">₹{submittedAmount?.toFixed(2)}</span>
              </p>
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                <p className="text-xs text-blue-300">
                  <strong>⏱️ Processing Timeline:</strong> Our team will review
                  and process your request within 2-3 business days. You'll
                  receive confirmation via email once the payment is
                  transferred.
                </p>
              </div>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit}>
              {/* Available Balance Info */}
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <p className="text-xs text-blue-300 font-semibold">
                  Available Balance
                </p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  ₹{availableBalance.toFixed(2)}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Payout Amount (₹)
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-mvp-card border border-mvp-border text-white rounded-lg text-lg font-semibold focus:ring-2 focus:ring-brand-accent focus:border-transparent disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum: ₹{availableBalance.toFixed(2)}
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAmount(Math.min(1000, availableBalance).toString())}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-mvp-border text-white rounded hover:bg-white/20 disabled:opacity-50"
                >
                  ₹1,000
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(Math.min(5000, availableBalance).toString())}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-mvp-border text-white rounded hover:bg-white/20 disabled:opacity-50"
                >
                  ₹5,000
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(availableBalance.toString())}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-mvp-border text-white rounded hover:bg-white/20 disabled:opacity-50"
                >
                  All
                </button>
              </div>

              {/* Info Box */}
              <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                <p className="text-xs text-amber-300">
                  <strong>ℹ️ Manual Processing:</strong> Payouts are processed
                  manually. Please allow 2-3 business days for approval and
                  transfer. Bank holidays may cause delays.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-mvp-border rounded-lg text-white font-medium hover:bg-white/5 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !amount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                >
                  {loading ? "Submitting..." : "Request Payout"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayoutRequestModal;
