export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-10 h-10 mb-4">
        {/* Soft background track */}
        <div className="absolute inset-0 border-4 border-[#4C9A5A]/10 rounded-full"></div>
        
        {/* Active spinning indicator */}
        <div className="absolute inset-0 border-4 border-transparent border-t-[#4C9A5A] rounded-full animate-spin"></div>
      </div>
      
      {/* Modern, subtle loading text */}
      <p className="text-[12px] font-bold text-[#1F2A22]/40 tracking-widest uppercase animate-pulse">
        {label}
      </p>
    </div>
  );
}