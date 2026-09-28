// Core App Controller for ParkSmart India Dashboard SPA
let currentView = '';
let selectedSlotData = null;
let currentLotData = null;
let chartInstances = {};
let qrcodeInstance = null;

// Google Maps global state variables
let googleMapInstance = null;
let googleMarkers = [];
let userCoords = null;
let isGoogleMapsLoaded = false;

// Initialize on page load
window.addEventListener('load', () => {
  const user = auth.getUser();
  if (!user) {
    window.location.href = '/';
    return;
  }

  // Set the dashboard initial theme
  initDashboardTheme();

  // Populate Sidebar User Info
  document.getElementById('sidebar-username').innerText = user.name;
  document.getElementById('sidebar-userrole').innerText = user.role;
  document.getElementById('sidebar-avatar').innerText = user.name.charAt(0).toUpperCase();
  document.getElementById('header-welcome').innerText = `Welcome, ${user.name}!`;

  // Render role-specific navigation menus
  if (user.role === 'admin') {
    document.getElementById('admin-menu').style.display = 'flex';
    switchView('admin-dash');
  } else {
    document.getElementById('user-menu').style.display = 'flex';
    switchView('user-dash');
  }

  // Fetch unread alerts
  fetchUnreadNotificationsCount();
  
  // Register app hooks globally for Socket client scripts
  window.app = {
    handleRealtimeSlotUpdate,
    showNotificationToast,
    refreshActiveViews
  };

  // Fetch Google Maps Config and Load SDK
  loadGoogleMapsScript();

  // Setup Autocomplete inputs
  setupSearchAutocomplete();

  // Check redirect caches from landing homepage
  const queryRedirect = localStorage.getItem('search_query_redirect');
  if (queryRedirect) {
    localStorage.removeItem('search_query_redirect');
    const searchInput = document.getElementById('parking-search-query');
    if (searchInput) {
      searchInput.value = queryRedirect;
      setTimeout(() => {
        searchParkingLots();
      }, 800);
    }
  }

  const coordsRedirect = localStorage.getItem('user_coords_redirect');
  if (coordsRedirect) {
    localStorage.removeItem('user_coords_redirect');
    userCoords = JSON.parse(coordsRedirect);
    setTimeout(() => {
      if (isGoogleMapsLoaded && googleMapInstance) {
        googleMapInstance.setCenter(userCoords);
        googleMapInstance.setZoom(13);
      }
      searchParkingLots();
    }, 800);
  }
});

// Theme Toggle Management
function initDashboardTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const themeBtn = document.getElementById('theme-btn');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeBtn) themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.body.classList.remove('light-theme');
    if (themeBtn) themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  const theme = isLight ? 'light' : 'dark';
  localStorage.setItem('theme', theme);
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }
  updateChartThemes();
}

function updateChartThemes() {
  const isLight = document.body.classList.contains('light-theme');
  const textColor = isLight ? '#0f172a' : '#f3f4f6';
  const gridColor = isLight ? '#e2e8f0' : '#2e3748';
  const borderColor = isLight ? '#e2e8f0' : '#2e3748';

  if (chartInstances.occupancy) {
    chartInstances.occupancy.options.plugins.legend.labels.color = textColor;
    chartInstances.occupancy.data.datasets[0].borderColor = borderColor;
    chartInstances.occupancy.update();
  }
  if (chartInstances.revenue) {
    chartInstances.revenue.options.plugins.legend.labels.color = textColor;
    chartInstances.revenue.options.scales.y.grid.color = gridColor;
    chartInstances.revenue.options.scales.y.ticks.color = textColor;
    chartInstances.revenue.options.scales.y1.ticks.color = textColor;
    chartInstances.revenue.options.scales.x.ticks.color = textColor;
    chartInstances.revenue.update();
  }
  if (chartInstances.peakHours) {
    chartInstances.peakHours.options.plugins.legend.labels.color = textColor;
    chartInstances.peakHours.options.scales.y.grid.color = gridColor;
    chartInstances.peakHours.options.scales.y.ticks.color = textColor;
    chartInstances.peakHours.options.scales.x.ticks.color = textColor;
    chartInstances.peakHours.update();
  }
}

// Router and View Management
function switchView(viewName) {
  currentView = viewName;

  // Update Sidebar active state
  document.querySelectorAll('.sidebar-menu-item').forEach(el => el.classList.remove('active'));
  
  let menuId = 'menu-' + viewName;
  if (viewName === 'live-slots') {
    menuId = 'menu-find-parking'; // Keep Find Parking highlighted
  }
  const menuEl = document.getElementById(menuId);
  if (menuEl) menuEl.classList.add('active');

  // Toggle visible panels
  document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active-view'));
  const viewPanel = document.getElementById('view-' + viewName);
  if (viewPanel) viewPanel.classList.add('active-view');

  // Update Page Header Title
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    let title = 'Dashboard';
    switch (viewName) {
      case 'user-dash': title = 'Dashboard'; break;
      case 'find-parking': title = 'Find Parking'; break;
      case 'live-slots': title = 'Select Slot'; break;
      case 'user-bookings': title = 'My Bookings'; break;
      case 'payment-history': title = 'Payment History'; break;
      case 'user-profile': title = 'Vehicle & Profile Settings'; break;
      case 'notifications': title = 'My Notifications'; break;
      case 'admin-dash': title = 'Admin Analytics'; break;
      case 'admin-parking': title = 'Lot Management'; break;
      case 'admin-bookings': title = 'All Bookings'; break;
      case 'admin-users': title = 'User Management'; break;
      case 'admin-entry-exit': title = 'Entry/Exit Gate Operations'; break;
      case 'admin-iot': title = 'IoT Simulation Control'; break;
      case 'admin-payments': title = 'Payments Transaction Log'; break;
    }
    titleEl.innerText = title;
  }

  // Load view-specific dynamic data
  switch (viewName) {
    case 'user-dash':
      loadUserDashboard();
      break;
    case 'find-parking':
      searchParkingLots();
      break;
    case 'user-bookings':
      loadUserBookings();
      break;
    case 'payment-history':
      loadUserPayments();
      break;
    case 'user-profile':
      loadUserProfile();
      break;
    case 'notifications':
      loadNotifications();
      break;
    case 'admin-dash':
      loadAdminDashboard();
      break;
    case 'admin-parking':
      loadAdminParkingLots();
      break;
    case 'admin-bookings':
      loadAdminBookings();
      break;
    case 'admin-users':
      loadAdminUsers();
      break;
    case 'admin-entry-exit':
      loadGateOperations();
      break;
    case 'admin-iot':
      loadIotSimulatorLots();
      break;
    case 'admin-payments':
      loadAdminPayments();
      break;
  }
}

function refreshActiveViews() {
  if (currentView) {
    switch (currentView) {
      case 'user-dash': loadUserDashboard(); break;
      case 'find-parking': searchParkingLots(); break;
      case 'user-bookings': loadUserBookings(); break;
      case 'payment-history': loadUserPayments(); break;
      case 'user-profile': loadUserProfile(); break;
      case 'notifications': loadNotifications(); break;
      case 'admin-dash': loadAdminDashboard(); break;
      case 'admin-parking': loadAdminParkingLots(); break;
      case 'admin-bookings': loadAdminBookings(); break;
      case 'admin-users': loadAdminUsers(); break;
      case 'admin-entry-exit': loadGateOperations(); break;
      case 'admin-iot': loadIotSlots(); break;
      case 'admin-payments': loadAdminPayments(); break;
    }
  }
}

