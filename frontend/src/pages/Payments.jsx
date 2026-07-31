import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPendingPayments } from "../api/paymentApi";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const getTodayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PRESETS = [
  { label: "All Time", from: "", to: "" },
  { label: "Last 6 Months", from: monthsAgo(6), to: getTodayLocal() },
];

export default function Payments() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activePreset, setActivePreset] = useState("All Time");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [generatingVillage, setGeneratingVillage] = useState(null);
  const navigate = useNavigate();
  const searchBoxRef = useRef(null);

  const loadRecords = async (from, to) => {
    setLoading(true);
    try {
      const { data } = await getPendingPayments(from, to);
      // Filter out orphaned records whose farmer was deleted directly in the DB
      setRecords(data.records.filter((r) => r.farmer));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePreset = (preset) => {
    setActivePreset(preset.label);
    setShowCustomRange(false);
    loadRecords(preset.from, preset.to);
  };

  const handleApplyCustomRange = () => {
    setActivePreset("Custom");
    loadRecords(customFrom, customTo);
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const name = r.farmer.fullName?.toLowerCase() || "";
      const village = r.farmer.village?.toLowerCase() || "";
      return name.includes(q) || village.includes(q);
    });
  }, [records, searchQuery]);

  // Dropdown suggestions — farmers matching the query, and distinct villages
  // matching the query (villages are what drive PDF generation).
  const { farmerSuggestions, villageSuggestions } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { farmerSuggestions: [], villageSuggestions: [] };

    const farmerMatches = [];
    const villageMap = new Map();

    records.forEach((r) => {
      const name = r.farmer.fullName?.toLowerCase() || "";
      const village = r.farmer.village || "";
      const villageLower = village.toLowerCase();

      if (name.includes(q)) {
        farmerMatches.push(r);
      }

      if (village && villageLower.includes(q)) {
        if (!villageMap.has(village)) villageMap.set(village, new Set());
        villageMap.get(village).add(r.farmer._id);
      }
    });

    const villages = Array.from(villageMap.entries()).map(([village, farmerIds]) => ({
      village,
      count: farmerIds.size,
    }));

    return { farmerSuggestions: farmerMatches.slice(0, 5), villageSuggestions: villages.slice(0, 5) };
  }, [records, searchQuery]);

  // Builds a PDF for one village: unique pending farmers, showing only
  // Name, Village, Mobile — not individual payment history.
  const handleGenerateVillagePdf = (village) => {
    setGeneratingVillage(village);
    try {
      const seen = new Set();
      const farmersInVillage = [];

      records.forEach((r) => {
        if (r.farmer.village === village && !seen.has(r.farmer._id)) {
          seen.add(r.farmer._id);
          farmersInVillage.push(r.farmer);
        }
      });

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`${village} — Pending Farmers`, 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${formatDate(new Date())}`, 14, 25);
      doc.text(`Total Farmers: ${farmersInVillage.length}`, 14, 30);

      const rows = farmersInVillage.map((f) => [f.fullName || "-", f.village || "-", f.mobile || "-"]);

      autoTable(doc, {
        startY: 36,
        head: [["Farmer Name", "Village", "Mobile No."]],
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [76, 154, 90] },
      });

      doc.save(`${village.replace(/\s+/g, "_")}_pending_farmers.pdf`);
      setShowDropdown(false);
      setSearchQuery("");
    } finally {
      setGeneratingVillage(null);
    }
  };

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
        style={{ backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)" }}
        />
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Pending Payments</h1>
            <p className="text-[#B9D9BE] text-sm mt-1">Outstanding balances</p>
          </div>
          {!loading && records.length > 0 && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-white bg-white/10 rounded-lg px-2.5 py-1 backdrop-blur-sm border border-white/20">
              {records.length}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-5 -mt-8 relative z-10 max-w-md mx-auto">
        {/* Date range presets */}
        <div className="flex justify-center gap-5 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                activePreset === p.label
                  ? "bg-[#2B5439] text-white shadow-sm"
                  : "bg-white text-[#1F2A22]/60 border border-black/[0.06]"
              }`}
            >
              {p.label}
            </button>
          ))}

          <button
  onClick={() => {
    setShowCustomRange((prev) => {
      const next = !prev;
      if (next) setActivePreset("Custom");
      return next;
    });
  }}
  className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
    activePreset === "Custom"
      ? "bg-[#2B5439] text-white shadow-sm"
      : "bg-white text-[#1F2A22]/60 border border-black/[0.06]"
  }`}
>
  Custom Range
</button>
        </div>

        {showCustomRange && (
          <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">From</label>
                <input
                  type="date"
                  name="pendingFrom"
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
                  name="pendingTo"
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

        {/* Search bar with dropdown — farmer name / village suggestions */}
        {!loading && records.length > 0 && (
          <div ref={searchBoxRef} className="relative mb-4 sticky top-3 z-20">
            <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-3 flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-[#1F2A22]/30 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="text"
                name="paymentSearch"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type name or village..."
                className="flex-1 bg-transparent text-sm text-[#1F2A22] placeholder-[#1F2A22]/30 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowDropdown(false);
                  }}
                  className="text-[#1F2A22]/30 hover:text-[#1F2A22]/60 shrink-0"
                >
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown Menu — villages generate a PDF, farmers jump to their page */}
            {showDropdown && searchQuery.trim().length >= 1 && (
              <div className="absolute z-50 w-full bg-white border border-black/[0.04] rounded-2xl mt-2 shadow-xl shadow-black/[0.05] max-h-72 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
                {villageSuggestions.length === 0 && farmerSuggestions.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[14px] font-medium text-[#1F2A22]/50">No matches found</p>
                  </div>
                )}

                {villageSuggestions.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-[#1F2A22]/40">
                      Villages
                    </p>
                    {villageSuggestions.map((v) => (
                      <div
                        key={v.village}
                        className="w-full px-4 py-3 border-b border-black/5 last:border-b-0 flex items-center gap-3"
                      >
                        <div className="h-8 w-8 rounded-full bg-[#E9F3E9] flex items-center justify-center text-[#4C9A5A] shrink-0">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-[#1F2A22] truncate">{v.village}</p>
                          <p className="text-[11px] text-[#1F2A22]/40">{v.count} pending farmer{v.count !== 1 ? "s" : ""}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGenerateVillagePdf(v.village)}
                          disabled={generatingVillage === v.village}
                          className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-white bg-[#4C9A5A] rounded-lg px-3 py-2 disabled:opacity-50 active:scale-95 transition-all"
                        >
                          {generatingVillage === v.village ? "Generating…" : "Generate PDF"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {farmerSuggestions.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-[#1F2A22]/40">
                      Farmers
                    </p>
                    {farmerSuggestions.map((r) => (
                      <button
                        key={r._id}
                        type="button"
                        onClick={() => {
                          setShowDropdown(false);
                          navigate(`/farmers/${r.farmer._id}`);
                        }}
                        className="w-full text-left px-4 py-3 active:bg-black/[0.02] hover:bg-black/[0.01] border-b border-black/5 last:border-b-0 transition-colors flex items-center gap-3"
                      >
                        <div className="h-8 w-8 rounded-full bg-[#F6F2E9] flex items-center justify-center text-[#1F2A22]/50 shrink-0">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#1F2A22]">{r.farmer.fullName}</p>
                          <p className="text-[11px] text-[#1F2A22]/40">{r.farmer.village || "—"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-10">
            <Spinner label="Loading pending payments..." />
          </div>
        ) : (
          <>
            {searchQuery && (
              <p className="text-[11px] font-semibold text-[#1F2A22]/40 uppercase tracking-wide mb-3 px-1">
                {filteredRecords.length} result{filteredRecords.length !== 1 ? "s" : ""} for "{searchQuery}"
              </p>
            )}

            {records.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] p-8 animate-in fade-in duration-300">
                <EmptyState icon="✅" title="All caught up!" subtitle="No pending payments in this range." />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] p-8 animate-in fade-in duration-300">
                <EmptyState icon="🔍" title="No matches found" subtitle={`Nothing matches "${searchQuery}" — try a different name or village`} />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((r, index) => (
                  <button
                    key={r._id}
                    onClick={() => navigate(`/farmers/${r.farmer._id}`)}
                    className="w-full text-left bg-white rounded-3xl shadow-sm border border-black/[0.04] p-5 active:scale-[0.98] transition-all block animate-in slide-in-from-bottom-2 fade-in"
                    style={{ animationDelay: `${Math.min(index, 10) * 50}ms`, animationFillMode: "both" }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-2xl bg-[#F6F2E9] flex items-center justify-center text-[#1F3D2B] text-lg font-bold shadow-inner border border-[#1F3D2B]/5 shrink-0">
                          {r.farmer.fullName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#1F2A22] text-[15px] leading-tight mb-0.5">{r.farmer.fullName}</h3>
                          <p className="text-[12px] font-medium text-[#1F2A22]/50 truncate max-w-[160px]">
                            {r.farmer.village || "—"} • {r.cropName}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] shrink-0">
                        {r.paymentStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {r.serviceType && (
                        <span className="text-[11px] font-semibold text-[#4C9A5A] bg-[#E9F3E9] px-2 py-1 rounded-md">{r.serviceType}</span>
                      )}
                      {r.kshetra && (
                        <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2 py-1 rounded-md">{r.kshetra}</span>
                      )}
                      {r.acres != null && (
                        <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2 py-1 rounded-md">{r.acres} acres</span>
                      )}
                      {r.createdBy?.name && (
                        <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2 py-1 rounded-md">
                          Added by {r.createdBy.name}{r.createdBy.role ? ` (${r.createdBy.role})` : ""}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-end border-t border-black/5 pt-3.5 mt-2">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] uppercase font-bold text-[#1F2A22]/40 tracking-wider">Service Date</p>
                        <p className="text-xs font-semibold text-[#1F2A22]/70">{formatDate(r.serviceDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-[#C24949]/70 tracking-wider mb-0.5">To Collect</p>
                        <p className="font-black text-[#C24949] text-lg leading-none">{formatCurrency(r.pendingAmount)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}