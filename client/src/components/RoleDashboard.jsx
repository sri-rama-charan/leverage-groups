import { useAuth } from "../context/AuthContext";
import GroupAdminHome from "../pages/group-admin/Home";
import BrandHome from "../pages/brand/Home";

/**
 * RoleDashboard Component
 * Renders the appropriate dashboard based on user role
 * This ensures proper role-based rendering that updates on role changes
 */
const RoleDashboard = () => {
  const { user } = useAuth();

  // Debug: Log the user role being used for dashboard selection
  console.log("RoleDashboard: user.role =", user?.role);

  // Render brand dashboard for brand users
  if (user?.role === "BR") {
    return <BrandHome />;
  }

  // Render group admin dashboard for GA users
  if (user?.role === "GA") {
    return <GroupAdminHome />;
  }

  // Fallback (shouldn't reach here due to ProtectedRoute)
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-white">Invalid user role</div>
    </div>
  );
};

export default RoleDashboard;
