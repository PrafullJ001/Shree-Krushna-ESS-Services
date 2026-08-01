import React from "react";
import { useNavigate } from "react-router-dom";

export default function RecentServiceItem({ service }) {
  const navigate = useNavigate();

  // If the farmer was deleted directly in the DB, populate() returns
  // null here — skip rendering this orphaned record instead of showing
  // a broken "Unknown" row.
  if (!service.farmer) return null;

  const statusColor = {
    Paid: "text-[#4C9A5A] bg-[#E9F3E9] border-[#4C9A5A]/20",
    "Partially Paid": "text-[#D97706] bg-[#FFFBEB] border-[#D97706]/20",
    Unpaid: "text-[#C24949] bg-[#FCEDED] border-[#C24949]/20",
  };

  const date = new Date(service.serviceDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  const farmerName = service.farmer.fullName;

  const initials = farmerName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={() => navigate(`/services/${service._id}`)}
      className="w-full text-left bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] p-4 flex items-center justify-between active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-[#F6F2E9] flex items-center justify-center border border-[#1F3D2B]/5 shrink-0 text-[#1F3D2B]/60 font-bold text-sm">
          {initials}
        </div>

        <div>
          <p className="text-[15px] font-bold text-[#1F2A22] leading-tight mb-1">
            {farmerName}
          </p>
          <p className="text-[12px] font-medium text-[#1F2A22]/50 flex items-center gap-1.5">
            <span className="truncate max-w-[70px]">{service.village}</span>
            <span className="w-1 h-1 rounded-full bg-[#1F2A22]/20"></span>
            <span className="truncate max-w-[70px]">{service.cropName}</span>
            <span className="w-1 h-1 rounded-full bg-[#1F2A22]/20"></span>
            <span>{date}</span>
            {service.acres != null && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#1F2A22]/20"></span>
                <span>{service.acres} ac</span>
              </>
            )}
          </p>
          {service.billNo ? (
            <p className="text-[11px] font-semibold text-[#1F2A22]/40 mt-1">
              Bill:  {service.billNo}
            </p>
          ) : (
            <p className="text-[11px] font-semibold text-[#C24949] mt-1">
              No Bill.
            </p>
          )}
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-1.5">
        <p className="text-[15px] font-bold text-[#1F2A22] leading-tight">₹{service.totalBill}</p>
        <span
          className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
            statusColor[service.paymentStatus] || "text-gray-500 bg-gray-50 border-gray-200"
          }`}
        >
          {service.paymentStatus}
        </span>
      </div>
    </button>
  );
}