// Socket UI Update triggers
async function handleRealtimeSlotUpdate(data) {
  console.log('Realtime slot update received in app.js:', data);
  if (currentView === 'live-slots' && currentLotData && currentLotData._id === data.parkingLotId) {
    try {
      const slotsData = await auth.fetch(`/api/parking/${currentLotData._id}/slots`);
      if (slotsData.success) {
        renderSlotsGrid(slotsData.slots);
      }
    } catch (e) {
      console.error('Error reloading live slots on real-time event:', e);
    }
  }
  if (currentView === 'admin-iot') {
    const select = document.getElementById('iot-lot-select');
    if (select && select.value === data.parkingLotId) {
      loadIotSlots();
    }
  }
}

function getStatusBadgeColorClass(status) {
  switch (status) {
    case 'available': return 'success';
    case 'reserved': return 'warning';
    case 'occupied': return 'danger';
    case 'maintenance': return 'neutral';
    default: return 'neutral';
  }
}

// Get user role helper
function getUserRole() {
  const user = auth.getUser();
  return user ? user.role : 'user';
}

// Show premium toast alerts
function showNotificationToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'danger') icon = 'fa-exclamation-circle';
  if (type === 'warning') icon = 'fa-exclamation-triangle';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <div class="toast-message">${message}</div>
    <i class="fa-solid fa-xmark toast-close" onclick="this.parentElement.remove()"></i>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 6000);
}

// Dynamic Google Maps Script Ingestion
async function loadGoogleMapsScript() {
  try {
    const config = await fetch('/api/config/maps').then(res => res.json());
    if (config.apiKey && config.apiKey !== 'your_key') {
      window.initGoogleMap = initGoogleMap;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=places&callback=initGoogleMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      console.warn('Google Maps API Key not configured or placeholder detected. Initializing interactive mockup map instead.');
      initMockMap();
    }
  } catch (error) {
    console.error('Failed loading maps config', error);
    initMockMap();
  }
}

// Initialize Actual Google Map instance
function initGoogleMap() {
  isGoogleMapsLoaded = true;
  const mapElement = document.getElementById('google-map');
  if (!mapElement) return;

  mapElement.innerHTML = ''; // clear loading message
  
  // Default coordinates (India center: Nagpur)
  const defaultCoords = { lat: 21.1458, lng: 79.0882 };
  
  googleMapInstance = new google.maps.Map(mapElement, {
    center: defaultCoords,
    zoom: 5,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#161c2d' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#161c2d' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#f3f4f6' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e3748' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2e3748' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0f19' }] }
    ]
  });

  console.log('Google Maps API successfully initialized.');
}

// Initialize Mock Interactive Map if key is unavailable
function initMockMap() {
  isGoogleMapsLoaded = false;
  const mapElement = document.getElementById('google-map');
  if (!mapElement) return;

  mapElement.innerHTML = `
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle, #1e2640 0%, #161c2d 100%);">
      <i class="fa-solid fa-map-location-dot" style="font-size: 3.5rem; color: var(--primary-color); margin-bottom: 12px; filter: drop-shadow(0 0 10px var(--primary-glow));"></i>
      <h3 style="font-family: Outfit, sans-serif;">ParkSmart India Radar Mockup</h3>
      <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px; padding: 0 20px; text-align: center;">
        Interactive Geolocation enabled. Plotting nearby parking lots on simulated radar.
      </p>
      <div id="mock-radar-status" style="font-size: 0.8rem; color: var(--success-color); font-weight: bold; margin-top: 10px;"></div>
    </div>
  `;
}

// Setup autocomplete suggestion dropdown matching Indian cities list
function setupSearchAutocomplete() {
  const input = document.getElementById('parking-search-query');
  const suggestionsBox = document.getElementById('autocomplete-suggestions');
  if (!input || !suggestionsBox) return;

  const cities = [
    'Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Indore', 'Bhopal', 'Noida', 'Gurugram', 
    'Jaipur', 'Ujjain', 'Varanasi', 'Goa', 'Hyderabad', 'Chennai', 'Kolkata', 
    'Chandigarh', 'Ahmedabad', 'Lucknow', 'Nagpur', 'Surat', 'Patna', 'Ranchi'
  ];

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    suggestionsBox.innerHTML = '';
    
    if (!val) {
      suggestionsBox.style.display = 'none';
      return;
    }

    const matches = cities.filter(c => c.toLowerCase().includes(val));
    if (matches.length === 0) {
      suggestionsBox.style.display = 'none';
      return;
    }

    suggestionsBox.innerHTML = matches.map(m => `
      <div class="suggestion-item" onclick="selectSuggestion('${m}')">
        <i class="fa-solid fa-location-dot suggestion-icon"></i>
        <span class="suggestion-text"><strong>${m}</strong>, India</span>
      </div>
    `).join('');
    
    suggestionsBox.style.display = 'block';
  });

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target !== input && e.target !== suggestionsBox) {
      suggestionsBox.style.display = 'none';
    }
  });
}

function selectSuggestion(city) {
  document.getElementById('parking-search-query').value = `${city}, India`;
  document.getElementById('autocomplete-suggestions').style.display = 'none';
  searchParkingLots();
}

// Geolocation: Use Browser Geolocation API
function useMyLocation() {
  if (!navigator.geolocation) {
    showNotificationToast('Geolocation is not supported by your browser.', 'danger');
    return;
  }

  showNotificationToast('Detecting location...', 'info');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      showNotificationToast('Location detected successfully!', 'success');

      // Update Map View
      if (isGoogleMapsLoaded && googleMapInstance) {
        googleMapInstance.setCenter(userCoords);
        googleMapInstance.setZoom(13);
        
        // Add User Marker
        new google.maps.Marker({
          position: userCoords,
          map: googleMapInstance,
          title: 'Your Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-pushpin.png'
          }
        });
      } else {
        const statusDiv = document.getElementById('mock-radar-status');
        if (statusDiv) {
          statusDiv.innerHTML = `<i class="fa-solid fa-crosshairs"></i> Position: ${userCoords.lat.toFixed(4)} N, ${userCoords.lng.toFixed(4)} E (Center mapped)`;
        }
      }

      // Re-trigger search to calculate distances
      searchParkingLots();
    },
    (error) => {
      console.warn('Geolocation Error:', error);
      showNotificationToast('Permission to access location was denied.', 'warning');
    }
  );
}

// Haversine Distance Calculator (km)
function calculateHaversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

