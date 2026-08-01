import { useState, useEffect } from "react";
import { recordBulkPayment } from "../../api/paymentApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { buildBulkPaymentMessage } from "../../utils/messageTemplates";
import SendMessageButtons from "../common/SendMessageButtons";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function BulkPaymentModal({ farmerId, farmer, totalPending, onSuccess, onClose }) {
  const [step, setStep] = useState("amount"); // amount -> captcha -> success
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [note, setNote] = useState("");
  const [paidOn, setPaidOn] = useState(todayStr());

  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultServices, setResultServices] = useState(null);

  // Frozen at modal-open time. The live `totalPending` prop can change
  // after a successful payment (parent refetches on our "payments-updated"
  // event while this modal is still showing its success screen), so all
  // remaining-amount math must use this snapshot, not the live prop.
  const [pendingSnapshot] = useState(totalPending);

  // LIVE remaining calculation as amount/discount are typed
  const enteredAmount = Number(amount) || 0;
  const enteredDiscount = applyDiscount ? Number(discountAmount) || 0 : 0;
  const liveRemaining = Math.max(pendingSnapshot - enteredAmount - enteredDiscount, 0);
  const exceedsPending = enteredAmount + enteredDiscount > pendingSnapshot;

  useEffect(() => {
    if (step === "captcha") {
      setCaptcha({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 });
      setAnswer("");
    }
  }, [step]);

  const handleProceedToCaptcha = () => {
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount");

    if (applyDiscount) {
      const disc = Number(discountAmount);
      if (!disc || disc <= 0) return setError("Enter a valid discount amount");
    }

    if (exceedsPending) {
      return setError(`Amount and discount together exceed total pending (${formatCurrency(pendingSnapshot)})`);
    }
    if (!paidOn) return setError("Please select a date");

    setStep("captcha");
  };

  const handleConfirm = async () => {
    setError(null);
    if (Number(answer) !== captcha.a + captcha.b) {
      setError("Incorrect answer — try again");
      setCaptcha({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 });
      setAnswer("");
      return;
    }

    setLoading(true);
    try {
      const { data } = await recordBulkPayment(farmerId, {
        amount: Number(amount),
        mode,
        note,
        paidOn,
        applyDiscount,
        discountAmount: applyDiscount ? Number(discountAmount) : 0,
        discountReason: applyDiscount ? discountReason : "",
      });
      setResultServices(data.services);
      setStep("success");
      onSuccess(data.services);
      window.dispatchEvent(new Event("payments-updated"));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const newTotalPaid = resultServices?.reduce((sum, s) => sum + Number(s.amountPaid || 0), 0);
  const remainingAfter = Math.max(pendingSnapshot - Number(amount || 0) - enteredDiscount, 0);

    return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4 pb-24">
      <div className="bg-white rounded-[1.5rem] shadow-lg w-full max-w-sm max-h-[75vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {step === "amount" && (
          <>
            <div className="p-6 pb-0 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-[#E9F3E9] flex items-center justify-center text-[#4C9A5A]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="font-bold text-lg text-[#1F2A22]">Record Payment</h2>
              </div>

              <p className="text-sm text-[#1F2A22]/60 mb-4">
                Enter a lump-sum amount — it'll be applied automatically across {farmer.fullName}'s oldest pending services first.
              </p>

              <div className="bg-[#F6F2E9] rounded-xl p-4 mb-4">
                <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-2">
                  Total Pending: {formatCurrency(pendingSnapshot)}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="bulkPaymentAmount"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-white border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setAmount(String(pendingSnapshot))}
                  className="text-[11px] font-bold text-[#4C9A5A] mt-1.5"
                >
                  Full amount ({formatCurrency(pendingSnapshot)})
                </button>
              </div>

              {/* LIVE REMAINING — updates as amount/discount are typed */}
              <div className="bg-[#F6F2E9] rounded-2xl p-4 mb-4 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase">Total Pending</p>
                  <p className="font-bold text-[#1F2A22]">{formatCurrency(pendingSnapshot)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#C24949]/60 uppercase">Remaining</p>
                  <p className="font-black text-[#C24949] text-lg">{formatCurrency(liveRemaining)}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  name="bulkPaymentDate"
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
                  name="bulkPaymentNote"
                  autoComplete="off"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              {/* DISCOUNT */}
              <div className="border border-black/[0.05] rounded-2xl p-4 mb-4">
                <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-2">Apply Discount?</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setApplyDiscount(false); setDiscountAmount(""); setDiscountReason(""); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${!applyDiscount ? "bg-[#1F3D2B] text-white" : "bg-[#F6F2E9] text-[#1F2A22]/60"}`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyDiscount(true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${applyDiscount ? "bg-[#D97706] text-white" : "bg-[#F6F2E9] text-[#1F2A22]/60"}`}
                  >
                    Yes
                  </button>
                </div>

                {applyDiscount && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">Discount Amount (₹)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        name="bulkDiscountAmount"
                        autoComplete="off"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        min="1"
                        placeholder="Enter discount"
                        required={applyDiscount}
                        className="w-full bg-white border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">Discount Reason (optional)</label>
                      <input
                        name="bulkDiscountReason"
                        autoComplete="off"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        placeholder="e.g. Regular customer"
                        className="w-full bg-white border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
                      />
                    </div>
                  </div>
                )}
              </div>

              {exceedsPending && (
                <div className="bg-[#FCEDED] border border-[#F3C6C6] rounded-xl px-3.5 py-2.5 mb-4">
                  <p className="text-[#C24949] text-sm font-semibold">
                    Amount and discount together exceed total pending.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-[#FCEDED] border border-[#F3C6C6] rounded-xl px-3.5 py-2.5 mb-4">
                  <p className="text-[#C24949] text-sm font-semibold">{error}</p>
                </div>
              )}
            </div>

            {/* Sticky footer — always fully visible, never cut off on short mobile screens */}
            <div className="flex gap-3 p-6 pt-4 shrink-0 bg-white border-t border-black/[0.04]">
              <button type="button" onClick={onClose} className="flex-1 bg-white border border-black/10 text-[#1F2A22] rounded-2xl py-3 font-bold text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToCaptcha}
                disabled={exceedsPending}
                className="flex-[1.5] bg-[#4C9A5A] text-white rounded-2xl py-3 font-bold text-sm disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === "captcha" && (
          <>
            <div className="p-6 pb-0 overflow-y-auto flex-1 min-h-0">
              <p className="text-sm text-[#1F2A22]/60 mb-4">
                Confirm: apply <span className="font-bold text-[#1F2A22]">{formatCurrency(amount)}</span>
                {applyDiscount && <> + <span className="font-bold text-[#D97706]">{formatCurrency(discountAmount)} discount</span></>} across {farmer.fullName}'s pending services.
              </p>

              <div className="bg-[#F6F2E9] rounded-xl p-4 mb-4">
                <label className="block text-xs font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-2">
                  Solve: {captcha.a} + {captcha.b} = ?
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="bulkPaymentCaptcha"
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
            </div>

            {/* Sticky footer */}
            <div className="flex gap-3 p-6 pt-4 shrink-0 bg-white border-t border-black/[0.04]">
              <button type="button" onClick={() => setStep("amount")} disabled={loading} className="flex-1 bg-white border border-black/10 text-[#1F2A22] rounded-2xl py-3 font-bold text-sm">
                Back
              </button>
              <button type="button" onClick={handleConfirm} disabled={loading || !answer} className="flex-[1.5] bg-[#4C9A5A] text-white rounded-2xl py-3 font-bold text-sm disabled:opacity-50">
                {loading ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="text-center p-6 overflow-y-auto">
            <div className="mx-auto h-16 w-16 bg-[#E9F3E9] rounded-full flex items-center justify-center mb-4 border border-[#4C9A5A]/10 shadow-inner">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#4C9A5A]" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1F2A22] mb-1">Payment Recorded!</h2>
            <p className="text-[13px] font-medium text-[#1F2A22]/50 mb-5">
              Applied across {resultServices?.length || 0} service(s)
            </p>

            <div className="bg-[#F6F2E9]/50 rounded-2xl p-4 mb-3 flex justify-between items-center text-left border border-black/[0.03]">
              <div>
                <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase tracking-wide mb-0.5">Received</p>
                <p className="font-black text-[18px] text-[#4C9A5A]">{formatCurrency(amount)}</p>
              </div>
              <div className="w-px h-10 bg-black/5"></div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase tracking-wide mb-0.5">Pending</p>
                <p className="font-bold text-[16px] text-[#C24949]">{formatCurrency(remainingAfter)}</p>
              </div>
            </div>

            {applyDiscount && (
              <div className="bg-[#FEF3C7]/50 rounded-2xl p-3 mb-3">
                <p className="text-[11px] font-bold text-[#D97706] uppercase tracking-wide">Discount Applied</p>
                <p className="font-black text-[17px] text-[#D97706]">{formatCurrency(Number(discountAmount))}</p>
              </div>
            )}

            <div className="mb-6 text-left">
              <p className="text-[12px] font-bold text-[#1F2A22]/60 uppercase tracking-wider mb-3">
                Notify {farmer.fullName}?
              </p>
              <SendMessageButtons
                mobile={farmer.mobile}
                message={buildBulkPaymentMessage(farmer, Number(amount), {
                  totalBill: resultServices?.reduce((sum, s) => sum + Number(s.totalBill || 0), 0) || 0,
                  totalCollected: newTotalPaid || 0,
                  totalPending: remainingAfter,
                })}
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-white border border-black/10 rounded-2xl text-[14px] font-bold text-[#1F2A22]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}