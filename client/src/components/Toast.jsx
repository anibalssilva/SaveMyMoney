import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'danger':
        return '🚨';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        ✕
      </button>
      {duration > 0 && (
        <div className="toast-progress">
          <div
            className="toast-progress-bar"
            style={{ animation: `shrink ${duration}ms linear` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
