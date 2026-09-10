const Counter = require('../models/Counter');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

async function createProduct(req, res) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const description =
    typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const price = Number(req.body?.price);

  if (!name || !description || req.body?.price === undefined) {
    throw new AppError('name, price and description are required.', 422);
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new AppError('price must be a positive number.', 422);
  }

  const id = await Counter.next('product');
  const product = await Product.create({ id, name, price, description });

  res.status(201).json({ success: true, data: product });
}

async function listProducts(_req, res) {
  const products = await Product.find({ available: true })
    .sort({ created_at: -1 })
    .select('-_id -updated_at -available')
    .lean();

  res.json({ success: true, data: products });
}

module.exports = { createProduct, listProducts };
