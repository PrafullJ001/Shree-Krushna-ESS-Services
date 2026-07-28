import { useState } from "react";
import { addPayment } from "../../api/paymentApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { buildPaymentMessage } from "../../utils/messageTemplates";
import SendMessageButtons from "../common/SendMessageButtons";
import { useAuth } from "../../hooks/useAuth";

const getTodayLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Path to your UPI QR code image. Put the actual image file in your
// frontend's /public folder (e.g. public/upi-qr.png) so this path resolves.
const UPI_QR_IMAGE = "/upi-qr.png";

export default function PaymentForm({
  service,
  farmer,
  onSuccess,
  onCancel,
}) {
  const { user } = useAuth();

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [note, setNote] = useState("");
  const [paidOnDate, setPaidOnDate] = useState(getTodayLocal());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [applyDiscount, setApplyDiscount] =
    useState(false);

  const [discountAmount, setDiscountAmount] =
    useState("");

  const [discountReason, setDiscountReason] =
    useState("");

  const [paymentSuccess, setPaymentSuccess] =
    useState(false);

  const [updatedService, setUpdatedService] =
    useState(null);

  const [paidAmount, setPaidAmount] =
    useState(0);

  const [paidAt, setPaidAt] =
    useState(null);

  // ---------------------------------------------
  // LIVE PENDING CALCULATION
  // ---------------------------------------------

  const originalPending =
    Number(service.pendingAmount) || 0;

  const enteredPayment =
    Number(amount) || 0;

  const enteredDiscount = applyDiscount
    ? Number(discountAmount) || 0
    : 0;

  const adjustedPending = Math.max(
    originalPending -
      enteredPayment -
      enteredDiscount,
    0
  );

  const totalReduction =
    enteredPayment + enteredDiscount;

  const exceedsPending =
    totalReduction > originalPending;

  // ---------------------------------------------
  // SUBMIT PAYMENT
  // ---------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

    const paymentAmount =
      Number(amount);

    const discount =
      Number(discountAmount);

    if (
      !paymentAmount ||
      paymentAmount <= 0
    ) {
      return setError(
        "Please enter a valid payment amount"
      );
    }

    if (
      paymentAmount >
      originalPending
    ) {
      return setError(
        "Payment cannot be greater than pending amount"
      );
    }

    if (!paidOnDate) {
      return setError(
        "Please select a payment date"
      );
    }

    if (applyDiscount) {
      if (
        !discount ||
        discount <= 0
      ) {
        return setError(
          "Please enter a valid discount amount"
        );
      }

      if (
        paymentAmount + discount >
        originalPending
      ) {
        return setError(
          "Payment and discount together cannot exceed pending amount"
        );
      }
    }

    setLoading(true);

    try {
      const { data } =
        await addPayment({
          serviceRecordId:
            service._id,

          amount:
            paymentAmount,

          mode,

          note,

          paidOn: paidOnDate,

          applyDiscount,

          discountAmount:
            applyDiscount
              ? discount
              : 0,

          discountReason:
            applyDiscount
              ? discountReason
              : "",
        });

      const updated =
        data.service || data;

      setUpdatedService(updated);

      setPaidAmount(
        paymentAmount
      );

      setPaidAt(
        new Date(paidOnDate)
      );

      setPaymentSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to record payment"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full bg-[#F6F2E9]/50 border border-black/[0.05] rounded-2xl px-4 py-3.5 text-[15px] font-medium text-[#1F2A22] placeholder:text-[#1F2A22]/30 focus:outline-none focus:ring-4 focus:ring-[#4C9A5A]/10 focus:border-[#4C9A5A]/50 transition-all";

  const labelClassName =
    "block text-[12px] font-bold text-[#1F2A22]/60 uppercase tracking-wider mb-1.5 ml-1";

  // ---------------------------------------------
  // SUCCESS SCREEN
  // ---------------------------------------------

  if (
    paymentSuccess &&
    updatedService
  ) {
    return (
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-[#4C9A5A]/20 p-6 text-center animate-in zoom-in-95 fade-in duration-300">
        <div className="mx-auto h-16 w-16 bg-[#E9F3E9] rounded-full flex items-center justify-center mb-4 border border-[#4C9A5A]/10 shadow-inner">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-[#4C9A5A]"
            fill="none"
          >
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-[#1F2A22] mb-1">
          Payment Recorded!
        </h2>

        <p className="text-[13px] font-medium text-[#1F2A22]/50 mb-5">
          The balance has been updated successfully.
        </p>

        <div className="bg-[#F6F2E9]/50 rounded-2xl p-4 mb-3 flex justify-between items-center text-left border border-black/[0.03]">
          <div>
            <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase tracking-wide mb-0.5">
              Received
            </p>

            <p className="font-black text-[18px] text-[#4C9A5A]">
              {formatCurrency(
                paidAmount
              )}
            </p>
          </div>

          <div className="w-px h-10 bg-black/5" />

          <div className="text-right">
            <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase tracking-wide mb-0.5">
              Pending
            </p>

            <p className="font-bold text-[16px] text-[#C24949]">
              {formatCurrency(
                updatedService.pendingAmount ||
                  0
              )}
            </p>
          </div>
        </div>

        {applyDiscount && (
          <div className="bg-[#FEF3C7]/50 rounded-2xl p-3 mb-3">
            <p className="text-[11px] font-bold text-[#D97706] uppercase tracking-wide">
              Discount Applied
            </p>

            <p className="font-black text-[17px] text-[#D97706]">
              {formatCurrency(
                Number(
                  discountAmount
                )
              )}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 justify-center mb-6">
          {paidAt && (
            <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2.5 py-1.5 rounded-md">
              {formatDate(
                paidAt
              )}
            </span>
          )}

          {service.village && (
            <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2.5 py-1.5 rounded-md">
              {service.village}
            </span>
          )}

          {mode && (
            <span className="text-[11px] font-semibold text-[#1F2A22]/60 bg-[#F6F2E9] px-2.5 py-1.5 rounded-md">
              {mode}
            </span>
          )}

          {user?.name && (
            <span className="text-[11px] font-semibold text-[#4C9A5A] bg-[#E9F3E9] px-2.5 py-1.5 rounded-md">
              Collected by{" "}
              {user.name}
              {user.role
                ? ` (${user.role})`
                : ""}
            </span>
          )}
        </div>

        <div className="mb-6">
          <p className="text-[12px] font-bold text-[#1F2A22]/60 uppercase tracking-wider mb-3">
            Notify{" "}
            {farmer?.fullName ||
              farmer?.name ||
              "Farmer"}
            ?
          </p>

          <SendMessageButtons
            mobile={farmer?.mobile}
            message={buildPaymentMessage(
              farmer || {},
              updatedService,
              paidAmount,
              applyDiscount
                ? Number(
                    discountAmount
                  )
                : 0
            )}
          />
        </div>

        <button
          type="button"
          onClick={() =>
            onSuccess(
              updatedService
            )
          }
          className="w-full py-3.5 bg-white border border-black/10 rounded-2xl text-[14px] font-bold text-[#1F2A22]"
        >
          Done, return to history
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] p-6 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-xl text-[#1F2A22]">
            Collect
          </h2>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold text-[#C24949]/70 uppercase tracking-widest">
            Current Pending
          </p>

          <p className="font-black text-[#C24949] text-lg">
            {formatCurrency(
              originalPending
            )}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClassName}>
            Amount (₹)
          </label>

          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
            max={originalPending}
            min="1"
            placeholder="0.00"
            required
            className={inputClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>
            Payment Date
          </label>

          <input
            type="date"
            value={paidOnDate}
            onChange={(e) =>
              setPaidOnDate(
                e.target.value
              )
            }
            max={getTodayLocal()}
            required
            className={inputClassName}
          />
        </div>

        {/* LIVE PENDING */}
        <div className="bg-[#F6F2E9] rounded-2xl p-4 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase">
              Current Pending
            </p>

            <p className="font-bold text-[#1F2A22]">
              {formatCurrency(
                originalPending
              )}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-bold text-[#C24949]/60 uppercase">
              Remaining
            </p>

            <p className="font-black text-[#C24949] text-lg">
              {formatCurrency(
                adjustedPending
              )}
            </p>
          </div>
        </div>

        <div>
          <label className={labelClassName}>
            Payment Mode
          </label>

          <select
            value={mode}
            onChange={(e) =>
              setMode(
                e.target.value
              )
            }
            className={inputClassName}
          >
            <option value="Cash">
              Cash
            </option>

            <option value="UPI">
              UPI / Online
            </option>

            <option value="Bank">
              Bank Transfer
            </option>
          </select>

          {/* UPI QR CODE */}
          {mode === "UPI" && (
            <div className="mt-3 bg-[#F6F2E9]/60 border border-black/[0.05] rounded-2xl p-4 flex flex-col items-center">
              <p className="text-[12px] font-bold text-[#1F2A22]/60 uppercase tracking-wider mb-3">
                Scan to Pay via UPI
              </p>

              <img
                src={UPI_QR_IMAGE}
                alt="UPI QR Code"
                className="w-44 h-44 object-contain rounded-xl border border-black/[0.06] bg-white p-2"
              />

              <p className="text-[11px] font-medium text-[#1F2A22]/40 mt-2 text-center">
                Ask the farmer to scan this code, then enter the paid amount above.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className={labelClassName}>
            Note (Optional)
          </label>

          <input
            value={note}
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
            placeholder="e.g. Paid by brother"
            className={inputClassName}
          />
        </div>

        {/* DISCOUNT */}
        <div className="border border-black/[0.05] rounded-2xl p-4">
          <label className={labelClassName}>
            Apply Discount?
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setApplyDiscount(false);
                setDiscountAmount("");
                setDiscountReason("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${
                !applyDiscount
                  ? "bg-[#1F3D2B] text-white"
                  : "bg-[#F6F2E9] text-[#1F2A22]/60"
              }`}
            >
              No
            </button>

            <button
              type="button"
              onClick={() =>
                setApplyDiscount(true)
              }
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${
                applyDiscount
                  ? "bg-[#D97706] text-white"
                  : "bg-[#F6F2E9] text-[#1F2A22]/60"
              }`}
            >
              Yes
            </button>
          </div>

          {applyDiscount && (
            <div className="space-y-3 mt-4">
              <div>
                <label
                  className={
                    labelClassName
                  }
                >
                  Discount Amount (₹)
                </label>

                <input
                  type="number"
                  inputMode="decimal"
                  value={
                    discountAmount
                  }
                  onChange={(e) =>
                    setDiscountAmount(
                      e.target.value
                    )
                  }
                  min="1"
                  placeholder="Enter discount"
                  required
                  className={
                    inputClassName
                  }
                />
              </div>

              <div>
                <label
                  className={
                    labelClassName
                  }
                >
                  Discount Reason
                  (Optional)
                </label>

                <input
                  value={
                    discountReason
                  }
                  onChange={(e) =>
                    setDiscountReason(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Regular customer"
                  className={
                    inputClassName
                  }
                />
              </div>

              {/* LIVE DISCOUNT RESULT */}
              <div className="bg-[#FEF3C7]/50 rounded-xl p-3 flex justify-between">
                <span className="text-xs font-bold text-[#D97706]">
                  Remaining after
                  payment + discount
                </span>

                <span className="font-black text-[#D97706]">
                  {formatCurrency(
                    adjustedPending
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {exceedsPending && (
        <div className="mt-4 p-3 bg-[#FCEDED] rounded-xl">
          <p className="text-[#C24949] text-sm font-semibold">
            Payment and discount
            together cannot exceed
            pending amount.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-[#FCEDED] rounded-xl">
          <p className="text-[#C24949] text-sm">
            {error}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-white border border-black/10 rounded-2xl py-3.5 font-bold"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            loading ||
            exceedsPending
          }
          className="flex-[1.5] text-white rounded-2xl py-3.5 font-bold disabled:opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(180deg, #4C9A5A 0%, #3B7A46 100%)",
          }}
        >
          {loading
            ? "Processing..."
            : "Record Payment"}
        </button>
      </div>
    </form>
  );
}