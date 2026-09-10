require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDatabase = require('./src/config/database');

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  await connectDatabase();

  const server = app.listen(port, () => {
    console.log(`Payflow is running at http://localhost:${port}`);
  });

  async function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down cleanly...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error(`Unable to start the application: ${error.message}`);
  process.exit(1);
});
