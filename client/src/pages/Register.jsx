import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import auth from '../utils/auth';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = auth.getToken();
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const validateForm = () => {
    const tempErrors = {};
    let isValid = true;

    if (!name.trim()) {
      tempErrors.name = 'Full Name is required';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Valid Email Address is required';
      isValid = false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      tempErrors.phone = 'Valid 10-digit Mobile Number is required';
      isValid = false;
    }

    if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleQuickFill = (type) => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    if (type === 'driver') {
      setName('Aarav Patel');
      setEmail(`aarav.${rand}@example.com`);
      setPhone('9876543210');
      setRole('user');
      setVehicleNumber(`DL-${rand % 99 + 1}A-1234`);
      setVehicleType('car');
      setPassword('password123');
      setConfirmPassword('password123');
      setErrors({});
    } else {
      setName('Smart Operator');
      setEmail(`operator.${rand}@example.com`);
      setPhone('9988776655');
      setRole('admin');
      setPassword('admin12345');
      setConfirmPassword('admin12345');
      setErrors({});
    }
    if (window.showToast) {
      window.showToast(`Filled sample ${type} details. Click 'Register Now' to submit!`, 'info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      if (window.showToast) {
        window.showToast('Please correct the validation errors', 'warning');
      }
      return;
    }

    setLoading(true);

    try {
      const vehicles = [];
      if (role === 'user' && vehicleNumber.trim()) {
        vehicles.push({
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          vehicleType
        });
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          password,
          vehicles
        })
      });

      const data = await response.json();

      if (data.success) {
        auth.login(data.token, data.user);
        if (window.showToast) {
          window.showToast('🎉 Account created successfully! Redirecting to Dashboard...', 'success');
        }
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        const errorMsg = data.message || 'Registration failed.';
        if (errorMsg.toLowerCase().includes('already exists') || errorMsg.toLowerCase().includes('duplicate')) {
          if (window.showToast) window.showToast('❌ Email already registered', 'danger');
          setErrors(prev => ({ ...prev, email: 'Email already registered' }));
        } else {
          if (window.showToast) window.showToast(`❌ ${errorMsg}`, 'danger');
        }
      }
    } catch (err) {
      console.error(err);
      if (window.showToast) {
        window.showToast('❌ Server error occurred. Please try again later.', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card glass-card" style={{ width: '100%', maxWidth: '520px', margin: '80px 20px' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
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
          <h3>Create Your Account</h3>
          <p>Book parking slots instantly anywhere in India</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
            ⚡ AUTO-FILL SAMPLE REGISTRATION FORM
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '6px 12px', flex: 1 }}
              onClick={() => handleQuickFill('driver')}
            >
              <i className="fa-solid fa-user"></i> Fill Sample Driver
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '6px 12px', flex: 1, borderColor: 'var(--primary-color)' }}
              onClick={() => handleQuickFill('operator')}
            >
              <i className="fa-solid fa-shield-halved" style={{ color: 'var(--primary-color)' }}></i> Fill Sample Operator
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
            <label htmlFor="reg-name">Full Name *</label>
            <input 
              type="text" 
              id="reg-name" 
              className="form-control" 
              placeholder="e.g. Rohan Sharma" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
            {errors.name && <div className="validation-msg" style={{ display: 'block' }}>{errors.name}</div>}
          </div>

          <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="reg-email">Email Address *</label>
            <input 
              type="email" 
              id="reg-email" 
              className="form-control" 
              placeholder="e.g. rohan@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            {errors.email && <div className="validation-msg" style={{ display: 'block' }}>{errors.email}</div>}
          </div>

          <div className="form-row">
            <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
              <label htmlFor="reg-phone">Mobile Number *</label>
              <input 
                type="tel" 
                id="reg-phone" 
                className="form-control" 
                placeholder="10-digit mobile" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required 
              />
              {errors.phone && <div className="validation-msg" style={{ display: 'block' }}>{errors.phone}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="reg-role">Account Role *</label>
              <select 
                id="reg-role" 
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Driver / Customer</option>
                <option value="admin">Parking Operator (Admin)</option>
              </select>
            </div>
          </div>

          {/* Optional Vehicle Details if Driver */}
          {role === 'user' && (
            <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-car"></i> Vehicle Details (Optional)
              </div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="reg-veh-num" style={{ fontSize: '0.8rem' }}>License Plate Number</label>
                  <input 
                    type="text" 
                    id="reg-veh-num" 
                    className="form-control" 
                    placeholder="e.g. DL-01-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="reg-veh-type" style={{ fontSize: '0.8rem' }}>Vehicle Type</label>
                  <select 
                    id="reg-veh-type" 
                    className="form-control"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    <option value="car">Car (Four-wheeler)</option>
                    <option value="bike">Bike (Two-wheeler)</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="disabled">Accessible / Disabled</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
              <label htmlFor="reg-password">Password *</label>
              <input 
                type="password" 
                id="reg-password" 
                className="form-control" 
                placeholder="At least 6 chars" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              {errors.password && <div className="validation-msg" style={{ display: 'block' }}>{errors.password}</div>}
            </div>

            <div className={`form-group ${errors.confirmPassword ? 'has-error' : ''}`}>
              <label htmlFor="reg-confirm">Confirm Password *</label>
              <input 
                type="password" 
                id="reg-confirm" 
                className="form-control" 
                placeholder="Re-enter password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
              {errors.confirmPassword && <div className="validation-msg" style={{ display: 'block' }}>{errors.confirmPassword}</div>}
            </div>
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Now'} <i className="fa-solid fa-user-plus"></i>
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Log In here</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}><i className="fa-solid fa-arrow-left-long"></i> Back to Homepage</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
