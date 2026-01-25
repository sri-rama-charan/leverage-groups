import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  CreditCard,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Building,
  MapPin,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile Data
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    campaignAlerts: true,
    payoutUpdates: true,
    groupActivity: false,
    weeklyReports: true,
  });

  // Payment Details
  const [paymentData, setPaymentData] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    upiId: "",
  });

  // Load user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      if (user) {
        setProfileData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        });
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load user data:", err);
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await api.put("/auth/profile", profileData);
      
        // Update user via AuthContext
        updateUser({ ...user, ...profileData });

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" });
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      setSaving(false);
      return;
    }

    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage({
        type: "success",
        text: "Password changed successfully!",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await api.put("/auth/notifications", notifications);
      setMessage({
        type: "success",
        text: "Notification preferences updated!",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: "Failed to update notification preferences",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.put("/auth/payment-details", paymentData);
      setMessage({
        type: "success",
        text: "Payment details updated successfully!",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: "Failed to update payment details",
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "security", label: "Security", icon: <Shield size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "payment", label: "Payment", icon: <CreditCard size={18} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/50"
              : "bg-red-500/10 border border-red-500/50"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} className="text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-red-400 mt-0.5" />
          )}
          <p
            className={
              message.type === "success" ? "text-emerald-400" : "text-red-400"
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1d28] border border-white/30 rounded-xl p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-brand-accent/10 text-brand-accent"
                    : "text-gray-400 hover:bg-black/30 hover:text-white"
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-[#1a1d28] border border-white/30 rounded-xl p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">
                  Profile Information
                </h2>
                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, name: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="tel"
                        value={profileData.phone}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Phone number cannot be changed
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full btn-primary"
                  >
                    <Save size={18} />
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">
                  Change Password
                </h2>
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-12 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-12 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full btn-primary"
                  >
                    <Lock size={18} />
                    <span>{saving ? "Updating..." : "Update Password"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      key: "emailNotifications",
                      label: "Email Notifications",
                      description: "Receive notifications via email",
                    },
                    {
                      key: "campaignAlerts",
                      label: "Campaign Alerts",
                      description: "Get notified about new campaigns",
                    },
                    {
                      key: "payoutUpdates",
                      label: "Payout Updates",
                      description: "Notifications about payout status changes",
                    },
                    {
                      key: "groupActivity",
                      label: "Group Activity",
                      description: "Updates about your group activities",
                    },
                    {
                      key: "weeklyReports",
                      label: "Weekly Reports",
                      description: "Receive weekly performance summaries",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10"
                    >
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">
                          {item.label}
                        </h3>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            [item.key]: !notifications[item.key],
                          })
                        }
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          notifications[item.key]
                            ? "bg-emerald-500"
                            : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            notifications[item.key] ? "translate-x-7" : ""
                          }`}
                        />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={handleNotificationUpdate}
                    disabled={saving}
                    className="w-full btn-primary mt-6"
                  >
                    <Save size={18} />
                    <span>{saving ? "Saving..." : "Save Preferences"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === "payment" && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">
                  Payment Details
                </h2>
                <form onSubmit={handlePaymentUpdate} className="space-y-5">
                  {/* Bank Account Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                      Bank Account
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Account Holder Name
                      </label>
                      <div className="relative">
                        <User
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={paymentData.accountHolderName}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              accountHolderName: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                          placeholder="Full name as per bank"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Account Number
                      </label>
                      <div className="relative">
                        <FileText
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={paymentData.accountNumber}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              accountNumber: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                          placeholder="Enter account number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        IFSC Code
                      </label>
                      <div className="relative">
                        <Building
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={paymentData.ifscCode}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              ifscCode: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                          placeholder="IFSC Code"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bank Name
                      </label>
                      <div className="relative">
                        <Building
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={paymentData.bankName}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              bankName: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                          placeholder="Bank name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Branch Name
                      </label>
                      <div className="relative">
                        <MapPin
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={paymentData.branchName}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              branchName: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                          placeholder="Branch name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* UPI Details */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                      UPI (Optional)
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        UPI ID
                      </label>
                      <div className="relative">
                        <CreditCard
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={paymentData.upiId}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              upiId: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
                          placeholder="yourname@upi"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full btn-primary"
                  >
                    <Save size={18} />
                    <span>{saving ? "Saving..." : "Save Payment Details"}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
