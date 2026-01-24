import { useState, useEffect, useMemo } from "react";
import { Search, Filter, X, SlidersHorizontal, Star, MessageCircle, Users, DollarSign, MapPin, Tag, AlertCircle } from "lucide-react";
import api from "../../api/axios";

/**
 * BRAND GROUPS PAGE
 * Shows all available groups from all Group Admins that the brand can launch campaigns in.
 * Provides filters by tags, members, price, and search.
 */
const BrandGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedGroups, setSavedGroups] = useState([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [minMembers, setMinMembers] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchGroups();
    loadSavedGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get("/groups/available");
      setGroups(response.data.groups || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setError("Failed to load groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedGroups = () => {
    const saved = JSON.parse(localStorage.getItem("savedGroups") || "[]");
    setSavedGroups(saved);
  };

  // Get all unique tags
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

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.groupName?.toLowerCase().includes(query) ||
        group.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(group =>
        group.tags?.includes(selectedTag)
      );
    }

    // Member count filter
    if (minMembers) {
      const minVal = parseInt(minMembers);
      filtered = filtered.filter(group =>
        (group.scrapedMemberCount || 0) >= minVal
      );
    }

    // Price filter
    if (maxPrice) {
      const maxVal = parseFloat(maxPrice);
      filtered = filtered.filter(group =>
        parseFloat(group.pricePerMessage || 0) <= maxVal
      );
    }

    // Sorting
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
  }, [groups, searchQuery, selectedTag, minMembers, maxPrice, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("");
    setMinMembers("");
    setMaxPrice("");
    setSortBy("newest");
  };

  const hasActiveFilters = searchQuery || selectedTag || minMembers || maxPrice || sortBy !== "newest";

  const toggleSaveGroup = (groupId) => {
    const saved = JSON.parse(localStorage.getItem("savedGroups") || "[]");
    const index = saved.indexOf(groupId);
    
    if (index > -1) {
      saved.splice(index, 1);
    } else {
      saved.push(groupId);
    }
    
    localStorage.setItem("savedGroups", JSON.stringify(saved));
    setSavedGroups(saved);
  };

  const isGroupSaved = (groupId) => savedGroups.includes(groupId);

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
          onClick={fetchGroups}
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
          <h1 className="text-3xl font-bold text-white mb-1">Available Groups</h1>
          <p className="text-gray-400">
            Browse and select groups for your campaigns
          </p>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-4">
          {/* Search and Filter Bar */}
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

                {/* Min Members */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Members
                  </label>
                  <input
                    type="number"
                    value={minMembers}
                    onChange={(e) => setMinMembers(e.target.value)}
                    placeholder="e.g., 100"
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent placeholder-gray-500"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Price (per msg)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="e.g., 10"
                    step="0.01"
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent placeholder-gray-500"
                  />
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

      {/* Groups Grid */}
      {filteredGroups.length === 0 && groups.length > 0 ? (
        <div className="bg-[#1a1d28] border border-white/30 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Groups Found</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            No groups match your filters. Try adjusting your search or filters.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-brand-accent/10 text-brand-accent rounded-lg hover:bg-brand-accent/20 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-[#1a1d28] border border-white/30 rounded-xl p-12 text-center">
          <MessageCircle className="h-8 w-8 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Groups Available</h3>
          <p className="text-gray-400">
            There are no groups available yet. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-[#1a1d28] border border-white/30 rounded-2xl p-6 hover:border-white/50 transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
            >
              {/* Header: Name + Save Button */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-0.5 line-clamp-2">
                    {group.groupName || "Unnamed Group"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    by {group.admin?.name || "Unknown"}
                  </p>
                </div>
                <button
                  onClick={() => toggleSaveGroup(group.id)}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    isGroupSaved(group.id)
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-black/30 text-gray-400 hover:text-white"
                  }`}
                  title={isGroupSaved(group.id) ? "Remove from saved" : "Save group"}
                >
                  <Star size={18} fill={isGroupSaved(group.id) ? "currentColor" : "none"} />
                </button>
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
                      className="px-2.5 py-1 bg-black/30 text-gray-400 text-[11px] rounded-md hover:bg-black/50 transition-colors"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No tags</span>
                )}
              </div>

              {/* Select Group Button */}
              <button className="w-full py-2.5 bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent text-sm font-medium rounded-lg transition-colors">
                Select Group
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandGroups;
