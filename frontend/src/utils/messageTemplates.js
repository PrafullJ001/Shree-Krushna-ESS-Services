import { formatCurrency } from "./formatCurrency";
import { formatDate } from "./formatDate";

export const buildServiceMessage = (farmer, service) => {
  const farmerName =
    farmer?.fullName || farmer?.name || "Farmer";

  const totalBill = Number(service?.totalBill || 0);
  const amountPaid = Number(service?.amountPaid || 0);

  const pendingAmount =
    service?.pendingAmount !== undefined &&
    service?.pendingAmount !== null
      ? Number(service.pendingAmount)
      : Math.max(totalBill - amountPaid, 0);

  return `Namaste ${farmerName},

Spraying service completed successfully.

Crop: ${service?.cropName || "-"}
Acres: ${service?.acres || "-"}
Date: ${formatDate(service?.serviceDate)}

Total Bill: ${formatCurrency(totalBill)}
Amount Paid: ${formatCurrency(amountPaid)}
Pending Amount: ${formatCurrency(pendingAmount)}
${pendingAmount <= 0 ? "Payment Status: Fully Paid ✅" : "Payment Status: Payment Pending"}

Thank you!
Shree Krushna ESS Spraying Service`;
};

export const buildPaymentMessage = (
  farmer,
  service,
  paymentAmount,
  discountAmount = 0
) => {
  const farmerName =
    farmer?.fullName || farmer?.name || "Farmer";

  const totalBill = Number(service?.totalBill || 0);
  const paidNow = Number(paymentAmount || 0);
  const discount = Number(discountAmount || 0);
  const amountPaid = Number(service?.amountPaid || 0);

  const pendingAmount =
    service?.pendingAmount !== undefined &&
    service?.pendingAmount !== null
      ? Number(service.pendingAmount)
      : Math.max(totalBill - amountPaid, 0);

  return `Namaste ${farmerName},

Payment received successfully.

Payment Received: ${formatCurrency(paidNow)}
${discount > 0 ? `Discount Applied: ${formatCurrency(discount)}\n` : ""}Total Bill: ${formatCurrency(totalBill)}
Total Amount Paid: ${formatCurrency(amountPaid)}
Remaining Pending: ${formatCurrency(pendingAmount)}
${pendingAmount <= 0 ? "Payment Status: Fully Paid ✅" : "Payment Status: Payment Pending"}

Thank you!
Shree Krushna ESS Spraying Service`;
};