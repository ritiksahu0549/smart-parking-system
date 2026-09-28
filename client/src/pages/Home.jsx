import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
  const [locationQuery, setLocationQuery] = useState('Los Angeles Parking');
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [checkInTime, setCheckInTime] = useState('10:30 AM');
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [checkOutTime, setCheckOutTime] = useState('06:00 PM');
  const [promoCode, setPromoCode] = useState('');
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const navigate = useNavigate();

  const handleBookNowSubmit = (e) => {
    e.preventDefault();
    const city = locationQuery.split(',')[0].trim();
    if (city) {
      localStorage.setItem('search_query_redirect', city);
    }
    navigate('/dashboard?tab=find-parking');
  };

  const handlePlanSelect = (planName, price) => {
    localStorage.setItem('selected_parking_plan', JSON.stringify({ planName, price }));
    navigate('/dashboard?tab=find-parking');
  };

  const featuredReviews = [
    {
      name: 'JuTo Robert',
      role: 'Digital Marketing Executive',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      text: 'Easy Park completely transformed how I commute daily. Finding a secure, reserved spot takes seconds, and the digital QR pass makes gate entry completely effortless. Highly recommended!'
    },
    {
      name: 'Jane Cooper',
      role: 'Business Traveler',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      text: 'The best parking reservation platform in the city. The ultrasonic sensor guidance and guaranteed reserved spaces save me at least 30 minutes every morning.'
    },
    {
      name: 'Jenny Wilson',
      role: 'Operations Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      text: 'Exceptional security and clean, spacious bays. Booking online with instant UPI verification and scanning the QR pass at the boom barrier is seamless.'
    }
  ];

  return (
    <div className="easypark-page">
      {/* =========================================================
          1. HERO SECTION (Matching Figma Design)
          ========================================================= */}
      <section className="easypark-hero">
        <div className="easypark-hero-overlay"></div>
        <div className="easypark-hero-content">
          <div className="easypark-hero-tag">Welcome to</div>
          <h1 className="easypark-hero-title">
            <span className="text-white">EASY</span> <span className="text-gold">PARK</span>
          </h1>
          <p className="easypark-hero-desc">
            Premium automated smart parking system with live IoT sensor availability, instant digital QR pass generation, and 24/7 high-security surveillance.
          </p>

          {/* Floating Frosted Glass "Book Now" Search Widget */}
          <div className="easypark-booking-card">
            <div className="easypark-booking-card-header">
              <span className="easypark-booking-card-title">Book Now</span>
            </div>

            <form onSubmit={handleBookNowSubmit} className="easypark-booking-form">
              {/* Field 1: SELECT LOCATION */}
              <div className="easypark-form-col">
                <label className="easypark-label">SELECT LOCATION</label>
                <div className="easypark-input-wrap">
                  <i className="fa-solid fa-location-dot easypark-input-icon"></i>
                  <input
                    type="text"
                    className="easypark-input"
                    placeholder="e.g. Connaught Place, BKC, Indiranagar"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Field 2: CHECK IN */}
              <div className="easypark-form-col">
                <label className="easypark-label">CHECK IN</label>
                <div className="easypark-input-wrap-dual">
                  <div className="easypark-input-wrap">
                    <i className="fa-regular fa-calendar easypark-input-icon"></i>
                    <input
                      type="date"
                      className="easypark-input"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                    />
                  </div>
                  <div className="easypark-input-wrap">
                    <i className="fa-regular fa-clock easypark-input-icon"></i>
                    <input
                      type="text"
                      className="easypark-input"
                      placeholder="10:30 AM"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Field 3: CHECK OUT */}
              <div className="easypark-form-col">
                <label className="easypark-label">CHECK OUT</label>
                <div className="easypark-input-wrap-dual">
                  <div className="easypark-input-wrap">
                    <i className="fa-regular fa-calendar easypark-input-icon"></i>
                    <input
                      type="date"
                      className="easypark-input"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                    />
                  </div>
                  <div className="easypark-input-wrap">
                    <i className="fa-regular fa-clock easypark-input-icon"></i>
                    <input
                      type="text"
                      className="easypark-input"
                      placeholder="06:00 PM"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Field 4: PROMO CODE (Optional) */}
              <div className="easypark-form-col">
                <label className="easypark-label">PROMO CODE <span style={{ opacity: 0.6 }}>(Optional)</span></label>
                <div className="easypark-input-wrap">
                  <i className="fa-solid fa-tag easypark-input-icon"></i>
                  <input
                    type="text"
                    className="easypark-input"
                    placeholder="Enter Code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="easypark-form-btn-col">
                <button type="submit" className="easypark-btn-book">
                  <span>Book Now</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. ABOUT US SECTION (Matching White Cards in Figma)
          ========================================================= */}
      <section className="easypark-section easypark-about-section" id="about-us">
        <div className="easypark-container">
          <div className="easypark-about-header">
            <h2 className="easypark-section-title">ABOUT US</h2>
            <p className="easypark-section-subtitle">
              Engineered with world-class parking infrastructure, AI vehicle recognition, automated gates, and guaranteed reserved spaces across 22+ Indian metropolitan hubs.
            </p>
          </div>

          <div className="easypark-about-grid">
            {/* White Feature Card 1: Security Guard or Anti Thief */}
            <div className="easypark-white-card">
              <div className="easypark-card-img-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80" 
                  alt="Security Guard or Anti Thief" 
                  className="easypark-card-img"
                />
              </div>
              <div className="easypark-card-body">
                <h3 className="easypark-card-title">Security Guard or Anti Thief</h3>
                <p className="easypark-card-text">
                  24/7 CCTV surveillance, automated boom barriers, and round-the-clock physical security guards ensuring complete peace of mind for your vehicle.
                </p>
                <Link to="/dashboard?tab=find-parking" className="easypark-card-link">
                  <span>Learn More</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </div>

            {/* White Feature Card 2: Spacious Parking Lot */}
            <div className="easypark-white-card">
              <div className="easypark-card-img-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80" 
                  alt="Spacious Parking Lot" 
                  className="easypark-card-img"
                />
              </div>
              <div className="easypark-card-body">
                <h3 className="easypark-card-title">Spacious Parking Lot</h3>
                <p className="easypark-card-text">
                  Generously wide bays, organized driving lanes, and intelligent ultrasonic slot indicators guiding drivers directly to their open reserved spot.
                </p>
                <Link to="/dashboard?tab=live-slots" className="easypark-card-link">
                  <span>Learn More</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </div>

            {/* White Feature Card 3: 24/7 EV & Fast Tag Charging */}
            <div className="easypark-white-card">
              <div className="easypark-card-img-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=600&q=80" 
                  alt="Fast-Tag & EV Charging" 
                  className="easypark-card-img"
                />
              </div>
              <div className="easypark-card-body">
                <h3 className="easypark-card-title">Fast-Tag & EV Charging</h3>
                <p className="easypark-card-text">
                  Dedicated high-speed electric vehicle charging docks, instant RFID boom barrier clearance, and touchless digital QR pass verification.
                </p>
                <Link to="/dashboard?tab=find-parking" className="easypark-card-link">
                  <span>Learn More</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </div>

            {/* Luxury Car Graphics Banner */}
            <div className="easypark-car-banner">
              <img 
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80" 
                alt="Luxury Sports Car in Parking" 
                className="easypark-car-banner-img"
              />
              <div className="easypark-car-banner-badge">
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--primary-color)' }}></i>
                <span>100% Insured & Guaranteed Spaces</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. PRICING PLANS (Exact Matching Figma Cards)
          ========================================================= */}
      <section className="easypark-section easypark-pricing-section" id="pricing-plan">
        <div className="easypark-container">
          <div className="easypark-section-header-center">
            <div className="easypark-pill-tag">
              <i className="fa-solid fa-award"></i>
              <span>FLEXIBLE PARKING PASSES</span>
            </div>
            <h2 className="easypark-section-title">PRICING PLANS</h2>
            <p className="easypark-section-subtitle">
              Choose the perfect parking pass tailored for hourly parkers, daily office commuters, or VIP valet executive reservations.
            </p>
          </div>

          <div className="easypark-pricing-grid">
            {/* Plan 1: Regular Class */}
            <div className="easypark-price-card">
              <div className="easypark-price-card-header">
                <h4 className="easypark-plan-name">Regular Class</h4>
                <div className="easypark-plan-price">
                  <span className="easypark-currency">₹</span>
                  <span className="easypark-amount">249</span>
                  <span className="easypark-period">/pass</span>
                </div>
                <button 
                  onClick={() => handlePlanSelect('Regular Class', 249)}
                  className="easypark-btn-plan-outline"
                >
                  Select Plan
                </button>
              </div>
              <ul className="easypark-plan-features">
                <li><i className="fa-solid fa-check text-gold"></i> Standard 4-Wheeler / 2-Wheeler Bay</li>
                <li><i className="fa-solid fa-check text-gold"></i> 24/7 CCTV & Automated Gate Access</li>
                <li><i className="fa-solid fa-check text-gold"></i> Digital QR Entry & Exit Pass</li>
                <li><i className="fa-solid fa-check text-gold"></i> Real-time Slot Availability Map</li>
                <li><i className="fa-solid fa-xmark text-muted"></i> EV Fast-Charging Access</li>
                <li><i className="fa-solid fa-xmark text-muted"></i> Dedicated Covered Reserved Deck</li>
              </ul>
            </div>

            {/* Plan 2: Premium Class (RECOMMENDED) */}
            <div className="easypark-price-card easypark-price-card-featured">
              <div className="easypark-recommended-badge">Recommended</div>
              <div className="easypark-price-card-header">
                <h4 className="easypark-plan-name">Premium Class</h4>
                <div className="easypark-plan-price">
                  <span className="easypark-currency">₹</span>
                  <span className="easypark-amount">499</span>
                  <span className="easypark-period">/pass</span>
                </div>
                <button 
                  onClick={() => handlePlanSelect('Premium Class', 499)}
                  className="easypark-btn-plan-filled"
                >
                  Select Plan
                </button>
              </div>
              <ul className="easypark-plan-features">
                <li><i className="fa-solid fa-check text-gold"></i> Priority Prime Level-1 Parking Bay</li>
                <li><i className="fa-solid fa-check text-gold"></i> Fast-Tag Automated Barrier Clearance</li>
                <li><i className="fa-solid fa-check text-gold"></i> Dedicated EV Charging Station Bay</li>
                <li><i className="fa-solid fa-check text-gold"></i> Multi-City Roaming Access Pass</li>
                <li><i className="fa-solid fa-check text-gold"></i> 24/7 On-Site Attendant & CCTV</li>
                <li><i className="fa-solid fa-check text-gold"></i> Free 30-Minute Overstay Grace Period</li>
              </ul>
            </div>

            {/* Plan 3: Luxury Class */}
            <div className="easypark-price-card">
              <div className="easypark-price-card-header">
                <h4 className="easypark-plan-name">Luxury Class</h4>
                <div className="easypark-plan-price">
                  <span className="easypark-currency">₹</span>
                  <span className="easypark-amount">999</span>
                  <span className="easypark-period">/pass</span>
                </div>
                <button 
                  onClick={() => handlePlanSelect('Luxury Class', 999)}
                  className="easypark-btn-plan-outline"
                >
                  Select Plan
                </button>
              </div>
              <ul className="easypark-plan-features">
                <li><i className="fa-solid fa-check text-gold"></i> Dedicated VIP Covered Valet Bay</li>
                <li><i className="fa-solid fa-check text-gold"></i> Unlimited Ultra-Fast EV Supercharging</li>
                <li><i className="fa-solid fa-check text-gold"></i> Complimentary Eco Car Wash Service</li>
                <li><i className="fa-solid fa-check text-gold"></i> Instant Gate Clearance via ANPR Camera</li>
                <li><i className="fa-solid fa-check text-gold"></i> Personal Parking Concierge Support</li>
                <li><i className="fa-solid fa-check text-gold"></i> 100% Guaranteed Space at All 22 Cities</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. TESTIMONIALS SECTION (Exact Matching Figma Design)
          ========================================================= */}
      <section className="easypark-section easypark-testimonials-section" id="testimonials">
        <div className="easypark-container">
          <div className="easypark-testimonials-header">
            <div className="easypark-logo-badge" style={{ width: '38px', height: '38px', fontSize: '1.2rem' }}>P</div>
            <h2 className="easypark-section-title" style={{ margin: 0 }}>TESTIMONIAL</h2>
          </div>
          <p className="easypark-section-subtitle" style={{ marginBottom: '40px' }}>
            Trusted by over 50,000+ drivers, daily urban commuters, and premier enterprise operators nationwide.
          </p>

          <div className="easypark-testimonials-grid">
            {/* Left Big Featured Quote Box */}
            <div className="easypark-featured-quote-card">
              <div className="easypark-quote-icon">
                <i className="fa-solid fa-quote-left"></i>
              </div>
              <p className="easypark-featured-quote-text">
                "{featuredReviews[testimonialIndex].text}"
              </p>
              <div className="easypark-quote-author">
                <img 
                  src={featuredReviews[testimonialIndex].avatar} 
                  alt={featuredReviews[testimonialIndex].name}
                  className="easypark-author-avatar"
                />
                <div className="easypark-author-info">
                  <h4 className="easypark-author-name">{featuredReviews[testimonialIndex].name}</h4>
                  <span className="easypark-author-role">{featuredReviews[testimonialIndex].role}</span>
                </div>
              </div>

              {/* Slider Controls */}
              <div className="easypark-quote-controls">
                <button 
                  onClick={() => setTestimonialIndex(prev => (prev === 0 ? featuredReviews.length - 1 : prev - 1))}
                  className="easypark-control-btn"
                  aria-label="Previous Testimonial"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button 
                  onClick={() => setTestimonialIndex(prev => (prev === featuredReviews.length - 1 ? 0 : prev + 1))}
                  className="easypark-control-btn"
                  aria-label="Next Testimonial"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>

            {/* Right Stacked Testimonial Cards */}
            <div className="easypark-testimonial-stack">
              {/* Card 1: Jane Cooper */}
              <div className="easypark-stack-card">
                <div className="easypark-stack-avatar-wrap">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" 
                    alt="Jane Cooper" 
                    className="easypark-stack-avatar"
                  />
                  <div>
                    <h4 className="easypark-stack-name">Jane Cooper</h4>
                    <span className="easypark-stack-role">Daily Commuter</span>
                  </div>
                </div>
                <div className="easypark-stack-badge">
                  <i className="fa-solid fa-quote-right"></i>
                </div>
              </div>

              {/* Card 2: Jenny Wilson */}
              <div className="easypark-stack-card">
                <div className="easypark-stack-avatar-wrap">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" 
                    alt="Jenny Wilson" 
                    className="easypark-stack-avatar"
                  />
                  <div>
                    <h4 className="easypark-stack-name">Jenny Wilson</h4>
                    <span className="easypark-stack-role">Fleet Manager</span>
                  </div>
                </div>
                <div className="easypark-stack-badge">
                  <i className="fa-solid fa-quote-right"></i>
                </div>
              </div>

              {/* Card 3: Cameron Williamson */}
              <div className="easypark-stack-card">
                <div className="easypark-stack-avatar-wrap">
                  <img 
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" 
                    alt="Cameron Williamson" 
                    className="easypark-stack-avatar"
                  />
                  <div>
                    <h4 className="easypark-stack-name">Cameron Williamson</h4>
                    <span className="easypark-stack-role">Electric Vehicle Owner</span>
                  </div>
                </div>
                <div className="easypark-stack-badge">
                  <i className="fa-solid fa-quote-right"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          5. 22 CITIES SMART PARKING NETWORK
          ========================================================= */}
      <section className="easypark-section easypark-cities-section">
        <div className="easypark-container">
          <div className="easypark-section-header-center">
            <div className="easypark-pill-tag">
              <i className="fa-solid fa-map-location-dot"></i>
              <span>NATIONWIDE COVERAGE</span>
            </div>
            <h2 className="easypark-section-title">22+ INDIAN CITIES NETWORK</h2>
            <p className="easypark-section-subtitle">
              Book real-time parking spaces across all major business hubs, airports, malls, and railway terminals.
            </p>
          </div>

          <div className="easypark-cities-pills">
            {['Delhi', 'Mumbai', 'Bengaluru', 'Indore', 'Bhopal', 'Gurugram', 'Noida', 'Ujjain', 'Varanasi', 'Goa', 'Jaipur', 'Chandigarh', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Lucknow', 'Nagpur', 'Surat', 'Patna', 'Ranchi'].map((city) => (
              <button
                key={city}
                onClick={() => {
                  localStorage.setItem('search_query_redirect', city);
                  navigate('/dashboard?tab=find-parking');
                }}
                className="easypark-city-pill"
              >
                <i className="fa-solid fa-location-pin" style={{ color: 'var(--primary-color)' }}></i>
                <span>{city}</span>
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link to="/dashboard?tab=find-parking" className="easypark-btn-book" style={{ display: 'inline-flex', padding: '14px 36px', fontSize: '1rem' }}>
              <i className="fa-solid fa-magnifying-glass-location"></i>
              <span>Explore All 22+ Smart Parking Lots</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
