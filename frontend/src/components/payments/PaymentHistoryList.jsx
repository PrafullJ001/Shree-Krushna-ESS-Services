import { useState, useEffect } from "react";
import { getPaymentsForService, deletePayment } from "../../api/paymentApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import PaymentEditForm from "./PaymentEditForm";
import MathCaptchaModal from "../common/MathCaptchaModal";
import { useAuth } from "../../hooks/useAuth";

export default function PaymentHistoryList({ serviceId, onChanged }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collapsed by default — history only shows after the arrow is clicked.
  const [expanded, setExpanded] = useState(false);

  const fetchPayments = () => {
    setLoading(true);
    getPaymentsForService(serviceId)
      .then(({ data }) => setPayments(data))
      .catch(() => setError("Failed to load payment history"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  // Bulk payment and settle-all create payments for this service without
  // reloading the page, so listen for their completion event and refetch.
  useEffect(() => {
    const handlePaymentsUpdated = () => fetchPayments();
    window.addEventListener("payments-updated", handlePaymentsUpdated);
    return () => window.removeEventListener("payments-updated", handlePaymentsUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const handleDeleteConfirmed = async () => {
    setDeleteLoading(true);
    try {
      await deletePayment(deletingPayment._id);
      // Force a full page refresh so Paid/Pending/Bill Total always
      // match the database, same as a manual refresh would show.
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
      setDeletingPayment(null);
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <p className="text-[12px] text-[#1F2A22]/40 mt-3">Loading payment history...</p>;
  }

  if (payments.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-black/5 space-y-2">
      {/* Toggle header — click arrow to show/hide history, hidden by default */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between text-[11px] font-bold text-[#1F2A22]/40 uppercase tracking-wide mb-1"
      >
        <span>
          Payment History
          <span className="ml-1.5 text-[#1F2A22]/30">({payments.length})</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {error && <p className="text-[#C24949] text-[13px] font-medium mb-2">{error}</p>}

      {expanded &&
        payments.map((p) =>
          editingPayment?._id === p._id ? (
            <PaymentEditForm
              key={p._id}
              payment={p}
              onCancel={() => setEditingPayment(null)}
              onSuccess={() => {
                // Force a full page refresh so Paid/Pending/Bill Total always
                // match the database, same as a manual refresh would show.
                window.location.reload();
              }}
            />
          ) : (
            <div
              key={p._id}
              className="flex flex-col bg-[#F6F2E9]/50 rounded-xl px-3.5 py-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-[#1F2A22]">
                    {p.type === "Discount" ? "Discount" : "Payment"}: {formatCurrency(p.amount)}
                    {p.mode && p.type !== "Discount" ? ` · ${p.mode}` : ""}
                    {p.editHistory?.length > 0 && (
                      <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] rounded px-1.5 py-0.5 align-middle">
                        Edited
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-[#1F2A22]/50">
                    {formatDate(p.paidOn || p.createdAt)}
                    {p.receivedBy?.name ? ` · ${p.receivedBy.name}` : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex gap-3 shrink-0 ml-3">
                    {p.type !== "Discount" && (
                      <button
                        type="button"
                        onClick={() => setEditingPayment(p)}
                        className="text-[11px] font-bold text-[#1F3D2B]/60 hover:text-[#1F3D2B] uppercase tracking-wide"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingPayment(p)}
                      className="text-[11px] font-bold text-[#C24949]/70 hover:text-[#C24949] uppercase tracking-wide"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Edit log — shows every prior version of this payment */}
              {p.editHistory?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-black/[0.05] space-y-1">
                  {p.editHistory.map((h, i) => (
                    <p key={i} className="text-[10px] text-[#1F2A22]/40">
                      Edited {formatDate(h.editedAt)} — was {formatCurrency(h.previousAmount)}
                      {h.previousMode ? ` · ${h.previousMode}` : ""}
                      {h.previousNote ? ` · "${h.previousNote}"` : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )
        )}

      {deletingPayment && (
        <MathCaptchaModal
          title={`Delete this ${deletingPayment.type === "Discount" ? "discount" : "payment"}?`}
          message={`This will remove ${formatCurrency(deletingPayment.amount)} and update the bill's pending amount. This cannot be undone.`}
          onCancel={() => setDeletingPayment(null)}
          onConfirm={handleDeleteConfirmed}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}