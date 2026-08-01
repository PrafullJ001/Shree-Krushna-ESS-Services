import { useEffect, useState, useRef } from "react";
import { getDashboardStats } from "../api/dashboardApi";
import StatCard from "../components/dashboard/StatCard";
import RecentServiceItem from "../components/dashboard/RecentServiceItem";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import { useNavigate } from "react-router-dom";

const getTodayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recent-services filters
  const [activePreset, setActivePreset] = useState("Recent");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isFirstSearchRender = useRef(true);

  const loadStats = async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await getDashboardStats(params);
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Initial load — no filters, exactly the original default behavior
  useEffect(() => {
    loadStats();
  }, []);

  // Debounced search — re-runs whenever the search text changes, combined
  // with whatever date range filter is currently active
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      loadStats({ ...dateRange, search: searchQuery });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handlePresetRecent = () => {
    setActivePreset("Recent");
    setShowCustomRange(false);
    setDateRange({ from: "", to: "" });
    loadStats({ search: searchQuery });
  };

  const handlePresetToday = () => {
    const today = getTodayLocal();
    setActivePreset("Today");
    setShowCustomRange(false);
    setDateRange({ from: today, to: today });
    loadStats({ from: today, to: today, search: searchQuery });
  };

  const handlePresetWeek = () => {
    const from = daysAgo(7);
    const to = getTodayLocal();
    setActivePreset("Last Week");
    setShowCustomRange(false);
    setDateRange({ from, to });
    loadStats({ from, to, search: searchQuery });
  };

  const handleToggleCustomRange = () => {
    setShowCustomRange((prev) => {
      const next = !prev;
      if (next) setActivePreset("Custom");
      return next;
    });
  };

  const handleApplyCustomRange = () => {
    setActivePreset("Custom");
    setDateRange({ from: customFrom, to: customTo });
    loadStats({ from: customFrom, to: customTo, search: searchQuery });
  };

  if (loading && !stats) {
    return <Spinner label="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F2E9] px-6">
        <div className="max-w-sm w-full bg-white/50 backdrop-blur-sm rounded-3xl border border-[#F3C6C6]/50 shadow-sm p-8 text-center flex flex-col items-center transition-all">
          <div className="h-16 w-16 rounded-2xl bg-[#FCEDED] border border-[#F3C6C6] flex items-center justify-center mb-4 shadow-inner">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#C24949]" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-[#C24949] text-base font-semibold mb-1">Unable to load</h3>
          <p className="text-[#C24949]/80 text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "";

  // Drop services whose farmer was deleted directly in the DB (populate()
  // returns null for those). No longer sliced to 15 here — the backend
  // controls how many rows come back based on the active filter.
  const displayedRecentServices = (stats?.recentServices || [])
    .filter((s) => s.farmer)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  // Check if any amount is 50 Lakhs (5,000,000) or more
  const hasLargeAmounts =
    Number(stats?.totalBillAmount || 0) >= 5000000 ||
    Number(stats?.totalAmountReceived || 0) >= 5000000 ||
    Number(stats?.totalPendingAmount || 0) >= 5000000;

  // Dynamically adjust grid layout based on amount sizes
  const gridClass = hasLargeAmounts
    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
    : "grid-cols-2 md:grid-cols-3";

  // Helper to format currency in Indian numbering system (e.g., 3,33,567)
  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  return (
    <div className="min-h-screen bg-[#F6F2E9] pb-24 font-sans selection:bg-[#4C9A5A]/20">
      {/* Header */}
      <div
        className="relative px-6 pt-10 pb-20 overflow-hidden rounded-b-[2.5rem] shadow-sm"
        style={{
          backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 60%, #2B5439 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)",
          }}
        />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm font-bold backdrop-blur-md shadow-inner">
              {initials || (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <circle cx="12" cy="8" r="3.5" stroke="white" strokeWidth="1.6" />
                  <path d="M5 20c1.5-3.5 5-5 7-5s5.5 1.5 7 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs text-[#B9D9BE] font-medium tracking-wide uppercase mb-0.5">
                Welcome back
              </p>
              <h1 className="text-lg font-bold text-white tracking-tight">{user?.name}</h1>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs font-semibold text-[#F3C6C6] bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 hover:text-white active:scale-95 transition-all duration-200 backdrop-blur-sm"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M15 17l5-5-5-5M20 12H9M13 21H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Stat grid — money totals shown to admin only */}
      {isAdmin && (
        <div className="px-5 -mt-12 relative z-10 max-w-5xl mx-auto">
          {/* Increased gap slightly to 'gap-5' to give the boxes a little more room */}
          <div className={`grid ${gridClass} gap-5`}>
            <StatCard label="Total Farmers" value={stats.totalFarmers} accent="blue" />
            <StatCard
              label="Total Acres"
              value={stats.totalAcres != null ? Number(stats.totalAcres).toFixed(2) : "0.0000"}
              accent="green"
            />
            <StatCard label="Total Billed" value={`₹${formatCurrency(stats.totalBillAmount)}`} accent="green" />
            <StatCard label="Collected" value={`₹${formatCurrency(stats.totalAmountReceived)}`} accent="green" />
            <StatCard label="Pending" value={`₹${formatCurrency(stats.totalPendingAmount)}`} accent="orange" />
            <StatCard label="Total Services" value={stats.totalServiceRecords} accent="blue" />
          </div>
        </div>
      )}

      {/* Recent services — visible to everyone */}
      <div className={`px-5 ${isAdmin ? "mt-8" : "-mt-12 relative z-10"} max-w-5xl mx-auto`}>
        <div className="flex items-end justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-[#8b968e] tracking-tight">Recent Services</h2>
          {displayedRecentServices.length > 0 && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#4C9A5A] bg-[#E9F3E9] rounded-lg px-2.5 py-1 shadow-sm border border-[#4C9A5A]/10">
              {displayedRecentServices.length} shown
            </span>
          )}
        </div>

        {/* Date filter presets */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          <button
            onClick={handlePresetRecent}
            className={`shrink-0 flex-1 min-w-[76px] px-2 py-2 rounded-xl text-[11px] leading-tight font-bold whitespace-nowrap transition-all ${
              activePreset === "Recent"
                ? "bg-[#2B5439] text-white shadow-sm"
                : "bg-white text-[#1F2A22]/60 border border-black/[0.06]"
            }`}
          >
            Recent
          </button>

          <button
            onClick={handlePresetToday}
            className={`shrink-0 flex-1 min-w-[76px] px-2 py-2 rounded-xl text-[11px] leading-tight font-bold whitespace-nowrap transition-all ${
              activePreset === "Today"
                ? "bg-[#2B5439] text-white shadow-sm"
                : "bg-white text-[#1F2A22]/60 border border-black/[0.06]"
            }`}
          >
            Today
          </button>

          <button
            onClick={handlePresetWeek}
            className={`shrink-0 flex-1 min-w-[76px] px-2 py-2 rounded-xl text-[11px] leading-tight font-bold whitespace-nowrap transition-all ${
              activePreset === "Last Week"
                ? "bg-[#2B5439] text-white shadow-sm"
                : "bg-white text-[#1F2A22]/60 border border-black/[0.06]"
            }`}
          >
            Last Week
          </button>

          <button
            onClick={handleToggleCustomRange}
            className={`shrink-0 flex-1 min-w-[76px] px-2 py-2 rounded-xl text-[11px] leading-tight font-bold whitespace-nowrap transition-all ${
              activePreset === "Custom"
                ? "bg-[#2B5439] text-white shadow-sm"
                : "bg-white text-[#1F2A22]/60 border border-black/[0.06]"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom range picker */}
        {showCustomRange && (
          <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">From</label>
                <input
                  type="date"
                  name="dashboardFrom"
                  autoComplete="off"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">To</label>
                <input
                  type="date"
                  name="dashboardTo"
                  autoComplete="off"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleApplyCustomRange}
              className="w-full bg-[#4C9A5A] text-white rounded-xl py-2.5 text-sm font-bold"
            >
              Apply Range
            </button>
          </div>
        )}

        {/* Search bar — farmer name / village */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-3 flex items-center gap-2.5 mb-4">
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-[#1F2A22]/30 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            name="dashboardSearch"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search farmer name or village..."
            className="flex-1 bg-transparent text-sm text-[#1F2A22] placeholder-[#1F2A22]/30 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[#1F2A22]/30 hover:text-[#1F2A22]/60 shrink-0"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] p-1 overflow-hidden transition-all">
          {loading ? (
            <div className="py-6">
              <Spinner label="Loading..." />
            </div>
          ) : displayedRecentServices.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon="🌱"
                title="No services found"
                subtitle="Try a different date range or search term"
              />
            </div>
          ) : (
            <div className="flex flex-col">
              {displayedRecentServices.map((service) => (
                <div
                  key={service._id}
                  onClick={() => service.farmer && navigate(`/farmers/${service.farmer._id}`)}
                  className="cursor-pointer active:bg-black/[0.02] transition-colors rounded-xl"
                >
                  <RecentServiceItem service={service} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}