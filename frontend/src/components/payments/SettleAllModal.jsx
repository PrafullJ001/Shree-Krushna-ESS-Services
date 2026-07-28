import { useState, useEffect } from "react";
import { settleAllForFarmer } from "../../api/paymentApi";
import { formatCurrency } from "../../utils/formatCurrency";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function SettleAllModal({ farmerId, farmerName, totalPending, onSuccess, onClose }) {
  const [paidOn, setPaidOn] = useState(todayStr());
  const [mode, setMode] = useState("Cash");
  const [note, setNote] = useState("");
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCaptcha({
      a: Math.floor(Math.random() * 9) + 1,
      b: Math.floor(Math.random() * 9) + 1,
    });
  }, []);

  const handleConfirm = async () => {
    setError(null);
    if (Number(answer) !== captcha.a + captcha.b) {
      setError("Incorrect answer — please try again");
      setCaptcha({
        a: Math.floor(Math.random() * 9) + 1,
        b: Math.floor(Math.random() * 9) + 1,
      });
      setAnswer("");
      return;
    }

    setLoading(true);
    try {
      const { data } = await settleAllForFarmer(farmerId, { paidOn, mode, note });
      onSuccess(data.services);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to settle payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[1.5rem] shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 003.82 21h16.36a2 2 0 001.71-2.96L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-bold text-lg text-[#1F2A22]">Clear All Pending</h2>
        </div>

        <p className="text-sm text-[#1F2A22]/60 mb-4">
          This will mark all of <span className="font-semibold text-[#1F2A22]">{farmerName}</span>'s unpaid services as fully paid — total <span className="font-bold text-[#C24949]">{formatCurrency(totalPending)}</span>. Payment records will be created for audit history.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">Date</label>
          <input
            type="date"
            name="settleDate"
            value={paidOn}
            max={todayStr()}
            onChange={(e) => setPaidOn(e.target.value)}
            className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm"
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI / Online</option>
            <option value="Bank">Bank Transfer</option>
          </select>

          {mode === "UPI" && (
            <div className="flex justify-center mt-3">
              <img
                src="/upi-qr.png"
                alt="UPI QR Code"
                height={120}
                width={120}
                className="rounded-xl border border-black/[0.08]"
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">Note (optional)</label>
          <input
            name="settleNote"
            autoComplete="off"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="bg-[#F6F2E9] rounded-xl p-4 mb-4">
          <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-2">
            To confirm, solve: {captcha.a} + {captcha.b} = ?
          </label>
          <input
            type="number"
            inputMode="numeric"
            name="settleCaptcha"
            autoComplete="off"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full bg-white border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
            autoFocus
          />
        </div>

        {error && (
          <div className="bg-[#FCEDED] border border-[#F3C6C6] rounded-xl px-3.5 py-2.5 mb-4">
            <p className="text-[#C24949] text-sm font-semibold">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-white border border-black/10 text-[#1F2A22] rounded-2xl py-3 font-bold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !answer}
            className="flex-[1.5] bg-[#D97706] text-white rounded-2xl py-3 font-bold text-sm disabled:opacity-50"
          >
            {loading ? "Clearing..." : "Confirm & Clear"}
          </button>
        </div>
      </div>
    </div>
  );
}