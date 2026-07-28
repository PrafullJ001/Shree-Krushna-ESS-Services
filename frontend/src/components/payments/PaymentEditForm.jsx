﻿import { useState } from "react";
import { updatePayment } from "../../api/paymentApi";

export default function PaymentEditForm({ payment, onSuccess, onCancel }) {
  const [amount, setAmount] = useState(payment.amount || "");
  const [mode, setMode] = useState(payment.mode || "Cash");
  const [note, setNote] = useState(payment.note || "");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || Number(amount) <= 0) {
      return setError("Amount must be greater than 0");
    }

    setLoading(true);
    try {
      const { data } = await updatePayment(payment._id, {
        amount: Number(amount),
        mode,
        note,
      });
      onSuccess(data.payment, data.service);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update payment");
    } finally {
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
        <h2 className="font-bold text-xl text-[#1F2A22]">Edit Payment</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClassName}>Amount (₹) *</label>
          <input
            type="number"
            inputMode="numeric"
            name="amount"
            autoComplete="off"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            required
            className={inputClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>Payment Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClassName}>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI / Online</option>
            <option value="Bank">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label className={labelClassName}>Note</label>
          <input
            name="note"
            autoComplete="off"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid by brother"
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
