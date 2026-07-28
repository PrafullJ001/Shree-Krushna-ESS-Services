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

  const handleDeleteConfirmed = async () => {
    setDeleteLoading(true);
    try {
      await deletePayment(deletingPayment._id);
      setDeletingPayment(null);
      fetchPayments();
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
      setDeletingPayment(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <p className="text-[12px] text-[#1F2A22]/40 mt-3">Loading payment history...</p>;
  }

  if (payments.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-black/5 space-y-2">
      <p className="text-[11px] font-bold text-[#1F2A22]/40 uppercase tracking-wide mb-2">
        Payment History
      </p>

      {error && <p className="text-[#C24949] text-[13px] font-medium mb-2">{error}</p>}

      {payments.map((p) =>
        editingPayment?._id === p._id ? (
          <PaymentEditForm
            key={p._id}
            payment={p}
            onCancel={() => setEditingPayment(null)}
            onSuccess={() => {
              setEditingPayment(null);
              fetchPayments();
              if (onChanged) onChanged();
            }}
          />
        ) : (
          <div
            key={p._id}
            className="flex items-center justify-between bg-[#F6F2E9]/50 rounded-xl px-3.5 py-2.5"
          >
            <div>
              <p className="text-[13px] font-bold text-[#1F2A22]">
                {p.type === "Discount" ? "Discount" : "Payment"}: {formatCurrency(p.amount)}
                {p.mode && p.type !== "Discount" ? ` · ${p.mode}` : ""}
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
