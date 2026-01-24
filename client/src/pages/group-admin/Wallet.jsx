import { useState, useEffect } from "react";
import { DollarSign, RefreshCw } from "lucide-react";
import api from "../../api/axios";
import WalletSummary from "../../components/WalletSummary";
import EarningsByGroup from "../../components/EarningsByGroup";
import EarningsTimeline from "../../components/EarningsTimeline";
import PayoutRequestModal from "../../components/PayoutRequestModal";
import PayoutHistory from "../../components/PayoutHistory";

/**
 * Wallet Page for Group Admin
 * Phase-1: Manual Payouts
 *
 * Features:
 * - Wallet Summary (total earnings, available balance, pending payouts)
 * - Earnings by Group (sortable, filterable)
 * - Earnings Timeline (read-only log)
 * - Request Payout (manual processing)
 * - Payout History (status tracking)
 */
const Wallet = () => {
  // State management
  const [summary, setSummary] = useState(null);
  const [earningsByGroup, setEarningsByGroup] = useState([]);
  const [earningsTimeline, setEarningsTimeline] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);

  const [timelinePagination, setTimelinePagination] = useState({ page: 1, pages: 1, total: 0 });
  const [payoutPagination, setPayoutPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all wallet data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [summaryRes, earningsRes, timelineRes, payoutRes] = await Promise.all(
        [
          api.get("/wallet/summary"),
          api.get("/wallet/earnings-by-group"),
          api.get("/wallet/earnings-timeline", { params: { page: 1 } }),
          api.get("/wallet/payout-history", { params: { page: 1 } }),
        ]
      );

      setSummary(summaryRes.data.summary);
      setEarningsByGroup(earningsRes.data.earningsByGroup || []);
      setEarningsTimeline(timelineRes.data.timeline || []);
      setTimelinePagination(timelineRes.data.pagination || { page: 1, pages: 1, total: 0 });
      setPayoutHistory(payoutRes.data.payouts || []);
      setPayoutPagination(payoutRes.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Failed to load wallet data. Please try again.";
      setError(errorMsg);
      console.error("Error fetching wallet data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data (manual refresh button)
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAllData();
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch earnings with date filter
  const handleEarningsDateFilter = async (dates) => {
    try {
      const params = {};
      if (dates.fromDate) params.fromDate = dates.fromDate;
      if (dates.toDate) params.toDate = dates.toDate;

      const res = await api.get("/wallet/earnings-by-group", { params });
      setEarningsByGroup(res.data.earningsByGroup || []);
    } catch (err) {
      console.error("Error filtering earnings:", err);
    }
  };

  // Fetch earnings timeline with pagination
  const handleTimelinePageChange = async (page) => {
    try {
      const res = await api.get("/wallet/earnings-timeline", {
        params: { page },
      });
      setEarningsTimeline(res.data.timeline || []);
      setTimelinePagination(res.data.pagination || { page, pages: 1, total: 0 });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error fetching timeline page:", err);
    }
  };

  // Fetch payout history with pagination
  const handlePayoutPageChange = async (page) => {
    try {
      const res = await api.get("/wallet/payout-history", {
        params: { page },
      });
      setPayoutHistory(res.data.payouts || []);
      setPayoutPagination(res.data.pagination || { page, pages: 1, total: 0 });
    } catch (err) {
      console.error("Error fetching payout history page:", err);
    }
  };

  // Handle successful payout request
  const handlePayoutSuccess = () => {
    // Refresh all data to update summary and history
    fetchAllData();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-brand-accent" />
          <div>
            <h1 className="text-3xl font-bold text-white">Wallet</h1>
            <p className="text-mvp-sub text-sm mt-1">Track your earnings and manage payouts</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-mvp-card border border-mvp-border rounded-lg text-white font-medium hover:border-white/20 disabled:opacity-50 transition flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          {summary && summary.availableBalance > 0 && (
            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Request Payout
            </button>
          )}
        </div>
      </div>

      {/* Global Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

        {/* Wallet Summary */}
        <WalletSummary
          summary={summary}
          loading={loading}
          error={null}
        />

        {/* Earnings by Group */}
        <EarningsByGroup
          earnings={earningsByGroup}
          loading={loading}
          error={null}
          onDateFilterChange={handleEarningsDateFilter}
        />

        {/* Earnings Timeline */}
        <EarningsTimeline
          timeline={earningsTimeline}
          loading={loading}
          error={null}
          pagination={timelinePagination}
          onPageChange={handleTimelinePageChange}
        />

        {/* Payout History */}
        <PayoutHistory
          payouts={payoutHistory}
          loading={loading}
          error={null}
          pagination={payoutPagination}
          onPageChange={handlePayoutPageChange}
        />

      {/* Payout Request Modal */}
      <PayoutRequestModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        availableBalance={summary?.availableBalance || 0}
        onSuccess={handlePayoutSuccess}
      />

      {/* Info Banner */}
      <div className="fixed bottom-4 right-4 max-w-sm bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 shadow-lg">
        <p className="text-xs text-blue-300">
          <strong>💡 Phase-1 Note:</strong> All payouts are manually processed
          by our team. Please allow 2-3 business days for processing after
          submission.
        </p>
      </div>
    </div>
  );
};

export default Wallet;