// Search and Render Parking Lots (with distance calculations)
async function searchParkingLots() {
  const query = document.getElementById('parking-search-query').value.split(',')[0].trim();
  
  try {
    let url = '/api/parking?status=active';
    if (query) url += `&city=${encodeURIComponent(query)}`;

    const data = await auth.fetch(url);
    const container = document.getElementById('parking-lots-container');

    if (data.success) {
      let lots = data.lots;

      // Calculate distance if userCoords available
      if (userCoords) {
        lots = lots.map(lot => {
          const dist = calculateHaversineDistance(userCoords, { lat: lot.latitude, lng: lot.longitude });
          return { ...lot, distance: dist };
        });
        
        // Sort by distance ascending
        lots.sort((a, b) => a.distance - b.distance);
      }

      // Render Google Maps Pins
      if (isGoogleMapsLoaded && googleMapInstance) {
        // Clear old markers
        googleMarkers.forEach(m => m.setMap(null));
        googleMarkers = [];

        lots.forEach(lot => {
          const marker = new google.maps.Marker({
            position: { lat: lot.latitude, lng: lot.longitude },
            map: googleMapInstance,
            title: lot.name
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="color: #161c2d; padding: 10px; max-width: 200px;">
                <h4 style="color: #161c2d; margin-bottom: 5px;">${lot.name}</h4>
                <p style="font-size: 0.8rem; margin: 2px 0;">Rate: ₹${lot.pricePerHour}/hr</p>
                <p style="font-size: 0.8rem; color: #10b981; font-weight: bold;">Slots: ${lot.availableSlots} free</p>
                <button onclick="openSlotSelector('${lot._id}')" style="background:#6366f1; color:white; border:none; padding:4px 8px; font-size:0.75rem; border-radius:4px; margin-top:8px; cursor:pointer;">Book Now</button>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapInstance, marker);
          });

          googleMarkers.push(marker);
        });

        // Autofit map boundaries if lots returned
        if (lots.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          lots.forEach(lot => bounds.extend({ lat: lot.latitude, lng: lot.longitude }));
          googleMapInstance.fitBounds(bounds);
        }
      }

      // Render cards
      if (lots.length === 0) {
        container.innerHTML = `
          <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
            <i class="fa-solid fa-parking" style="font-size: 3rem; margin-bottom: 16px;"></i>
            <p>No parking lots matching search found.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = lots.map(lot => {
        const distanceText = lot.distance ? `${lot.distance.toFixed(1)} km away` : 'Nagpur (Geocentered)';
        const ratingStars = '⭐'.repeat(Math.round(lot.rating || 4));
        const amenitiesBadges = (lot.amenities || []).map(a => `
          <span style="font-size: 0.7rem; background: rgba(99,102,241,0.1); color: var(--primary-color); padding: 2px 6px; border-radius: 4px; display: inline-block;">${a}</span>
        `).join(' ');

        return `
          <div class="parking-lot-card glass-card">
            <div style="position: relative; overflow: hidden; border-radius: 8px; height: 140px; margin-bottom: 14px; border: 1px solid var(--border-color);">
              <img src="${lot.images && lot.images[0] ? lot.images[0] : 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80'}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="parking-lot-name">${lot.name}</div>
            <div class="parking-lot-address"><i class="fa-solid fa-location-dot"></i> ${lot.address}, ${lot.city}</div>
            
            <div style="font-size: 0.85rem; color: var(--warning-color); margin-bottom: 10px;">
              ${ratingStars} <span style="color: var(--text-secondary); font-size: 0.8rem;">(${lot.rating || 4.2}/5)</span>
            </div>

            <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 6px;">
              ${amenitiesBadges}
            </div>

            <div class="parking-lot-stats">
              <div class="lot-stat-item">
                <span class="lot-stat-label">Available Slots</span>
                <span class="lot-stat-value" style="color: ${lot.availableSlots > 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
                  ${lot.availableSlots} / ${lot.totalSlots}
                </span>
              </div>
              <div class="lot-stat-item">
                <span class="lot-stat-label">Distance</span>
                <span class="lot-stat-value" style="font-size: 0.9rem; color: var(--primary-color);">${distanceText}</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">Base price</span>
                <span class="parking-lot-price">₹${lot.pricePerHour}/hr</span>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">Peak surge</span>
                <span style="font-size: 1.1rem; font-weight: 700; color: var(--warning-color);">₹${lot.peakPricePerHour}/hr</span>
              </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; margin-top: auto;" onclick="openSlotSelector('${lot._id}')">
              View Live Slots & Book <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    showNotificationToast('Search query failed.', 'danger');
  }
}

// Fetch lot details & slot map layout
async function openSlotSelector(lotId) {
  try {
    const lotData = await auth.fetch(`/api/parking/${lotId}`);
    const slotsData = await auth.fetch(`/api/parking/${lotId}/slots`);
    const reviewsData = await auth.fetch(`/api/parking/${lotId}/reviews`);

    if (lotData.success && slotsData.success) {
      currentLotData = lotData.lot;
      
      // Update Slot layout Header details
      document.getElementById('slot-view-lot-name').innerText = currentLotData.name;
      document.getElementById('slot-view-lot-address').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${currentLotData.address}, ${currentLotData.city}, ${currentLotData.state}`;

      // Reset form variables
      selectedSlotData = null;
      document.getElementById('book-slot-number').value = '';
      document.getElementById('book-slot-id').value = '';
      document.getElementById('book-price-estimate').innerText = '₹0';
      
      // Load user vehicles
      const user = auth.getUser();
      const vehicleSelect = document.getElementById('book-vehicle-select');
      if (user && user.vehicles && user.vehicles.length > 0) {
        vehicleSelect.innerHTML = user.vehicles.map(v => `
          <option value="${v.vehicleNumber}" data-type="${v.vehicleType}">${v.vehicleNumber} (${v.vehicleType.toUpperCase()} - ${v.vehicleModel || ''})</option>
        `).join('');
      } else {
        vehicleSelect.innerHTML = '<option value="" disabled selected>No vehicles added. Profile tab -> Add Vehicle</option>';
      }

      // Populate default start/end times
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getMinutes() % 15);
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      
      const formatDateTimeLocal = (date) => {
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset*60*1000));
        return adjustedDate.toISOString().slice(0, 16);
      };

      document.getElementById('book-start-time').value = formatDateTimeLocal(now);
      document.getElementById('book-end-time').value = formatDateTimeLocal(inOneHour);

      // Render slots layout grid
      renderSlotsGrid(slotsData.slots);

      // Render reviews
      renderReviews(reviewsData.reviews || []);

      switchView('live-slots');
    }
  } catch (error) {
    showNotificationToast('Failed to fetch slot availability.', 'danger');
  }
}

// Render slot layouts
function renderSlotsGrid(slots) {
  const container = document.getElementById('live-slots-grid');
  container.innerHTML = slots.map(slot => {
    let typeIcon = 'fa-car';
    if (slot.vehicleType === 'bike') typeIcon = 'fa-motorcycle';
    if (slot.vehicleType === 'ev') typeIcon = 'fa-charging-station';
    if (slot.vehicleType === 'disabled') typeIcon = 'fa-wheelchair';

    return `
      <div class="slot-block ${slot.status}" id="slot-card-${slot._id}" onclick="selectSlot('${slot._id}', '${slot.slotNumber}', '${slot.status}', '${slot.vehicleType}')">
        <span class="slot-status-indicator"></span>
        <div class="slot-number">${slot.slotNumber}</div>
        <div class="slot-type-icon"><i class="fa-solid ${typeIcon}"></i></div>
        <span style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase;">${slot.vehicleType}</span>
      </div>
    `;
  }).join('');
}

// Select slot card
function selectSlot(id, slotNumber, status, vehicleType) {
  if (status !== 'available') {
    showNotificationToast(`Slot ${slotNumber} is ${status.toUpperCase()}.`, 'warning');
    return;
  }

  document.querySelectorAll('.slot-block').forEach(el => {
    el.classList.remove('selected-slot');
  });

  const el = document.getElementById(`slot-card-${id}`);
  if (el) el.classList.add('selected-slot');

  selectedSlotData = { id, slotNumber, vehicleType };
  document.getElementById('book-slot-number').value = slotNumber;
  document.getElementById('book-slot-id').value = id;

  const vehicleSelect = document.getElementById('book-vehicle-select');
  for (let option of vehicleSelect.options) {
    if (option.getAttribute('data-type') === vehicleType) {
      vehicleSelect.value = option.value;
      break;
    }
  }

  estimatePrice();
}

// Estimate dynamic pricing
async function estimatePrice() {
  if (!currentLotData || !selectedSlotData) return;

  const startTime = document.getElementById('book-start-time').value;
  const endTime = document.getElementById('book-end-time').value;
  const vehicleSelect = document.getElementById('book-vehicle-select');
  const vehicleOption = vehicleSelect.options[vehicleSelect.selectedIndex];
  
  if (!startTime || !endTime || !vehicleOption) return;
  const vehicleType = vehicleOption.getAttribute('data-type');

  try {
    const data = await auth.fetch('/api/bookings/estimate', {
      method: 'POST',
      body: JSON.stringify({
        parkingLotId: currentLotData._id,
        startTime,
        endTime,
        vehicleType
      })
    });

    if (data.success) {
      document.getElementById('book-price-estimate').innerText = `₹${data.amount}`;
    }
  } catch (error) {
    console.error('Estimation error:', error);
  }
}

// Directions trigger
function getDirectionsAction() {
  if (!currentLotData) return;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${currentLotData.latitude},${currentLotData.longitude}`;
  window.open(url, '_blank');
}

// Submit Reservation booking
async function submitBooking(e) {
  e.preventDefault();
  
  if (!selectedSlotData) {
    showNotificationToast('Please select a slot first.', 'warning');
    return;
  }

  const slotId = document.getElementById('book-slot-id').value;
  const vehicleNumber = document.getElementById('book-vehicle-select').value;
  const startTime = document.getElementById('book-start-time').value;
  const endTime = document.getElementById('book-end-time').value;

  if (!vehicleNumber) {
    showNotificationToast('Register a vehicle before booking.', 'warning');
    return;
  }

  try {
    const bookingRes = await auth.fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        parkingLotId: currentLotData._id,
        slotId,
        vehicleNumber,
        vehicleType: selectedSlotData.vehicleType,
        startTime,
        endTime
      })
    });

    if (bookingRes.success) {
      openRazorpayPaymentMock(bookingRes.booking);
    } else {
      showNotificationToast(bookingRes.message || 'Booking overlap conflict.', 'danger');
    }
  } catch (err) {
    showNotificationToast('API error, please try again.', 'danger');
  }
}

