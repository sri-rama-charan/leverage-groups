import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import SelectRole from "./pages/SelectRole";
import Login from "./pages/Login";
import DashboardLayout from "./pages/DashboardLayout";
import GroupAdminHome from "./pages/group-admin/Home";
import Subscriptions from "./pages/group-admin/Subscriptions";
import Groups from "./pages/group-admin/Groups";
import Wallet from "./pages/group-admin/Wallet";
import BrandWallet from "./pages/brand/Wallet";
import Settings from "./pages/group-admin/Settings";
import BrandHome from "./pages/brand/Home";
import BrandGroups from "./pages/brand/Groups";
import BrandSaved from "./pages/brand/Saved";
import RoleDashboard from "./components/RoleDashboard";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Redirect root to Login for now */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Dashboard Routes (wrapper style for nested routes) */}
          <Route element={<ProtectedRoute allowedRoles={["GA", "BR"]} />}>
            <Route 
              path="/dashboard" 
              element={<DashboardLayout />}
            >
              {/* Dashboard Home - Role-based component */}
              <Route index element={<RoleDashboard />} />

              {/* Group Admin Only Routes */}
              <Route 
                path="groups" 
                element={<ProtectedRoute element={<Groups />} allowedRoles="GA" />} 
              />
              <Route 
                path="wallet" 
                element={<ProtectedRoute element={<Wallet />} allowedRoles="GA" />} 
              />
              <Route 
                path="subscriptions" 
                element={<ProtectedRoute element={<Subscriptions />} allowedRoles="GA" />} 
              />

              {/* Brand Only Routes */}
              <Route 
                path="brand/groups" 
                element={<ProtectedRoute element={<BrandGroups />} allowedRoles="BR" />} 
              />
              <Route 
                path="brand/wallet" 
                element={<ProtectedRoute element={<BrandWallet />} allowedRoles="BR" />} 
              />
              <Route 
                path="brand/saved" 
                element={<ProtectedRoute element={<BrandSaved />} allowedRoles="BR" />} 
              />

              {/* Shared Routes (accessible by both roles) */}
              <Route 
                path="settings" 
                element={<ProtectedRoute element={<Settings />} allowedRoles={["GA", "BR"]} />} 
              />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
