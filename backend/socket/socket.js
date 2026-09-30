const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Attaches Socket.IO connection handling to the given io instance
const initSocket = (io) => {
  // Authenticate the socket handshake using the same JWT used for the REST API
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name email avatarColor');
      if (!user) return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Every authenticated socket joins a personal room so we can push
    // lightweight notifications (assignments, comments, invites) to a
    // user regardless of which project board they currently have open.
    socket.join(`user:${socket.user._id}`);

    // Client joins a room for each project board it has open so updates
    // are only broadcast to people viewing that project.
    socket.on('project:join', (projectId) => {
      if (!projectId) return;
      socket.join(`project:${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      if (!projectId) return;
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      // no-op, room membership is cleaned up automatically
    });
  });
};

module.exports = initSocket;
