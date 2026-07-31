import { formatCurrency } from "./formatCurrency";
import { formatDate } from "./formatDate";
import { BUSINESS_NAME } from "../constants/business";

const statusLine = (paid, pending) => {
  if (pending <= 0) return "पूर्ण भरणा झाला आहे ✅";
  if (paid > 0) return "अंशतः भरणा झाला आहे";
  return "भरणा बाकी आहे";
};

export const buildServiceMessage = (farmer, service) => {
  const paid = Number(service.amountPaid || 0);
  const pending = Number(service.pendingAmount || 0);

  return `नमस्कार, प्रिय शेतकरी ${farmer.fullName} 🙏

आपली फवारणी सेवा यशस्वीरित्या पूर्ण झाली आहे. ✅

पीक: ${service.cropName || "-"}
क्षेत्र (एकर): ${service.acres || "-"}
तारीख: ${formatDate(service.serviceDate)}
एकूण बिल: ${formatCurrency(service.totalBill)}
जमा रक्कम: ${formatCurrency(paid)}
शिल्लक रक्कम: ${formatCurrency(pending)}
स्थिती: ${statusLine(paid, pending)}

आधुनिक तंत्रज्ञान आधुनिक शेती.
धन्यवाद!
${BUSINESS_NAME}`;
};

export const buildPaymentMessage = (farmer, service, paymentAmount, discountAmount = 0) => {
  const paid = Number(service.amountPaid || 0);
  const pending = Number(service.pendingAmount || 0);

  return `नमस्कार, प्रिय शेतकरी ${farmer.fullName} 🙏

आपले पेमेंट यशस्वीरित्या स्वीकारले गेले आहे ✅

मिळालेली रक्कम: ${formatCurrency(paymentAmount)}
${discountAmount > 0 ? `सवलत: ${formatCurrency(discountAmount)}\n` : ""}एकूण बिल: ${formatCurrency(service.totalBill)}
जमा रक्कम: ${formatCurrency(paid)}
शिल्लक रक्कम: ${formatCurrency(pending)}
स्थिती: ${statusLine(paid, pending)}

आधुनिक तंत्रज्ञान आधुनिक शेती.
धन्यवाद!
${BUSINESS_NAME}`;
};

export const buildReminderMessage = (farmer, totals) => {
  const { totalBill, totalCollected, totalPending } = totals;

  return `नमस्कार, प्रिय शेतकरी ${farmer.fullName} 🙏

ही आपल्या खात्याच्या स्थितीबद्दल आठवण आहे.

एकूण बिल: ${formatCurrency(totalBill)}
भरलेली रक्कम: ${formatCurrency(totalCollected)}
शिल्लक रक्कम: ${formatCurrency(totalPending)}

${totalPending > 0 ? "कृपया लवकरात लवकर शिल्लक रक्कम भरावी." : "आपले खाते पूर्णपणे भरले आहे ✅"}

आधुनिक तंत्रज्ञान आधुनिक शेती.
धन्यवाद!
${BUSINESS_NAME}`;
};

export const buildBulkPaymentMessage = (farmer, paymentAmount, totals) => {
  const { totalBill, totalCollected, totalPending } = totals;

  return `नमस्कार, प्रिय शेतकरी ${farmer.fullName} 🙏

आपले पेमेंट यशस्वीरित्या स्वीकारले गेले आहे ✅

मिळालेली रक्कम: ${formatCurrency(paymentAmount)}
एकूण बिल: ${formatCurrency(totalBill)}
भरलेली रक्कम: ${formatCurrency(totalCollected)}
शिल्लक रक्कम: ${formatCurrency(totalPending)}
स्थिती: ${totalPending > 0 ? "अंशतः भरणा झाला आहे" : "पूर्ण भरणा झाला आहे ✅"}

आधुनिक तंत्रज्ञान आधुनिक शेती.
धन्यवाद!
${BUSINESS_NAME}`;
};

export const buildSettleAllMessage = (farmer, totals) => {
  const { totalBill, totalCollected } = totals;

  return `नमस्कार, प्रिय शेतकरी ${farmer.fullName} 🙏

आपले खाते पूर्णपणे सेटल झाले आहे ✅

एकूण बिल: ${formatCurrency(totalBill)}
भरलेली रक्कम: ${formatCurrency(totalCollected)}
शिल्लक रक्कम: ${formatCurrency(0)}

आधुनिक तंत्रज्ञान आधुनिक शेती.
धन्यवाद!
${BUSINESS_NAME}`;
};