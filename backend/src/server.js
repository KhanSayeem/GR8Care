const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { port, corsOrigin } = require('./config/env');

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: corsOrigin } });
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
  });

  server.listen(port, () => {
    console.log(`GR8Care API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
