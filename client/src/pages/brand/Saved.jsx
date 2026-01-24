import { useState, useEffect } from "react";
import { Bookmark, MessageCircle, Users, DollarSign, X, AlertCircle } from "lucide-react";
import api from "../../api/axios";

/**
 * BRAND SAVED GROUPS PAGE
 * Shows all groups that the brand has saved/bookmarked for later use.
 */
const BrandSaved = () => {
  const [allGroups, setAllGroups] = useState([]);
  const [savedGroupIds, setSavedGroupIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroupsAndSaved();
  }, []);

  const fetchGroupsAndSaved = async () => {
    try {
      // Fetch all groups
      const response = await api.get("/groups");
      setAllGroups(response.data.groups || []);
      
      // Load saved group IDs from localStorage
      const saved = JSON.parse(localStorage.getItem("savedGroups") || "[]");
      setSavedGroupIds(saved);
      
      setError(null);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setError("Failed to load saved groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get only saved groups
  const savedGroups = allGroups.filter(group => savedGroupIds.includes(group.id));

  const removeSavedGroup = (groupId) => {
    const updated = savedGroupIds.filter(id => id !== groupId);
    localStorage.setItem("savedGroups", JSON.stringify(updated));
    setSavedGroupIds(updated);
  };

  const clearAllSaved = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all saved groups? This action cannot be undone."
    );
    if (confirmed) {
      localStorage.setItem("savedGroups", JSON.stringify([]));
      setSavedGroupIds([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <h3 className="text-red-500 font-medium">{error}</h3>
        <button
          onClick={fetchGroupsAndSaved}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Saved Groups</h1>
          <p className="text-gray-400">
            Your bookmarked groups for quick access
          </p>
        </div>
        {savedGroups.length > 0 && (
          <button
            onClick={clearAllSaved}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors w-full md:w-auto"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Empty State */}
      {savedGroups.length === 0 ? (
        <div className="bg-[#1a1d28] border border-white/30 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Saved Groups Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Start saving groups from the Groups page to quickly access them later for your campaigns.
          </p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-400">
              You have <span className="text-white font-medium">{savedGroups.length}</span> saved group{savedGroups.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Saved Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {savedGroups.map((group) => (
              <div
                key={group.id}
                className="bg-[#1a1d28] border border-white/30 rounded-2xl p-6 hover:border-white/50 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 relative"
              >
                {/* Remove Button */}
                <button
                  onClick={() => removeSavedGroup(group.id)}
                  className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  title="Remove from saved"
                >
                  <X size={18} />
                </button>

                {/* Header: Name + Admin */}
                <div className="mb-4 pb-4 border-b border-white/10 pr-8">
                  <h3 className="text-lg font-bold text-white mb-0.5">
                    {group.groupName || "Unnamed Group"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    by {group.admin?.name || "Unknown"}
                  </p>
                </div>

                {/* Stats Section */}
                <div className="space-y-3 my-5">
                  {/* Row 1: Members + Daily Cap */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-black/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users size={16} className="text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Members</p>
                        <p className="text-base font-bold text-white">
                          {(group.scrapedMemberCount || group.memberCount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-black/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={16} className="text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Daily Cap</p>
                        <p className="text-base font-bold text-white">{group.dailyMessageCap || 1}</p>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Price */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-black/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-sm font-bold">₹</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Price</p>
                      <p className="text-base font-bold text-white">
                        {parseFloat(group.pricePerMessage || 0).toFixed(2)} / msg
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
                  {group.tags && group.tags.length > 0 ? (
                    group.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-black/30 text-gray-400 text-[11px] rounded-md"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">No tags</span>
                  )}
                </div>

                {/* Use Group Button */}
                <button className="w-full py-2.5 bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent text-sm font-medium rounded-lg transition-colors">
                  Use in Campaign
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BrandSaved;
