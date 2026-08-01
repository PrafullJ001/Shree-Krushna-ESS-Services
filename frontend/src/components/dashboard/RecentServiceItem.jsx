import React from "react";
import { useNavigate } from "react-router-dom";

export default function RecentServiceItem({ service, disableNavigation = false }) {
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

  const Wrapper = disableNavigation ? "div" : "button";

  return (
    <Wrapper
      {...(!disableNavigation && {
        onClick: () => navigate(`/services/${service._id}`),
      })}
      className={`w-full text-left bg-white rounded-2xl border border-black/[0.06] p-3.5 flex items-center justify-between gap-3 transition-all ${
        disableNavigation ? "" : "active:scale-[0.97] active:bg-black/[0.015]"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E9F3E9] to-[#F6F2E9] flex items-center justify-center border border-[#4C9A5A]/15 shrink-0 text-[#2B5439] font-bold text-[13px]">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="text-[14px] font-bold text-[#1F2A22] leading-snug mb-0.5 truncate">
            {farmerName}
          </p>
          <p className="text-[11px] font-medium text-[#1F2A22]/45 flex items-center gap-1.5 flex-wrap">
            <span className="truncate max-w-[64px]">{service.village}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-[#1F2A22]/25 shrink-0"></span>
            <span className="truncate max-w-[64px]">{service.cropName}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-[#1F2A22]/25 shrink-0"></span>
            <span className="shrink-0">{date}</span>
            {service.acres != null && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-[#1F2A22]/25 shrink-0"></span>
                <span className="shrink-0">{service.acres} ac</span>
              </>
            )}
          </p>
          {service.billNo ? (
            <p className="text-[10px] font-semibold text-[#1F2A22]/35 mt-0.5">
              Bill: {service.billNo}
            </p>
          ) : (
            <p className="text-[10px] font-semibold text-[#C24949]/80 mt-0.5">
              No Bill
            </p>
          )}
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-1 shrink-0">
        <p className="text-[14px] font-bold text-[#1F2A22] leading-snug">₹{service.totalBill}</p>
        <span
          className={`text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full border ${
            statusColor[service.paymentStatus] || "text-gray-500 bg-gray-50 border-gray-200"
          }`}
        >
          {service.paymentStatus}
        </span>
      </div>
    </Wrapper>
  );
}