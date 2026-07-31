import { formatCurrency } from "./formatCurrency";
import { formatDate } from "./formatDate";
import { BUSINESS_NAME } from "../constants/business";

const statusLine = (paid, pending) => {
  if (pending <= 0) return "पूर्ण पेमेंट झाले ✅";
  if (paid > 0) return "अंशतः पेमेंट झाले ⚠️";
  return "पेमेंट बाकी आहे ❌";
};

export const buildServiceMessage = (farmer, service) => {
  const paid = Number(service.amountPaid || 0);
  const pending = Number(service.pendingAmount || 0);

  return `नमस्कार प्रिय शेतकरी ${farmer.fullName} जी 🙏,

🌾 फवारणी सेवा यशस्वीरित्या पूर्ण झाली आहे.
🌱 पीक: ${service.cropName || "-"}
📏 क्षेत्र (एकर): ${service.acres || "-"}
📅 तारीख: ${formatDate(service.serviceDate)}
💰 एकूण बिल: ${formatCurrency(service.totalBill)}
✅ एकूण जमा रक्कम: ${formatCurrency(paid)}
⏳ शिल्लक रक्कम: ${formatCurrency(pending)}
📊 पेमेंट स्थिती: ${statusLine(paid, pending)}

धन्यवाद! 🙏
${BUSINESS_NAME}`;
};

export const buildPaymentMessage = (farmer, service, paymentAmount, discountAmount = 0) => {
  const paid = Number(service.amountPaid || 0);
  const pending = Number(service.pendingAmount || 0);

  return `नमस्कार प्रिय शेतकरी ${farmer.fullName} जी 🙏,

💵 पेमेंट यशस्वीरित्या मिळाले आहे.
💵 मिळालेली रक्कम: ${formatCurrency(paymentAmount)}
${discountAmount > 0 ? `🎁 सवलत लागू: ${formatCurrency(discountAmount)}\n` : ""}💰 एकूण बिल: ${formatCurrency(service.totalBill)}
✅ एकूण जमा रक्कम: ${formatCurrency(paid)}
⏳ शिल्लक रक्कम: ${formatCurrency(pending)}
📊 पेमेंट स्थिती: ${statusLine(paid, pending)}

धन्यवाद! 🙏
${BUSINESS_NAME}`;
};

export const buildReminderMessage = (farmer, totals) => {
  const { totalBill, totalCollected, totalPending } = totals;

  return `नमस्कार प्रिय शेतकरी ${farmer.fullName} जी 🙏,

🔔 ही तुमच्या खात्याच्या स्थितीबद्दल आठवण आहे:
💰 एकूण बिल: ${formatCurrency(totalBill)}
✅ एकूण भरलेली रक्कम: ${formatCurrency(totalCollected)}
⏳ शिल्लक रक्कम: ${formatCurrency(totalPending)}

${totalPending > 0 ? "🙏 कृपया लवकरात लवकर शिल्लक रक्कम भरावी." : "🎉 तुमचे खाते पूर्णपणे पूर्ण झाले आहे. धन्यवाद!"}

${BUSINESS_NAME}`;
};

export const buildBulkPaymentMessage = (farmer, paymentAmount, totals) => {
  const { totalBill, totalCollected, totalPending } = totals;

  return `नमस्कार प्रिय शेतकरी ${farmer.fullName} जी 🙏,

💵 पेमेंट यशस्वीरित्या मिळाले आहे.
💵 मिळालेली रक्कम: ${formatCurrency(paymentAmount)}
💰 एकूण बिल: ${formatCurrency(totalBill)}
✅ एकूण भरलेली रक्कम: ${formatCurrency(totalCollected)}
⏳ शिल्लक रक्कम: ${formatCurrency(totalPending)}
📊 पेमेंट स्थिती: ${totalPending > 0 ? "अंशतः पेमेंट झाले ⚠️" : "पूर्ण पेमेंट झाले ✅"}

धन्यवाद! 🙏
${BUSINESS_NAME}`;
};

export const buildSettleAllMessage = (farmer, totals) => {
  const { totalBill, totalCollected } = totals;

  return `नमस्कार प्रिय शेतकरी ${farmer.fullName} जी 🙏,

🎉 तुमचे खाते पूर्णपणे सेटल झाले आहे.
💰 एकूण बिल: ${formatCurrency(totalBill)}
✅ एकूण भरलेली रक्कम: ${formatCurrency(totalCollected)}
⏳ शिल्लक रक्कम: ${formatCurrency(0)}
📊 पेमेंट स्थिती: पूर्ण पेमेंट झाले ✅

धन्यवाद! 🙏
${BUSINESS_NAME}`;
};