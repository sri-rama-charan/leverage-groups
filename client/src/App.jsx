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

        {/* Placeholder for Dashboard */}
        <Route
          path="/dashboard"
          element={
            <div className="text-white text-center mt-20 text-3xl">
              Dashboard Coming Soon 🚀
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
