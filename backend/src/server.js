const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { port, corsOrigin } = require('./config/env');
const { verifyToken } = require('./utils/jwt');
const User = require('./models/User');

const PROVIDER_ROOM_ROLES = ['provider', 'supportWorker'];
const PARTICIPANT_ROOM_ROLES = ['participant', 'caregiver'];

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: corsOrigin } });
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join', async ({ token } = {}) => {
      try {
        const payload = verifyToken(token);
        const user = await User.findById(payload.sub);
        if (!user || !user.isActive) return;

        if (PROVIDER_ROOM_ROLES.includes(user.role)) {
          socket.join(`provider:${user._id}`);
        } else if (PARTICIPANT_ROOM_ROLES.includes(user.role)) {
          socket.join(`participant:${user._id}`);
        }
      } catch (err) {
        // Invalid or expired token: no-op, do not crash the socket.
      }
    });
  });

  server.listen(port, () => {
    console.log(`GR8Care API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
