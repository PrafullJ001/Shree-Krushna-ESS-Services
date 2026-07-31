import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPublicStatement } from "../api/farmerApi";
import Spinner from "../components/common/Spinner";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import { BUSINESS_NAME } from "../constants/business";

export default function StatementPage() {
  const { slugId } = useParams();
  const farmerId = slugId?.match(/[a-f0-9]{24}$/i)?.[0];

  const [farmer, setFarmer] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!farmerId) {
      setError("Invalid statement link");
      setLoading(false);
      return;
    }

    getPublicStatement(farmerId)
      .then((res) => {
        setFarmer(res.data.farmer);
        setServices(res.data.services);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load statement");
      })
      .finally(() => setLoading(false));
  }, [farmerId]);

  if (loading) {
    return <Spinner label="Loading statement..." />;
  }

  if (error || !farmer) {
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
          <p className="text-[#C24949]/80 text-sm font-medium">{error || "Statement not found"}</p>
        </div>
      </div>
    );
  }

  const initials = farmer.fullName
    ? farmer.fullName.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "F";

  const totalBill = services.reduce((sum, s) => sum + Number(s.totalBill || 0), 0);
  const totalCollected = services.reduce((sum, s) => sum + Number(s.amountPaid || 0), 0);
  const totalPending = services.reduce((sum, s) => sum + Number(s.pendingAmount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F6F2E9] pb-16 font-sans selection:bg-[#4C9A5A]/20">
      <div
        className="relative px-6 pt-10 pb-20 overflow-hidden rounded-b-[2.5rem] shadow-sm"
        style={{ backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)" }}
        />
        <div className="relative z-10">
          <p className="text-[#B9D9BE] text-xs font-bold uppercase tracking-widest mb-1">{BUSINESS_NAME}</p>
          <h1 className="text-xl font-bold text-white tracking-tight">Account Statement</h1>
        </div>
      </div>

      <div className="px-5 -mt-16 relative z-10 max-w-md mx-auto space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] p-5">
          <div className="flex gap-4 items-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-[#E9F3E9] text-[#2B5439] flex items-center justify-center text-lg font-bold shadow-inner border border-[#4C9A5A]/10 shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1F2A22] leading-tight mb-1">{farmer.fullName}</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F6F2E9] text-[#1F3D2B]/70 text-[11px] font-bold uppercase tracking-widest border border-[#1F3D2B]/5">
                {farmer.farmerCode}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#F6F2E9]/50 rounded-xl p-3 border border-[#1F3D2B]/5">
              <p className="text-[10px] uppercase font-bold text-[#1F2A22]/50 tracking-wider mb-1">Village</p>
              <p className="text-sm font-semibold text-[#1F2A22] truncate">{farmer.village}</p>
            </div>
            <div className="bg-[#F6F2E9]/50 rounded-xl p-3 border border-[#1F3D2B]/5">
              <p className="text-[10px] uppercase font-bold text-[#1F2A22]/50 tracking-wider mb-1">Mobile</p>
              <p className="text-sm font-semibold text-[#1F2A22]">{farmer.mobile}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.05]">
            <p className="text-[10px] uppercase font-bold text-[#1F2A22]/40 tracking-widest mb-3">Payment Summary</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#F6F2E9]/70 rounded-xl p-3 border border-black/[0.04]">
                <p className="text-[9px] uppercase font-bold text-[#1F2A22]/45 tracking-wide mb-1">Total Bill</p>
                <p className="text-sm font-black text-[#1F2A22] break-words">{formatCurrency(totalBill)}</p>
              </div>
              <div className="bg-[#E9F3E9]/70 rounded-xl p-3 border border-[#4C9A5A]/10">
                <p className="text-[9px] uppercase font-bold text-[#4C9A5A]/70 tracking-wide mb-1">Collected</p>
                <p className="text-sm font-black text-[#4C9A5A] break-words">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="bg-[#FEF3C7]/50 rounded-xl p-3 border border-[#D97706]/10">
                <p className="text-[9px] uppercase font-bold text-[#D97706]/70 tracking-wide mb-1">Pending</p>
                <p className="text-sm font-black text-[#D97706] break-words">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service History (read-only) */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold text-[#1F2A22] tracking-tight">Service History</h2>
            {services.length > 0 && (
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#4C9A5A] bg-[#E9F3E9] rounded-lg px-2.5 py-1 shadow-sm border border-[#4C9A5A]/10">
                {services.length} Total
              </span>
            )}
          </div>

          <div className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] overflow-hidden divide-y divide-black/[0.04]">
            {services.length === 0 && (
              <p className="text-sm text-[#1F2A22]/50 text-center py-8">No service records yet</p>
            )}
            {services.map((s) => (
              <div key={s._id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-[#1F2A22]">{s.cropName || "-"}</p>
                  <p className="text-xs font-semibold text-[#1F2A22]/50">{formatDate(s.serviceDate)}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[#1F2A22]/45 font-bold uppercase text-[9px] mb-0.5">Bill</p>
                    <p className="font-bold text-[#1F2A22]">{formatCurrency(s.totalBill)}</p>
                  </div>
                  <div>
                    <p className="text-[#4C9A5A]/70 font-bold uppercase text-[9px] mb-0.5">Paid</p>
                    <p className="font-bold text-[#4C9A5A]">{formatCurrency(s.amountPaid)}</p>
                  </div>
                  <div>
                    <p className="text-[#D97706]/70 font-bold uppercase text-[9px] mb-0.5">Pending</p>
                    <p className="font-bold text-[#D97706]">{formatCurrency(s.pendingAmount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}