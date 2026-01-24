import { useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * PayoutHistory Component
 * Shows all payout requests with their status
 * Statuses: Pending, Paid, Rejected
 */
const PayoutHistory = ({
  payouts,
  loading,
  error,
  pagination,
  onPageChange,
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "PAID":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-800 border-amber-200",
      PAID: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-400 border-red-200",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
          styles[status] || styles.PENDING
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-mvp-card border border-mvp-border rounded-lg p-6">
        <div className="h-8 bg-mvp-border rounded animate-pulse mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-mvp-border rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-mvp-card border border-mvp-border rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Payout History</h2>

      {payouts && payouts.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">No payout requests yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/30 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">
                    Request Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">
                    Amount (₹)
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">
                    Processed Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {payouts?.map((payout, index) => (
                  <tr
                    key={payout.id}
                    className={index % 2 === 0 ? "bg-mvp-card" : "bg-black/20"}
                  >
                    <td className="px-4 py-3 text-white">
                      {new Date(payout.requestDate).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      ₹{payout.amount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payout.status)}
                        {getStatusBadge(payout.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {payout.processedDate
                        ? new Date(payout.processedDate).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                      {payout.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing page {pagination.page} of {pagination.pages} (
                {pagination.total} total requests)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-mvp-border rounded-lg text-sm font-medium text-gray-300 hover:bg-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from(
                  { length: Math.min(pagination.pages, 5) },
                  (_, i) => {
                    let page;
                    if (pagination.pages <= 5) {
                      page = i + 1;
                    } else if (pagination.page <= 3) {
                      page = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      page = pagination.pages - 4 + i;
                    } else {
                      page = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          page === pagination.page
                            ? "bg-brand-accent text-white"
                            : "border border-mvp-border text-gray-300 hover:bg-black/20"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-mvp-border rounded-lg text-sm font-medium text-gray-300 hover:bg-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PayoutHistory;
