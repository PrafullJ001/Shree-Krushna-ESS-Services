import { useState } from "react";
import { buildReminderMessage } from "../../utils/messageTemplates";
import SendMessageButtons from "../common/SendMessageButtons";

export default function ReminderButton({ farmer, totals }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full mt-2 bg-[#E9F3E9]/60 hover:bg-[#E9F3E9] border border-[#4C9A5A]/20 text-[#2B5439] rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-1.5"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Send Payment Reminder
      </button>

      {open && (
        <div className="mt-3 bg-[#F6F2E9]/60 rounded-xl p-3.5">
          <SendMessageButtons mobile={farmer.mobile} message={buildReminderMessage(farmer, totals)} />
        </div>
      )}
    </div>
  );
}