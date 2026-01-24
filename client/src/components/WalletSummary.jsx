import { TrendingUp, Wallet, Clock, Calendar } from "lucide-react";

/**
 * WalletSummary Component
 * Displays: Total lifetime earnings, Available balance, Pending payouts, Last payout date
 */
const WalletSummary = ({ summary, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-mvp-card border border-mvp-border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div className="h-8 bg-mvp-border rounded animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-mvp-border rounded animate-pulse"></div>
            ))}
          </div>
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

  const stats = [
    {
      label: "Total Lifetime Earnings",
      value: `₹${summary?.totalLifetimeEarnings?.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      color: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      label: "Available Balance",
      value: `₹${summary?.availableBalance?.toFixed(2) || "0.00"}`,
      icon: Wallet,
      color: "bg-green-500/10",
      iconColor: "text-green-400",
    },
    {
      label: "Pending Payouts",
      value: `₹${summary?.pendingPayoutAmount?.toFixed(2) || "0.00"}`,
      icon: Clock,
      color: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
    {
      label: "Last Payout Date",
      value: summary?.lastPayoutDate
        ? new Date(summary.lastPayoutDate).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "No payouts yet",
      icon: Calendar,
      color: "bg-purple-500/10",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <div className="bg-mvp-card border border-mvp-border rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-white mb-4">Wallet Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.color} rounded-lg p-4 border border-white/10`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
                <Icon className={`${stat.iconColor} w-6 h-6`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WalletSummary;
