import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import auth from '../utils/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = auth.getToken();
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      window.showToast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);

    try {
      const data = await auth.fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (data.success) {
        auth.login(data.token, data.user);
        if (window.showToast) {
          window.showToast('✅ Login successful! Redirecting to Dashboard...', 'success');
        }
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        if (window.showToast) {
          window.showToast(data.message || 'Invalid email or password', 'danger');
        }
      }
    } catch (err) {
      console.error(err);
      window.showToast('Network error. Please make sure the backend is running.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card glass-card" style={{ width: '100%', maxWidth: '440px', margin: '80px 20px' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{
              background: 'var(--primary-color)',
              color: '#000000',
              borderRadius: '6px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.35rem',
              fontFamily: 'Outfit, sans-serif',
              marginRight: '8px'
            }}>
              P
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.3rem', color: '#ffffff' }}>
              EASY <span style={{ color: 'var(--primary-color)' }}>PARK</span>
            </span>
          </div>
          <h3>Welcome Back</h3>
          <p>Login to your parking dashboard</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input 
              type="email" 
              id="login-email" 
              className="form-control" 
              placeholder="rohan@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--primary-color)', cursor: 'pointer' }}
                onClick={() => window.showToast('Simulated: Please register a new user to reset your credentials.', 'warning')}
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              id="login-password" 
              className="form-control" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'} <i className="fa-solid fa-right-to-bracket"></i>
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>
            🚀 QUICK DEMO LOGIN
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '6px 12px', flex: 1 }}
              onClick={() => {
                setEmail('user@parking.com');
                setPassword('user123');
              }}
            >
              <i className="fa-solid fa-user"></i> Driver (User)
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '6px 12px', flex: 1, borderColor: 'var(--primary-color)' }}
              onClick={() => {
                setEmail('admin@parking.com');
                setPassword('admin123');
              }}
            >
              <i className="fa-solid fa-shield-halved" style={{ color: 'var(--primary-color)' }}></i> Admin
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Register here</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}><i className="fa-solid fa-arrow-left-long"></i> Back to Homepage</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
