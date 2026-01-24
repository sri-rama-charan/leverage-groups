import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  LogOut,
  Target,
  BarChart3,
  Bookmark,
} from "lucide-react";
import api from "../api/axios"; // Import API client

/**
 * SIDEBAR COMPONENT
 * This is the navigation menu on the left side of the dashboard.
 * It contains links to different pages and the Logout button.
 * Supports both Group Admin (GA) and Brand (BR) roles.
 */
const Sidebar = () => {
  const location = useLocation(); // To know which page is active
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Handle Logout
  const handleLogout = async () => {
    // 1. Tell backend to disconnect WhatsApp (Security Requirement)
    try {
      await api.post("/whatsapp/disconnect"); // We reuse the disconnect endpoint
    } catch (err) {
      console.warn("Backend logout failed, forcing local logout:", err);
    }

    // 2. Remove the "VIP Pass" (Token) from user's browser
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 3. Send them back to the Login page
    navigate("/login");
  };

  // List of Links for Group Admins
  const gaLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { name: "My Groups", path: "/dashboard/groups", icon: <Users size={20} /> },
    {
      name: "Wallet",
      path: "/dashboard/wallet",
      icon: <DollarSign size={20} />,
    },
    {
      name: "Subscriptions",
      path: "/dashboard/subscriptions",
      icon: <CreditCard size={20} />,
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: <Settings size={20} />,
    },
  ];

  // List of Links for Brands
  const brandLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "Groups",
      path: "/dashboard/groups",
      icon: <Users size={20} />,
    },
    {
      name: "Saved",
      path: "/dashboard/saved",
      icon: <Bookmark size={20} />,
    },
    {
      name: "Campaigns",
      path: "/dashboard/campaigns",
      icon: <Target size={20} />,
    },
    {
      name: "Wallet",
      path: "/dashboard/wallet",
      icon: <DollarSign size={20} />,
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: <Settings size={20} />,
    },
  ];

  // Select links based on user role
  const links = user.role === "BR" ? brandLinks : gaLinks;

  return (
    <div className="w-64 bg-mvp-card border-r border-mvp-border flex flex-col h-screen fixed left-0 top-0">
      {/* 1. Logo / Brand Name */}
      <div className="p-6 border-b border-mvp-border">
        <h1 className="text-xl font-bold text-white tracking-wide">
          Leverage<span className="text-brand-accent">Groups</span>
        </h1>
      </div>

      {/* 2. Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                isActive
                  ? "bg-brand-accent/10 text-brand-accent" // Active Style
                  : "text-mvp-sub hover:bg-mvp-border hover:text-white" // Inactive Style
              }`}
            >
              {link.icon}
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. Logout Button (at the bottom) */}
      <div className="p-4 border-t border-mvp-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-md transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
