export default function EmptyState({ icon, title, subtitle, action }) {
  // Modern default clipboard SVG replacing the emoji
  const displayIcon = icon || (
    <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-90" fill="none">
      <rect x="8" y="4" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14h6M9 18h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      
      {/* Elevated Icon Container */}
      <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mb-5 border border-black/[0.04] shadow-sm text-[#4C9A5A]">
        {typeof displayIcon === "string" ? (
          <span className="text-3xl">{displayIcon}</span>
        ) : (
          displayIcon
        )}
      </div>

      {/* Typography */}
      <p className="text-[17px] font-bold text-[#1F2A22] tracking-tight mb-1.5">
        {title}
      </p>
      
      {subtitle && (
        <p className="text-[13px] font-medium text-[#1F2A22]/50 max-w-[260px] leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Action Button Wrapper */}
      {action && (
        <div className="mt-8 w-full max-w-[220px]">
          {action}
        </div>
      )}
      
    </div>
  );
}