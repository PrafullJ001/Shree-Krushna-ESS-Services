import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboardApi";
import StatCard from "../components/dashboard/StatCard";
import RecentServiceItem from "../components/dashboard/RecentServiceItem";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
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
  // returns null for those) BEFORE slicing, so we still show a full 5
  // valid rows instead of losing slots to orphaned records.
  const visibleRecentServices = stats.recentServices
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
          <h2 className="text-lg font-bold text-[#1F2A22] tracking-tight">Recent Services</h2>
          {visibleRecentServices.length > 0 && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#4C9A5A] bg-[#E9F3E9] rounded-lg px-2.5 py-1 shadow-sm border border-[#4C9A5A]/10">
              {visibleRecentServices.length} total
            </span>
          )}
        </div>

        <div className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] p-1 overflow-hidden transition-all">
          {visibleRecentServices.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon="🌱"
                title="No services yet"
                subtitle="Services you log will show up here"
              />
            </div>
          ) : (
            <div className="flex flex-col">
              {visibleRecentServices.slice(0, 5).map((service) => (
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