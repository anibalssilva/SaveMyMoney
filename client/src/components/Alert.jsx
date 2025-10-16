import React from 'react';

const Alert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="alert">
      <p>{message}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default Alert;
