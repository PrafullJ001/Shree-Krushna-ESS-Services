import { formatCurrency } from "./formatCurrency";
import { formatDate } from "./formatDate";
import { BUSINESS_NAME } from "../constants/business";

const statusLine = (paid, pending) => {
  if (pending <= 0) return "Fully Paid ✅";
  if (paid > 0) return "Partially Paid ⚠️";
  return "Unpaid ❌";
};

export const buildServiceMessage = (farmer, service) => {
  const paid = Number(service.amountPaid || 0);
  const pending = Number(service.pendingAmount || 0);

  return `Namaste ${farmer.fullName},

Spraying service completed successfully.
Crop: ${service.cropName || "-"}
Acres: ${service.acres || "-"}
Date: ${formatDate(service.serviceDate)}
Total Bill: ${formatCurrency(service.totalBill)}
Total Amount Paid: ${formatCurrency(paid)}
Remaining Pending: ${formatCurrency(pending)}
Payment Status: ${statusLine(paid, pending)}

Thank you!
${BUSINESS_NAME}`;
};

export const buildPaymentMessage = (farmer, service, paymentAmount, discountAmount = 0) => {
  const paid = Number(service.amountPaid || 0);
  const pending = Number(service.pendingAmount || 0);

  return `Namaste ${farmer.fullName},

Payment received successfully.
Payment Received: ${formatCurrency(paymentAmount)}
${discountAmount > 0 ? `Discount Applied: ${formatCurrency(discountAmount)}\n` : ""}Total Bill: ${formatCurrency(service.totalBill)}
Total Amount Paid: ${formatCurrency(paid)}
Remaining Pending: ${formatCurrency(pending)}
Payment Status: ${statusLine(paid, pending)}

Thank you!
${BUSINESS_NAME}`;
};

export const buildReminderMessage = (farmer, totals) => {
  const { totalBill, totalCollected, totalPending } = totals;

  return `Namaste ${farmer.fullName},

This is a reminder of your account summary with us:
Total Billed: ${formatCurrency(totalBill)}
Total Paid: ${formatCurrency(totalCollected)}
Pending Amount: ${formatCurrency(totalPending)}

${totalPending > 0 ? "Kindly clear the pending amount at your earliest convenience." : "Your account is fully settled. Thank you!"}

${BUSINESS_NAME}`;
};

export const buildBulkPaymentMessage = (farmer, paymentAmount, totals) => {
  const { totalBill, totalCollected, totalPending } = totals;

  return `Namaste ${farmer.fullName},

Payment received successfully.
Payment Received: ${formatCurrency(paymentAmount)}
Total Billed: ${formatCurrency(totalBill)}
Total Paid: ${formatCurrency(totalCollected)}
Remaining Pending: ${formatCurrency(totalPending)}
Payment Status: ${totalPending > 0 ? "Partially Paid ⚠️" : "Fully Paid ✅"}

Thank you!
${BUSINESS_NAME}`;
};

export const buildSettleAllMessage = (farmer, totals) => {
  const { totalBill, totalCollected } = totals;

  return `Namaste ${farmer.fullName},

Your account has been fully settled.
Total Billed: ${formatCurrency(totalBill)}
Total Paid: ${formatCurrency(totalCollected)}
Remaining Pending: ${formatCurrency(0)}
Payment Status: Fully Paid ✅

Thank you!
${BUSINESS_NAME}`;
};