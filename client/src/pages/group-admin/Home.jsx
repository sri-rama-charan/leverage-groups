import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Zap,
  Plus,
} from "lucide-react";
import api from "../../api/axios";

/**
 * GROUP ADMIN HOME
 * The main landing page after login.
 * Shows quick stats and overview with real data.
 */
const GroupAdminHome = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalGroups: 0,
    totalMembers: 0,
    totalEarnings: 0,
    availableBalance: 0,
    pendingPayouts: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    recentActivity: [],
    topGroups: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch groups data
      const groupsRes = await api.get("/groups");
      const groups = groupsRes.data.groups || [];

      // Fetch wallet summary
      let walletData = {
        totalLifetimeEarnings: 0,
        availableBalance: 0,
        pendingPayoutAmount: 0,
      };
      try {
        const walletRes = await api.get("/wallet/summary");
        walletData = walletRes.data;
      } catch (err) {
        console.log("Wallet data not available");
      }

      // Calculate total members
      const totalMembers = groups.reduce(
        (sum, group) => sum + (group.scrapedMemberCount || group.memberCount || 0),
        0
      );

      // Fetch earnings timeline for recent activity
      let recentActivity = [];
      try {
        const activityRes = await api.get("/wallet/earnings-timeline?limit=5");
        recentActivity = activityRes.data.earnings || [];
      } catch (err) {
        console.log("Activity data not available");
      }

      // Get top groups by earnings
      let topGroups = [];
      try {
        const topGroupsRes = await api.get("/wallet/earnings-by-group");
        topGroups = (topGroupsRes.data.earnings || [])
          .sort((a, b) => parseFloat(b.totalEarnings) - parseFloat(a.totalEarnings))
          .slice(0, 5);
      } catch (err) {
        console.log("Top groups data not available");
      }

      setDashboardData({
        totalGroups: groups.length,
        totalMembers,
        totalEarnings: walletData.totalLifetimeEarnings || 0,
        availableBalance: walletData.availableBalance || 0,
        pendingPayouts: walletData.pendingPayoutAmount || 0,
        thisMonthEarnings: 0, // Can be calculated from earnings timeline
        lastMonthEarnings: 0,
        recentActivity,
        topGroups,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Groups",
      value: dashboardData.totalGroups,
      sub: "Active Communities",
      icon: <Users size={24} />,
      color: "emerald",
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      action: () => navigate("/dashboard/groups"),
    },
    {
      label: "Total Members",
      value: dashboardData.totalMembers.toLocaleString(),
      sub: "Scraped Contacts",
      icon: <MessageCircle size={24} />,
      color: "blue",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      label: "Lifetime Earnings",
      value: `₹${parseFloat(dashboardData.totalEarnings).toFixed(2)}`,
      sub: "Total Revenue",
      icon: <TrendingUp size={24} />,
      color: "purple",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
      action: () => navigate("/dashboard/wallet"),
    },
    {
      label: "Available Balance",
      value: `₹${parseFloat(dashboardData.availableBalance).toFixed(2)}`,
      sub: "Ready to Withdraw",
      icon: <DollarSign size={24} />,
      color: "amber",
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-400",
      action: () => navigate("/dashboard/wallet"),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Hello, {user.name || "Admin"} 👋
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your groups today
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/groups")}
          className="btn-primary w-full md:w-auto"
        >
          <Plus size={20} />
          <span>Add New Group</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.action}
            className={`bg-[#1a1d28] border border-white/30 rounded-xl p-6 hover:border-white/50 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 ${
              stat.action ? "cursor-pointer" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <span className={stat.iconColor}>{stat.icon}</span>
              </div>
              {stat.action && (
                <ArrowUpRight size={18} className="text-gray-400" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className="text-xs text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Performing Groups */}
        <div className="xl:col-span-2 bg-[#1a1d28] border border-white/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Top Performing Groups</h2>
              <p className="text-sm text-gray-400 mt-1">By total earnings</p>
            </div>
            <button
              onClick={() => navigate("/dashboard/wallet")}
              className="text-sm text-brand-accent hover:text-brand-accent/80 font-medium"
            >
              View All →
            </button>
          </div>

          {dashboardData.topGroups.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.topGroups.map((group, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-black/30 rounded-lg hover:bg-black/40 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/10 rounded-lg flex-shrink-0">
                    <span className="text-emerald-400 font-bold">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {group.groupName}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {group.messagesSent || 0} messages sent
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">
                      ₹{parseFloat(group.totalEarnings || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">Total earned</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-400">No earnings data yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Start sending campaigns to see your top groups
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1a1d28] border border-white/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard/groups")}
              className="w-full flex items-center gap-3 p-4 bg-black/30 hover:bg-black/40 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Manage Groups</p>
                <p className="text-xs text-gray-400">Add or edit your groups</p>
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/dashboard/wallet")}
              className="w-full flex items-center gap-3 p-4 bg-black/30 hover:bg-black/40 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">View Wallet</p>
                <p className="text-xs text-gray-400">Check earnings & payouts</p>
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/dashboard/subscriptions")}
              className="w-full flex items-center gap-3 p-4 bg-black/30 hover:bg-black/40 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Zap size={20} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Subscriptions</p>
                <p className="text-xs text-gray-400">Manage your plan</p>
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/dashboard/settings")}
              className="w-full flex items-center gap-3 p-4 bg-black/30 hover:bg-black/40 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Activity size={20} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Settings</p>
                <p className="text-xs text-gray-400">Account preferences</p>
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a1d28] border border-white/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <p className="text-sm text-gray-400 mt-1">Latest earnings from campaigns</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/wallet")}
            className="text-sm text-brand-accent hover:text-brand-accent/80 font-medium"
          >
            View All →
          </button>
        </div>

        {dashboardData.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-black/30 rounded-lg"
              >
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign size={20} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium">
                    {activity.groupName || "Unknown Group"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {activity.messagesSent || 0} messages • {new Date(activity.earnedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">
                    +₹{parseFloat(activity.amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-400">No recent activity</p>
            <p className="text-sm text-gray-500 mt-1">
              Your earnings will appear here once campaigns start
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupAdminHome;
