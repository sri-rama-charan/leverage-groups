import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Phone as PhoneIcon, User } from "lucide-react";
import api from "../api/axios";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Tell the server to create a temp user and send OTP
      const response = await api.post("/auth/register", formData);
      console.log("Success:", response.data);

      // Go to Step 2 (Verify OTP), passing the phone number along
      navigate("/verify-otp", { state: { phone: formData.phone } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gpt-dark p-4">
      <div className="card animate-fade-in shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
        <p className="text-gpt-sub text-center mb-8">Join LeverageGroups</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Full Name"
              className="input-field pl-10"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="relative">
            <PhoneIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="WhatsApp Number (e.g., 9876543210)"
              className="input-field pl-10"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="input-field pl-10"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-6">
            {loading ? "Processing..." : "Continue"}{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-gpt-sub text-sm mt-6">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-brand-green cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
