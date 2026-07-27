import { useState, useEffect, useRef } from "react";
import { searchFarmers } from "../../api/farmerApi";

export default function FarmerSearchSelect({ onSelect, selectedFarmer }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchFarmers(query);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (farmer) => {
    onSelect(farmer);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  // Extract initials for the selected farmer avatar
  const getInitials = (name) => {
    if (!name) return "F";
    return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <div className="relative">
      <label className="block text-[12px] font-bold text-[#1F2A22]/60 uppercase tracking-wider mb-1.5 ml-1">
        Farmer
      </label>

      {selectedFarmer ? (
        /* Modern Selected State Card */
        <div className="flex items-center justify-between bg-[#E9F3E9]/50 border border-[#4C9A5A]/20 rounded-2xl p-3.5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#4C9A5A] font-bold text-sm shadow-sm border border-[#4C9A5A]/10 shrink-0">
              {getInitials(selectedFarmer.fullName)}
            </div>
            <div>
              <p className="font-bold text-[15px] text-[#1F2A22] leading-tight mb-0.5">
                {selectedFarmer.fullName}
              </p>
              <p className="text-[12px] font-medium text-[#1F2A22]/50">
                {selectedFarmer.village} • {selectedFarmer.mobile}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="h-8 px-3 bg-white border border-black/5 rounded-lg text-[11px] font-bold uppercase tracking-wide text-[#C24949] shadow-sm active:scale-95 transition-all flex items-center gap-1"
          >
            Change
          </button>
        </div>
      ) : (
        /* Modern Search Input */
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1F2A22]/40" fill="none">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            placeholder="Type name, mobile, or village..."
            className="w-full bg-[#F6F2E9]/50 border border-black/[0.05] rounded-2xl py-3.5 pl-11 pr-4 text-[15px] font-medium text-[#1F2A22] placeholder:text-[#1F2A22]/40 focus:outline-none focus:ring-4 focus:ring-[#4C9A5A]/10 focus:border-[#4C9A5A]/50 transition-all shadow-sm"
          />

          {/* Modern Dropdown Menu */}
          {showDropdown && query.trim().length >= 2 && (
            <div className="absolute z-50 w-full bg-white border border-black/[0.04] rounded-2xl mt-2 shadow-xl shadow-black/[0.05] max-h-64 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
              
              {loading && (
                <div className="px-4 py-6 flex flex-col items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-[#4C9A5A]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-[13px] font-medium text-[#1F2A22]/50">Searching...</p>
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-[14px] font-medium text-[#1F2A22]/50">No farmers found</p>
                  <p className="text-[12px] text-[#1F2A22]/30 mt-1">Check spelling or register a new farmer</p>
                </div>
              )}

              {results.map((farmer) => (
                <button
                  key={farmer._id}
                  type="button"
                  onClick={() => handleSelect(farmer)}
                  className="w-full text-left px-4 py-3.5 active:bg-black/[0.02] hover:bg-black/[0.01] border-b border-black/5 last:border-b-0 transition-colors flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-[#F6F2E9] flex items-center justify-center text-[#1F2A22]/50 shrink-0">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {/* The API sends farmer.label, so we style it cleanly here */}
                  <p className="text-[14px] font-semibold text-[#1F2A22]">
                    {farmer.label}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}