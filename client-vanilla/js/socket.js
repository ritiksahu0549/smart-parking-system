// Socket.IO Real-time Handler
let socket;

const initSocket = () => {
  if (typeof io === 'undefined') {
    console.warn('Socket.IO script not loaded yet.');
    return;
  }

  // Connect to the backend
  socket = io();

  socket.on('connect', () => {
    console.log('Socket.IO Connected to Server');
  });

  // Listen for real-time slot status updates
  socket.on('slotUpdated', (data) => {
    console.log('Real-time Slot Update Received:', data);
    
    // Trigger slot UI updates if app.js is ready
    if (window.app && typeof window.app.handleRealtimeSlotUpdate === 'function') {
      window.app.handleRealtimeSlotUpdate(data);
    }
  });

  // Listen for vehicle actions
  socket.on('vehicleEntered', (data) => {
    console.log('Vehicle entered slot:', data);
    if (window.app && typeof window.app.showNotificationToast === 'function') {
      window.app.showNotificationToast('🚗 Vehicle entered slot: Status is now Occupied.', 'info');
      window.app.refreshActiveViews();
    }
  });

  socket.on('vehicleExited', (data) => {
    console.log('Vehicle exited slot:', data);
    if (window.app && typeof window.app.showNotificationToast === 'function') {
      window.app.showNotificationToast('🏁 Vehicle exited: Slot is now Available.', 'success');
      window.app.refreshActiveViews();
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO Disconnected');
  });
};

// Initialize socket on window load if io is available
window.addEventListener('load', () => {
  initSocket();
});
