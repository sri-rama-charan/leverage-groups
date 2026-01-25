import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute Component
 * Industry-standard route protection with role-based access control
 *
 * @param {Object} props
 * @param {React.Component} props.element - The component to render if authorized
 * @param {string|string[]} props.allowedRoles - Role(s) that can access this route ("GA", "BR", or ["GA", "BR"])
 * @param {string} props.redirectTo - Path to redirect if unauthorized (default: "/login")
 */
const ProtectedRoute = ({
  element,
  allowedRoles = [],
  redirectTo = "/login",
}) => {
  const { user, loading } = useAuth();
  // Debug: show role and allowedRoles during route guard evaluation
  if (typeof window !== "undefined") {
    try {
      console.debug("ProtectedRoute:", { userRole: user?.role, allowedRoles });
    } catch {
      console.error("Failed to access user role in ProtectedRoute");
    }
  }

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Convert single role to array for easier handling
  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  // No role restriction (accessible by all authenticated users)
  if (rolesArray.length === 0) {
    // Support both element-based and wrapper-based usage
    return element ? element : <Outlet />;
  }

  // Check if user's role is allowed
  const hasAccess = rolesArray.includes(user.role);

  // CRITICAL: If user has no role set (null/undefined), redirect to role selection
  if (!user.role) {
    console.warn(
      "ProtectedRoute: User has no role, redirecting to /select-role",
    );
    return <Navigate to="/select-role" replace />;
  }

  if (!hasAccess) {
    // User is authenticated but doesn't have the right role
    // Redirect to their appropriate dashboard
    console.warn(
      "ProtectedRoute: No access for role",
      user.role,
      "allowed:",
      rolesArray,
    );
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has the right role
  return element ? element : <Outlet />;
};

export default ProtectedRoute;
