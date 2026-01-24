import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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

function App() {
  const getGroupsElement = () => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    return user?.role === "BR" ? <BrandGroups /> : <Groups />;
  };
  const getWalletElement = () => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    return user?.role === "BR" ? <BrandWallet /> : <Wallet />;
  };

  return (
    <Router>
      <Routes>
        {/* Redirect root to Login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Determine which home to show based on role */}
          <Route index element={
            localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")).role === "BR" 
              ? <BrandHome /> 
              : <GroupAdminHome />
          } />
          
          {/* Groups Route - Shows different page based on role */}
          <Route path="groups" element={getGroupsElement()} />
          
          {/* Wallet route - Shows different page based on role */}
          <Route path="wallet" element={getWalletElement()} />
          <Route path="subscriptions" element={<Subscriptions />} />
          
          {/* Brand only routes */}
          <Route path="saved" element={<BrandSaved />} />
          
          {/* Both GA and Brand use Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
