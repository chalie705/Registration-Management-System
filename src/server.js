const app = require('./app');
const { port } = require('./config/env');
const { connectDB } = require('./config/db');

async function startServer() {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`🚀 RMS Backend server running on port ${port}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();