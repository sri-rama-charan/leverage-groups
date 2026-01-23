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

function App() {
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
          <Route index element={<GroupAdminHome />} />
          <Route path="groups" element={<Groups />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route
            path="settings"
            element={
              <div className="text-white p-8">Settings (Coming Soon)</div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
