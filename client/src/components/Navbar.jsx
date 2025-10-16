import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  // A simple check for token existence. In a real app, you might want a more robust check (e.g., context).
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    // Force a re-render or use state management to update the navbar instantly.
    window.location.reload(); 
  };

  return (
    <nav className="navbar">
      <Link to="/"><h1>SaveMyMoney</h1></Link>
      <ul className="nav-links">
        {token ? (
          <>
            <li>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            </li>
            <li>
              <Link to="/transactions" className="nav-link">Transactions</Link>
            </li>
            <li>
              <Link to="/ocr" className="nav-link">Upload Receipt</Link>
            </li>
            <li>
              <Link to="/upload-statement" className="nav-link">Upload Statement</Link>
            </li>
            <li>
              <Link to="/budgets" className="nav-link">Budgets</Link>
            </li>
            <li>
              <Link to="/alerts" className="nav-link">Alerts</Link>
            </li>
            <li>
              <Link to="/portfolio" className="nav-link">Portfolio</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="btn btn-logout">Logout</button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" className="nav-link">Login</Link>
            </li>
            <li>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
