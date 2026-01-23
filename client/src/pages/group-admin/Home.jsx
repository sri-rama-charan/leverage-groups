/**
 * GROUP ADMIN HOME
 * The main landing page after login.
 * Shows quick stats and overview.
 */
const GroupAdminHome = () => {
  // Get user info from local storage (saved during login)
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const stats = [
    { label: "Total Groups", value: "0", sub: "Active Communities" },
    { label: "Total Members", value: "0", sub: "Scraped Contacts" },
    { label: "Total Earnings", value: "$0.00", sub: "This Month" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Hello, {user.name || "Admin"} 👋
        </h1>
        <p className="text-mvp-sub">
          Here is what's happening with your groups today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-mvp-card border border-mvp-border p-6 rounded-xl shadow-lg"
          >
            <p className="text-mvp-sub text-sm font-medium uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-xs text-brand-accent">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for Recent Activity */}
      <div className="bg-mvp-card border border-mvp-border rounded-xl p-8 text-center">
        <h3 className="text-lg font-medium text-mvp-sub">No recent activity</h3>
        <p className="text-sm text-gray-600 mt-2">
          Connect your first WhatsApp group to get started!
        </p>

        {/* We will implement the 'Add Group' flow later */}
      </div>
    </div>
  );
};

export default GroupAdminHome;
