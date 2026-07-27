import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStaffPerformance } from "../api/staffApi";
import { formatCurrency } from "../utils/formatCurrency";

export default function StaffPerformance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getStaffPerformance()
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F2E9] pb-24 font-sans">
      <div
        className="relative px-6 pt-10 pb-16 overflow-hidden rounded-b-[2.5rem] shadow-sm"
        style={{ backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 60%, #2B5439 100%)" }}
      >
        <button onClick={() => navigate("/profile")} className="text-white/80 text-sm mb-3">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight">Staff Performance</h1>
        <p className="text-[#B9D9BE] text-xs mt-1">Entries and acres logged per user</p>
      </div>

      <div className="px-5 -mt-8 relative z-10 max-w-2xl mx-auto space-y-3">
        {loading && <p className="text-center text-[#5B6B5E] text-sm py-6">Loading...</p>}
        {error && <p className="text-center text-[#C24949] text-sm py-6">{error}</p>}

        {!loading && !error && data.length === 0 && (
          <div className="bg-white rounded-[1.5rem] shadow-sm p-6 text-center text-[#8A968C] text-sm">
            No service entries recorded yet
          </div>
        )}

        {data.map((s) => (
          <div key={s.userId} className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-[#1F2A22]">{s.name}</p>
                <p className="text-xs text-[#8A968C]">{s.mobile}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-[#E9F3E9] text-[#4C9A5A] px-2.5 py-1 rounded-lg">
                {s.role}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F6F2E9] rounded-xl py-2.5">
                <p className="text-lg font-bold text-[#1F2A22]">{s.totalEntries}</p>
                <p className="text-[10px] text-[#8A968C] uppercase tracking-wide">Entries</p>
              </div>
              <div className="bg-[#F6F2E9] rounded-xl py-2.5">
                <p className="text-lg font-bold text-[#1F2A22]">{s.totalAcres}</p>
                <p className="text-[10px] text-[#8A968C] uppercase tracking-wide">Acres</p>
              </div>
              <div className="bg-[#F6F2E9] rounded-xl py-2.5">
                <p className="text-sm font-bold text-[#1F2A22]">{formatCurrency(s.totalBillAmount)}</p>
                <p className="text-[10px] text-[#8A968C] uppercase tracking-wide">Billed</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}