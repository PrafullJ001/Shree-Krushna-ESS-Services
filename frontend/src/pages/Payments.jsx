import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPendingPayments } from "../api/paymentApi";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";

export default function Payments() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getPendingPayments();
        // Filter out orphaned records whose farmer was deleted directly
        // in the DB (populate() returns null for a missing reference).
        setRecords(data.filter((r) => r.farmer));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load pending payments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner label="Loading pending payments..." />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F2E9] px-6">
        <div className="max-w-sm w-full bg-white/50 backdrop-blur-sm rounded-3xl border border-[#F3C6C6]/50 shadow-sm p-8 text-center flex flex-col items-center">
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

  return (
    <div className="min-h-screen bg-[#F6F2E9] pb-24 font-sans selection:bg-[#4C9A5A]/20">
      {/* Mobile App Header */}
      <div
        className="relative px-6 pt-10 pb-16 overflow-hidden rounded-b-[2rem] shadow-sm"
        style={{
          backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)",
          }}
        />
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Pending Payments</h1>
            <p className="text-[#B9D9BE] text-sm mt-1">Outstanding balances</p>
          </div>
          {records.length > 0 && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-white bg-white/10 rounded-lg px-2.5 py-1 backdrop-blur-sm border border-white/20">
              {records.length} Left
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-5 -mt-8 relative z-10 max-w-md mx-auto">
        {records.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] p-8 animate-in fade-in duration-300">
            <EmptyState
              icon="✅"
              title="All caught up!"
              subtitle="There are no pending payments to collect right now."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((r, index) => (
              <button
                key={r._id}
                onClick={() => navigate(`/farmers/${r.farmer._id}`)}
                className="w-full text-left bg-white rounded-3xl shadow-sm border border-black/[0.04] p-5 active:scale-[0.98] transition-all block animate-in slide-in-from-bottom-2 fade-in"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-[#F6F2E9] flex items-center justify-center text-[#1F3D2B] text-lg font-bold shadow-inner border border-[#1F3D2B]/5 shrink-0">
                      {r.farmer.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1F2A22] text-[15px] leading-tight mb-0.5">
                        {r.farmer.fullName}
                      </h3>
                      <p className="text-[12px] font-medium text-[#1F2A22]/50 truncate max-w-[160px]">
                        {r.farmer.village || "—"} • {r.cropName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] shrink-0">
                    {r.paymentStatus}
                  </span>
                </div>

                {/* Meta chips: service type, plot size in R & acres, who added it */}
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {r.serviceType && (
                    <span className="text-[11px] font-semibold text-[#4C9A5A] bg-[#E9F3E9] px-2 py-1 rounded-md">
                      {r.serviceType}
                    </span>
                  )}
                  {r.kshetra && (
                    <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2 py-1 rounded-md">
                      {r.kshetra}
                    </span>
                  )}
                  {r.acres != null && (
                    <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2 py-1 rounded-md">
                      {r.acres} acres
                    </span>
                  )}
                  {r.createdBy?.name && (
                    <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2 py-1 rounded-md">
                      Added by {r.createdBy.name}
                      {r.createdBy.role ? ` (${r.createdBy.role})` : ""}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-end border-t border-black/5 pt-3.5 mt-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase font-bold text-[#1F2A22]/40 tracking-wider">
                      Service Date
                    </p>
                    <p className="text-xs font-semibold text-[#1F2A22]/70">
                      {formatDate(r.serviceDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-[#C24949]/70 tracking-wider mb-0.5">
                      To Collect
                    </p>
                    <p className="font-black text-[#C24949] text-lg leading-none">
                      {formatCurrency(r.pendingAmount)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}