// Razorpay checkout modal simulation
function openRazorpayPaymentMock(booking) {
  document.getElementById('rzp-modal-amount').innerText = `₹${booking.amount}.00`;
  document.getElementById('rzp-modal-details').innerText = `Booking Plate: ${booking.vehicleNumber} | Slot: ${selectedSlotData.slotNumber}`;
  
  const payBtn = document.getElementById('rzp-pay-button');
  payBtn.onclick = () => processMockPayment(booking);

  openModal('razorpay-mock-modal');
}

async function processMockPayment(booking) {
  const paymentStatus = document.getElementById('rzp-mock-status').value;
  closeModal('razorpay-mock-modal');

  showNotificationToast('Verifying transaction details...', 'info');

  try {
    const response = await auth.fetch('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: booking._id,
        transactionId: paymentStatus === 'success' ? `pay_${cryptoRandomString(12)}` : `pay_fail_${cryptoRandomString(12)}`,
        paymentStatus
      })
    });

    if (response.success) {
      showNotificationToast('🎉 Reservation confirmed successfully!', 'success');
      viewTicket(booking._id);
      switchView('user-bookings');
    } else {
      showNotificationToast('❌ Checkout transaction failed.', 'danger');
    }
  } catch (err) {
    showNotificationToast('Verification API failed.', 'danger');
  }
}

function cryptoRandomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';
  for (let i = 0; i < len; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

// Digital QR Ticket modal
async function viewTicket(bookingId) {
  try {
    const data = await auth.fetch(`/api/bookings/${bookingId}`);
    if (data.success) {
      const b = data.booking;
      
      document.getElementById('ticket-lot-name').innerText = b.parkingLotId.name;
      document.getElementById('ticket-user-name').innerText = b.userId.name;
      document.getElementById('ticket-slot-num').innerText = b.slotId.slotNumber;
      document.getElementById('ticket-vehicle-num').innerText = b.vehicleNumber;
      document.getElementById('ticket-amount').innerText = `₹${b.amount}.00`;
      document.getElementById('ticket-status').innerText = b.status.toUpperCase();
      
      const startStr = new Date(b.startTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const timeRange = `${startStr}, ${new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(b.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      document.getElementById('ticket-time-range').innerText = timeRange;

      const qrContainer = document.getElementById('qrcode');
      qrContainer.innerHTML = '';
      
      qrcodeInstance = new QRCode(qrContainer, {
        text: b.qrToken,
        width: 150,
        height: 150,
        colorDark : "#0b0f19",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
      });

      document.getElementById('ticket-qr-label').innerText = `Pass Token: ${b.qrToken.slice(0, 12)}...`;

      openModal('ticket-modal');
    }
  } catch (error) {
    showNotificationToast('Failed pulling receipt details.', 'danger');
  }
}

// Cancel Booking
async function cancelBookingAction(id) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  try {
    const data = await auth.fetch(`/api/bookings/${id}/cancel`, { method: 'PUT' });
    if (data.success) {
      showNotificationToast('Booking cancelled.', 'success');
      refreshActiveViews();
    } else {
      showNotificationToast(data.message, 'danger');
    }
  } catch (error) {
    showNotificationToast('Cancellation request failed.', 'danger');
  }
}

// Render reviews on parking slot selection page
function renderReviews(reviews) {
  const container = document.getElementById('reviews-list-container');
  if (reviews.length === 0) {
    container.innerHTML = '<p class="text-secondary" style="font-size: 0.9rem;">No reviews posted yet. Be the first to leave a comment!</p>';
    return;
  }

  container.innerHTML = reviews.map(r => `
    <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 16px; border-radius: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong>${r.userId ? r.userId.name : 'Verified Customer'}</strong>
        <span style="color: var(--warning-color);">${'⭐'.repeat(r.rating)}</span>
      </div>
      <p style="font-size: 0.9rem; color: var(--text-secondary);">${r.comment}</p>
      <span style="font-size: 0.75rem; color: rgba(255,255,255,0.2); display: block; margin-top: 8px;">${new Date(r.createdAt).toLocaleDateString()}</span>
    </div>
  `).join('');
}

// Submit Customer Review
async function submitReview(e) {
  e.preventDefault();
  if (!currentLotData) return;

  const rating = parseInt(document.getElementById('review-rating').value, 10);
  const comment = document.getElementById('review-comment').value;

  try {
    const data = await auth.fetch(`/api/parking/${currentLotData._id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });

    if (data.success) {
      showNotificationToast('Review posted successfully!', 'success');
      document.getElementById('add-review-form').reset();
      
      // reload reviews
      const reviewsRes = await auth.fetch(`/api/parking/${currentLotData._id}/reviews`);
      renderReviews(reviewsRes.reviews || []);
    } else {
      showNotificationToast(data.message || 'Review submission rejected.', 'warning');
    }
  } catch (error) {
    showNotificationToast('Failed submitting review.', 'danger');
  }
}

// 8. User Dashboard Stats
async function loadUserDashboard() {
  try {
    const bookingsData = await auth.fetch('/api/bookings/my');
    const lotsData = await auth.fetch('/api/parking');

    if (bookingsData.success && lotsData.success) {
      const bookings = bookingsData.bookings;
      const lotsCount = lotsData.lots.filter(l => l.status === 'active').length;
      
      const totalBookings = bookings.length;
      const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'confirmed');
      const totalSpent = bookings
        .filter(b => b.status !== 'pending' && b.status !== 'cancelled')
        .reduce((sum, b) => sum + b.amount, 0);

      document.getElementById('ud-stat-available').innerText = lotsCount;
      document.getElementById('ud-stat-active').innerText = activeBookings.length;
      document.getElementById('ud-stat-total').innerText = totalBookings;
      document.getElementById('ud-stat-spent').innerText = `₹${totalSpent}`;

      const activeContent = document.getElementById('ud-active-booking-content');
      if (activeBookings.length > 0) {
        const latestActive = activeBookings[0];
        const statusBadge = getStatusBadgeClass(latestActive.status);
        activeContent.innerHTML = `
          <div class="glass-card" style="background: rgba(255,255,255,0.01); border-color: var(--primary-color);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="color: var(--primary-color);">${latestActive.parkingLotId.name}</h4>
              <span class="badge ${statusBadge}">${latestActive.status}</span>
            </div>
            <p style="font-size: 0.9rem; margin-bottom: 8px;">
              <span class="text-secondary">Assigned Slot:</span> <strong>${latestActive.slotId.slotNumber}</strong> (${latestActive.slotId.vehicleType.toUpperCase()})
            </p>
            <p style="font-size: 0.9rem; margin-bottom: 8px;">
              <span class="text-secondary">Vehicle Number:</span> <strong>${latestActive.vehicleNumber}</strong>
            </p>
            <p style="font-size: 0.9rem; margin-bottom: 16px;">
              <span class="text-secondary">Time:</span> <strong>${new Date(latestActive.startTime).toLocaleString()} - ${new Date(latestActive.endTime).toLocaleTimeString()}</strong>
            </p>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.85rem;" onclick="viewTicket('${latestActive._id}')">
                <i class="fa-solid fa-qrcode"></i> View QR Ticket
              </button>
              ${latestActive.status === 'confirmed' ? `
                <button class="btn btn-danger" style="padding: 8px 16px; font-size: 0.85rem;" onclick="cancelBookingAction('${latestActive._id}')">
                  Cancel Booking
                </button>
              ` : ''}
            </div>
          </div>
        `;
      } else {
        activeContent.innerHTML = `
          <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
            <i class="fa-solid fa-ticket" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--border-color);"></i>
            <p>No active reservations.</p>
            <button class="btn btn-primary" onclick="switchView('find-parking')" style="margin-top: 14px; padding: 8px 16px;">Search & Book Spot</button>
          </div>
        `;
      }

      const quickLots = document.getElementById('ud-quick-lots');
      quickLots.innerHTML = lotsData.lots.slice(0, 3).map(lot => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${lot.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${lot.city}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; color: var(--success-color);">${lot.availableSlots} / ${lot.totalSlots} free</div>
            <div style="font-size: 0.75rem; color: var(--primary-color);">₹${lot.pricePerHour}/hr</div>
          </div>
        </div>
      `).join('') || '<p class="text-secondary">No slots seeded.</p>';
    }
  } catch (error) {
    console.error(error);
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'pending': return 'badge-warning';
    case 'confirmed': return 'badge-success';
    case 'active': return 'badge-info';
    case 'completed': return 'badge-success';
    case 'cancelled': return 'badge-danger';
    case 'expired': return 'badge-neutral';
    default: return 'badge-neutral';
  }
}

// 9. Load User Bookings History
async function loadUserBookings() {
  try {
    const data = await auth.fetch('/api/bookings/my');
    const tbody = document.getElementById('user-bookings-table-body');
    if (data.success) {
      if (data.bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-secondary);">No bookings recorded.</td></tr>';
        return;
      }

      tbody.innerHTML = data.bookings.map(b => {
        const badgeColor = getStatusBadgeClass(b.status);
        return `
          <tr>
            <td style="font-family: monospace;">${b._id.slice(-8)}</td>
            <td><strong>${b.parkingLotId.name}</strong></td>
            <td>${b.slotId.slotNumber} (${b.slotId.vehicleType.toUpperCase()})</td>
            <td>${b.vehicleNumber}</td>
            <td style="font-size: 0.8rem;">${new Date(b.startTime).toLocaleString()}</td>
            <td style="font-size: 0.8rem;">${new Date(b.endTime).toLocaleString()}</td>
            <td><strong>₹${b.amount}</strong></td>
            <td><span class="badge ${badgeColor}">${b.status}</span></td>
            <td>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.75rem;" onclick="viewTicket('${b._id}')">
                  <i class="fa-solid fa-qrcode"></i> Ticket
                </button>
                ${b.status === 'confirmed' ? `
                  <button class="btn btn-danger" style="padding: 6px 10px; font-size: 0.75rem;" onclick="cancelBookingAction('${b._id}')">
                    Cancel
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (error) {
    console.error(error);
  }
}

// 10. Load User Payments
async function loadUserPayments() {
  try {
    const data = await auth.fetch('/api/bookings/my');
    const tbody = document.getElementById('user-payments-table-body');
    if (data.success) {
      const paidBookings = data.bookings.filter(b => b.status !== 'pending');
      if (paidBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No payments logged.</td></tr>';
        return;
      }
      tbody.innerHTML = paidBookings.map(b => `
        <tr>
          <td style="font-family: monospace; color: var(--primary-color);">TXN-${b.qrToken.slice(0, 12).toUpperCase()}</td>
          <td style="font-family: monospace;">${b._id.slice(-8)}</td>
          <td><strong>₹${b.amount}.00</strong></td>
          <td style="font-size: 0.85rem;">${new Date(b.createdAt).toLocaleString()}</td>
          <td><span class="badge badge-success">Success</span></td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error(error);
  }
}

// 11. Profile & Vehicles
async function loadUserProfile() {
  const user = auth.getUser();
  if (!user) return;

  document.getElementById('profile-name').value = user.name;
  document.getElementById('profile-email').value = user.email;
  document.getElementById('profile-phone').value = user.phone;

  renderVehicles(user.vehicles);
}

function renderVehicles(vehicles) {
  const container = document.getElementById('vehicles-list-container');
  if (!vehicles || vehicles.length === 0) {
    container.innerHTML = '<p class="text-secondary" style="font-size: 0.9rem;">No registered vehicles.</p>';
    return;
  }
  container.innerHTML = vehicles.map(v => {
    let icon = 'fa-car';
    if (v.vehicleType === 'bike') icon = 'fa-motorcycle';
    if (v.vehicleType === 'ev') icon = 'fa-charging-station';
    if (v.vehicleType === 'disabled') icon = 'fa-wheelchair';
    return `
      <div class="vehicle-badge-item">
        <div class="vehicle-badge-info">
          <i class="fa-solid ${icon}" style="color: var(--primary-color); font-size: 1.2rem;"></i>
          <div>
            <strong>${v.vehicleNumber}</strong>
            <span style="font-size: 0.7rem; color: var(--text-secondary); display: block; text-transform: uppercase;">${v.vehicleType}</span>
          </div>
        </div>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.75rem; color: var(--danger-color); border-color: rgba(239, 68, 68, 0.2);" onclick="deleteVehicle('${v.vehicleNumber}')">
          Delete
        </button>
      </div>
    `;
  }).join('');
}

async function updateProfileInfo(e) {
  e.preventDefault();
  const name = document.getElementById('profile-name').value;
  const phone = document.getElementById('profile-phone').value;

  try {
    const data = await auth.fetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, phone })
    });
    if (data.success) {
      auth.setUser(data.user);
      showNotificationToast('Profile saved.', 'success');
      document.getElementById('sidebar-username').innerText = data.user.name;
    }
  } catch (error) {
    showNotificationToast('Update failed.', 'danger');
  }
}

async function addNewVehicle(e) {
  e.preventDefault();
  const vehicleNumber = document.getElementById('new-vehicle-num').value.toUpperCase();
  const vehicleType = document.getElementById('new-vehicle-type').value;

  const user = auth.getUser();
  if (!user) return;

  if (user.vehicles.some(v => v.vehicleNumber === vehicleNumber)) {
    showNotificationToast('Vehicle plate already exists.', 'warning');
    return;
  }

  const updatedVehicles = [...user.vehicles, { vehicleNumber, vehicleType }];

  try {
    const data = await auth.fetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ vehicles: updatedVehicles })
    });
    if (data.success) {
      auth.setUser(data.user);
      showNotificationToast('Vehicle registered!', 'success');
      renderVehicles(data.user.vehicles);
      document.getElementById('vehicle-add-form').reset();
    }
  } catch (error) {
    showNotificationToast('Registration failed.', 'danger');
  }
}

