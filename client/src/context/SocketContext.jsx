import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

/**
 * SocketContext
 * Provides a Socket.IO connection and online users state
 * to the entire application.
 */
const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to Socket.IO server
    const newSocket = io(
      import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
      {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      }
    );

    // Emit join event with user ID
    newSocket.on('connect', () => {
      newSocket.emit('join', user._id);
    });

    // Listen for online users updates
    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);

    // Cleanup on unmount or user change
    return () => {
      newSocket.disconnect();
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    socket,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

/**
 * useSocket - Custom hook to access socket context.
 * Must be used within a SocketProvider.
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
