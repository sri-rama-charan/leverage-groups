import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound } from "lucide-react";
import api from "../api/axios";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // Get the phone number passed from the previous page
  const phone = location.state?.phone;

  useEffect(() => {
    if (!phone) {
      alert("No phone number found. Redirecting to register.");
      navigate("/register");
    }
  }, [phone, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 2: Verify the OTP
      await api.post("/auth/verify-otp", { phone, otp });

      // Go to Step 3 (Role Selection)
      navigate("/select-role", { state: { phone } });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Invalid OTP. Please check the console.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gpt-dark p-4">
      <div className="card animate-fade-in text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-brand-green/20 p-3 rounded-full">
            <KeyRound className="h-8 w-8 text-brand-green" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Verify WhatsApp</h2>
        <p className="text-gpt-sub mb-6">
          Enter the code sent to{" "}
          <span className="text-white font-mono">{phone}</span>
          <br />
          (Check your backend console for the mock code: "123456")
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            className="input-field text-center text-xl tracking-widest"
            maxLength={6}
            required
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Verifying..." : "Verify OTP"}{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
