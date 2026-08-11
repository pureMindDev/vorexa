const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackRequest = async (path, options = {}) => {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Paystack request failed');
  }

  return data.data;
};

// Amount must be in kobo (Naira × 100) per Paystack's API
const initializeTransaction = async ({ email, amountNaira, reference, callbackUrl, metadata }) => {
  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: Math.round(amountNaira * 100),
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });
};

const verifyTransaction = async (reference) => {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
  });
};

module.exports = { initializeTransaction, verifyTransaction };
