import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const baseNavItems = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: "/farmers",
    label: "Farmers",
    adminOnly: true, // staff never sees this tab
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: "/add-service",
    label: "Add",
    isAction: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    to: "/payments",
    label: "Payments",
    adminOnly: true, // staff never sees this tab
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navItems = baseNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#1F3D2B]/10 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around items-center h-16 px-2 relative">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              item.isAction
                ? `relative -top-5 flex flex-col items-center justify-center`
                : `flex flex-col items-center justify-center flex-1 h-full w-full gap-1 transition-all duration-200 ${
                    isActive
                      ? "text-[#4C9A5A]"
                      : "text-[#1F2A22]/40 hover:text-[#1F2A22]/70"
                  }`
            }
          >
            {({ isActive }) =>
              item.isAction ? (
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center h-[52px] w-[52px] rounded-full shadow-lg border-4 border-[#F6F2E9] transition-transform active:scale-95 ${
                      isActive ? "bg-[#2B5439] text-white" : "bg-[#4C9A5A] text-white"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${isActive ? "text-[#2B5439]" : "text-[#1F2A22]/40"}`}>
                    {item.label}
                  </span>
                </div>
              ) : (
                <>
                  <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] tracking-wide transition-all ${isActive ? "font-bold" : "font-medium"}`}>
                    {item.label}
                  </span>
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
