import { useState, useMemo } from "react";

export default function MathCaptchaModal({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = "Confirm Delete",
  loadingLabel = "Deleting...",
}) {
  const [a, b] = useMemo(() => [
    Math.floor(Math.random() * 8) + 1,
    Math.floor(Math.random() * 8) + 1,
  ], []);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(null);

  const handleConfirm = () => {
    if (Number(answer) !== a + b) {
      setError("That's not correct — try again");
      return;
    }
    setError(null);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[1.5rem] shadow-lg p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <h3 className="font-bold text-lg text-[#1F2A22] mb-1">{title}</h3>
        <p className="text-sm text-[#1F2A22]/60 mb-4">{message}</p>

        <label className="block text-[12px] font-bold text-[#1F2A22]/60 uppercase tracking-wider mb-1.5">
          What is {a} + {b}?
        </label>
        <input
          type="number"
          inputMode="numeric"
          autoComplete="off"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full bg-[#F6F2E9]/50 border border-black/[0.05] rounded-2xl px-4 py-3 text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-[#4C9A5A]/10 focus:border-[#4C9A5A]/50"
          autoFocus
        />

        {error && <p className="text-[#C24949] text-[13px] font-medium mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-white border border-black/10 text-[#1F2A22] rounded-2xl py-3 font-bold text-[14px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !answer}
            className="flex-[1.5] bg-[#C24949] text-white rounded-2xl py-3 font-bold text-[14px] disabled:opacity-50"
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}