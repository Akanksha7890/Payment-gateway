const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const { createRazorpayOrder, verifySignature } = require('../services/razorpayService');
const AppError = require('../utils/AppError');

function requiredStrings(body, fields) {
  return fields.every(
    (field) => typeof body?.[field] === 'string' && body[field].trim().length > 0,
  );
}

async function createOrder(req, res) {
  const productId = Number(req.body?.product_id);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new AppError('product_id is required.', 422);
  }

  const product = await Product.findOne({ id: productId, available: true });
  if (!product) throw new AppError('Product not found.', 404);

  const amount = Math.round(product.price * 100);

  try {
    const razorpayOrder = await createRazorpayOrder(product, amount);

    await Order.findOneAndUpdate(
      { razorpay_order_id: razorpayOrder.id },
      {
        $setOnInsert: {
          razorpay_order_id: razorpayOrder.id,
          product_id: product.id,
          amount,
          currency: razorpayOrder.currency || 'INR',
          status: 'created',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({
      success: true,
      data: {
        order_id: razorpayOrder.id,
        amount,
        currency: razorpayOrder.currency || 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Unable to create Razorpay order.', 502);
  }
}

async function verifyPayment(req, res) {
  const fields = [
    'razorpay_order_id',
    'razorpay_payment_id',
    'razorpay_signature',
  ];

  if (!requiredStrings(req.body, fields)) {
    throw new AppError('One of the three payment fields is missing.', 422);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const order = await Order.findOne({ razorpay_order_id });

  if (!order) throw new AppError('Order not found.', 404);

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    order.status = 'failed';
    await order.save();
    throw new AppError('Payment signature verification failed.', 400);
  }

  const existingPayment = await Payment.findOne({ razorpay_payment_id });
  if (existingPayment && existingPayment.razorpay_order_id !== razorpay_order_id) {
    throw new AppError('Payment is already linked to a different order.', 400);
  }

  if (!existingPayment) {
    await Payment.create({
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      amount: order.amount,
      status: 'success',
    });
  }

  order.status = 'paid';
  await order.save();

  res.json({
    success: true,
    message: 'Payment verified and recorded successfully.',
    data: {
      order_id: order.razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: order.amount,
      status: order.status,
    },
  });
}

module.exports = { createOrder, verifyPayment, requiredStrings };
