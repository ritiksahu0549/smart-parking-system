import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import auth from './utils/auth';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = auth.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Bind global Toast triggers
    window.showToast = (message, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    // Keep backwards compatibility for sub-scripts calling app.showNotificationToast
    window.app = {
      ...window.app,
      showNotificationToast: (msg, type) => window.showToast(msg, type)
    };
  }, []);

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <Footer />

        {/* Global Toast notifications layout */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <i className={`fa-solid ${
                t.type === 'success' ? 'fa-circle-check' : 
                t.type === 'danger' ? 'fa-circle-xmark' : 
                t.type === 'warning' ? 'fa-triangle-exclamation' : 
                'fa-circle-info'
              }`} style={{
                color: t.type === 'success' ? 'var(--success-color)' :
                       t.type === 'danger' ? 'var(--danger-color)' :
                       t.type === 'warning' ? 'var(--warning-color)' :
                       'var(--info-color)',
                fontSize: '1.2rem'
              }}></i>
              <div className="toast-message">{t.message}</div>
              <i 
                className="fa-solid fa-xmark toast-close" 
                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              ></i>
            </div>
          ))}
        </div>
      </div>
    </Router>
  );
}

export default App;
