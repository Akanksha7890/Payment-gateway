const express = require('express');
const {
  createProduct,
  listProducts,
} = require('../controllers/productController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.route('/').get(asyncHandler(listProducts)).post(asyncHandler(createProduct));

module.exports = router;
