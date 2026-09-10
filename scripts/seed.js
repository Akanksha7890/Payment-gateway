require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const Counter = require('../src/models/Counter');
const Product = require('../src/models/Product');

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

async function seed() {
  await connectDatabase();

  if (await Product.exists({})) {
    console.log('Products already exist. Nothing was changed.');
    return;
  }

  for (const productData of sampleProducts) {
    const id = await Counter.next('product');
    await Product.create({ id, ...productData });
  }

  console.log(`${sampleProducts.length} sample products created.`);
}

seed()
  .catch((error) => {
    console.error(`Unable to seed products: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
``