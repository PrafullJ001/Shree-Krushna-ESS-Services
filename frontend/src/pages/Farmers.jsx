import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FarmerSearchSelect from "../components/farmers/FarmerSearchSelect";
import FarmerForm from "../components/farmers/FarmerForm";

export default function Farmers() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (farmer) => {
    if (farmer) {
      navigate(`/farmers/${farmer._id}`);
    }
  };

  const handleRegistered = (farmer) => {
    navigate(`/farmers/${farmer._id}`);
  };

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
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Farmers
            </h1>
            <p className="text-[#B9D9BE] text-sm mt-1">
              {showForm ? "Register a new farmer" : "Search and manage profiles"}
            </p>
          </div>
          
          {showForm && (
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#F3C6C6] bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10 active:scale-95 transition-all duration-200 backdrop-blur-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 -mt-8 relative z-10 max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] p-5">
          {!showForm ? (
            <div className="animate-in fade-in duration-300">
              <FarmerSearchSelect onSelect={handleSelect} selectedFarmer={null} />
              
              <div className="relative flex py-6 items-center">
                <div className="flex-grow border-t border-black/5"></div>
                <span className="flex-shrink-0 mx-4 text-[#1F2A22]/30 text-xs font-bold uppercase tracking-wider">
                  OR
                </span>
                <div className="flex-grow border-t border-black/5"></div>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-[#4C9A5A] text-white rounded-xl py-3.5 text-base font-bold shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Register New Farmer
              </button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
              <FarmerForm 
                onSuccess={handleRegistered} 
                onCancel={() => setShowForm(false)} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}