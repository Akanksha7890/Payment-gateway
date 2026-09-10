const mongoose = require('mongoose');
const Counter = require('../models/Counter');
const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Wireless Mouse',
    price: 5,
    description: 'An ergonomic wireless mouse for comfortable everyday work.',
  },
  {
    name: 'Everyday Headphones',
    price: 10,
    description: 'Clear, balanced sound for focused work and relaxed weekends.',
  },
  {
    name: 'Travel Tumbler',
    price: 9,
    description: 'A reusable insulated tumbler that keeps drinks ready on the move.',
  },
];

async function seedProductsIfNeeded() {
  const existing = await Product.exists({});
  if (existing) {
    return;
  }

  for (const productData of sampleProducts) {
    const id = await Counter.next('product');
    await Product.create({ id, ...productData });
  }

  console.log(`${sampleProducts.length} sample products created automatically.`);
}

async function connectDatabase() {
  const mongoUri =
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/payment_gateway';

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5_000,
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  await seedProductsIfNeeded();
}

module.exports = connectDatabase;