async function deleteVehicle(plate) {
  if (!confirm(`Delete vehicle ${plate}?`)) return;
  const user = auth.getUser();
  if (!user) return;

  const updatedVehicles = user.vehicles.filter(v => v.vehicleNumber !== plate);

  try {
    const data = await auth.fetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ vehicles: updatedVehicles })
    });
    if (data.success) {
      auth.setUser(data.user);
      showNotificationToast('Vehicle deleted.', 'success');
      renderVehicles(data.user.vehicles);
    }
  } catch (error) {
    showNotificationToast('Delete failed.', 'danger');
  }
}

// 12. Load In-App Notifications
async function loadNotifications() {
  try {
    const data = await auth.fetch('/api/notifications');
    const container = document.getElementById('notifications-list-container');
    if (data.success) {
      const unread = data.notifications.filter(n => !n.isRead).length;
      updateNotificationBadgeUI(unread);

      if (data.notifications.length === 0) {
        container.innerHTML = '<p class="text-secondary" style="text-align: center; padding: 20px;">No alerts in inbox.</p>';
        return;
      }

      container.innerHTML = data.notifications.map(n => {
        let icon = 'fa-info-circle';
        let color = 'info';
        if (n.type === 'payment_success') { icon = 'fa-credit-card'; color = 'success'; }
        if (n.type === 'booking_confirmed') { icon = 'fa-calendar-check'; color = 'success'; }
        if (n.type === 'entry_success') { icon = 'fa-car'; color = 'success'; }
        if (n.type === 'exit_success') { icon = 'fa-flag-checkered'; color = 'info'; }
        if (n.type === 'cancelled') { icon = 'fa-xmark'; color = 'danger'; }
        if (n.type === 'reminder') { icon = 'fa-clock'; color = 'warning'; }

        return `
          <div class="notification-list-item ${n.isRead ? '' : 'unread'}" onclick="markNotificationRead('${n._id}')" style="cursor: pointer;">
            <div class="notification-list-icon ${color}">
              <i class="fa-solid ${icon}"></i>
            </div>
            <div class="notification-list-content">
              <strong>${n.title || 'Platform Notification'}</strong>
              <div style="font-size: 0.9rem; margin-top: 4px;">${n.message}</div>
              <div class="notification-list-time">${new Date(n.createdAt).toLocaleString()}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error(error);
  }
}

async function markNotificationRead(id) {
  try {
    await auth.fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    loadNotifications();
  } catch (error) {
    console.error(error);
  }
}

async function markAllNotificationsRead() {
  try {
    const data = await auth.fetch('/api/notifications/read-all', { method: 'PATCH' });
    if (data.success) {
      showNotificationToast('All alerts marked read.', 'success');
      loadNotifications();
    }
  } catch (error) {
    console.error(error);
  }
}

async function fetchUnreadNotificationsCount() {
  try {
    const data = await auth.fetch('/api/notifications');
    if (data.success) {
      const unreadCount = data.notifications.filter(n => !n.isRead).length;
      updateNotificationBadgeUI(unreadCount);
    }
  } catch (error) {
    console.error(error);
  }
}

function updateNotificationBadgeUI(count) {
  const badge = document.getElementById('nav-notification-badge');
  if (count > 0) {
    badge.innerText = count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}


// ==================== ADMIN PANEL VIEW CONTROLLERS ====================

// 1. Admin Dashboard Stats & Graphs
async function loadAdminDashboard() {
  try {
    const data = await auth.fetch('/api/admin/dashboard');
    if (data.success) {
      const stats = data.stats;
      
      document.getElementById('ad-stat-lots').innerText = stats.totalLots;
      document.getElementById('ad-stat-slots').innerText = `${stats.availableSlots} / ${stats.totalSlots}`;
      document.getElementById('ad-stat-bookings').innerText = stats.todayBookings;
      document.getElementById('ad-stat-revenue').innerText = `₹${stats.todayRevenue}`;

      Object.values(chartInstances).forEach(chart => chart.destroy());

      // Redraw Donut Chart: Occupancy
      const pieCtx = document.getElementById('occupancyPieChart').getContext('2d');
      chartInstances.occupancy = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: ['Available', 'Reserved', 'Occupied'],
          datasets: [{
            data: [stats.availableSlots, stats.reservedSlots, stats.occupiedSlots],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 1,
            borderColor: '#2e3748'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#f3f4f6' } }
          }
        }
      });

      // Redraw Revenue Bar Chart
      const barLabels = data.chartData.map(d => d.date);
      const barBookings = data.chartData.map(d => d.bookings);
      const barRevenue = data.chartData.map(d => d.revenue);

      const barCtx = document.getElementById('revenueBarChart').getContext('2d');
      chartInstances.revenue = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: barLabels,
          datasets: [
            {
              label: 'Revenue (₹)',
              data: barRevenue,
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderColor: 'var(--primary-color)',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: 'Bookings Count',
              data: barBookings,
              type: 'line',
              borderColor: '#10b981',
              backgroundColor: 'transparent',
              borderWidth: 2,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              position: 'left',
              grid: { color: '#2e3748' },
              ticks: { color: '#9ca3af' }
            },
            y1: {
              type: 'linear',
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: '#9ca3af' }
            },
            x: { ticks: { color: '#9ca3af' } }
          },
          plugins: {
            legend: { labels: { color: '#f3f4f6' } }
          }
        }
      });

      // Redraw Peak Hours
      const lineHours = data.peakHoursData.map(h => h.hour);
      const lineCounts = data.peakHoursData.map(h => h.bookings);

      const lineCtx = document.getElementById('peakHoursLineChart').getContext('2d');
      chartInstances.peakHours = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: lineHours,
          datasets: [{
            label: 'Occupancy Peak Hours',
            data: lineCounts,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { grid: { color: '#2e3748' }, ticks: { color: '#9ca3af' } },
            x: { grid: { color: '#2e3748' }, ticks: { color: '#9ca3af' } }
          },
          plugins: {
            legend: { labels: { color: '#f3f4f6' } }
          }
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
}

// 2. Parking Lot CRUD
async function loadAdminParkingLots() {
  try {
    const data = await auth.fetch('/api/parking');
    const tbody = document.getElementById('admin-lots-table-body');
    if (data.success) {
      tbody.innerHTML = data.lots.map(lot => `
        <tr>
          <td><strong>${lot.name}</strong></td>
          <td>${lot.city}</td>
          <td style="font-size: 0.85rem;">${lot.address}</td>
          <td>₹${lot.pricePerHour}/hr</td>
          <td>₹${lot.peakPricePerHour}/hr</td>
          <td><span style="font-weight: 600;">${lot.availableSlots} / ${lot.totalSlots}</span></td>
          <td>${lot.openingTime}</td>
          <td>${lot.closingTime}</td>
          <td>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.75rem;" onclick="openEditLotModal('${lot._id}')">
                Edit
              </button>
              <button class="btn btn-danger" style="padding: 6px 10px; font-size: 0.75rem;" onclick="deleteParkingLotAction('${lot._id}')">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="9" style="text-align: center;">No parking lots found.</td></tr>';
    }
  } catch (error) {
    console.error(error);
  }
}

function openAddLotModal() {
  document.getElementById('lot-modal-title').innerText = 'Add Parking Lot';
  document.getElementById('parking-lot-form').reset();
  document.getElementById('lot-form-id').value = '';
  openModal('parking-lot-modal');
}

async function openEditLotModal(id) {
  try {
    const data = await auth.fetch(`/api/parking/${id}`);
    if (data.success) {
      const lot = data.lot;
      document.getElementById('lot-modal-title').innerText = 'Edit Parking Location';
      document.getElementById('lot-form-id').value = lot._id;
      document.getElementById('lot-name').value = lot.name;
      document.getElementById('lot-address').value = lot.address;
      document.getElementById('lot-city').value = lot.city;
      document.getElementById('lot-state').value = lot.state || '';
      document.getElementById('lot-pincode').value = lot.pincode || '';
      document.getElementById('lot-totalslots').value = lot.totalSlots;
      document.getElementById('lot-lat').value = lot.latitude;
      document.getElementById('lot-lng').value = lot.longitude;
      document.getElementById('lot-baseprice').value = lot.pricePerHour;
      document.getElementById('lot-peakprice').value = lot.peakPricePerHour;
      document.getElementById('lot-peakstart').value = lot.peakStartHour;
      document.getElementById('lot-peakend').value = lot.peakEndHour;
      document.getElementById('lot-opening').value = lot.openingTime;
      document.getElementById('lot-closing').value = lot.closingTime;
      
      openModal('parking-lot-modal');
    }
  } catch (error) {
    showNotificationToast('Failed loading lot data.', 'danger');
  }
}

async function saveParkingLot(e) {
  e.preventDefault();
  const id = document.getElementById('lot-form-id').value;
  
  const lotData = {
    name: document.getElementById('lot-name').value,
    address: document.getElementById('lot-address').value,
    city: document.getElementById('lot-city').value,
    state: document.getElementById('lot-state').value,
    pincode: document.getElementById('lot-pincode').value,
    totalSlots: parseInt(document.getElementById('lot-totalslots').value, 10),
    latitude: parseFloat(document.getElementById('lot-lat').value),
    longitude: parseFloat(document.getElementById('lot-lng').value),
    pricePerHour: parseInt(document.getElementById('lot-baseprice').value, 10),
    peakPricePerHour: parseInt(document.getElementById('lot-peakprice').value, 10),
    peakStartHour: document.getElementById('lot-peakstart').value,
    peakEndHour: document.getElementById('lot-peakend').value,
    openingTime: document.getElementById('lot-opening').value,
    closingTime: document.getElementById('lot-closing').value
  };

  try {
    let res;
    if (id) {
      res = await auth.fetch(`/api/parking/${id}`, { method: 'PUT', body: JSON.stringify(lotData) });
    } else {
      res = await auth.fetch('/api/parking', { method: 'POST', body: JSON.stringify(lotData) });
    }

    if (res.success) {
      closeModal('parking-lot-modal');
      showNotificationToast('Parking lot saved!', 'success');
      loadAdminParkingLots();
    } else {
      showNotificationToast(res.message, 'danger');
    }
  } catch (error) {
    showNotificationToast('Error saving parking lot.', 'danger');
  }
}

async function deleteParkingLotAction(id) {
  if (!confirm('Delete lot? Associated slots will be removed.')) return;
  try {
    const data = await auth.fetch(`/api/parking/${id}`, { method: 'DELETE' });
    if (data.success) {
      showNotificationToast('Parking lot deleted.', 'success');
      loadAdminParkingLots();
    }
  } catch (error) {
    showNotificationToast('Failed deleting lot.', 'danger');
  }
}

// 3. Bookings list
async function loadAdminBookings() {
  try {
    const data = await auth.fetch('/api/admin/bookings');
    const tbody = document.getElementById('admin-bookings-table-body');
    if (data.success) {
      if (data.bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No bookings recorded.</td></tr>';
        return;
      }

      tbody.innerHTML = data.bookings.map(b => {
        const dateStr = new Date(b.startTime).toLocaleDateString([], {month:'short', day:'numeric'});
        const timeRange = `${dateStr}, ${new Date(b.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(b.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
        return `
          <tr>
            <td style="font-family: monospace; font-size: 0.8rem;">${b._id}</td>
            <td>
              <strong>${b.userId ? b.userId.name : 'Deleted'}</strong>
              <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">${b.userId ? b.userId.phone : ''}</span>
            </td>
            <td>${b.parkingLotId ? b.parkingLotId.name : 'Deleted'}</td>
            <td>${b.slotId ? b.slotId.slotNumber : 'Deleted'}</td>
            <td>${b.vehicleNumber}</td>
            <td style="font-size: 0.8rem;">${timeRange}</td>
            <td><strong>₹${b.amount}</strong></td>
            <td><span class="badge ${getStatusBadgeClass(b.status)}">${b.status}</span></td>
            <td>
              ${['confirmed', 'active', 'pending'].includes(b.status) ? `
                <button class="btn btn-danger" style="padding: 6px 10px; font-size: 0.75rem;" onclick="cancelBookingAction('${b._id}')">
                  Cancel
                </button>
              ` : '-'}
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (error) {
    console.error(error);
  }
}

// 4. Users Accounts
async function loadAdminUsers() {
  try {
    const data = await auth.fetch('/api/admin/users');
    const tbody = document.getElementById('admin-users-table-body');
    if (data.success) {
      tbody.innerHTML = data.users.map(u => {
        const vehiclesText = u.vehicles.map(v => `${v.vehicleNumber} (${v.vehicleType})`).join(', ') || 'None';
        return `
          <tr>
            <td style="font-family: monospace; font-size: 0.8rem;">${u._id}</td>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td>${u.phone}</td>
            <td><span class="badge badge-info">${u.role.toUpperCase()}</span></td>
            <td style="font-size: 0.85rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${vehiclesText}</td>
            <td>
              <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="toggleUserStatus('${u._id}')">
                Active
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (error) {
    console.error(error);
  }
}

async function toggleUserStatus(id) {
  try {
    const data = await auth.fetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'disabled' })
    });
    if (data.success) {
      showNotificationToast('User status updated (Simulated).', 'success');
      loadAdminUsers();
    }
  } catch (error) {
    console.error(error);
  }
}

// 5. Entry/Exit gates verify
async function loadGateOperations() {
  try {
    const data = await auth.fetch('/api/admin/bookings');
    const tbody = document.getElementById('gate-exit-table-body');
    if (data.success) {
      const active = data.bookings.filter(b => b.status === 'active');
      if (active.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No vehicles parked.</td></tr>';
        return;
      }
      tbody.innerHTML = active.map(b => `
        <tr>
          <td><strong style="color: var(--danger-color);">${b.slotId ? b.slotId.slotNumber : ''}</strong></td>
          <td><strong>${b.vehicleNumber}</strong></td>
          <td>${b.parkingLotId ? b.parkingLotId.name : ''}</td>
          <td>
            <button class="btn btn-success" style="padding: 6px 12px; font-size: 0.75rem;" onclick="processGateExit('${b._id}')">
              Exit <i class="fa-solid fa-car-off"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error(error);
  }
}

async function verifyQREntry(e) {
  e.preventDefault();
  const qrToken = document.getElementById('gate-qr-token').value.trim();
  const statusDiv = document.getElementById('entry-gate-status');

  statusDiv.innerHTML = '<p class="text-secondary"><i class="fa-solid fa-spinner fa-spin"></i> Verifying ticket code...</p>';

  try {
    const data = await auth.fetch('/api/entry/verify', {
      method: 'POST',
      body: JSON.stringify({ qrToken })
    });

    if (data.success) {
      statusDiv.innerHTML = `
        <div class="glass-card" style="border-color: var(--success-color); background: rgba(16,185,129,0.02);">
          <h4 style="color: var(--success-color); font-size: 1.1rem; margin-bottom: 8px;">
            <i class="fa-solid fa-circle-check"></i> ${data.message}
          </h4>
          <p style="font-size: 0.9rem;">
            Slot: <strong>${data.booking.slotId.slotNumber}</strong> | Vehicle: <strong>${data.booking.vehicleNumber}</strong>
          </p>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
            Lot: ${data.booking.parkingLotId.name}
          </p>
        </div>
      `;
      document.getElementById('entry-verify-form').reset();
      showNotificationToast('Entry allowed! Gate opened.', 'success');
      loadGateOperations();
    } else {
      statusDiv.innerHTML = `
        <div class="glass-card" style="border-color: var(--danger-color); background: rgba(239,68,68,0.02);">
          <h4 style="color: var(--danger-color); font-size: 1.1rem; margin-bottom: 8px;">
            <i class="fa-solid fa-circle-xmark"></i> Verification Rejected
          </h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary);">${data.message}</p>
        </div>
      `;
    }
  } catch (err) {
    statusDiv.innerHTML = `<div class="glass-card" style="border-color: var(--danger-color);"><h4>❌ API Processing Error</h4></div>`;
  }
}

async function processGateExit(bookingId) {
  try {
    const data = await auth.fetch('/api/entry/exit', {
      method: 'POST',
      body: JSON.stringify({ bookingId })
    });
    if (data.success) {
      showNotificationToast('Vehicle exit registered. Slot is now available.', 'success');
      loadGateOperations();
    } else {
      showNotificationToast(data.message, 'danger');
    }
  } catch (error) {
    showNotificationToast('Failed processing exit.', 'danger');
  }
}

// 6. IoT simulation
async function loadIotSimulatorLots() {
  try {
    const data = await auth.fetch('/api/parking');
    const select = document.getElementById('iot-lot-select');
    if (data.success) {
      select.innerHTML = data.lots.map(lot => `
        <option value="${lot._id}">${lot.name} (${lot.city})</option>
      `).join('');
      if (data.lots.length > 0) {
        loadIotSlots();
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function loadIotSlots() {
  const lotId = document.getElementById('iot-lot-select').value;
  const container = document.getElementById('iot-slots-container');
  if (!lotId) return;

  container.innerHTML = '<p class="text-secondary">Loading sensors...</p>';

  try {
    const data = await auth.fetch(`/api/parking/${lotId}/slots`);
    if (data.success) {
      if (data.slots.length === 0) {
        container.innerHTML = '<p class="text-secondary">No slots found.</p>';
        return;
      }
      container.innerHTML = data.slots.map(slot => {
        const badgeColor = getStatusBadgeColorClass(slot.status);
        return `
          <div class="iot-slot-card glass-card">
            <div class="iot-slot-header">
              <strong style="font-size: 1.1rem; color: #fff;">Slot ${slot.slotNumber}</strong>
              <span class="badge badge-${badgeColor}" id="iot-status-${slot._id}">${slot.status.toUpperCase()}</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Sensor: ${slot.sensorId || 'Generic'}</p>
            
            <div class="iot-slot-actions">
              <button class="iot-btn iot-btn-detect" onclick="triggerIotSensorEvent('${slot._id}', 'occupied')">
                Park
              </button>
              <button class="iot-btn iot-btn-clear" onclick="triggerIotSensorEvent('${slot._id}', 'available')">
                Clear
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error(error);
  }
}

async function triggerIotSensorEvent(slotId, status) {
  try {
    const data = await auth.fetch(`/api/iot/slot/${slotId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (data.success) {
      showNotificationToast(`IoT Sensor Event: slot is now ${status}.`, 'info');
    } else {
      showNotificationToast(data.message, 'danger');
    }
  } catch (error) {
    showNotificationToast('Failed connecting to simulated sensor.', 'danger');
  }
}

// 7. Payments log
async function loadAdminPayments() {
  try {
    const data = await auth.fetch('/api/admin/payments');
    const tbody = document.getElementById('admin-payments-table-body');
    if (data.success) {
      if (data.payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No transactions logged.</td></tr>';
        return;
      }
      tbody.innerHTML = data.payments.map(p => `
        <tr>
          <td style="font-family: monospace; color: var(--primary-color);">${p.transactionId}</td>
          <td style="font-family: monospace; font-size: 0.8rem;">${p.bookingId ? p.bookingId._id.slice(-8) : 'Deleted'}</td>
          <td><strong>${p.userId ? p.userId.name : 'Deleted'}</strong></td>
          <td>${(p.bookingId && p.bookingId.parkingLotId) ? p.bookingId.parkingLotId.name : 'Deleted'}</td>
          <td><strong>₹${p.amount}</strong></td>
          <td style="font-size: 0.85rem;">${new Date(p.paidAt).toLocaleString()}</td>
          <td><span class="badge badge-success">${p.status.toUpperCase()}</span></td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error(error);
  }
}
