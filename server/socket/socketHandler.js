const { Server } = require('socket.io');

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins in development
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  // Attach to global context so controllers can access it
  global.io = io;

  return io;
};

module.exports = socketHandler;
