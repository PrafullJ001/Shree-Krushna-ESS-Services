export default function StatsCard({ label, value, accent = "green", icon, variant = "soft" }) {
  const tones = {
    green: {
      solidBg: "linear-gradient(135deg, #4C9A5A 0%, #2B5439 100%)",
      badgeBg: "#E9F3E9",
      iconColor: "#2B5439",
      valueColor: "text-[#1F3D2B]",
    },
    blue: {
      solidBg: "linear-gradient(135deg, #4A8FC2 0%, #2E5F87 100%)",
      badgeBg: "#E8F1F8",
      iconColor: "#2E5F87",
      valueColor: "text-[#1F2A22]",
    },
    orange: {
      solidBg: "linear-gradient(135deg, #E8A33D 0%, #C97F1F 100%)",
      badgeBg: "#FBF0DD",
      iconColor: "#B8791C",
      valueColor: "text-[#1F2A22]",
    },
    red: {
      solidBg: "linear-gradient(135deg, #D96A6A 0%, #B14545 100%)",
      badgeBg: "#FCEDED",
      iconColor: "#C24949",
      valueColor: "text-[#1F2A22]",
    },
  };
  const t = tones[accent] || tones.green;

  // Shrink the value's font size as it gets longer, so amounts up to
  // ₹1,00,00,000 (and beyond) still fit inside the box on mobile instead
  // of overflowing or wrapping awkwardly.
  const valueLength = String(value).length;
  const valueSizeClass =
    valueLength > 10 ? "text-base" : valueLength > 7 ? "text-lg" : "text-2xl";

  if (variant === "solid") {
    return (
      <div
        className="rounded-2xl p-4 shadow-md relative overflow-hidden"
        style={{ backgroundImage: t.solidBg }}
      >
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)",
          }}
        />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs text-white/75 font-medium">{label}</p>
            <p className={`${valueSizeClass} font-bold text-white mt-1.5 break-words leading-tight`}>{value}</p>
          </div>
          {icon && (
            <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
      <div className="flex items-center justify-between mb-2.5">
        {icon && (
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: t.badgeBg, color: t.iconColor }}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-xs text-[#8A9A8E] font-medium">{label}</p>
      <p className={`${valueSizeClass} font-bold mt-1 ${t.valueColor} break-words leading-tight`}>{value}</p>
    </div>
  );
}
