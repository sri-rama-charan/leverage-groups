import { useState, useEffect } from "react";
import { X, Trash2, Check } from "lucide-react";
import api from "../api/axios";

/**
 * MANAGE GROUP MODAL
 * Allows GA to edit group details:
 * - Tags
 * - Daily message cap
 * - Price per message
 * - Monetization status
 */
const ManageGroupModal = ({ isOpen, group, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    tags: "",
    dailyMessageCap: 1,
    pricePerMessage: 3,
    monetizationEnabled: true,
  });

  // Initialize form when group changes
  useEffect(() => {
    if (group && isOpen) {
      setFormData({
        tags: (group.tags || []).join(", "),
        dailyMessageCap: group.dailyMessageCap || 1,
        pricePerMessage: group.pricePerMessage || 3,
        monetizationEnabled: group.monetizationEnabled || true,
      });
      setError(null);
      setSuccess(false);
    }
  }, [group, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.put(`/groups/${group.id}`, {
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        dailyMessageCap: Number(formData.dailyMessageCap) || 1,
        pricePerMessage: Number(formData.pricePerMessage) || 1,
        monetizationEnabled: formData.monetizationEnabled,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to update group:", err);
      setError(
        err.response?.data?.error || "Failed to update group. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-mvp-card border border-mvp-border rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-mvp-border flex justify-between items-center">
          <h2 className="text-xl font-bold">Manage Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Group Name Display */}
          <div className="bg-brand-accent/10 border border-brand-accent/20 p-4 rounded-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Group Name
            </p>
            <h3 className="text-lg font-bold text-white">{group.groupName}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {group.scrapedMemberCount || group.memberCount || 0} members
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm flex items-center gap-2">
              ❌ {error}
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded text-sm flex items-center gap-2 animate-pulse">
              <Check size={16} /> Changes saved successfully!
            </div>
          )}

          {/* Tags Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Tags <span className="text-gray-500">(comma separated)</span>
            </label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="Bangalore, Startups, Founders"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              Help brands discover your group
            </p>
          </div>

          {/* Daily Message Cap */}
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
                value={formData.dailyMessageCap}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dailyMessageCap: e.target.value,
                  })
                }
              />
              <span className="text-sm text-gray-400">messages/day</span>
            </div>
            <p className="text-xs text-gray-500">
              Protect member experience with daily limits
            </p>
          </div>

          {/* Price Per Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Price Per Message (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">₹</span>
              <input
                type="number"
                className="input-field flex-1"
                min="0.1"
                step="0.1"
                value={formData.pricePerMessage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricePerMessage: e.target.value,
                  })
                }
              />
            </div>
            <p className="text-xs text-gray-500">
              Amount brands pay per message sent
            </p>
          </div>

          {/* Monetization Toggle */}
          <div className="flex items-center justify-between p-3 bg-mvp-bg rounded border border-mvp-border">
            <div>
              <p className="text-sm font-medium text-gray-300">
                Monetization
              </p>
              <p className="text-xs text-gray-500">
                {formData.monetizationEnabled
                  ? "Group is active and earning"
                  : "Group is paused"}
              </p>
            </div>
            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  monetizationEnabled: !formData.monetizationEnabled,
                })
              }
              className={`relative w-12 h-7 rounded-full transition-colors ${
                formData.monetizationEnabled
                  ? "bg-brand-accent"
                  : "bg-gray-600"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.monetizationEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-mvp-border flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-4 rounded-lg border border-mvp-border text-gray-300 hover:bg-mvp-border transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || success}
            className="flex-1 py-2 px-4 bg-brand-accent hover:opacity-90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : success ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageGroupModal;
