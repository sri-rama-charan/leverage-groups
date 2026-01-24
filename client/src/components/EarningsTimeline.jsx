import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

/**
 * EarningsTimeline Component
 * Read-only log of all earnings
 * Shows: Date, Campaign/Brand reference, Group name, Messages count, Amount credited
 */
const EarningsTimeline = ({
  timeline,
  loading,
  error,
  pagination,
  onPageChange,
}) => {
  const [expandedId, setExpandedId] = useState(null);

  if (loading) {
    return (
      <div className="bg-mvp-card border border-mvp-border rounded-lg p-6 mb-6">
        <div className="h-8 bg-mvp-border rounded animate-pulse mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-mvp-border rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-mvp-card border border-mvp-border rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-white mb-4">Earnings Timeline</h2>

      {timeline && timeline.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">No earnings recorded yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {timeline?.map((entry) => (
              <div
                key={entry.id}
                className="border border-white/10 rounded-lg hover:border-brand-accent/50 transition"
              >
                {/* Main Row */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === entry.id ? null : entry.id)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {entry.groupName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(entry.date).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">
                        ₹{parseFloat(entry.amountCredited).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {entry.messagesCount} messages
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 text-gray-400">
                    {expandedId === entry.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedId === entry.id && (
                  <div className="px-4 py-3 bg-black/30 border-t border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">
                          Campaign
                        </p>
                        <p className="text-white mt-1">{entry.campaignName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">
                          Brand
                        </p>
                        <p className="text-white mt-1">{entry.brandName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">
                          Messages
                        </p>
                        <p className="text-white mt-1">
                          {entry.messagesCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">
                          Amount
                        </p>
                        <p className="text-green-400 font-bold mt-1">
                          ₹{parseFloat(entry.amountCredited).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing page {pagination.page} of {pagination.pages} (
                {pagination.total} total entries)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-mvp-border rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                            : "border border-mvp-border text-gray-300 hover:bg-white/5"
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
                  className="px-3 py-2 border border-mvp-border rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
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

export default EarningsTimeline;
