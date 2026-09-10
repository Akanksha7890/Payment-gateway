const express = require('express');
const {
  createOrder,
  verifyPayment,
} = require('../controllers/paymentController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/create-order', asyncHandler(createOrder));
router.post('/verify-payment', asyncHandler(verifyPayment));

module.exports = router;
