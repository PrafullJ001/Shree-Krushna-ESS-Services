import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestOtp = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{10}$/.test(mobile)) {
      return setError(
        "Enter a valid 10-digit mobile number"
      );
    }

    setLoading(true);

    try {
      const { data } = await axiosInstance.post(
        "/auth/forgot-password",
        {
          mobile,
        }
      );

      setMessage(
        data.message ||
          "OTP requested. Contact your admin for the code."
      );

      setStep("reset");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to request OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!otp.trim()) {
      return setError(
        "Enter the OTP provided by admin"
      );
    }

    if (newPassword.length < 6) {
      return setError(
        "Password must be at least 6 characters"
      );
    }

    if (newPassword !== confirmPassword) {
      return setError(
        "Passwords do not match"
      );
    }

    setLoading(true);

    try {
      const { data } = await axiosInstance.post(
        "/auth/reset-password",
        {
          mobile,
          otp: otp.trim(),
          newPassword,
        }
      );

      setMessage(
        data.message ||
          "Password reset successfully"
      );

      setStep("success");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-[#DCE4DD] rounded-xl px-3.5 py-3 text-sm text-[#1F2A22] placeholder:text-[#A9B6AC] focus:outline-none focus:ring-2 focus:ring-[#4C9A5A] focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-[#F6F2E9] flex flex-col">
      <div
        className="relative pt-12 pb-24 px-6 overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #1F3D2B 0%, #234730 55%, #2B5439 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)",
          }}
        />

        <div className="relative text-center">
          <h1 className="text-2xl font-semibold text-white">
            Forgot Password
          </h1>

          <p className="text-sm text-[#B9D9BE] mt-2">
            Reset your password using an admin approval code
          </p>
        </div>
      </div>

      <div className="px-5 -mt-14 relative">
        <div className="w-full max-w-sm mx-auto bg-white rounded-[1.75rem] shadow-[0_10px_40px_-12px_rgba(31,61,43,0.35)] p-6 border border-black/5">

          {step === "request" && (
            <form
              onSubmit={requestOtp}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-[#4A5A4E] uppercase tracking-wide mb-1.5">
                  Registered Mobile Number
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) =>
                    setMobile(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="Enter 10-digit mobile number"
                  className={inputClass}
                  required
                />
              </div>

              <p className="text-xs text-[#8A968C] leading-relaxed">
                After requesting the code, contact your admin to get the OTP.
              </p>

              {error && (
                <div className="bg-[#FCEDED] border border-[#F3C6C6] rounded-xl px-3 py-2.5">
                  <p className="text-[#C24949] text-xs">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2B5439] text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
              >
                {loading
                  ? "Requesting..."
                  : "Request OTP"}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form
              onSubmit={resetPassword}
              className="space-y-4"
            >
              {message && (
                <div className="bg-[#E9F3E9] border border-[#4C9A5A]/20 rounded-xl px-3 py-2.5">
                  <p className="text-[#2B5439] text-xs font-medium">
                    {message}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#4A5A4E] uppercase tracking-wide mb-1.5">
                  Admin OTP
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit OTP"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A5A4E] uppercase tracking-wide mb-1.5">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A5A4E] uppercase tracking-wide mb-1.5">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Enter password again"
                  className={inputClass}
                  required
                />
              </div>

              {error && (
                <div className="bg-[#FCEDED] border border-[#F3C6C6] rounded-xl px-3 py-2.5">
                  <p className="text-[#C24949] text-xs">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2B5439] text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
              >
                {loading
                  ? "Resetting..."
                  : "Reset Password"}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center">
              <div className="h-14 w-14 mx-auto rounded-full bg-[#E9F3E9] flex items-center justify-center text-[#4C9A5A] text-2xl font-bold mb-4">
                ✓
              </div>

              <h2 className="text-xl font-bold text-[#1F2A22]">
                Password Changed
              </h2>

              <p className="text-sm text-[#5B6B5E] mt-2 mb-6">
                Your password has been reset successfully.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/login")
                }
                className="w-full bg-[#2B5439] text-white rounded-xl py-3 font-semibold text-sm"
              >
                Back to Login
              </button>
            </div>
          )}

          {step !== "success" && (
            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
              className="w-full text-center text-sm font-medium text-[#5B6B5E] mt-5"
            >
              ← Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}