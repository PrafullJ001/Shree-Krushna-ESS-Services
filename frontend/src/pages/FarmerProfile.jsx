import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFarmerProfile, deleteFarmer } from "../api/farmerApi";
import { getServicesByFarmer } from "../api/serviceApi";
import FarmerHistoryTable from "../components/payments/FarmerHistoryTable";
import FarmerForm from "../components/farmers/FarmerForm";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/common/Spinner";
import { formatCurrency } from "../utils/formatCurrency";
import SettleAllModal from "../components/payments/SettleAllModal";
import BulkPaymentModal from "../components/payments/BulkPaymentModal";
import ReminderButton from "../components/payments/ReminderButton";

export default function FarmerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [farmer, setFarmer] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const loadData = async () => {
    try {
      const [farmerRes, servicesRes] = await Promise.all([
        getFarmerProfile(id),
        getServicesByFarmer(id),
      ]);

      setFarmer(farmerRes.data);
      setServices(servicesRes.data.services);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load farmer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handlePaymentRecorded = (updatedService) => {
    setServices((prev) => prev.map((s) => (s._id === updatedService._id ? updatedService : s)));
  };

  const handleServiceUpdated = (updatedService) => {
    setServices((prev) => prev.map((s) => (s._id === updatedService._id ? updatedService : s)));
  };

  const handleServiceDeleted = (deletedId) => {
    setServices((prev) => prev.filter((s) => s._id !== deletedId));
  };

  const handleDeleteFarmer = async () => {
    if (!window.confirm(`Delete ${farmer.fullName}? This cannot be undone.`)) return;
    setDeleteError(null);
    try {
      await deleteFarmer(id);
      navigate("/farmers");
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete farmer");
    }
  };

  const handleSettledAll = (updatedServices) => {
    setServices((prev) =>
      prev.map((s) => {
        const updated = updatedServices.find((u) => u._id === s._id);
        return updated || s;
      })
    );
    setShowSettleModal(false);
  };

  const handleBulkPaid = (updatedServices) => {
    setServices((prev) =>
      prev.map((s) => {
        const updated = updatedServices.find((u) => u._id === s._id);
        return updated || s;
      })
    );
  };

  if (loading) {
    return <Spinner label="Loading farmer..." />;
  }

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

          <button
            onClick={() => navigate("/farmers")}
            className="mt-6 text-[#1F3D2B] bg-[#F6F2E9] px-4 py-2 rounded-xl text-sm font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-[#F6F2E9] pb-24 font-sans selection:bg-[#4C9A5A]/20">
        <div className="relative px-6 pt-10 pb-16 overflow-hidden rounded-b-[2rem] shadow-sm bg-gradient-to-b from-[#1F3D2B] to-[#234730]">
          <div className="relative z-10">
            <h1 className="text-xl font-bold text-white tracking-tight">Edit Farmer</h1>
            <p className="text-[#B9D9BE] text-sm mt-1">Update profile details</p>
          </div>
        </div>

        <div className="px-5 -mt-8 relative z-10 max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] p-5">
            <FarmerForm
              existingFarmer={farmer}
              onSuccess={(updated) => {
                setFarmer(updated);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  const initials = farmer?.fullName
    ? farmer.fullName.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "F";

  // FARMER FINANCIAL SUMMARY
  const totalBill = services.reduce((sum, service) => sum + Number(service.totalBill || 0), 0);
  const totalCollected = services.reduce((sum, service) => sum + Number(service.amountPaid || 0), 0);
  const totalPending = services.reduce((sum, service) => sum + Number(service.pendingAmount || 0), 0);

  // ACRES SUMMARY — total acres across all services, and "pending acres"
  // (acres belonging to services that still have money owed). This is
  // derived live from `services`, so it auto-adjusts the moment a bulk
  // payment or "Clear All Pending" fully settles a service — no separate
  // tracking needed, it just reflects current state.
  const totalAcres = services.reduce((sum, service) => sum + Number(service.acres || 0), 0);
  const pendingAcres = services
    .filter((service) => Number(service.pendingAmount || 0) > 0)
    .reduce((sum, service) => sum + Number(service.acres || 0), 0);

  return (
    <div className="min-h-screen bg-[#F6F2E9] pb-24 font-sans selection:bg-[#4C9A5A]/20">
      {/* Mobile App Header */}
      <div
        className="relative px-6 pt-10 pb-20 overflow-hidden rounded-b-[2.5rem] shadow-sm"
        style={{ backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)" }}
        />

        <div className="relative z-10">
          <button
            onClick={() => navigate("/farmers")}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-4 hover:bg-white/10 active:scale-95 transition-all duration-200 backdrop-blur-sm w-max"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Farmers List
          </button>
        </div>
      </div>

      <div className="px-5 -mt-16 relative z-10 max-w-md mx-auto space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-4 items-center">
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

            {isAdmin && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-[#1F3D2B]/50 hover:text-[#1F3D2B] bg-[#F6F2E9]/50 hover:bg-[#F6F2E9] rounded-xl transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Farmer Information */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#F6F2E9]/50 rounded-xl p-3 border border-[#1F3D2B]/5">
              <p className="text-[10px] uppercase font-bold text-[#1F2A22]/50 tracking-wider mb-1">Village</p>
              <p className="text-sm font-semibold text-[#1F2A22] truncate">{farmer.village}</p>
            </div>

            <div className="bg-[#F6F2E9]/50 rounded-xl p-3 border border-[#1F3D2B]/5">
              <p className="text-[10px] uppercase font-bold text-[#1F2A22]/50 tracking-wider mb-1">Mobile</p>
              <p className="text-sm font-semibold text-[#1F2A22]">{farmer.mobile}</p>
            </div>

            {farmer.altMobile && (
              <div className="bg-[#F6F2E9]/50 rounded-xl p-3 border border-[#1F3D2B]/5 col-span-2">
                <p className="text-[10px] uppercase font-bold text-[#1F2A22]/50 tracking-wider mb-1">Alt Mobile</p>
                <p className="text-sm font-semibold text-[#1F2A22]">{farmer.altMobile}</p>
              </div>
            )}
          </div>

          {/* Acres Summary — admin only, since pending acres derives from payment status */}
          {isAdmin && (
          <div className="pt-4 border-t border-black/[0.05]">
            <p className="text-[10px] uppercase font-bold text-[#1F2A22]/40 tracking-widest mb-3">Acres Summary</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#F6F2E9]/70 rounded-xl p-3 border border-black/[0.04]">
                <p className="text-[9px] uppercase font-bold text-[#1F2A22]/45 tracking-wide mb-1">Total Acres</p>
                <p className="text-sm font-black text-[#1F2A22] break-words">{totalAcres.toFixed(2)}</p>
              </div>
              <div className="bg-[#FEF3C7]/50 rounded-xl p-3 border border-[#D97706]/10">
                <p className="text-[9px] uppercase font-bold text-[#D97706]/70 tracking-wide mb-1">Pending Acres</p>
                <p className="text-sm font-black text-[#D97706] break-words">{pendingAcres.toFixed(2)}</p>
              </div>
            </div>
          </div>
          )}

          {/* Financial Summary — admin only */}
          {isAdmin && (
          <div className="pt-4 mt-4 border-t border-black/[0.05]">
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

            {isAdmin && totalPending > 0 && (
              <button
                onClick={() => setShowSettleModal(true)}
                className="w-full mt-3 bg-[#FEF3C7]/50 hover:bg-[#FEF3C7] border border-[#D97706]/20 text-[#D97706] rounded-xl py-2.5 text-sm font-bold transition-all"
              >
                Clear All Pending
              </button>
            )}

            {totalPending > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="w-full mt-2 bg-[#E9F3E9]/60 hover:bg-[#E9F3E9] border border-[#4C9A5A]/20 text-[#2B5439] rounded-xl py-2.5 text-sm font-bold transition-all"
              >
                Record Payment (Multiple Services)
              </button>
            )}

            <ReminderButton
              farmer={farmer}
              totals={{ totalBill, totalCollected, totalPending }}
            />
          </div>
          )}

          {deleteError && (
            <div className="bg-[#FCEDED] border border-[#F3C6C6] rounded-xl p-3 mt-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#C24949] shrink-0" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-[#C24949] text-xs font-semibold">{deleteError}</p>
            </div>
          )}

          {isAdmin && services.length === 0 && (
            <button
              onClick={handleDeleteFarmer}
              className="w-full mt-4 bg-[#FCEDED]/50 text-[#C24949] hover:bg-[#FCEDED] border border-[#F3C6C6]/50 rounded-xl py-2.5 text-sm font-bold transition-all flex justify-center items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Delete Farmer
            </button>
          )}
        </div>

        {/* Add New Service */}
        <button
          onClick={() => navigate("/add-service", { state: { farmer } })}
          className="w-full bg-[#4C9A5A] text-white rounded-xl py-3.5 text-base font-bold shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Add New Service
        </button>

        {/* Service History */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold text-[#1F2A22] tracking-tight">Service History</h2>
            {services.length > 0 && (
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#4C9A5A] bg-[#E9F3E9] rounded-lg px-2.5 py-1 shadow-sm border border-[#4C9A5A]/10">
                {services.length} Total
              </span>
            )}
          </div>

          <div className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] overflow-hidden">
            <FarmerHistoryTable
              services={services}
              farmer={farmer}
              onPaymentRecorded={handlePaymentRecorded}
              onServiceUpdated={handleServiceUpdated}
              onServiceDeleted={handleServiceDeleted}
            />
          </div>
        </div>
      </div>

      {showSettleModal && (
        <SettleAllModal
          farmerId={id}
          farmerName={farmer.fullName}
          totalPending={totalPending}
          onSuccess={handleSettledAll}
          onClose={() => setShowSettleModal(false)}
        />
      )}

      {showBulkModal && (
        <BulkPaymentModal
          farmerId={id}
          farmer={farmer}
          totalPending={totalPending}
          onSuccess={handleBulkPaid}
          onClose={() => setShowBulkModal(false)}
        />
      )}
    </div>
  );
}