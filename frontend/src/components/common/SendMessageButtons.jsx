export default function SendMessageButtons({ mobile, message }) {
  const sendWhatsApp = () => {
    if (!mobile) return;

    const phone = `91${mobile}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  const sendSMS = () => {
    if (!mobile) return;

    const url = `sms:${mobile}?body=${encodeURIComponent(message)}`;

    window.location.href = url;
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={sendWhatsApp}
        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        WhatsApp
      </button>

      <button
        type="button"
        onClick={sendSMS}
        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        SMS
      </button>
    </div>
  );
}