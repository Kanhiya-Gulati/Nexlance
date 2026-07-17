import { createContext, useContext, useState, useCallback } from 'react';

/**
 * ToastContext
 * Provides a global toast notification system.
 * Supports types: 'success', 'error', 'info', 'warning'.
 */
const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * showToast - Display a toast notification.
   * Auto-removes after 4 seconds.
   * @param {string} message - The toast message
   * @param {string} type - Toast type: 'info' | 'success' | 'error' | 'warning'
   */
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  /**
   * removeToast - Manually remove a specific toast by id.
   * @param {number} id
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    toasts,
    showToast,
    removeToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

/**
 * useToast - Custom hook to access toast context.
 * Must be used within a ToastProvider.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
