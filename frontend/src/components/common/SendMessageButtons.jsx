// export default function SendMessageButtons({ mobile, message }) {
//   const sendWhatsApp = () => {
//     if (!mobile) return;

//     const phone = `91${mobile}`;

//     const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

//     window.open(url, "_blank");
//   };

//   const sendSMS = () => {
//     if (!mobile) return;

//     const url = `sms:${mobile}?body=${encodeURIComponent(message)}`;

//     window.location.href = url;
//   };

//   return (
//     <div className="flex gap-2">
//       <button
//         type="button"
//         onClick={sendWhatsApp}
//         className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg"
//       >
//         WhatsApp
//       </button>

//       <button
//         type="button"
//         onClick={sendSMS}
//         className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg"
//       >
//         SMS
//       </button>
//     </div>
//   );
// }



import { useState } from "react";
import { MessageCircle, Briefcase, Send, X } from "lucide-react";

const isAndroid = () => /Android/i.test(navigator.userAgent);

export default function SendMessageButtons({ mobile, message }) {
  const [showOptions, setShowOptions] = useState(false);
  const cleanMobile = mobile?.replace(/\D/g, "");
  const withCountryCode = cleanMobile?.length === 10 ? `91${cleanMobile}` : cleanMobile;

  if (!mobile) return null;

  const encodedText = encodeURIComponent(message);

  // Standard universal link — opens whatever WhatsApp variant is set as default.
  // Works everywhere (Android, iOS, desktop) as the reliable fallback.
  const waMeUrl = `https://wa.me/${withCountryCode}?text=${encodedText}`;

  // Android-only: intent links can target a specific installed app by package name,
  // letting us force either regular WhatsApp or WhatsApp Business specifically.
  const androidRegularIntent = `intent://send?phone=${withCountryCode}&text=${encodedText}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
  const androidBusinessIntent = `intent://send?phone=${withCountryCode}&text=${encodedText}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`;

  const smsUrl = `sms:${cleanMobile}?body=${encodedText}`;

  const openRegularWhatsApp = () => {
    window.location.href = isAndroid() ? androidRegularIntent : waMeUrl;
    setShowOptions(false);
  };

  const openBusinessWhatsApp = () => {
    if (isAndroid()) {
      window.location.href = androidBusinessIntent;
    } else {
      // iOS/desktop can't distinguish — same link opens whichever is installed
      window.location.href = waMeUrl;
    }
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white text-sm py-2.5 rounded-xl font-medium shadow-sm hover:bg-green-700 active:scale-[0.98] transition-all"
        >
          <MessageCircle size={16} strokeWidth={2.25} />
          WhatsApp
        </button>

        <a
          href={smsUrl}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white text-sm py-2.5 rounded-xl font-medium shadow-sm hover:bg-blue-800 active:scale-[0.98] transition-all"
        >
          <Send size={15} strokeWidth={2.25} />
          SMS
        </a>
      </div>

      {showOptions && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-10"
            onClick={() => setShowOptions(false)}
          />

          {/* modern centered sheet */}
          <div className="absolute left-0 right-0 top-full mt-3 z-20 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-2 pt-1 pb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Choose account
              </span>
              <button
                type="button"
                onClick={() => setShowOptions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={openRegularWhatsApp}
                className="flex flex-col items-center gap-2 rounded-xl py-3 px-2 bg-gray-50 hover:bg-green-50 active:scale-[0.97] transition-all"
              >
                <span className="h-10 w-10 flex items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                  <MessageCircle size={18} strokeWidth={2.25} />
                </span>
                <span className="text-xs font-medium text-gray-700">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={openBusinessWhatsApp}
                className="flex flex-col items-center gap-2 rounded-xl py-3 px-2 bg-gray-50 hover:bg-emerald-50 active:scale-[0.97] transition-all"
              >
                <span className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm">
                  <Briefcase size={18} strokeWidth={2.25} />
                </span>
                <span className="text-xs font-medium text-gray-700">Business</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}