import { useState, useEffect } from "react";
import { settleAllForFarmer } from "../../api/paymentApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { buildSettleAllMessage } from "../../utils/messageTemplates";
import SendMessageButtons from "../common/SendMessageButtons";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function SettleAllModal({ farmerId, farmer, farmerName, totalPending, onSuccess, onClose }) {
  const [step, setStep] = useState("confirm"); // confirm -> success
  const [paidOn, setPaidOn] = useState(todayStr());
  const [mode, setMode] = useState("Cash");
  const [note, setNote] = useState("");

  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultServices, setResultServices] = useState(null);

  // Frozen at modal-open time so the success screen's numbers can't be
  // thrown off by the parent refetching totalPending after our own
  // "payments-updated" event fires.
  const [pendingSnapshot] = useState(totalPending);

  // LIVE remaining calculation as discount is typed — the discount is
  // the only variable amount here, since the rest is always paid in full.
  const enteredDiscount = applyDiscount ? Number(discountAmount) || 0 : 0;
  const liveAmountCollected = Math.max(pendingSnapshot - enteredDiscount, 0);
  const exceedsPending = enteredDiscount > pendingSnapshot;

  useEffect(() => {
    setCaptcha({
      a: Math.floor(Math.random() * 9) + 1,
      b: Math.floor(Math.random() * 9) + 1,
    });
  }, []);

  const handleConfirm = async () => {
    setError(null);

    if (applyDiscount) {
      const disc = Number(discountAmount);
      if (!disc || disc <= 0) {
        setError("Enter a valid discount amount");
        return;
      }
      if (exceedsPending) {
        setError(`Discount exceeds total pending (${formatCurrency(pendingSnapshot)})`);
        return;
      }
    }

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
      const { data } = await settleAllForFarmer(farmerId, {
        paidOn,
        mode,
        note,
        applyDiscount,
        discountAmount: applyDiscount ? Number(discountAmount) : 0,
        discountReason: applyDiscount ? discountReason : "",
      });
      setResultServices(data.services);
      setStep("success");
      onSuccess(data.services);
      window.dispatchEvent(new Event("payments-updated"));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to settle payments");
    } finally {
      setLoading(false);
    }
  };

  const totalBillSettled = resultServices?.reduce((sum, s) => sum + Number(s.totalBill || 0), 0) || 0;
  const totalCollected = resultServices?.reduce((sum, s) => sum + Number(s.amountPaid || 0), 0) || 0;

   return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4 pb-24">
      <div className="bg-white rounded-[1.5rem] shadow-lg w-full max-w-sm max-h-[75vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {step === "confirm" && (
          <>
            {/* Scrollable content area — buttons live outside this in a sticky footer below */}
            <div className="p-6 pb-0 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                    <path d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 003.82 21h16.36a2 2 0 001.71-2.96L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="font-bold text-lg text-[#1F2A22]">Clear All Pending</h2>
              </div>

              <p className="text-sm text-[#1F2A22]/60 mb-4">
                This will mark all of <span className="font-semibold text-[#1F2A22]">{farmerName}</span>'s unpaid services as fully paid — total <span className="font-bold text-[#C24949]">{formatCurrency(pendingSnapshot)}</span>. Payment records will be created for audit history.
              </p>

              {/* LIVE SUMMARY — updates as discount is typed */}
              <div className="bg-[#F6F2E9] rounded-2xl p-4 mb-4 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase">Total Pending</p>
                  <p className="font-bold text-[#1F2A22]">{formatCurrency(pendingSnapshot)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#4C9A5A]/60 uppercase">To Collect</p>
                  <p className="font-black text-[#4C9A5A] text-lg">{formatCurrency(liveAmountCollected)}</p>
                </div>
              </div>

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
                        name="settleDiscountAmount"
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
                        name="settleDiscountReason"
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
                    Discount exceeds total pending.
                  </p>
                </div>
              )}

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
            </div>

            {/* Sticky footer — always fully visible, never cut off on short mobile screens */}
            <div className="flex gap-3 p-6 pt-4 shrink-0 bg-white border-t border-black/[0.04]">
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
                disabled={loading || !answer || exceedsPending}
                className="flex-[1.5] bg-[#D97706] text-white rounded-2xl py-3 font-bold text-sm disabled:opacity-50"
              >
                {loading ? "Clearing..." : "Confirm & Clear"}
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
            <h2 className="text-xl font-bold text-[#1F2A22] mb-1">Payment Settled!</h2>
            <p className="text-[13px] font-medium text-[#1F2A22]/50 mb-5">
              Cleared across {resultServices?.length || 0} service(s)
            </p>

            <div className="bg-[#F6F2E9]/50 rounded-2xl p-4 mb-3 flex justify-between items-center text-left border border-black/[0.03]">
              <div>
                <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase tracking-wide mb-0.5">Received</p>
                <p className="font-black text-[18px] text-[#4C9A5A]">{formatCurrency(liveAmountCollected)}</p>
              </div>
              <div className="w-px h-10 bg-black/5"></div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase tracking-wide mb-0.5">Pending</p>
                <p className="font-bold text-[16px] text-[#4C9A5A]">{formatCurrency(0)}</p>
              </div>
            </div>

            {applyDiscount && (
              <div className="bg-[#FEF3C7]/50 rounded-2xl p-3 mb-3">
                <p className="text-[11px] font-bold text-[#D97706] uppercase tracking-wide">Discount Applied</p>
                <p className="font-black text-[17px] text-[#D97706]">{formatCurrency(Number(discountAmount))}</p>
              </div>
            )}

            {farmer && (
              <div className="mb-6 text-left">
                <p className="text-[12px] font-bold text-[#1F2A22]/60 uppercase tracking-wider mb-3">
                  Notify {farmerName}?
                </p>
                <SendMessageButtons
                  mobile={farmer.mobile}
                  message={buildSettleAllMessage(farmer, {
                    totalBill: totalBillSettled,
                    totalCollected,
                  })}
                />
              </div>
            )}

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