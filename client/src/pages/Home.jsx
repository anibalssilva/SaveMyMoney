import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Home() {
  const [message, setMessage] = useState('Connecting to server...');

  useEffect(() => {
    api.get('/ping')
      .then(res => setMessage(res.data.message))
      .catch(() => setMessage('Server connection failed'));
  }, []);

  return (
    <div className="home-container">
      <h2>Welcome to SaveMyMoney</h2>
      <p>Your personal finance tracker, simplified.</p>
      <div className="actions">
        <Link to="/register" className="btn btn-primary">Get Started</Link>
        <Link to="/login" className="btn">Login</Link>
      </div>
      <p className="server-status">Server Status: <span>{message}</span></p>
    </div>
  );
}

export default Home;
