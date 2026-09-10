const crypto = require('node:crypto');
const Razorpay = require('razorpay');
const AppError = require('../utils/AppError');

let client;

function getClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new AppError('Razorpay credentials are not configured.', 500);
  }

  if (!client) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  return client;
}

function buildReceipt(product) {
  const stamp = Date.now().toString(36);
  const random = crypto.randomUUID().slice(0, 8);
  return `product_${product.id}_${stamp}_${random}`;
}

function verifySignature(orderId, paymentId, suppliedSignature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new AppError('Razorpay credentials are not configured.', 500);
  }

  if (!orderId || !paymentId || !suppliedSignature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (typeof suppliedSignature !== 'string') {
    return false;
  }

  if (suppliedSignature.length !== expected.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(suppliedSignature, 'utf8'),
    );
  } catch {
    return false;
  }
}

async function createRazorpayOrder(product, amount) {
  try {
    const orderPayload = {
      amount,
      currency: 'INR',
      receipt: buildReceipt(product),
      notes: {
        product_id: String(product.id),
        product_name: product.name,
        product_price: String(product.price),
        source: 'payflow-store',
      },
    };

    return await getClient().orders.create(orderPayload);
  } catch (error) {
    if (error instanceof AppError) throw error;

    const reason =
      error?.error?.description ||
      error?.response?.body?.error?.description ||
      error.message ||
      'Unknown error';

    throw new AppError(`Unable to create Razorpay order: ${reason}`, 502);
  }
}

module.exports = { createRazorpayOrder, getClient, buildReceipt, verifySignature };
