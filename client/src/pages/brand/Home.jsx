import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  Plus,
  Zap,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import api from "../../api/axios";

/**
 * BRAND HOME DASHBOARD
 * The main landing page for brands after login.
 * Shows campaign performance, budget spend, group engagement, and ROI.
 */
const BrandHome = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    activeCampaigns: 0,
    totalBudgetSpent: 0,
    groupsEngaged: 0,
    totalMessages: 0,
    avgROI: 0,
    campaignPerformance: [],
    recentCampaigns: [],
    topPerformingGroups: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch campaigns data (will need to be implemented on backend)
      let campaignsData = {
        activeCampaigns: 0,
        totalBudgetSpent: 0,
        groupsEngaged: 0,
        totalMessages: 0,
        avgROI: 0,
        campaigns: [],
      };

      try {
        const campaignsRes = await api.get("/campaigns");
        if (campaignsRes.data) {
          campaignsData = campaignsRes.data;
        }
      } catch (err) {
        console.log("Campaigns data not available yet");
      }

      setDashboardData({
        activeCampaigns: campaignsData.activeCampaigns || 0,
        totalBudgetSpent: campaignsData.totalBudgetSpent || 0,
        groupsEngaged: campaignsData.groupsEngaged || 0,
        totalMessages: campaignsData.totalMessages || 0,
        avgROI: campaignsData.avgROI || 0,
        campaignPerformance: campaignsData.campaigns?.slice(0, 5) || [],
        recentCampaigns: campaignsData.campaigns?.slice(0, 3) || [],
        topPerformingGroups: campaignsData.campaigns?.slice(0, 5) || [],
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
      label: "Active Campaigns",
      value: dashboardData.activeCampaigns,
      sub: "Running Campaigns",
      icon: <Target size={24} />,
      color: "emerald",
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      action: () => navigate("/dashboard/campaigns"),
    },
    {
      label: "Budget Spent",
      value: `₹${parseFloat(dashboardData.totalBudgetSpent).toFixed(2)}`,
      sub: "Total Spend",
      icon: <DollarSign size={24} />,
      color: "blue",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
      action: () => navigate("/dashboard/analytics"),
    },
    {
      label: "Groups Engaged",
      value: dashboardData.groupsEngaged,
      sub: "Active Groups",
      icon: <Users size={24} />,
      color: "purple",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
    },
    {
      label: "Avg ROI",
      value: `${dashboardData.avgROI.toFixed(1)}%`,
      sub: "Return on Investment",
      icon: <TrendingUp size={24} />,
      color: "amber",
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-400",
      action: () => navigate("/dashboard/analytics"),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome, {user.name || "Brand"} 👋
          </h1>
          <p className="text-gray-400">
            Manage your campaigns and track performance
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/campaigns")}
          className="btn-primary w-full md:w-auto"
        >
          <Plus size={20} />
          <span>Create Campaign</span>
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
        {/* Campaign Performance */}
        <div className="xl:col-span-2 bg-[#1a1d28] border border-white/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Campaign Performance</h2>
              <p className="text-sm text-gray-400 mt-1">Top performing campaigns</p>
            </div>
            <button
              onClick={() => navigate("/dashboard/campaigns")}
              className="text-sm text-brand-accent hover:text-brand-accent/80 font-medium"
            >
              View All →
            </button>
          </div>

          {dashboardData.campaignPerformance.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.campaignPerformance.map((campaign, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-black/30 rounded-lg hover:bg-black/40 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/10 rounded-lg flex-shrink-0">
                    <span className="text-emerald-400 font-bold">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {campaign.name || campaign.campaignName || "Campaign"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {campaign.groupCount || 0} groups • {campaign.messageCount || 0} messages
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">
                      {campaign.roi?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-gray-400">ROI</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-400">No campaigns yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Create your first campaign to get started
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1a1d28] border border-white/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard/campaigns")}
              className="w-full flex items-center gap-3 p-4 bg-black/30 hover:bg-black/40 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Plus size={20} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Create Campaign</p>
                <p className="text-xs text-gray-400">Start new campaign</p>
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/dashboard/analytics")}
              className="w-full flex items-center gap-3 p-4 bg-black/30 hover:bg-black/40 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">View Analytics</p>
                <p className="text-xs text-gray-400">Campaign performance</p>
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/dashboard/billing")}
              className="w-full flex items-center gap-3 p-4 bg-black/30 hover:bg-black/40 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Billing</p>
                <p className="text-xs text-gray-400">Manage payments</p>
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/dashboard/settings")}
              className="w-full flex items-center gap-3 p-4 bg-black/30 hover:bg-black/40 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Zap size={20} className="text-amber-400" />
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
            <h2 className="text-xl font-bold text-white">Campaign Activity</h2>
            <p className="text-sm text-gray-400 mt-1">Latest campaign updates</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/campaigns")}
            className="text-sm text-brand-accent hover:text-brand-accent/80 font-medium"
          >
            View All →
          </button>
        </div>

        {dashboardData.recentCampaigns.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.recentCampaigns.map((campaign, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-black/30 rounded-lg"
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={20} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium">
                    {campaign.name || campaign.campaignName || "Campaign"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {campaign.groupCount || 0} groups • Started {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">
                    ₹{parseFloat(campaign.budget || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Budget</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-400">No campaign activity yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Create and launch campaigns to see activity updates
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandHome;
