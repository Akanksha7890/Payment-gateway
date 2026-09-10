const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    razorpay_payment_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpay_order_id: { type: String, required: true, index: true },
    razorpay_signature: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['success'], default: 'success' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

module.exports = mongoose.model('Payment', paymentSchema);
