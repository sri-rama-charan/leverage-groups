import { useState, useEffect } from "react";
import { Plus, Search, MessageCircle, AlertCircle, Trash2, Tag, Users, DollarSign, Calendar } from "lucide-react";
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
        /* Groups List - Professional card grid matching exact design */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-[#2a2d3a] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
            >
              {/* Header: Name + Status + Delete */}
              <div className="flex items-start justify-between mb-4">
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
                    className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
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
                      className="px-2.5 py-1 bg-black/30 text-gray-400 text-[11px] rounded-md"
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
                onClick={() => alert(`Manage ${group.groupName}`)}
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
