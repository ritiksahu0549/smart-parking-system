import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import auth from '../utils/auth';

const Navbar = () => {
  const [user, setUser] = useState(auth.getUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Parse current active query param
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab');
  const isHome = location.pathname === '/' && !currentTab;

  // Listen to changes in auth state, location, or local storage
  useEffect(() => {
    const syncUser = () => {
      setUser(auth.getUser());
    };

    syncUser();
    window.addEventListener('auth-change', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, [location]);

  const handleLogout = () => {
    auth.logout(false);
    setUser(null);
    setMobileMenuOpen(false);
    if (window.showToast) {
      window.showToast('Logged out successfully.', 'info');
    }
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Notification Status Bar */}
      <div className="easypark-topbar">
        <div className="easypark-topbar-left">
          <div className="easypark-live-badge">
            <span className="easypark-live-pulse"></span>
            <span>Live Smart Parking System • 22+ Cities Active</span>
          </div>
          <span className="easypark-topbar-tagline">
            <i className="fa-solid fa-bolt" style={{ color: 'var(--primary-color)', marginRight: '6px' }}></i>
            Real-Time Slot Booking & Automated QR Gate Access
          </span>
        </div>

        <div className="easypark-topbar-right">
          <a href="tel:+917888711383" className="easypark-call-link">
            <i className="fa-solid fa-headset"></i>
            <span>24/7 Helpline: +91 7888711383</span>
          </a>
        </div>
      </div>

      {/* Main EASY PARK Navigation Header */}
      <header className="easypark-header">
        <div className="easypark-nav-container">
          {/* Brand Logo - [P] EASY PARK */}
          <Link to="/" className="easypark-logo-link" onClick={closeMenu}>
            <div className="easypark-logo-badge">P</div>
            <div className="easypark-logo-text">
              <span className="logo-easy">EASY</span>
              <span className="logo-park">PARK</span>
            </div>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button 
            className={`mobile-nav-toggle ${mobileMenuOpen ? 'open' : ''}`} 
            onClick={toggleMobileMenu} 
            type="button" 
            aria-label="Toggle navigation menu"
          >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars-staggered'}`}></i>
          </button>

          {/* Backdrop for mobile drawer */}
          {mobileMenuOpen && <div className="nav-mobile-backdrop" onClick={closeMenu}></div>}

          {/* Navigation Links (Matching Figma menu) */}
          <ul className={`easypark-nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
            <li>
              <Link 
                to="/" 
                className={`easypark-nav-link ${isHome ? 'active' : ''}`} 
                onClick={closeMenu}
              >
                <span>Home</span>
              </Link>
            </li>
            <li>
              <a href="/#about-us" className="easypark-nav-link" onClick={closeMenu}>
                <span>About us</span>
              </a>
            </li>
            <li>
              <a href="/#pricing-plan" className="easypark-nav-link" onClick={closeMenu}>
                <span>Plan</span>
              </a>
            </li>
            <li>
              <a href="/#testimonials" className="easypark-nav-link" onClick={closeMenu}>
                <span>Testimonials</span>
              </a>
            </li>
            <li>
              <Link 
                to="/dashboard?tab=find-parking" 
                className={`easypark-nav-link ${currentTab === 'find-parking' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <i className="fa-solid fa-magnifying-glass-location" style={{ color: 'var(--primary-color)' }}></i>
                <span>Find Parking</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/dashboard?tab=live-slots" 
                className={`easypark-nav-link ${currentTab === 'live-slots' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <i className="fa-solid fa-square-parking" style={{ color: '#00ff88' }}></i>
                <span>Live Slots</span>
              </Link>
            </li>
            {user && (
              user.role === 'admin' ? (
                <>
                  <li>
                    <Link 
                      to="/dashboard?tab=admin-dash" 
                      className={`easypark-nav-link ${currentTab === 'admin-dash' ? 'active' : ''}`}
                      onClick={closeMenu}
                    >
                      <i className="fa-solid fa-chart-pie" style={{ color: 'var(--primary-color)' }}></i>
                      <span>Admin</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/dashboard?tab=admin-iot" 
                      className={`easypark-nav-link ${currentTab === 'admin-iot' ? 'active' : ''}`}
                      onClick={closeMenu}
                    >
                      <i className="fa-solid fa-microchip" style={{ color: '#00ff88' }}></i>
                      <span>IoT Sensors</span>
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link 
                    to="/dashboard?tab=user-bookings" 
                    className={`easypark-nav-link ${currentTab === 'user-bookings' ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <i className="fa-solid fa-ticket" style={{ color: 'var(--primary-color)' }}></i>
                    <span>My Bookings</span>
                  </Link>
                </li>
              )
            )}
          </ul>

          {/* Right Action Utilities (Theme Toggle & Login Button) */}
          <div className="easypark-nav-right">
            <ThemeToggle />

            {user ? (
              <div className="user-nav-chip">
                <Link 
                  to={`/dashboard?tab=${user.role === 'admin' ? 'admin-dash' : 'user-dash'}`}
                  className="user-nav-profile"
                  onClick={closeMenu}
                  title="Go to Dashboard"
                >
                  <div className="user-nav-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="user-nav-info">
                    <span className="user-nav-name">{user?.name?.split(' ')[0]}</span>
                    <span className="user-nav-role">{user?.role === 'admin' ? 'Operator' : 'Driver'}</span>
                  </div>
                </Link>

                <button 
                  onClick={handleLogout} 
                  className="btn-logout" 
                  title="Log out"
                  aria-label="Logout"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="easypark-btn-login" 
                onClick={closeMenu}
              >
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
