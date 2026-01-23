import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Phone } from "lucide-react";
import api from "../api/axios";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", formData);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mvp-bg p-4">
      <div className="card animate-fade-in">
        <h2 className="text-3xl font-bold text-center mb-8">Welcome Back</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="WhatsApp Number"
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
            {loading ? "Logging in..." : "Login"}{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-mvp-sub text-sm mt-6">
          New here?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-brand-accent cursor-pointer hover:underline"
          >
            Create account
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
