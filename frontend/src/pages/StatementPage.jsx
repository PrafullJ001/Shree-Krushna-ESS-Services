import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPublicStatement } from "../api/farmerApi";
import Spinner from "../components/common/Spinner";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import { BUSINESS_NAME, BUSINESS_CONTACT, BUSINESS_PHONEPE } from "../constants/business";

export default function StatementPage() {
  const { slugId } = useParams();
  const farmerId = slugId?.match(/[a-f0-9]{24}$/i)?.[0];

  const [farmer, setFarmer] = useState(null);
  const [services, setServices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tracks which service boxes have their payment history expanded
  const [expandedServices, setExpandedServices] = useState(new Set());

  const toggleServiceHistory = (serviceId) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

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
        setPayments(res.data.payments || []);
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

  // Only unpaid/partially-paid services go into the Service History list
  const pendingServices = services.filter((s) => Number(s.pendingAmount || 0) > 0);

  return (
    <div className="min-h-screen bg-[#F6F2E9] pb-16 font-sans selection:bg-[#4C9A5A]/20">
      {/* Header — modernized business identity card */}
      <div
        className="relative px-6 pt-10 pb-20 overflow-hidden rounded-b-[2.5rem] shadow-sm"
        style={{ backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)" }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl px-4 py-3 mb-4 shadow-lg shadow-black/10">
            <div className="h-10 w-10 rounded-xl bg-[#4C9A5A] flex items-center justify-center shrink-0 shadow-inner">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
                <path d="M12 2c0 1.5-.8 2.3-1.6 3.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                <circle cx="9.5" cy="7.5" r="1.7" fill="currentColor" />
                <circle cx="13" cy="7.2" r="1.7" fill="currentColor" />
                <circle cx="8" cy="10.8" r="1.7" fill="currentColor" />
                <circle cx="11.5" cy="10.6" r="1.7" fill="currentColor" />
                <circle cx="15" cy="10.5" r="1.7" fill="currentColor" />
                <circle cx="9.7" cy="14" r="1.7" fill="currentColor" />
                <circle cx="13.2" cy="14" r="1.7" fill="currentColor" />
                <circle cx="11.5" cy="17.2" r="1.7" fill="currentColor" />
              </svg>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-white text-[15px] font-bold tracking-tight leading-none">{BUSINESS_NAME}</p>

              <div className="flex flex-col gap-0.5 mt-0.5">
                {BUSINESS_CONTACT && (
                  <div className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-[#B9D9BE] shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[#B9D9BE] text-[11px] font-semibold tracking-wide leading-none">{BUSINESS_CONTACT}</p>
                  </div>
                )}
                {BUSINESS_PHONEPE && (
                  <div className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-[#B9D9BE] shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 10h18M8 2v4M16 2v4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[#B9D9BE] text-[11px] font-semibold tracking-wide leading-none">PhonePe: {BUSINESS_PHONEPE}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

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

        {/* Pending Services — each box has its own expandable payment history */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold text-[#1F2A22] tracking-tight">Pending Services Payments</h2>
            {pendingServices.length > 0 && (
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#D97706] bg-[#FEF3C7] rounded-lg px-2.5 py-1 shadow-sm border border-[#D97706]/10">
                {pendingServices.length} Pending
              </span>
            )}
          </div>

          <div className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] overflow-hidden divide-y divide-black/[0.04]">
            {pendingServices.length === 0 && (
              <p className="text-sm text-[#1F2A22]/50 text-center py-8">No pending services — all caught up ✅</p>
            )}
            {pendingServices.map((s) => {
              const servicePayments = payments.filter((p) => p.serviceRecord?._id === s._id);
              const isExpanded = expandedServices.has(s._id);

              // Guntha can arrive on the record as either `are` or `guntha`
              // depending on where it was entered — fall back so it always
              // renders instead of silently disappearing.
              const gunthaValue =
                s.are != null && s.are !== ""
                  ? s.are
                  : s.guntha != null && s.guntha !== ""
                  ? s.guntha
                  : null;

              return (
                <div key={s._id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-[#1F2A22]">{s.cropName || "-"}</p>
                    <p className="text-xs font-semibold text-[#1F2A22]/50">{formatDate(s.serviceDate)}</p>
                  </div>

                  {/* Area: Acres + Gunthe */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {(s.acres != null && s.acres !== "") && (
                      <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2 py-0.5 rounded-md">
                        {s.acres} एकर
                      </span>
                    )}
                    {gunthaValue != null && (
                      <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2 py-0.5 rounded-md">
                        {gunthaValue} गुंठे
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
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

                  {/* Per-service payment history toggle */}
                  <button
                    type="button"
                    onClick={() => toggleServiceHistory(s._id)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-[#1F2A22]/40 uppercase tracking-wide pt-2.5 border-t border-black/[0.05]"
                  >
                    <span>
                      Payment History
                      <span className="ml-1.5 text-[#1F2A22]/30">({servicePayments.length})</span>
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 space-y-2">
                      {servicePayments.length === 0 && (
                        <p className="text-xs text-[#1F2A22]/40 text-center py-3">No payments recorded for this service yet</p>
                      )}
                      {servicePayments.map((p) => (
                        <div
                          key={p._id}
                          className="flex justify-between items-center bg-[#F6F2E9]/50 rounded-xl px-3.5 py-2.5"
                        >
                          <div>
                            <p className="text-[13px] font-bold text-[#1F2A22]">
                              {p.type === "Discount" ? "Discount" : "Payment"} · {p.mode}
                            </p>
                            <p className="text-[11px] text-[#1F2A22]/50">
                              {formatDate(p.paidOn)}
                              {p.note ? ` · ${p.note}` : ""}
                            </p>
                          </div>
                          <p className={`text-sm font-black ${p.type === "Discount" ? "text-[#D97706]" : "text-[#4C9A5A]"}`}>
                            {formatCurrency(p.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pay Now — UPI QR code */}
        <div className="mt-6">
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] p-5 flex flex-col items-center text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1F2A22]/40 mb-3">
              Pay Now
            </p>

            <div className="rounded-2xl border border-black/[0.06] p-2.5 bg-white shadow-inner mb-3">
              <img
                src="/public/upi-qr.png"
                alt="UPI QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>

            <p className="text-base font-bold text-[#1F2A22] leading-tight">
              Dhananjay Balasaheb Jadhav
            </p>

            <div className="flex items-center gap-1.5 mt-1.5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#4C9A5A]" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 10h18M8 2v4M16 2v4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm font-semibold text-[#4C9A5A]">
                PhonePe: 9637972009
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}