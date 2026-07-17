import { useContext } from 'react';
import ToastContext from '../../context/ToastContext';
import './Toast.css';

/**
 * Toast - Renders active toast notifications in the bottom-right corner.
 * Consumed from ToastContext which manages the toast queue.
 */
const Toast = () => {
  const context = useContext(ToastContext);

  if (!context) return null;

  const { toasts, removeToast } = context;

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          role="alert"
        >
          <span className="toast__icon">{getIcon(toast.type)}</span>
          <p className="toast__message">{toast.message}</p>
          <button
            className="toast__close"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

const getIcon = (type) => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    default: return 'ℹ';
  }
};

export default Toast;
