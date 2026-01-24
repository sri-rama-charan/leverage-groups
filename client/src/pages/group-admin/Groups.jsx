import { useState, useEffect, useMemo } from "react";
import { Plus, Search, MessageCircle, AlertCircle, Trash2, Tag, Users, DollarSign, Calendar, Filter, X, SlidersHorizontal } from "lucide-react";
import api from "../../api/axios";
import AddGroupWizard from "../../components/AddGroupWizard";
import ManageGroupModal from "../../components/ManageGroupModal";

// ====== GROUPS PAGE ======
// Shows admin all their WhatsApp groups
// Admin can see: groups, members, prices, tags
// Admin can: add groups, delete groups

const Groups = () => {
  // STATE: Store the data
  const [groups, setGroups] = useState([]);       // List of groups
  const [loading, setLoading] = useState(true);   // Is it loading?
  const [error, setError] = useState(null);       // Any errors?
  const [isModalOpen, setIsModalOpen] = useState(false); // Show add group popup?
  const [selectedGroup, setSelectedGroup] = useState(null); // Selected group for manage modal
  const [isManageOpen, setIsManageOpen] = useState(false); // Show manage group modal?

  // FILTER STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, members-high, members-low, price-high, price-low
  const [showFilters, setShowFilters] = useState(false);

  // WHEN PAGE LOADS: Get all groups from server
  useEffect(() => {
    fetchGroups();
  }, []);

  // FUNCTION: Get all groups from server
  const fetchGroups = async () => {
    try {
      const response = await api.get("/groups");  // Ask server for groups
      setGroups(response.data.groups);            // Save them
      setError(null);                             // No error
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setError(
        "We couldn't load your groups. Please check your connection or try again.",
      );
    } finally {
      setLoading(false);                          // Done loading
    }
  };

  // FUNCTION: Refresh groups when admin adds new one
  const handleConnectSuccess = () => {
    fetchGroups();           // Get latest groups
    setIsModalOpen(false);   // Close popup
  };

  // FUNCTION: Open manage group modal
  const handleManageGroup = (group) => {
    setSelectedGroup(group);
    setIsManageOpen(true);
  };

  // FUNCTION: Refresh groups after update
  const handleGroupUpdated = () => {
    fetchGroups();
  };

  // Get all unique tags from groups
  const allTags = useMemo(() => {
    const tags = new Set();
    groups.forEach(group => {
      if (group.tags && Array.isArray(group.tags)) {
        group.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [groups]);

  // Filter and sort groups
  const filteredGroups = useMemo(() => {
    let filtered = [...groups];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.groupName?.toLowerCase().includes(query) ||
        group.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(group =>
        group.tags?.includes(selectedTag)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "members-high":
          return (b.scrapedMemberCount || 0) - (a.scrapedMemberCount || 0);
        case "members-low":
          return (a.scrapedMemberCount || 0) - (b.scrapedMemberCount || 0);
        case "price-high":
          return parseFloat(b.pricePerMessage || 0) - parseFloat(a.pricePerMessage || 0);
        case "price-low":
          return parseFloat(a.pricePerMessage || 0) - parseFloat(b.pricePerMessage || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [groups, searchQuery, selectedTag, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("");
    setSortBy("newest");
  };

  const hasActiveFilters = searchQuery || selectedTag || sortBy !== "newest";

  // FUNCTION: Delete a group when admin clicks trash icon
  const handleDeleteGroup = async (groupId, groupName) => {
    // Ask admin: "Are you sure?"
    const confirmed = window.confirm(
      `Are you sure you want to delete "${groupName}"?\n\nThis will remove the group and all its members from the platform. This action cannot be undone.`
    );
    
    if (!confirmed) return; // Admin said "No", don't delete

    try {
      // Tell server to delete it
      await api.delete(`/groups/${groupId}`);
      // Refresh the list
      await fetchGroups();
      alert("Group deleted successfully!");
    } catch (err) {
      console.error("Failed to delete group:", err);
      alert(err.response?.data?.error || "Failed to delete group. Please try again.");
    }
  };

  // --- DIFFERENT SCREENS ---

  // SCREEN 1: Loading (show skeleton)
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-mvp-card rounded w-1/4 mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-mvp-card rounded-lg border border-mvp-border"
          ></div>
        ))}
      </div>
    );
  }

  // SCREEN 2: Error (show error message)
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <h3 className="text-red-500 font-medium">{error}</h3>
        <button
          onClick={fetchGroups}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // SCREEN 3: Main page with groups list
  return (
    <div className="animate-fade-in relative">
      {/* Add Group Wizard */}
      <AddGroupWizard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleConnectSuccess}
      />

      {/* Manage Group Modal */}
      <ManageGroupModal
        isOpen={isManageOpen}
        group={selectedGroup}
        onClose={() => setIsManageOpen(false)}
        onSuccess={handleGroupUpdated}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Groups</h1>
          <p className="text-mvp-sub">
            Manage your connected WhatsApp communities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)} // Open Modal
          className="btn-primary w-full md:w-auto"
        >
          <Plus size={20} />
          <span>Add New Group</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      {groups.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Search and Filter Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups by name or tag..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1d28] border border-white/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? "bg-brand-accent/10 border-brand-accent text-brand-accent"
                  : "bg-[#1a1d28] border-white/30 text-gray-400 hover:text-white hover:border-white/50"
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && !showFilters && (
                <span className="w-2 h-2 bg-brand-accent rounded-full"></span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-[#1a1d28] border border-white/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Filter size={18} />
                  Filter Options
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tag Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Tag
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                  >
                    <option value="">All Tags</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="members-high">Most Members</option>
                    <option value="members-low">Least Members</option>
                    <option value="price-high">Highest Price</option>
                    <option value="price-low">Lowest Price</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                  <span className="text-sm text-gray-400">Active filters:</span>
                  {searchQuery && (
                    <span className="px-2.5 py-1 bg-brand-accent/10 text-brand-accent text-xs rounded-md flex items-center gap-1">
                      Search: "{searchQuery}"
                      <button onClick={() => setSearchQuery("")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedTag && (
                    <span className="px-2.5 py-1 bg-brand-accent/10 text-brand-accent text-xs rounded-md flex items-center gap-1">
                      Tag: {selectedTag}
                      <button onClick={() => setSelectedTag("")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {sortBy !== "newest" && (
                    <span className="px-2.5 py-1 bg-brand-accent/10 text-brand-accent text-xs rounded-md flex items-center gap-1">
                      Sort: {sortBy.replace("-", " ")}
                      <button onClick={() => setSortBy("newest")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-400">
              Showing <span className="text-white font-medium">{filteredGroups.length}</span> of{" "}
              <span className="text-white font-medium">{groups.length}</span> groups
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {groups.length === 0 ? (
        <div className="bg-mvp-card border border-mvp-border rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-brand-accent" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Groups Yet</h3>
          <p className="text-mvp-sub max-w-md mb-8">
            Connect your WhatsApp to create groups.
          </p>
          <button
            onClick={() => setIsModalOpen(true)} // Open Modal
            className="btn-primary"
          >
            Connect WhatsApp
          </button>
        </div>
      ) : (
        /* Groups List - Professional card grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-[#1a1d28] border border-white/30 rounded-2xl p-6 hover:border-white/50 transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
            >
              {/* Header: Name + Status + Delete */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-0.5">
                    {group.groupName || "Unnamed Group"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteGroup(group.id, group.groupName)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete Group"
                  >
                    <Trash2 size={16} />
                  </button>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 uppercase">
                    ACTIVE
                  </span>
                </div>
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
                        {group.scrapedMemberCount || group.memberCount || 0}
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
                      className="px-2.5 py-1 bg-black/30 text-gray-400 text-[11px] rounded-md hover:bg-black/50 transition-colors"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No tags</span>
                )}
              </div>

              {/* Manage Button */}
              <button
                className="w-full py-2.5 bg-black/40 hover:bg-black/60 text-white text-sm font-medium rounded-lg transition-colors"
                onClick={() => handleManageGroup(group)}
              >
                Manage Group
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Groups;
