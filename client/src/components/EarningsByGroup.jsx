import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";

/**
 * EarningsByGroup Component
 * Shows earnings grouped by group with optional date filter
 * Displays: Group name, Messages sent, Amount earned
 */
const EarningsByGroup = ({ earnings, loading, error, onDateFilterChange }) => {
  const [sortBy, setSortBy] = useState("earnings"); // earnings or messages
  const [sortOrder, setSortOrder] = useState("desc"); // asc or desc
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleFilterChange = () => {
    onDateFilterChange({ fromDate, toDate });
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  if (loading) {
    return (
      <div className="bg-mvp-card border border-mvp-border rounded-lg p-6 mb-6">
        <div className="h-8 bg-mvp-border rounded animate-pulse mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-mvp-border rounded animate-pulse"></div>
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

  let displayedEarnings = [...(earnings || [])];

  // Sort
  displayedEarnings.sort((a, b) => {
    let aVal, bVal;
    if (sortBy === "earnings") {
      aVal = parseFloat(a.amountEarned);
      bVal = parseFloat(b.amountEarned);
    } else {
      aVal = a.messagesSent;
      bVal = b.messagesSent;
    }

    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  const totalEarnings = displayedEarnings.reduce(
    (sum, e) => sum + parseFloat(e.amountEarned),
    0
  );
  const totalMessages = displayedEarnings.reduce(
    (sum, e) => sum + e.messagesSent,
    0
  );

  return (
    <div className="bg-mvp-card border border-mvp-border rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-white mb-4">
        Earnings by Group
      </h2>

      {/* Date Filter */}
      <div className="mb-4 p-4 bg-black/30 rounded-lg border border-white/10">
        <p className="text-sm font-medium text-gray-300 mb-3">Date Filter</p>
        <div className="flex flex-col md:flex-row gap-3">
          <div>
            <label className="text-xs text-gray-400">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 px-3 py-2 bg-mvp-card border border-mvp-border text-white rounded text-sm w-full md:w-auto focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 px-3 py-2 bg-mvp-card border border-mvp-border text-white rounded text-sm w-full md:w-auto focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            />
          </div>
          <button
            onClick={handleFilterChange}
            className="md:self-end px-4 py-2 bg-brand-accent text-white rounded text-sm font-medium hover:bg-brand-accent/80 transition"
          >
            Apply Filter
          </button>
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
              onDateFilterChange({ fromDate: "", toDate: "" });
            }}
            className="md:self-end px-4 py-2 bg-mvp-border text-white rounded text-sm font-medium hover:bg-white/20 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      {displayedEarnings.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No earnings data available</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/30 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">
                    Group Name
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold text-gray-300 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSortChange("messages")}
                  >
                    <div className="flex items-center gap-2">
                      Messages Sent
                      {sortBy === "messages" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right font-semibold text-gray-300 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSortChange("earnings")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Amount Earned (₹)
                      {sortBy === "earnings" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedEarnings.map((earning, index) => (
                  <tr
                    key={earning.groupId}
                    className={index % 2 === 0 ? "bg-mvp-card" : "bg-black/20"}
                  >
                    <td className="px-4 py-3 text-white">
                      {earning.groupName}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {earning.messagesSent}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-400">
                      ₹{earning.amountEarned.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Row */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">
                  Total Groups
                </p>
                <p className="text-2xl font-bold text-white">
                  {displayedEarnings.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">
                  Total Messages
                </p>
                <p className="text-2xl font-bold text-white">
                  {totalMessages}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EarningsByGroup;
