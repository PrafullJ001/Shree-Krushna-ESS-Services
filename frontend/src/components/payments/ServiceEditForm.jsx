import { useState, useEffect } from "react";
import { updateService } from "../../api/serviceApi";
import { getSettings, updateSettings } from "../../api/settingsApi";
import { CROPS, SERVICE_TYPES } from "../../constants/serviceOptions";
import { useAuth } from "../../hooks/useAuth";

export default function ServiceEditForm({ service, onSuccess, onCancel }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const initialCropIsKnown = CROPS.includes(service.cropName);
  const initialServiceTypeIsKnown = SERVICE_TYPES.includes(service.serviceType);
  const initialR = service.acres ? String(Number(service.acres) * 40) : "";

  const [billNo, setBillNo] = useState(service.billNo || "");
  const [cropName, setCropName] = useState(initialCropIsKnown ? service.cropName : "Other");
  const [cropOther, setCropOther] = useState(initialCropIsKnown ? "" : service.cropName || "");
  const [serviceType, setServiceType] = useState(initialServiceTypeIsKnown ? service.serviceType : "Other");
  const [serviceTypeOther, setServiceTypeOther] = useState(initialServiceTypeIsKnown ? "" : service.serviceType || "");

  const [plotR, setPlotR] = useState(initialR);
  const [acres, setAcres] = useState(service.acres || "");
  const [areaInputSource, setAreaInputSource] = useState("R");
  const [plotName, setPlotName] = useState(service.plotName || "");

  const [ratePerAcre, setRatePerAcre] = useState(service.ratePerAcre || 0);
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState("");

  const [totalBill, setTotalBill] = useState(service.totalBill || "");
  const [notes, setNotes] = useState(service.notes || "");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSettings()
      .then(({ data }) => {
        if (!service.ratePerAcre) setRatePerAcre(data.ratePerAcre);
      })
      .catch(() => {});
  }, [service.ratePerAcre]);

  const handleRChange = (val) => {
    setAreaInputSource("R");
    setPlotR(val);
    if (val === "") {
      setAcres("");
      return;
    }
    const numericR = Number(val);
    if (!Number.isFinite(numericR)) return;
    setAcres((numericR / 40).toFixed(2));
  };

  const handleAcresChange = (val) => {
    setAreaInputSource("ACRES");
    setAcres(val);
    if (val === "") {
      setPlotR("");
      return;
    }
    const numericAcres = Number(val);
    if (!Number.isFinite(numericAcres)) return;
    setPlotR(String(Math.round((numericAcres * 40 + Number.EPSILON) * 100) / 100));
  };

  useEffect(() => {
    if (!ratePerAcre) {
      setTotalBill("");
      return;
    }

    let exactAcres = 0;
    if (areaInputSource === "R" && plotR !== "") {
      exactAcres = Number(plotR) / 40;
    } else if (areaInputSource === "ACRES" && acres !== "") {
      exactAcres = Number(acres);
    }

    if (!Number.isFinite(exactAcres) || exactAcres <= 0) {
      setTotalBill("");
      return;
    }

    const exactBill = exactAcres * Number(ratePerAcre);
    const finalBill = Math.round((exactBill + Number.EPSILON) * 100) / 100;
    setTotalBill(String(finalBill));
  }, [plotR, acres, ratePerAcre, areaInputSource]);

  const handleSaveRate = async () => {
    if (!newRate) return;
    try {
      const { data } = await updateSettings({ ratePerAcre: Number(newRate) });
      setRatePerAcre(data.ratePerAcre);
      setEditingRate(false);
      setNewRate("");
    } catch {
      setError("Failed to update rate");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const finalCrop = cropName === "Other" ? cropOther.trim() : cropName;
    const finalServiceType = serviceType === "Other" ? serviceTypeOther.trim() : serviceType;

    if (!billNo.trim()) return setError("Bill No. is required");
    if (!finalCrop) return setError("Please select or enter a crop name");
    if (!finalServiceType) return setError("Please select or enter a service type");
    if (totalBill === "" || totalBill === null) return setError("Total bill is required");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("billNo", billNo.trim());
      fd.append("cropName", finalCrop);
      fd.append("serviceType", finalServiceType);
      fd.append("kshetra", plotR ? `${plotR} R` : "");
      if (acres !== "") fd.append("acres", acres);
      if (plotName !== "") fd.append("plotName", plotName);
      fd.append("ratePerAcre", ratePerAcre);
      fd.append("totalBill", totalBill);
      if (notes !== "") fd.append("notes", notes);

      await updateService(service._id, fd);
      // Force a full page refresh so every screen (bill total, paid,
      // pending, history) reflects exactly what's in the database.
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update service");
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full bg-[#F6F2E9]/50 border border-black/[0.05] rounded-2xl px-4 py-3.5 text-[15px] font-medium text-[#1F2A22] placeholder:text-[#1F2A22]/30 focus:outline-none focus:ring-4 focus:ring-[#4C9A5A]/10 focus:border-[#4C9A5A]/50 transition-all";
  const labelClassName =
    "block text-[12px] font-bold text-[#1F2A22]/60 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-[#E9F3E9] flex items-center justify-center text-[#4C9A5A]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-bold text-xl text-[#1F2A22]">Edit Service</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClassName}>Bill No. *</label>
          <input
            type="text"
            name="billNo"
            autoComplete="off"
            value={billNo}
            onChange={(e) => setBillNo(e.target.value)}
            placeholder="Enter bill number"
            required
            className={inputClassName}
          />
        </div>

        {service.village && (
          <div>
            <label className={labelClassName}>Village</label>
            <div className="w-full bg-[#F6F2E9]/50 border border-black/[0.05] rounded-2xl px-4 py-3.5 text-[15px] font-medium text-[#1F2A22]/60">
              {service.village}
            </div>
            <p className="text-[11px] text-[#1F2A22]/40 mt-1.5 ml-1">Change village from Farmer Profile</p>
          </div>
        )}

        <div>
          <label className={labelClassName}>Crop Name</label>
          <select value={cropName} onChange={(e) => setCropName(e.target.value)} className={inputClassName}>
            {CROPS.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
          </select>
          {cropName === "Other" && (
            <input
              name="cropOther"
              autoComplete="off"
              value={cropOther}
              onChange={(e) => setCropOther(e.target.value)}
              placeholder="Type crop name"
              className={`${inputClassName} mt-2`}
            />
          )}
        </div>

        <div>
          <label className={labelClassName}>Service Type</label>
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={inputClassName}>
            {SERVICE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          {serviceType === "Other" && (
            <input
              name="serviceTypeOther"
              autoComplete="off"
              value={serviceTypeOther}
              onChange={(e) => setServiceTypeOther(e.target.value)}
              placeholder="Type service type"
              className={`${inputClassName} mt-2`}
            />
          )}
        </div>

        <div className="bg-[#F6F2E9]/50 rounded-2xl p-3.5 border border-black/[0.05]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClassName}>In R (Guntha)</label>
              <input
                type="number"
                inputMode="decimal"
                name="plotR"
                autoComplete="off"
                value={plotR}
                onChange={(e) => handleRChange(e.target.value)}
                className="w-full bg-white border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#4C9A5A]/10"
              />
            </div>
            <div>
              <label className={labelClassName}>In Acres</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                name="acres"
                autoComplete="off"
                value={acres}
                onChange={(e) => handleAcresChange(e.target.value)}
                className="w-full bg-white border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#4C9A5A]/10"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#1F2A22]/40 mt-2 ml-1">40 R = 1 Acre — enter either field</p>
        </div>

        <div>
          <label className={labelClassName}>Plot Name</label>
          <input
            name="plotName"
            autoComplete="off"
            value={plotName}
            onChange={(e) => setPlotName(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="bg-[#F6F2E9]/50 rounded-2xl p-3.5 border border-black/[0.05]">
          <div className="flex justify-between items-center">
            <span className={`${labelClassName} mb-0`}>Rate / Acre</span>
            {isAdmin && !editingRate && (
              <button
                type="button"
                onClick={() => { setEditingRate(true); setNewRate(ratePerAcre); }}
                className="text-[11px] font-bold text-[#4C9A5A] bg-[#E9F3E9] px-2.5 py-1 rounded-lg"
              >
                Edit rate
              </button>
            )}
          </div>

          {!editingRate ? (
            <p className="text-xl font-bold text-[#1F2A22] mt-1">
              ₹{ratePerAcre}<span className="text-sm font-medium text-[#1F2A22]/40"> /acre</span>
            </p>
          ) : (
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                name="newRate"
                autoComplete="off"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="flex-1 bg-white border border-black/[0.06] rounded-xl px-3.5 py-2 text-sm focus:outline-none"
              />
              <button type="button" onClick={handleSaveRate} className="bg-[#2B5439] text-white rounded-xl px-4 text-sm font-semibold">
                Save
              </button>
              <button type="button" onClick={() => setEditingRate(false)} className="bg-white border border-black/[0.08] rounded-xl px-4 text-sm font-semibold">
                Cancel
              </button>
            </div>
          )}
        </div>

        <div>
          <label className={labelClassName}>Total Bill *</label>
          <input
            type="number"
            name="totalBill"
            autoComplete="off"
            value={totalBill}
            onChange={(e) => setTotalBill(e.target.value)}
            required
            className={inputClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>Notes</label>
          <textarea
            name="notes"
            autoComplete="off"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClassName}
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 p-3.5 bg-[#FCEDED] border border-[#C24949]/20 rounded-xl">
          <p className="text-[#C24949] text-[13px] font-medium">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-6 mt-2 border-t border-black/[0.04]">
        <button type="button" onClick={onCancel} disabled={loading} className="flex-1 bg-white border border-black/10 text-[#1F2A22] rounded-2xl py-3.5 font-bold text-[15px]">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-[1.5] bg-[#4C9A5A] text-white rounded-2xl py-3.5 font-bold text-[15px] disabled:opacity-70">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}