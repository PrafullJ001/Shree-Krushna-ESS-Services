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
import { MessageCircle, Briefcase, Send } from "lucide-react";

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
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="flex-1 bg-green-600 text-white text-sm text-center py-2 rounded-lg font-medium"
        >
          Send via WhatsApp
        </button>

        <a
          href={smsUrl}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white text-sm py-2 rounded-lg font-medium shadow-sm hover:bg-blue-800 active:scale-[0.98] transition-all"
        >
          <Send size={15} strokeWidth={2.25} />
          Send via SMS
        </a>
      </div>

      {showOptions && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            type="button"
            onClick={openRegularWhatsApp}
            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2"
          >
            <MessageCircle size={16} strokeWidth={2.25} className="text-green-500" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={openBusinessWhatsApp}
            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Briefcase size={16} strokeWidth={2.25} className="text-emerald-700" />
            WhatsApp Business
          </button>
        </div>
      )}
    </div>
  );
}