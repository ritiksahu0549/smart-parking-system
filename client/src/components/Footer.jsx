import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="easypark-footer">
      <div className="easypark-footer-container">
        {/* Brand Column */}
        <div className="easypark-footer-brand-col">
          <Link to="/" className="easypark-logo-link">
            <div className="easypark-logo-badge">P</div>
            <div className="easypark-logo-text">
              <span className="logo-easy">EASY</span>
              <span className="logo-park">PARK</span>
            </div>
          </Link>
          <p className="easypark-footer-desc">
            Smart parking system with premium services, real-time IoT availability, and instant digital QR entry passes.
          </p>
          <div className="easypark-social-links">
            <a href="#twitter" aria-label="Twitter"><i className="fa-brands fa-twitter"></i></a>
            <a href="#facebook" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#instagram" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
            <a href="#linkedin" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
          </div>
        </div>

        {/* Column 1: Plan */}
        <div className="easypark-footer-col">
          <h4>Plan</h4>
          <ul>
            <li><a href="#pricing-plan">Regular</a></li>
            <li><a href="#pricing-plan">Premium</a></li>
            <li><a href="#pricing-plan">Golden</a></li>
            <li><a href="#pricing-plan">Luxury</a></li>
          </ul>
        </div>

        {/* Column 2: Services */}
        <div className="easypark-footer-col">
          <h4>Services</h4>
          <ul>
            <li><Link to="/dashboard?tab=find-parking">Spacious Parking</Link></li>
            <li><a href="#about-us">CCTV & Security</a></li>
            <li><Link to="/dashboard?tab=live-slots">Sensor Guidance</Link></li>
            <li><a href="#about-us">EV Charging Stations</a></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="easypark-footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#about-us">About Us</a></li>
            <li><a href="#terms">Terms</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#contact">Contact Support</a></li>
          </ul>
        </div>

        {/* Column 4: More */}
        <div className="easypark-footer-col">
          <h4>More</h4>
          <ul>
            <li><a href="#documentation">Documentation</a></li>
            <li><a href="#license">License</a></li>
            <li><Link to="/dashboard?tab=find-parking">22+ Cities Network</Link></li>
            <li><Link to="/dashboard?tab=user-bookings">Digital Pass Verification</Link></li>
          </ul>
        </div>
      </div>

      <div className="easypark-footer-bottom">
        <div>&copy; {new Date().getFullYear()} EASY PARK. All Rights Reserved.</div>
        <div className="easypark-footer-bottom-links">
          <a href="#terms">Terms of Service</a>
          <span>•</span>
          <a href="#privacy">Privacy Policy</a>
          <span>•</span>
          <a href="#support">Help Center</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
