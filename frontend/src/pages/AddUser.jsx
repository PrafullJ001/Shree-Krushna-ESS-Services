import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerRequest } from "../api/authApi";

export default function AddUser() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    role: "staff",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.role === "admin" && !form.email.trim()) {
      setError("Email is required for admin accounts");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        email: form.email.trim(),
      };

      if (form.role === "staff" && !payload.email) {
        delete payload.email;
      }

      const { data } = await registerRequest(payload);

      setSuccess(`${data.name} added as ${data.role}`);

      setForm({
        name: "",
        mobile: "",
        email: "",
        password: "",
        role: "staff",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[#F6F2E9]/50 border border-[#1F3D2B]/10 rounded-xl px-4 py-3.5 text-sm text-[#1F2A22] placeholder:text-[#1F2A22]/40 focus:bg-white focus:ring-2 focus:ring-[#4C9A5A]/20 focus:border-[#4C9A5A] transition-all outline-none";

  const labelClass =
    "block text-[11px] font-bold text-[#1F2A22]/60 mb-1.5 uppercase tracking-wider";

  // ---------------------------------------------------------------------------
  // SUCCESS STATE — shown after account creation, replaces the form entirely
  // ---------------------------------------------------------------------------
  if (success) {
    return (
      <div className="min-h-screen bg-[#F6F2E9] pb-24 font-sans selection:bg-[#4C9A5A]/20">
        <div
          className="relative px-6 pt-10 pb-16 overflow-hidden rounded-b-[2rem] shadow-sm"
          style={{ backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 100%)" }}
        >
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)" }}
          />
          <div className="relative z-10">
            <h1 className="text-xl font-bold text-white tracking-tight">Add New User</h1>
            <p className="text-[#B9D9BE] text-sm mt-1">Create a staff or admin login</p>
          </div>
        </div>

        <div className="px-5 -mt-8 relative z-10 max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] p-6 text-center animate-in zoom-in-95 fade-in duration-300">
            <div className="mx-auto h-16 w-16 bg-[#E9F3E9] rounded-full flex items-center justify-center mb-4 border border-[#4C9A5A]/10 shadow-inner">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#4C9A5A]" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-[#1F2A22] mb-1">Account Created!</h2>
            <p className="text-[13px] font-medium text-[#1F2A22]/50 mb-6">
              {success}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="flex-1 bg-white border border-black/10 text-[#1F2A22] rounded-2xl py-3.5 font-bold text-[14px] active:bg-gray-50 transition-colors"
              >
                Add Another
              </button>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex-[1.5] text-white rounded-2xl py-3.5 font-bold text-[14px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{ backgroundImage: "linear-gradient(180deg, #4C9A5A 0%, #3B7A46 100%)" }}
              >
                Back to Profile
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FORM UI
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F6F2E9] pb-24 font-sans selection:bg-[#4C9A5A]/20">
      <div
        className="relative px-6 pt-10 pb-16 overflow-hidden rounded-b-[2rem] shadow-sm"
        style={{ backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)" }}
        />

        <div className="relative z-10">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-4 hover:bg-white/10 active:scale-95 transition-all duration-200 backdrop-blur-sm w-max"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <h1 className="text-xl font-bold text-white tracking-tight">Add New User</h1>
          <p className="text-[#B9D9BE] text-sm mt-1">Create a staff or admin login</p>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-black/[0.04] p-5 space-y-5">
          <div className="bg-[#F6F2E9]/50 rounded-2xl p-4 border border-[#1F3D2B]/5">
            <label className="block text-sm font-bold text-[#1F2A22] mb-3 text-center">Select User Role</label>
            <div className="bg-[#F6F2E9] p-1 rounded-[14px] flex gap-1 shadow-inner border border-black/5">
              {["staff", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold capitalize transition-all duration-200 ${
                    form.role === r ? "bg-white text-[#1F3D2B] shadow-sm" : "text-[#1F3D2B]/50 hover:text-[#1F3D2B]/80"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required className={inputClass} placeholder="e.g. Rahul Sharma" />
          </div>

          <div>
  <label className={labelClass}>Mobile Number</label>
  <input
    name="mobile"
    type="tel"
    inputMode="numeric"
    pattern="[0-9]{10}"
    maxLength={10}
    value={form.mobile}
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
      setForm({
        ...form,
        mobile: value,
      });
    }}
    required
    className={inputClass}
    placeholder="10-digit mobile number"
  />
</div>

          <div>
            <label className={labelClass}>
              Email{" "}
              {form.role === "admin" ? (
                <span className="text-[#C24949] normal-case">(required for admin)</span>
              ) : (
                <span className="text-[#1F2A22]/40 normal-case font-normal">(optional)</span>
              )}
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required={form.role === "admin"}
              className={inputClass}
              placeholder={form.role === "admin" ? "Admin email for password recovery" : "user@example.com"}
            />
            {form.role === "admin" && (
              <p className="text-[11px] font-medium text-[#1F2A22]/50 mt-1.5 ml-1">
                Password reset OTP will be sent to this email
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} className={inputClass} placeholder="••••••••" />
            <p className="text-[11px] font-medium text-[#1F2A22]/50 mt-1.5 ml-1">Must be at least 6 characters</p>
          </div>

          {error && (
            <div className="bg-[#FCEDED] border border-[#F3C6C6] rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#C24949] shrink-0 mt-0.5" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <p className="text-[#C24949] text-[13px] font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4C9A5A] text-white rounded-xl py-3.5 text-base font-bold shadow-sm active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
