const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    data: { database: connected ? 'connected' : 'disconnected' },
  });
});

app.use('/api/products', productRoutes);
app.use('/api', paymentRoutes);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'API route not found.' });
});

app.use(errorHandler);

module.exports = app;
