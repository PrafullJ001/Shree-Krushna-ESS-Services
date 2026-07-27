import {
  useState,
} from "react";

import {
  getPaymentsForService,
} from "../../api/paymentApi";

import {
  formatCurrency,
} from "../../utils/formatCurrency";

import {
  formatDate,
} from "../../utils/formatDate";

export default function PaymentHistoryList({
  serviceId,
}) {
  const [expanded, setExpanded] =
    useState(false);

  const [payments, setPayments] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const handleToggle = async () => {
    if (
      !expanded &&
      payments === null
    ) {
      setLoading(true);

      try {
        const { data } =
          await getPaymentsForService(
            serviceId
          );

        setPayments(data);
      } catch {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    setExpanded((v) => !v);
  };

  return (
    <div className="mt-3 pt-3 border-t border-black/5">
      <button
        type="button"
        onClick={handleToggle}
        className="text-[12px] font-bold text-[#1F3D2B]/60 hover:text-[#1F3D2B] transition-colors uppercase tracking-wide flex items-center gap-1"
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform ${
            expanded
              ? "rotate-180"
              : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>

        Payment History
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {loading && (
            <p className="text-[12px] text-[#1F2A22]/40">
              Loading...
            </p>
          )}

          {!loading &&
            payments?.length === 0 && (
              <p className="text-[12px] text-[#1F2A22]/40">
                No payments recorded yet
              </p>
            )}

          {!loading &&
            payments?.map((p) => (
              <div
                key={p._id}
                className="bg-[#F6F2E9]/60 rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <p
                    className={`text-[13px] font-bold ${
                      p.type === "Discount"
                        ? "text-[#D97706]"
                        : "text-[#4C9A5A]"
                    }`}
                  >
                    {p.type === "Discount"
                      ? "Discount: "
                      : ""}

                    {formatCurrency(
                      p.amount
                    )}
                  </p>

                  <p className="text-[11px] text-[#1F2A22]/50 mt-0.5">
                    {formatDate(p.paidOn)}

                    {p.type ===
                    "Discount" ? (
                      <> • Discount</>
                    ) : (
                      <>
                        {" "}
                        • {p.mode}
                        {p.receivedBy?.name
                          ? ` • Collected by ${p.receivedBy.name}`
                          : ""}
                      </>
                    )}
                  </p>

                  {p.note && (
                    <p className="text-[11px] text-[#1F2A22]/40 mt-0.5 italic">
                      {p.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}