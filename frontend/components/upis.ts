const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

export interface PaymentLinkRequest {
  amount: number;        // in ₹ (e.g., 500 for ₹500)
  billerBillID: string;  // unique transaction ID you generate
  note?: string;
}

export interface PaymentLinkResponse {
  shortURL: string;
  upiLink: string;
  upiID: string;
  platformBillID: string;
}

export const createPaymentLink = async (
  payload: PaymentLinkRequest
): Promise<PaymentLinkResponse> => {
  const response = await fetch(`${BACKEND_URL}/create-payment-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment link');
  }

  const data = await response.json();
  return {
    shortURL: data.data.paymentLink.shortURL,
    upiLink: data.data.paymentLink.upiLink,
    upiID: data.data.paymentLink.upiID,
    platformBillID: data.data.platformBillID,
  };
};

export const checkPaymentStatus = async (
  platformBillID: string
): Promise<string> => {
  const response = await fetch(
    `${BACKEND_URL}/payment-status/${platformBillID}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch payment status');
  }
  const data = await response.json();
  return data.data.bill.status; // "PAYMENT_SUCCESSFUL" | "BILL_CREATED" | "PAYMENT_FAILED" | "BILL_EXPIRED"
};
