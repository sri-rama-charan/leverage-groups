import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Users, Briefcase, CheckCircle } from "lucide-react";
import api from "../api/axios";

const SelectRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null); // 'GA' or 'BR'

  const phone = location.state?.phone;

  useEffect(() => {
    if (!phone) {
      navigate("/register");
    }
  }, [phone, navigate]);

  const handleSelect = (r) => setRole(r);

  const handleSubmit = async () => {
    if (!role) return;
    setLoading(true);

    try {
      // Step 3: Set Role
      const response = await api.post("/auth/complete-profile", {
        phone,
        role,
      });

      // Save the Token!
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      alert("Welcome to LeverageGroups! Dashboard coming soon.");
      navigate("/dashboard"); // Placeholder
    } catch (err) {
      alert("Error setting role. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gpt-dark p-4">
      <div className="card animate-fade-in max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-2">
          Select Your Role
        </h2>
        <p className="text-gpt-sub text-center mb-8">
          How will you use LeverageGroups?
        </p>

        <div className="grid grid-cols-1 gap-4 mb-8">
          {/* Card 1: Group Admin */}
          <div
            onClick={() => handleSelect("GA")}
            className={`cursor-pointer border-2 rounded-lg p-4 flex items-center gap-4 transition-all ${role === "GA" ? "border-brand-green bg-gpt-light" : "border-gray-600 hover:bg-gpt-light/50"}`}
          >
            <div className="bg-blue-500/20 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Group Admin</h3>
              <p className="text-sm text-gpt-sub">
                I manage WhatsApp groups and want to monetize them.
              </p>
            </div>
            {role === "GA" && (
              <CheckCircle className="text-brand-green h-6 w-6" />
            )}
          </div>

          {/* Card 2: Brand */}
          <div
            onClick={() => handleSelect("BR")}
            className={`cursor-pointer border-2 rounded-lg p-4 flex items-center gap-4 transition-all ${role === "BR" ? "border-brand-green bg-gpt-light" : "border-gray-600 hover:bg-gpt-light/50"}`}
          >
            <div className="bg-purple-500/20 p-3 rounded-full">
              <Briefcase className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Brand / Advertiser</h3>
              <p className="text-sm text-gpt-sub">
                I want to run campaigns across multiple groups.
              </p>
            </div>
            {role === "BR" && (
              <CheckCircle className="text-brand-green h-6 w-6" />
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!role || loading}
          className={`btn-primary ${!role ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Finishing Up..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );
};

export default SelectRole;
