import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import auth from '../utils/auth';
import { getParkingAreaIllustration } from '../utils/parkingDrawing';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(auth.getUser());
  
  // Dashboard navigation tab from URL or user role
  const urlTab = searchParams.get('tab');
  const defaultTab = user?.role === 'admin' ? 'admin-dash' : 'user-dash';
  const [activeTab, setActiveTab] = useState(urlTab || defaultTab);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Sync tab whenever URL search parameter changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Page Header Title mapping
  const getTabTitle = (tab) => {
    switch(tab) {
      case 'user-dash': return '👋 Welcome! Your Parking Overview';
      case 'find-parking': return '🔍 Find & Reserve a Parking Spot';
      case 'live-slots': return '🅿️ Pick Your Parking Spot';
      case 'user-bookings': return '🎟️ My Bookings & Digital QR Passes';
      case 'payment-history': return '💳 Payment Receipts & History';
      case 'user-profile': return '🚗 My Vehicles & Profile';
      case 'notifications': return '🔔 Alerts & Notifications';
      case 'admin-dash': return '📊 Live Parking Overview & Analytics';
      case 'admin-parking': return '📍 Manage Parking Lots & Spaces';
      case 'admin-bookings': return '📋 All Driver Reservations';
      case 'admin-users': return '👥 Registered Users & Accounts';
      case 'admin-entry-exit': return '🚪 Gate QR Scanner & Check-in';
      case 'admin-iot': return '📡 Live Ultrasonic Sensor Simulator';
      case 'admin-payments': return '💰 Revenue & Transaction Receipts';
      default: return 'ParkSmart Portal';
    }
  };

  const getStatusBadgeColorClass = (status) => {
    switch(status) {
      case 'available': return 'success';
      case 'occupied': return 'danger';
      case 'reserved': return 'warning';
      case 'maintenance': return 'neutral';
      default: return 'info';
    }
  };

  // State caches
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsList, setNotificationsList] = useState([]);
  const [userStats, setUserStats] = useState({ availableLots: 0, active: 0, total: 0, spent: 0 });
  const [adminStats, setAdminStats] = useState({ totalLots: 0, availableSlots: 0, totalSlots: 0, todayBookings: 0, todayRevenue: 0 });
  const [chartData, setChartData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [allLots, setAllLots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [matchingLots, setMatchingLots] = useState([]);
  
  // Slot selection view state
  const [selectedLot, setSelectedLot] = useState(null);
  const [slotsList, setSlotsList] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotTypeFilter, setSlotTypeFilter] = useState('all');
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [slotReviews, setSlotReviews] = useState([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  
  // Booking reservation date & vehicle states
  const [bookingStartTime, setBookingStartTime] = useState('');
  const [bookingEndTime, setBookingEndTime] = useState('');
  const [bookingVehicle, setBookingVehicle] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);
  
  // Checkout & pass modal states
  const [pendingBooking, setPendingBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rzpStatus, setRzpStatus] = useState('success');
  const [activeTicket, setActiveTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // User Profile & Vehicles editor
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [newVehicleNum, setNewVehicleNum] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('car');

  // Admin Lot forms
  const [lotModalOpen, setLotModalOpen] = useState(false);
  const [editLotId, setEditLotId] = useState('');
  const [lotNameForm, setLotNameForm] = useState('');
  const [lotAddressForm, setLotAddressForm] = useState('');
  const [lotCityForm, setLotCityForm] = useState('');
  const [lotStateForm, setLotStateForm] = useState('');
  const [lotPincodeForm, setLotPincodeForm] = useState('');
  const [lotTotalSlotsForm, setLotTotalSlotsForm] = useState(15);
  const [lotLatForm, setLotLatForm] = useState(22.7533);
  const [lotLngForm, setLotLngForm] = useState(75.8937);
  const [lotPriceForm, setLotPriceForm] = useState(20);
  const [lotPeakPriceForm, setLotPeakPriceForm] = useState(35);
  const [lotPeakStartForm, setLotPeakStartForm] = useState('17:00');
  const [lotPeakEndForm, setLotPeakEndForm] = useState('21:00');
  const [lotOpeningForm, setLotOpeningForm] = useState('08:00');
  const [lotClosingForm, setLotClosingForm] = useState('23:30');
  const [lotImageForm, setLotImageForm] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');

  const presetParkingImages = [
    { label: 'Multi-Level Plaza', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80' },
    { label: 'Smart Covered Garage', url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80' },
    { label: 'Underground EV Station', url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=600&q=80' },
    { label: 'Commercial Open Bays', url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80' },
    { label: 'Airport Valet Terminal', url: 'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=600&q=80' }
  ];

  // User and Admin CRUD lists
  const [userBookings, setUserBookings] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminPayments, setAdminPayments] = useState([]);
  const [iotSelectedLotId, setIotSelectedLotId] = useState('');
  const [iotSlots, setIotSlots] = useState([]);
  const [gateQrToken, setGateQrToken] = useState('');
  const [gateVerificationStatus, setGateVerificationStatus] = useState(null);
  const [activeVehiclesList, setActiveVehiclesList] = useState([]);

  // Theme settings (for Chart rendering)
  const [themeMode, setThemeMode] = useState(localStorage.getItem('theme') || 'dark');

  // Refs for Maps autocomplete
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const indianCities = [
    'Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Indore', 'Bhopal', 'Noida', 'Gurugram', 
    'Jaipur', 'Ujjain', 'Varanasi', 'Goa', 'Hyderabad', 'Chennai', 'Kolkata', 
    'Chandigarh', 'Ahmedabad', 'Lucknow', 'Nagpur', 'Surat', 'Patna', 'Ranchi'
  ];

  // Socket.IO Connection Setup
  useEffect(() => {
    const backendUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || undefined;
    const socket = io(backendUrl);

    socket.on('connect', () => {
      console.log('Socket.IO Dashboard Session Connected');
    });

    socket.on('slotUpdated', (data) => {
      console.log('Real-time Slot update received:', data);
      handleRealtimeUpdateEvent(data);
    });

    socket.on('vehicleEntered', (data) => {
      window.showToast('🚗 Vehicle entered slot: Status is now Occupied.', 'info');
      handleRealtimeUpdateEvent(data);
    });

    socket.on('vehicleExited', (data) => {
      window.showToast('🏁 Vehicle exited: Slot is now Available.', 'success');
      handleRealtimeUpdateEvent(data);
    });

    // Theme changed listener
    const handleThemeChange = () => {
      setThemeMode(localStorage.getItem('theme') || 'dark');
    };
    window.addEventListener('theme-changed', handleThemeChange);

    // Initial triggers
    fetchNotifications();
    loadActiveViewData(activeTab);

    // Redirect search helpers check
    const queryRedirect = localStorage.getItem('search_query_redirect');
    if (queryRedirect) {
      localStorage.removeItem('search_query_redirect');
      setSearchQuery(queryRedirect);
      setActiveTab('find-parking');
      setTimeout(() => {
        executeSearch(queryRedirect, null);
      }, 500);
    }

    const coordsRedirect = localStorage.getItem('user_coords_redirect');
    if (coordsRedirect) {
      localStorage.removeItem('user_coords_redirect');
      const coords = JSON.parse(coordsRedirect);
      setUserLocation(coords);
      setActiveTab('find-parking');
      setTimeout(() => {
        executeSearch('', coords);
      }, 500);
    }

    return () => {
      socket.disconnect();
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);

  // Reload views when active view tab switches
  useEffect(() => {
    loadActiveViewData(activeTab);
  }, [activeTab]);

  // Recalculate price surge
  useEffect(() => {
    if (selectedLot && selectedSlot && bookingStartTime && bookingEndTime && bookingVehicle) {
      calculateCostSurge();
    }
  }, [bookingStartTime, bookingEndTime, bookingVehicle, selectedSlot, selectedLot]);

  // Load specific sub-view backend data
  const loadActiveViewData = async (tab) => {
    if (!user) return;
    try {
      if (tab === 'user-dash') {
        const myBookings = await auth.fetch('/api/bookings/my');
        const lots = await auth.fetch('/api/parking');
        if (myBookings.success && lots.success) {
          const activeBookings = myBookings.bookings.filter(b => ['active', 'confirmed'].includes(b.status));
          const totalSpent = myBookings.bookings
            .filter(b => b.status !== 'pending' && b.status !== 'cancelled')
            .reduce((sum, b) => sum + b.amount, 0);
          
          setUserStats({
            availableLots: lots.lots.filter(l => l.status === 'active').length,
            active: activeBookings.length,
            total: myBookings.bookings.length,
            spent: totalSpent
          });
          
          if (activeBookings.length > 0) {
            setActiveTicket(activeBookings[0]);
          } else {
            setActiveTicket(null);
          }
          
          setMatchingLots(lots.lots.slice(0, 3));
        }
      }
      else if (tab === 'find-parking') {
        const data = await auth.fetch('/api/parking?status=active');
        if (data.success) {
          setMatchingLots(data.lots);
          setAllLots(data.lots);
        }
      }
      else if (tab === 'live-slots') {
        setIsSlotsLoading(true);
        const data = await auth.fetch('/api/parking?status=active');
        if (data.success && data.lots.length > 0) {
          setAllLots(data.lots);
          if (!selectedLot) {
            handleOpenSlots(data.lots[0]);
          } else {
            fetchSlotsList(selectedLot._id);
          }
        }
        setIsSlotsLoading(false);
      }
      else if (tab === 'user-bookings') {
        const data = await auth.fetch('/api/bookings/my');
        if (data.success) {
          setUserBookings(data.bookings);
        }
      }
      else if (tab === 'payment-history') {
        try {
          const pData = await auth.fetch('/api/payment/my');
          if (pData.success && pData.payments && pData.payments.length > 0) {
            setUserPayments(pData.payments);
          } else {
            const bData = await auth.fetch('/api/bookings/my');
            if (bData.success) {
              setUserPayments(bData.bookings.filter(b => b.status !== 'pending'));
            }
          }
        } catch (e) {
          const bData = await auth.fetch('/api/bookings/my');
          if (bData.success) {
            setUserPayments(bData.bookings.filter(b => b.status !== 'pending'));
          }
        }
      }
      else if (tab === 'notifications') {
        fetchNotifications();
      }
      else if (tab === 'admin-dash') {
        const dashboard = await auth.fetch('/api/admin/dashboard');
        if (dashboard.success) {
          setAdminStats(dashboard.stats);
          setChartData(dashboard.chartData);
          setPeakHoursData(dashboard.peakHoursData);
        }
      }
      else if (tab === 'admin-parking') {
        const data = await auth.fetch('/api/parking');
        if (data.success) {
          setAllLots(data.lots);
        }
      }
      else if (tab === 'admin-bookings') {
        const data = await auth.fetch('/api/admin/bookings');
        if (data.success) {
          setAdminBookings(data.bookings);
        }
      }
      else if (tab === 'admin-users') {
        const data = await auth.fetch('/api/admin/users');
        if (data.success) {
          setAdminUsers(data.users);
        }
      }
      else if (tab === 'admin-entry-exit') {
        const data = await auth.fetch('/api/admin/bookings');
        if (data.success) {
          setActiveVehiclesList(data.bookings.filter(b => b.status === 'active'));
        }
      }
      else if (tab === 'admin-iot') {
        const data = await auth.fetch('/api/parking');
        if (data.success) {
          setAllLots(data.lots);
          if (data.lots.length > 0) {
            setIotSelectedLotId(data.lots[0]._id);
            fetchIotSlots(data.lots[0]._id);
          }
        }
      }
      else if (tab === 'admin-payments') {
        const data = await auth.fetch('/api/admin/payments');
        if (data.success) {
          setAdminPayments(data.payments);
        }
      }
    } catch(err) {
      console.error('Error fetching view data', err);
    }
  };

  // Realtime updates triggers
  const handleRealtimeUpdateEvent = (data) => {
    // If we're looking at live slots layout
    if (activeTab === 'live-slots' && selectedLot && selectedLot._id === data.parkingLotId) {
      fetchSlotsList(selectedLot._id);
    }
    // If we're looking at IoT simulation
    if (activeTab === 'admin-iot' && iotSelectedLotId === data.parkingLotId) {
      fetchIotSlots(iotSelectedLotId);
    }
    // If we're looking at dashboard counts
    if (activeTab === 'user-dash' || activeTab === 'admin-dash') {
      loadActiveViewData(activeTab);
    }
  };

  // Retrieve unread alert updates
  const fetchNotifications = async () => {
    try {
      const data = await auth.fetch('/api/notifications');
      if (data.success) {
        setNotificationsList(data.notifications);
        setUnreadNotifications(data.notifications.filter(n => !n.isRead).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllNotifications = async () => {
    try {
      const data = await auth.fetch('/api/notifications/read-all', { method: 'PATCH' });
      if (data.success) {
        window.showToast('All notifications marked as read.', 'success');
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleNotification = async (id) => {
    try {
      await auth.fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Autocomplete helpers
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setAutocompleteSuggestions([]);
      return;
    }
    const matches = indianCities.filter(c => c.toLowerCase().includes(val.toLowerCase()));
    setAutocompleteSuggestions(matches);
  };

  const selectCitySuggestion = (city) => {
    setSearchQuery(city + ', India');
    setAutocompleteSuggestions([]);
    executeSearch(city, null);
  };

  // Search trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(searchQuery.split(',')[0].trim(), null);
  };

  const executeSearch = async (query, coords) => {
    try {
      let url = '/api/parking?status=active';
      if (query) url += `&city=${encodeURIComponent(query)}`;
      const data = await auth.fetch(url);
      if (data.success) {
        let lots = data.lots;
        if (coords) {
          lots = lots.map(l => {
            const d = calculateHaversineDistance(coords, { lat: l.latitude, lng: l.longitude });
            return { ...l, distance: d };
          });
          lots.sort((a, b) => a.distance - b.distance);
        }
        setMatchingLots(lots);
        window.showToast(`Found ${lots.length} parking lot(s)`, 'success');
      }
    } catch (e) {
      window.showToast('Failed to load search results', 'danger');
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      window.showToast('Geolocation is not supported by your browser.', 'danger');
      return;
    }
    window.showToast('Detecting location...', 'info');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(coords);
        window.showToast('Location captured successfully', 'success');
        executeSearch('', coords);
      },
      (error) => {
        console.warn(error);
        window.showToast('Permission to access location was denied.', 'warning');
      }
    );
  };

  const calculateHaversineDistance = (coords1, coords2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLng = toRad(coords2.lng - coords1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords1.lat)) *
        Math.cos(toRad(coords2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Slot Select flow
  const handleOpenSlots = (lot) => {
    setSelectedLot(lot);
    setSelectedSlot(null);
    setEstimatedCost(0);

    // Read any redirected start/end times from Home page
    const redirectStart = localStorage.getItem('book_start_time_redirect');
    const redirectEnd = localStorage.getItem('book_end_time_redirect');
    if (redirectStart) localStorage.removeItem('book_start_time_redirect');
    if (redirectEnd) localStorage.removeItem('book_end_time_redirect');

    // Default times setup (always 5 mins in future so it is never in the past)
    const now = new Date(Date.now() + 5 * 60 * 1000);
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const formatDateTimeLocal = (date) => {
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
      return adjustedDate.toISOString().slice(0, 16);
    };

    setBookingStartTime(redirectStart || formatDateTimeLocal(now));
    setBookingEndTime(redirectEnd || formatDateTimeLocal(inTwoHours));

    // Vehicle setups - default to user vehicle or standard plate
    if (user && user.vehicles && Array.isArray(user.vehicles) && user.vehicles.length > 0) {
      setBookingVehicle(user.vehicles[0].vehicleNumber);
    } else {
      setBookingVehicle('DL-01-AB-1234');
    }

    fetchSlotsList(lot._id);
    fetchReviews(lot._id);
    setActiveTab('live-slots');
  };

  const fetchSlotsList = async (lotId) => {
    setIsSlotsLoading(true);
    try {
      const data = await auth.fetch(`/api/parking/${lotId}/slots`);
      if (data.success) {
        setSlotsList(data.slots);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsSlotsLoading(false);
    }
  };

  const fetchReviews = async (lotId) => {
    try {
      const data = await auth.fetch(`/api/parking/${lotId}/reviews`);
      if (data.success) {
        setSlotReviews(data.reviews);
      }
    } catch(e) {}
  };

  const handleSelectSlotCard = (slot) => {
    if (slot.status !== 'available') {
      window.showToast(`Slot ${slot.slotNumber} is ${slot.status.toUpperCase()} and not available.`, 'warning');
      return;
    }
    setSelectedSlot(slot);
    // Find matching vehicle type in user's profile safely
    if (user && user.vehicles && Array.isArray(user.vehicles) && user.vehicles.length > 0) {
      const matched = user.vehicles.find(v => v.vehicleType === slot.vehicleType);
      if (matched) {
        setBookingVehicle(matched.vehicleNumber);
      } else if (!bookingVehicle) {
        setBookingVehicle(user.vehicles[0].vehicleNumber);
      }
    } else if (!bookingVehicle) {
      if (slot.vehicleType === 'bike') setBookingVehicle('DL-01-BK-1234');
      else if (slot.vehicleType === 'ev') setBookingVehicle('DL-01-EV-1234');
      else setBookingVehicle('DL-01-AB-1234');
    }
  };

  const calculateCostSurge = async () => {
    try {
      const response = await auth.fetch('/api/bookings/estimate', {
        method: 'POST',
        body: JSON.stringify({
          parkingLotId: selectedLot._id,
          startTime: bookingStartTime,
          endTime: bookingEndTime,
          vehicleType: selectedSlot?.vehicleType || 'car'
        })
      });
      if (response.success) {
        setEstimatedCost(response.amount);
      }
    } catch(e) {}
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      window.showToast('Please click an available green slot on the layout first.', 'warning');
      return;
    }
    const vehiclePlate = (bookingVehicle || 'DL-01-AB-1234').toUpperCase().trim();

    try {
      const response = await auth.fetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          parkingLotId: selectedLot._id,
          slotId: selectedSlot._id,
          vehicleNumber: vehiclePlate,
          vehicleType: selectedSlot.vehicleType || 'car',
          startTime: bookingStartTime,
          endTime: bookingEndTime
        })
      });

      if (response.success && response.booking) {
        setPendingBooking(response.booking);
        // Ensure local user has vehicle
        if (user) {
          const currentVehicles = user.vehicles || [];
          if (!currentVehicles.some(v => v.vehicleNumber === vehiclePlate)) {
            const updatedUser = {
              ...user,
              vehicles: [...currentVehicles, { vehicleNumber: vehiclePlate, vehicleType: selectedSlot.vehicleType || 'car' }]
            };
            setUser(updatedUser);
            auth.setUser(updatedUser);
          }
        }
        setShowPaymentModal(true);
      } else {
        window.showToast(response.message || 'Slot booking conflict. Please try another slot.', 'danger');
      }
    } catch (err) {
      console.error('Booking submit error:', err);
      window.showToast('API Reservation error occurred. Please try again.', 'danger');
    }
  };

  const handlePayPendingBooking = (booking) => {
    setPendingBooking(booking);
    setSelectedSlot(booking.slotId);
    setShowPaymentModal(true);
  };

  const processSandboxPayment = async () => {
    if (!pendingBooking) {
      window.showToast('No booking found to process.', 'warning');
      return;
    }

    setIsProcessingPayment(true);
    if (window.showToast) {
      window.showToast('💳 Authorizing payment securely...', 'info');
    }

    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let txnId = 'pay_';
    for (let i = 0; i < 14; i++) {
      txnId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      const response = await auth.fetch('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: pendingBooking._id,
          transactionId: txnId,
          paymentStatus: rzpStatus === 'failed' ? 'failed' : 'success'
        })
      });

      setIsProcessingPayment(false);

      if (response.success) {
        setShowPaymentModal(false);
        if (window.showToast) {
          window.showToast('🎉 Payment successful! Guaranteed spot confirmed.', 'success');
        }
        
        // Show QR Ticket Pass immediately
        const confirmedBooking = response.booking || pendingBooking;
        setActiveTicket(confirmedBooking);
        setShowTicketModal(true);

        // Keep user smoothly on their confirmed bookings tab
        switchTab('user-bookings');
        loadActiveViewData('user-bookings');
      } else {
        if (window.showToast) {
          window.showToast(response.message || '❌ Payment was declined.', 'danger');
        }
      }
    } catch(err) {
      setIsProcessingPayment(false);
      console.error('Payment error:', err);
      if (window.showToast) {
        window.showToast('Payment verification error occurred.', 'danger');
      }
    }
  };

  const viewQRReceipt = async (bookingId) => {
    try {
      const response = await auth.fetch(`/api/bookings/${bookingId}`);
      if (response.success && response.booking) {
        setActiveTicket(response.booking);
        setShowTicketModal(true);
      } else {
        if (window.showToast) window.showToast('Could not load ticket details', 'warning');
      }
    } catch(e) {
      console.error(e);
      if (window.showToast) window.showToast('Error loading QR ticket', 'danger');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await auth.fetch(`/api/bookings/${id}/cancel`, { method: 'PUT' });
      if (response.success) {
        window.showToast('Booking cancelled successfully.', 'success');
        loadActiveViewData(activeTab);
      } else {
        window.showToast(response.message, 'danger');
      }
    } catch (e) {
      window.showToast('Cancellation request failed', 'danger');
    }
  };

  // Submit Review Form
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLot) return;
    try {
      const data = await auth.fetch(`/api/parking/${selectedLot._id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: newReviewRating, comment: newReviewComment })
      });
      if (data.success) {
        window.showToast('Thank you! Review posted successfully.', 'success');
        setNewReviewComment('');
        setNewReviewRating(5);
        fetchReviews(selectedLot._id);
      } else {
        window.showToast(data.message || 'Submit rejected. (No completed bookings found).', 'warning');
      }
    } catch (e) {
      window.showToast('Review submit failed.', 'danger');
    }
  };

  // User profile vehicle settings updates
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const data = await auth.fetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: profileName, phone: profilePhone })
      });
      if (data.success) {
        auth.setUser(data.user);
        setUser(data.user);
        window.showToast('Profile updated successfully', 'success');
      }
    } catch (e) {
      window.showToast('Profile save failed.', 'danger');
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const plate = newVehicleNum.toUpperCase().trim();
    if (!plate) return;

    if (user.vehicles.some(v => v.vehicleNumber === plate)) {
      window.showToast('Plate number already exists.', 'warning');
      return;
    }

    const updated = [...user.vehicles, { vehicleNumber: plate, vehicleType: newVehicleType }];
    try {
      const data = await auth.fetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ vehicles: updated })
      });
      if (data.success) {
        auth.setUser(data.user);
        setUser(data.user);
        setNewVehicleNum('');
        window.showToast('Vehicle added successfully!', 'success');
      }
    } catch (e) {
      window.showToast('Failed to add vehicle.', 'danger');
    }
  };

  const handleDeleteVehicle = async (plate) => {
    if (!window.confirm(`Delete vehicle ${plate}?`)) return;
    const updated = user.vehicles.filter(v => v.vehicleNumber !== plate);
    try {
      const data = await auth.fetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ vehicles: updated })
      });
      if (data.success) {
        auth.setUser(data.user);
        setUser(data.user);
        window.showToast('Vehicle deleted successfully.', 'success');
      }
    } catch (e) {
      window.showToast('Failed to delete vehicle.', 'danger');
    }
  };

  // Admin Lot management
  const openLotModal = (lot = null) => {
    if (lot) {
      setEditLotId(lot._id);
      setLotNameForm(lot.name);
      setLotAddressForm(lot.address);
      setLotCityForm(lot.city);
      setLotStateForm(lot.state);
      setLotPincodeForm(lot.pincode);
      setLotTotalSlotsForm(lot.totalSlots);
      setLotLatForm(lot.latitude);
      setLotLngForm(lot.longitude);
      setLotPriceForm(lot.pricePerHour);
      setLotPeakPriceForm(lot.peakPricePerHour);
      setLotPeakStartForm(lot.peakStartHour);
      setLotPeakEndForm(lot.peakEndHour);
      setLotOpeningForm(lot.openingTime);
      setLotClosingForm(lot.closingTime);
      setLotImageForm(lot.images?.[0] || presetParkingImages[0].url);
    } else {
      setEditLotId('');
      setLotNameForm('');
      setLotAddressForm('');
      setLotCityForm('Delhi');
      setLotStateForm('Delhi');
      setLotPincodeForm('110001');
      setLotTotalSlotsForm(15);
      setLotLatForm(28.6304);
      setLotLngForm(77.2177);
      setLotPriceForm(30);
      setLotPeakPriceForm(50);
      setLotPeakStartForm('17:00');
      setLotPeakEndForm('21:00');
      setLotOpeningForm('00:00');
      setLotClosingForm('23:59');
      setLotImageForm(presetParkingImages[0].url);
    }
    setLotModalOpen(true);
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      window.showToast('Image size should be less than 10MB', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      setLotImageForm(base64Data);
      try {
        const uploadRes = await auth.fetch('/api/parking/upload', {
          method: 'POST',
          body: JSON.stringify({ imageBase64: base64Data })
        });
        if (uploadRes.success && uploadRes.imageUrl) {
          setLotImageForm(uploadRes.imageUrl);
          window.showToast('📸 Photo uploaded & stored in server/uploads!', 'success');
        } else {
          window.showToast('📸 Photo loaded locally!', 'success');
        }
      } catch (err) {
        window.showToast('📸 Photo loaded locally!', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveParkingLot = async (e) => {
    e.preventDefault();
    const lotData = {
      name: lotNameForm,
      address: lotAddressForm,
      city: lotCityForm,
      state: lotStateForm,
      pincode: lotPincodeForm,
      totalSlots: parseInt(lotTotalSlotsForm, 10),
      latitude: parseFloat(lotLatForm),
      longitude: parseFloat(lotLngForm),
      pricePerHour: parseInt(lotPriceForm, 10),
      peakPricePerHour: parseInt(lotPeakPriceForm, 10),
      peakStartHour: lotPeakStartForm,
      peakEndHour: lotPeakEndForm,
      openingTime: lotOpeningForm,
      closingTime: lotClosingForm,
      images: lotImageForm ? [lotImageForm] : [presetParkingImages[0].url]
    };

    try {
      let res;
      if (editLotId) {
        res = await auth.fetch(`/api/parking/${editLotId}`, { method: 'PUT', body: JSON.stringify(lotData) });
      } else {
        res = await auth.fetch('/api/parking', { method: 'POST', body: JSON.stringify(lotData) });
      }

      if (res.success) {
        setLotModalOpen(false);
        window.showToast('Parking location saved successfully!', 'success');
        loadActiveViewData('admin-parking');
      } else {
        window.showToast(res.message, 'danger');
      }
    } catch (e) {
      window.showToast('Error saving location', 'danger');
    }
  };

  const handleDeleteLot = async (id) => {
    if (!window.confirm('Delete parking lot? This removes all associated slots.')) return;
    try {
      const res = await auth.fetch(`/api/parking/${id}`, { method: 'DELETE' });
      if (res.success) {
        window.showToast('Parking location deleted.', 'success');
        loadActiveViewData('admin-parking');
      }
    } catch (e) {
      window.showToast('Failed to delete lot.', 'danger');
    }
  };

  const handleToggleUserStatus = async (id) => {
    try {
      const data = await auth.fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'disabled' })
      });
      if (data.success) {
        window.showToast('Status toggled successfully.', 'success');
        loadActiveViewData('admin-users');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin IoT Simulation
  const fetchIotSlots = async (lotId) => {
    try {
      const data = await auth.fetch(`/api/parking/${lotId}/slots`);
      if (data.success) {
        setIotSlots(data.slots);
      }
    } catch (e) {}
  };

  const handleIotSensorChange = async (slotId, status) => {
    try {
      const data = await auth.fetch(`/api/iot/slot/${slotId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (data.success) {
        window.showToast(`IoT simulated slot is now ${status}.`, 'info');
        fetchIotSlots(iotSelectedLotId);
      }
    } catch (e) {
      window.showToast('Failed to trigger simulated sensor.', 'danger');
    }
  };

  // Gate Verification
  const handleVerifyEntrySubmit = async (e) => {
    e.preventDefault();
    if (!gateQrToken.trim()) return;
    setGateVerificationStatus('loading');
    try {
      const data = await auth.fetch('/api/entry/verify', {
        method: 'POST',
        body: JSON.stringify({ qrToken: gateQrToken.trim() })
      });
      if (data.success) {
        setGateVerificationStatus({ success: true, message: data.message, booking: data.booking });
        window.showToast('Entry allowed! Gate opened.', 'success');
        setGateQrToken('');
        loadActiveViewData('admin-entry-exit');
      } else {
        setGateVerificationStatus({ success: false, message: data.message });
        window.showToast('Access rejected.', 'danger');
      }
    } catch (err) {
      setGateVerificationStatus({ success: false, message: 'Processing error.' });
    }
  };

  const handleProcessExit = async (bookingId) => {
    try {
      const data = await auth.fetch('/api/entry/exit', {
        method: 'POST',
        body: JSON.stringify({ bookingId })
      });
      if (data.success) {
        window.showToast('Vehicle exit registered. Slot is now free.', 'success');
        loadActiveViewData('admin-entry-exit');
      } else {
        window.showToast(data.message, 'danger');
      }
    } catch (e) {
      window.showToast('Processing exit failed', 'danger');
    }
  };

  // Chart Rendering data
  const isLightTheme = themeMode === 'light';
  const textLabelColor = isLightTheme ? '#0f172a' : '#f3f4f6';
  const gridLineColor = isLightTheme ? '#e2e8f0' : '#2e3748';

  const doughnutData = {
    labels: ['Available', 'Reserved', 'Occupied'],
    datasets: [{
      data: [
        adminStats.availableSlots,
        adminStats.totalSlots - adminStats.availableSlots - (adminStats.occupiedSlots || 0),
        adminStats.occupiedSlots || 0
      ],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 1,
      borderColor: isLightTheme ? '#ffffff' : '#161c2d'
    }]
  };

  const barChartConfig = {
    labels: chartData.map(d => d.date),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: chartData.map(d => d.revenue),
        backgroundColor: 'rgba(0, 210, 196, 0.8)',
        borderColor: '#00d2c4',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        label: 'Bookings Count',
        data: chartData.map(d => d.bookings),
        type: 'line',
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        grid: { color: gridLineColor },
        ticks: { color: textLabelColor }
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: textLabelColor }
      },
      x: { ticks: { color: textLabelColor }, grid: { color: gridLineColor } }
    },
    plugins: {
      legend: { labels: { color: textLabelColor } }
    }
  };

  const lineChartData = {
    labels: peakHoursData.map(h => h.hour),
    datasets: [{
      label: 'Occupancy Peak Hours',
      data: peakHoursData.map(h => h.bookings),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { color: gridLineColor }, ticks: { color: textLabelColor } },
      x: { grid: { color: gridLineColor }, ticks: { color: textLabelColor } }
    },
    plugins: {
      legend: { labels: { color: textLabelColor } }
    }
  };

  return (
    <div className="dashboard-layout" style={{ marginTop: '74px' }}>
      
      {/* Dynamic Sidebar */}
      <aside className="sidebar" style={{ top: '74px' }}>
        {user?.role === 'admin' ? (
          /* Admin Menu options */
          <ul className="sidebar-menu">
            <li className={`sidebar-menu-item ${activeTab === 'admin-dash' ? 'active' : ''}`}>
              <button onClick={() => switchTab('admin-dash')}><i className="fa-solid fa-chart-pie"></i> Live Overview</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'admin-parking' ? 'active' : ''}`}>
              <button onClick={() => switchTab('admin-parking')}><i className="fa-solid fa-square-parking"></i> Parking Lots</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'admin-bookings' ? 'active' : ''}`}>
              <button onClick={() => switchTab('admin-bookings')}><i className="fa-solid fa-book-open"></i> All Bookings</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'admin-users' ? 'active' : ''}`}>
              <button onClick={() => switchTab('admin-users')}><i className="fa-solid fa-users-gear"></i> Users List</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'admin-entry-exit' ? 'active' : ''}`}>
              <button onClick={() => switchTab('admin-entry-exit')}><i className="fa-solid fa-qrcode"></i> Gate Scanner</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'admin-iot' ? 'active' : ''}`}>
              <button onClick={() => switchTab('admin-iot')}><i className="fa-solid fa-microchip"></i> Live Simulator</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'admin-payments' ? 'active' : ''}`}>
              <button onClick={() => switchTab('admin-payments')}><i className="fa-solid fa-receipt"></i> Revenue Log</button>
            </li>
          </ul>
        ) : (
          /* User Menu options */
          <ul className="sidebar-menu">
            <li className={`sidebar-menu-item ${activeTab === 'user-dash' ? 'active' : ''}`}>
              <button onClick={() => switchTab('user-dash')}><i className="fa-solid fa-gauge"></i> Overview</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'find-parking' ? 'active' : ''}`}>
              <button onClick={() => switchTab('find-parking')}><i className="fa-solid fa-magnifying-glass-location"></i> Find a Spot</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'live-slots' ? 'active' : ''}`}>
              <button onClick={() => switchTab('live-slots')}><i className="fa-solid fa-square-parking"></i> Live Slots</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'user-bookings' ? 'active' : ''}`}>
              <button onClick={() => switchTab('user-bookings')}><i className="fa-solid fa-ticket"></i> My Bookings</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'payment-history' ? 'active' : ''}`}>
              <button onClick={() => switchTab('payment-history')}><i className="fa-solid fa-receipt"></i> Receipts</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'user-profile' ? 'active' : ''}`}>
              <button onClick={() => switchTab('user-profile')}><i className="fa-solid fa-car"></i> My Vehicles</button>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'notifications' ? 'active' : ''}`}>
              <button onClick={() => switchTab('notifications')}><i className="fa-solid fa-bell"></i> Alerts & Updates</button>
            </li>
          </ul>
        )}

        <div className="sidebar-footer">
          <div className="user-profile-summary">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="user-details-summary">
              <div className="user-name-summary">{user?.name}</div>
              <div className="user-role-summary">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="main-wrapper">
        <header className="topbar" style={{ display: 'none' /* Handled by landing header */ }} />
        
        <main className="content-body">
          <h2 style={{ marginBottom: '24px' }}>{getTabTitle(activeTab)}</h2>

          {/* ================= USER VIEW: OVERVIEW ================= */}
          {activeTab === 'user-dash' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card glass-card">
                  <div className="stat-info">
                    <h3>{userStats.availableLots}</h3>
                    <p>Open Parking Lots</p>
                  </div>
                  <div className="stat-icon primary"><i className="fa-solid fa-square-parking"></i></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-info">
                    <h3>{userStats.active}</h3>
                    <p>Active Passes</p>
                  </div>
                  <div className="stat-icon success"><i className="fa-solid fa-ticket"></i></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-info">
                    <h3>{userStats.total}</h3>
                    <p>Total Bookings</p>
                  </div>
                  <div className="stat-icon warning"><i className="fa-solid fa-clock-rotate-left"></i></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-info">
                    <h3>₹{userStats.spent}.00</h3>
                    <p>Total Spent</p>
                  </div>
                  <div className="stat-icon danger"><i className="fa-solid fa-indian-rupee-sign"></i></div>
                </div>
              </div>

              <div className="dashboard-row">
                {/* Confirmed QR Code widget */}
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>🎟️ Your Active Parking Pass</h3>
                    {activeTicket && <span className="badge badge-success">Ready to Park</span>}
                  </div>

                  {activeTicket ? (
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>{activeTicket.parkingLotId?.name || 'Parking Location'}</h4>
                        <span className="badge badge-success">{activeTicket.status?.toUpperCase()}</span>
                      </div>
                      <p style={{ fontSize: '0.95rem', margin: 0 }}>
                        Your Slot: <strong style={{ color: 'var(--success-color)', fontSize: '1.1rem' }}>{activeTicket.slotId?.slotNumber || 'Slot'}</strong> &nbsp;|&nbsp; Vehicle: <strong>{activeTicket.vehicleNumber}</strong>
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        <i className="fa-solid fa-clock" style={{ marginRight: '6px' }}></i> 
                        {new Date(activeTicket.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} to {new Date(activeTicket.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => viewQRReceipt(activeTicket._id)}>
                          <i className="fa-solid fa-qrcode" style={{ marginRight: '6px' }}></i> View Digital QR Pass
                        </button>
                        {activeTicket.parkingLotId?.latitude && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }} 
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeTicket.parkingLotId.latitude},${activeTicket.parkingLotId.longitude}`, '_blank')}
                          >
                            <i className="fa-solid fa-location-arrow" style={{ marginRight: '6px' }}></i> Directions
                          </button>
                        )}
                        {activeTicket.status === 'confirmed' && (
                          <button className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleCancelBooking(activeTicket._id)}>
                            Cancel Pass
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                      <i className="fa-solid fa-ticket" style={{ fontSize: '3rem', color: 'var(--border-color)', marginBottom: '15px', opacity: 0.6 }}></i>
                      <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>You don't have any active parking passes right now.</p>
                      <p style={{ fontSize: '0.85rem', marginTop: '6px', color: 'var(--text-secondary)' }}>Plan ahead and guarantee your spot in seconds.</p>
                      <button className="btn btn-primary" style={{ marginTop: '15px', padding: '10px 20px' }} onClick={() => switchTab('find-parking')}>
                        <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '6px' }}></i> Find a Parking Spot
                      </button>
                    </div>
                  )}
                </div>

                {/* Nearby list */}
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>📍 Popular Parking Hubs</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => switchTab('find-parking')}>View All</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {matchingLots.slice(0, 3).map(lot => (
                      <div key={lot._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{lot.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lot.city} • ₹{lot.pricePerHour}/hr</div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenSlots(lot)}>
                          Book Spot ➔
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= USER VIEW: FIND PARKING ================= */}
          {activeTab === 'find-parking' && (
            <div>
              <form onSubmit={handleSearchSubmit} className="search-bar-row">
                <div className="search-input-wrapper">
                  <i className="fa-solid fa-magnifying-glass search-main-icon"></i>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search by city, area, landmark or mall..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                  />
                  {autocompleteSuggestions.length > 0 && (
                    <div id="autocomplete-suggestions" className="autocomplete-dropdown">
                      {autocompleteSuggestions.map(city => (
                        <div 
                          key={city} 
                          className="suggestion-item" 
                          onClick={() => selectCitySuggestion(city)}
                        >
                          <i className="fa-solid fa-location-dot suggestion-icon"></i>
                          <span className="suggestion-text">
                            <strong>{city}</strong>, India
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" className="btn btn-secondary" onClick={handleUseMyLocation}>
                  <i className="fa-solid fa-location-crosshairs"></i> Use My Location
                </button>
                <button type="submit" className="btn btn-primary">Search</button>
              </form>

              {/* simulated interactive map radar */}
              <div style={{ width: '100%', height: '360px', background: 'radial-gradient(circle, #1a2238 0%, #0d1321 100%)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {/* Radar Grid Circles */}
                <div style={{ position: 'absolute', width: '280px', height: '280px', border: '1px dashed rgba(99,102,241,0.25)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', width: '160px', height: '160px', border: '1px dashed rgba(99,102,241,0.2)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', width: '60px', height: '60px', border: '1px dashed rgba(99,102,241,0.15)', borderRadius: '50%' }}></div>
                
                {/* Radar Sweep Line */}
                <div style={{ position: 'absolute', width: '50%', height: '2px', background: 'linear-gradient(to right, transparent, var(--primary-color))', transformOrigin: 'left center', left: '50%', top: '50%', animation: 'radar-sweep 4s linear infinite', zIndex: 1 }}></div>

                {/* User location pointer */}
                <div style={{ zIndex: 2, position: 'absolute', width: '14px', height: '14px', background: '#3b82f6', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 10px #3b82f6' }} title="Your Location"></div>

                {/* Simulated Pins */}
                {matchingLots.map((lot, index) => {
                  const angle = (index * 360) / (matchingLots.length || 1);
                  const radius = 80 + (index * 15) % 80;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  return (
                    <button 
                      key={lot._id}
                      onClick={() => handleOpenSlots(lot)}
                      className="radar-pin-btn"
                      style={{
                        zIndex: 2,
                        position: 'absolute',
                        transform: `translate(${x}px, ${y}px)`,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      title={lot.name}
                    >
                      <i className="fa-solid fa-location-dot" style={{ fontSize: '1.8rem', color: 'var(--primary-color)', filter: 'drop-shadow(0 0 5px var(--primary-glow))' }}></i>
                    </button>
                  );
                })}

                <div style={{ position: 'absolute', bottom: '15px', left: '20px', background: 'rgba(11,15,25,0.85)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid var(--border-color)', zIndex: 10 }}>
                  <i className="fa-solid fa-radar" style={{ color: 'var(--success-color)', marginRight: '6px' }}></i> GPS Active: Mapping {matchingLots.length} locations across India.
                </div>
              </div>

              {/* Cards Grid */}
              <div className="parking-lots-grid">
                {matchingLots.length > 0 ? (
                  matchingLots.map((lot, index) => {
                    const lotImg = getParkingAreaIllustration(lot, index);
                    return (
                      <div key={lot._id} className="parking-lot-card glass-card">
                        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', height: '155px', marginBottom: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                          <img 
                            src={lotImg} 
                            onError={(e) => { 
                              e.target.onerror = null; 
                              e.target.src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'; 
                            }} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            alt={lot.name} 
                          />
                        </div>
                        <div className="parking-lot-name">{lot.name}</div>
                        <div className="parking-lot-address"><i className="fa-solid fa-location-dot"></i> {lot.address}, {lot.city}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--warning-color)', marginBottom: '10px' }}>
                          ⭐ ⭐ ⭐ ⭐ ⭐ <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>({lot.rating || 4.2}/5)</span>
                        </div>
                        <div className="parking-lot-stats">
                          <div className="lot-stat-item">
                            <span className="lot-stat-label">Available Slots</span>
                            <span className="lot-stat-value" style={{ color: lot.availableSlots > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                              {lot.availableSlots} / {lot.totalSlots}
                            </span>
                          </div>
                          <div className="lot-stat-item">
                            <span className="lot-stat-label">Rate</span>
                            <span className="lot-stat-value" style={{ color: 'var(--primary-color)' }}>₹{lot.pricePerHour}/hr</span>
                          </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => handleOpenSlots(lot)}>
                          View Slots & Book <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                    <i className="fa-solid fa-parking" style={{ fontSize: '3rem', color: 'var(--border-color)', marginBottom: '15px' }}></i>
                    <p>No parking lots matching search criteria found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= USER VIEW: LIVE SLOTS & BOOKING ================= */}
          {activeTab === 'live-slots' && (
            <div>
              {/* Location Switcher & Realtime Status Bar */}
              <div className="glass-card" style={{ marginBottom: '24px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
                  <label style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary-color)' }}></i> Parking Location:
                  </label>
                  <select 
                    className="form-control" 
                    style={{ maxWidth: '420px', fontWeight: 600, background: '#161616', borderColor: 'rgba(255,184,0,0.3)', color: '#ffffff' }}
                    value={selectedLot?._id || (allLots.length > 0 ? allLots[0]._id : '')}
                    onChange={(e) => {
                      const lot = allLots.find(l => l._id === e.target.value);
                      if (lot) handleOpenSlots(lot);
                    }}
                  >
                    {allLots.map(lot => (
                      <option key={lot._id} value={lot._id}>
                        {lot.name} ({lot.city}) — ₹{lot.pricePerHour}/hr
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {selectedLot && (
                    <>
                      <span className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
                        <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
                        {slotsList.filter(s => s.status === 'available').length} / {slotsList.length} Available
                      </span>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedLot.latitude},${selectedLot.longitude}`, '_blank')}
                      >
                        <i className="fa-solid fa-location-arrow" style={{ marginRight: '6px' }}></i> Directions
                      </button>
                    </>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => switchTab('find-parking')}>
                    <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '6px' }}></i> Explore Map
                  </button>
                </div>
              </div>

              {selectedLot ? (
                <div>
                  {/* Hero Banner for Selected Lot */}
                  <div className="glass-card" style={{ marginBottom: '24px', overflow: 'hidden', padding: 0 }}>
                    <div style={{ width: '100%', height: '170px', position: 'relative', background: 'var(--bg-secondary)' }}>
                      <img 
                        src={getParkingAreaIllustration(selectedLot, 0)} 
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'; 
                        }} 
                        alt={selectedLot.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.3) 100%)' }}></div>
                      <div style={{ position: 'absolute', bottom: '16px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.6rem' }}>{selectedLot.name}</h3>
                          <p style={{ color: '#d1d5db', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                            <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary-color)', marginRight: '6px' }}></i> 
                            {selectedLot.address}, {selectedLot.city} • <strong style={{ color: 'var(--primary-color)' }}>₹{selectedLot.pricePerHour}/hr</strong>
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 700 }}>
                            ⭐ {selectedLot.rating || 4.5} / 5
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="booking-split-container">
                    {/* Step 1: Slots Visual Layout */}
                    <div className="glass-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>Step 1: Choose Your Spot</h3>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Click any available green spot to reserve</p>
                        </div>
                        <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                          <i className="fa-solid fa-bolt" style={{ marginRight: '4px' }}></i> Live Status
                        </span>
                      </div>

                      {/* Vehicle Category Filter Tabs */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {[
                          { id: 'all', label: 'All Spots', icon: 'fa-border-all' },
                          { id: 'car', label: 'Cars', icon: 'fa-car' },
                          { id: 'bike', label: 'Bikes', icon: 'fa-motorcycle' },
                          { id: 'ev', label: 'EV Charging', icon: 'fa-charging-station' },
                          { id: 'disabled', label: 'Accessible', icon: 'fa-wheelchair' }
                        ].map(tab => {
                          const count = tab.id === 'all' 
                            ? slotsList.length 
                            : slotsList.filter(s => s.vehicleType === tab.id).length;
                          const isActive = slotTypeFilter === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSlotTypeFilter(tab.id)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                border: isActive ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.12)',
                                background: isActive ? 'rgba(255, 184, 0, 0.18)' : '#181818',
                                color: isActive ? 'var(--primary-color)' : '#d1d5db',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                              }}
                            >
                              <i className={`fa-solid ${tab.icon}`}></i>
                              <span>{tab.label}</span>
                              <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({count})</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 18px 0', padding: '10px 14px', background: '#0e0e0e', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span>🟢 <strong>Available</strong> (Ready)</span>
                        <span>🟡 <strong>Reserved</strong> (Booked)</span>
                        <span>🔴 <strong>Occupied</strong> (Parked)</span>
                        <span>⚫ <strong>Maintenance</strong></span>
                      </div>

                      {/* Slots Grid */}
                      {isSlotsLoading ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
                          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '12px' }}></i>
                          <p>Fetching real-time slots...</p>
                        </div>
                      ) : (
                        <div className="slots-grid">
                          {(slotTypeFilter === 'all' ? slotsList : slotsList.filter(s => s.vehicleType === slotTypeFilter)).map(slot => {
                            let icon = 'fa-car';
                            if (slot.vehicleType === 'bike') icon = 'fa-motorcycle';
                            if (slot.vehicleType === 'ev') icon = 'fa-charging-station';
                            if (slot.vehicleType === 'disabled') icon = 'fa-wheelchair';
                            
                            const isSelected = selectedSlot?._id === slot._id;
                            
                            return (
                              <div 
                                key={slot._id} 
                                className={`slot-block ${slot.status} ${isSelected ? 'selected-slot' : ''}`}
                                onClick={() => handleSelectSlotCard(slot)}
                                title={`Slot ${slot.slotNumber} - ${slot.status.toUpperCase()} (${slot.vehicleType})`}
                              >
                                <span className="slot-status-indicator"></span>
                                <div className="slot-number">{slot.slotNumber}</div>
                                <div className="slot-type-icon"><i className={`fa-solid ${icon}`}></i></div>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{slot.vehicleType}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!isSlotsLoading && slotsList.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                          <i className="fa-solid fa-square-parking" style={{ fontSize: '2.5rem', color: 'var(--border-color)', marginBottom: '10px' }}></i>
                          <p>No slots found for this parking lot.</p>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Booking Form */}
                    <div className="glass-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>Step 2: Confirm Vehicle & Timing</h3>
                        {selectedSlot && (
                          <span className="badge badge-success">
                            Slot {selectedSlot.slotNumber} Selected
                          </span>
                        )}
                      </div>

                      <form onSubmit={handleBookingSubmit} style={{ marginTop: '16px' }}>
                        <div className="form-group">
                          <label>Selected Parking Spot</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            readOnly 
                            value={selectedSlot ? `Slot ${selectedSlot.slotNumber} (${selectedSlot.vehicleType.toUpperCase()})` : ''} 
                            placeholder="👈 Click an available green spot on the left" 
                            style={{ fontWeight: 700, color: selectedSlot ? 'var(--primary-color)' : 'var(--text-secondary)', background: selectedSlot ? 'rgba(255,184,0,0.1)' : '#161616', borderColor: selectedSlot ? 'var(--primary-color)' : 'var(--border-color)' }}
                          />
                        </div>

                        <div className="form-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ margin: 0 }}>Vehicle Plate Number</label>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Type plate or choose below</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="e.g. DL-01-AB-1234"
                              value={bookingVehicle}
                              onChange={(e) => setBookingVehicle(e.target.value.toUpperCase())}
                              required
                              style={{ fontWeight: 700, letterSpacing: '0.5px' }}
                            />
                            {user?.vehicles && user.vehicles.length > 0 && (
                              <select 
                                className="form-control" 
                                style={{ maxWidth: '170px' }}
                                onChange={(e) => {
                                  if (e.target.value) setBookingVehicle(e.target.value);
                                }}
                                value={user.vehicles.some(v => v.vehicleNumber === bookingVehicle) ? bookingVehicle : ''}
                              >
                                <option value="" disabled>Saved Vehicles</option>
                                {user.vehicles.map(v => (
                                  <option key={v.vehicleNumber} value={v.vehicleNumber}>
                                    {v.vehicleNumber} ({v.vehicleType ? v.vehicleType.toUpperCase() : 'CAR'})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Arriving At</label>
                            <input 
                              type="datetime-local" 
                              className="form-control"
                              value={bookingStartTime}
                              onChange={(e) => setBookingStartTime(e.target.value)}
                              required 
                            />
                          </div>
                          <div className="form-group">
                            <label>Leaving At</label>
                            <input 
                              type="datetime-local" 
                              className="form-control"
                              value={bookingEndTime}
                              onChange={(e) => setBookingEndTime(e.target.value)}
                              required 
                            />
                          </div>
                        </div>

                        <div className="glass-card" style={{ background: '#0e0e0e', padding: '16px', border: '1px solid rgba(255,184,0,0.25)', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#d1d5db' }}>Total Parking Fee:</span>
                            <span style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 900 }}>₹{estimatedCost}.00</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: 0 }}>
                            Base Rate: ₹{selectedLot.pricePerHour}/hr • Digital QR Pass & automated gate included
                          </p>
                        </div>

                        <button 
                          type="submit" 
                          className="btn btn-primary" 
                          style={{ width: '100%', padding: '13px', fontSize: '1.05rem', fontWeight: 800 }}
                          disabled={!selectedSlot}
                        >
                          {selectedSlot ? 'Proceed to Pay & Confirm ➔' : '👈 Select an Available Slot First'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Reviews and Comment Section */}
                  <div className="glass-card" style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>⭐ Driver Reviews & Ratings</h3>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                        {slotReviews.length} Verified Review(s)
                      </span>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {slotReviews.length > 0 ? (
                        slotReviews.map(review => (
                          <div key={review._id} style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: '#181818' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <strong style={{ color: '#ffffff' }}>{review.userId?.name || 'Verified Driver'}</strong>
                              <span style={{ color: 'var(--primary-color)' }}>{'⭐'.repeat(review.rating)}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#d1d5db', margin: 0 }}>{review.comment}</p>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--text-secondary)' }}>No reviews posted yet. Be the first to review this parking location!</p>
                      )}
                    </div>

                    <form onSubmit={handleReviewSubmit} style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                      <h4 style={{ marginBottom: '15px' }}>Post a Driver Review</h4>
                      <div className="form-group" style={{ maxWidth: '200px' }}>
                        <label>Rating</label>
                        <select 
                          className="form-control"
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(parseInt(e.target.value, 10))}
                        >
                          <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                          <option value="4">⭐⭐⭐⭐ (4/5)</option>
                          <option value="3">⭐⭐⭐ (3/5)</option>
                          <option value="2">⭐⭐ (2/5)</option>
                          <option value="1">⭐ (1/5)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Comment</label>
                        <textarea 
                          className="form-control" 
                          rows="3" 
                          style={{ resize: 'none' }}
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder="Share your booking and parking experience..."
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary">Submit Review</button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Fallback when no lot is selected */
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <i className="fa-solid fa-square-parking" style={{ fontSize: '3.5rem', color: 'var(--primary-color)', marginBottom: '18px' }}></i>
                  <h2>Choose a Parking Location</h2>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '8px auto 24px' }}>
                    Select one of our 22+ active smart parking hubs across India to view real-time live slots and book your spot.
                  </p>
                  <div className="parking-lots-grid" style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
                    {allLots.slice(0, 6).map((lot, idx) => (
                      <div key={lot._id} className="parking-lot-card glass-card" style={{ cursor: 'pointer' }} onClick={() => handleOpenSlots(lot)}>
                        <div className="parking-lot-name">{lot.name}</div>
                        <div className="parking-lot-address"><i className="fa-solid fa-location-dot"></i> {lot.address}, {lot.city}</div>
                        <div className="parking-lot-stats">
                          <div className="lot-stat-item">
                            <span className="lot-stat-label">Available Slots</span>
                            <span className="lot-stat-value" style={{ color: 'var(--success-color)' }}>{lot.availableSlots} / {lot.totalSlots}</span>
                          </div>
                          <div className="lot-stat-item">
                            <span className="lot-stat-label">Rate</span>
                            <span className="lot-stat-value" style={{ color: 'var(--primary-color)' }}>₹{lot.pricePerHour}/hr</span>
                          </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
                          View Live Slots ➔
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= USER VIEW: MY BOOKINGS ================= */}
          {activeTab === 'user-bookings' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>My Bookings & Digital Passes</h3>
                <button className="btn btn-primary btn-sm" onClick={() => switchTab('find-parking')}>
                  <i className="fa-solid fa-plus"></i> Book New Slot
                </button>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Parking Location</th>
                      <th>Slot</th>
                      <th>Vehicle Plate</th>
                      <th>Booking Time Window</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Pass / Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBookings.length > 0 ? (
                      userBookings.map(b => (
                        <tr key={b._id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-color)' }}>
                            #{b._id.slice(-8).toUpperCase()}
                          </td>
                          <td>
                            <strong>{b.parkingLotId?.name || 'Parking Lot'}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.parkingLotId?.city}</div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>{b.slotId?.slotNumber || 'Slot'}</span>
                            <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                              {b.slotId?.vehicleType || 'Car'}
                            </span>
                          </td>
                          <td><strong>{b.vehicleNumber}</strong></td>
                          <td style={{ fontSize: '0.8rem' }}>
                            <div>{new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div style={{ color: 'var(--text-secondary)' }}>to {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td><strong>₹{b.amount}.00</strong></td>
                          <td>
                            <span className={`badge ${
                              b.status === 'confirmed' ? 'badge-success' : 
                              b.status === 'active' ? 'badge-info' : 
                              b.status === 'completed' ? 'badge-success' : 
                              b.status === 'cancelled' ? 'badge-danger' : 
                              b.status === 'pending' ? 'badge-warning' : 'badge-neutral'
                            }`}>
                              {b.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {b.status === 'pending' ? (
                                <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#3b82f6', borderColor: '#3b82f6' }}
                                  onClick={() => handlePayPendingBooking(b)}
                                >
                                  <i className="fa-solid fa-wallet"></i> Pay Now
                                </button>
                              ) : (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 10px', fontSize: '0.75rem' }} 
                                  onClick={() => viewQRReceipt(b._id)}
                                  title="Open Digital QR Pass"
                                >
                                  <i className="fa-solid fa-qrcode" style={{ color: 'var(--primary-color)', marginRight: '4px' }}></i> QR Pass
                                </button>
                              )}

                              {b.status === 'confirmed' && (
                                <button 
                                  className="btn btn-danger" 
                                  style={{ padding: '6px 10px', fontSize: '0.75rem' }} 
                                  onClick={() => handleCancelBooking(b._id)}
                                  title="Cancel Booking"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '35px 20px', color: 'var(--text-secondary)' }}>
                          <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block', opacity: 0.5 }}></i>
                          No bookings found. <button className="btn btn-primary btn-sm" style={{ marginLeft: '10px' }} onClick={() => switchTab('find-parking')}>Find & Reserve a Spot</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= USER VIEW: PAYMENT LOGS ================= */}
          {activeTab === 'payment-history' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Payments & Transaction Receipts</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Transactions: {userPayments.length}</span>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Location</th>
                      <th>Slot</th>
                      <th>Amount</th>
                      <th>Payment Date</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPayments.length > 0 ? (
                      userPayments.map(p => {
                        const isPaymentDoc = !!p.transactionId && !p.vehicleNumber;
                        const txnId = p.transactionId || `pay_${p._id.slice(-10)}`;
                        const lotName = isPaymentDoc ? (p.bookingId?.parkingLotId?.name || 'Parking Lot') : (p.parkingLotId?.name || 'Parking Lot');
                        const lotCity = isPaymentDoc ? (p.bookingId?.parkingLotId?.city || '') : (p.parkingLotId?.city || '');
                        const slotCode = isPaymentDoc ? (p.bookingId?.slotId?.slotNumber || 'Slot') : (p.slotId?.slotNumber || 'Slot');
                        const amount = p.amount;
                        const dateStr = new Date(p.paidAt || p.createdAt).toLocaleString();
                        const status = p.status || 'success';
                        const bookingId = isPaymentDoc ? p.bookingId?._id : p._id;

                        return (
                          <tr key={p._id}>
                            <td style={{ fontFamily: 'monospace', color: 'var(--primary-color)', fontWeight: 600 }}>{txnId}</td>
                            <td>
                              <strong>{lotName}</strong>
                              {lotCity && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lotCity}</div>}
                            </td>
                            <td><span style={{ color: 'var(--success-color)', fontWeight: 600 }}>{slotCode}</span></td>
                            <td><strong>₹{amount}.00</strong></td>
                            <td style={{ fontSize: '0.85rem' }}>{dateStr}</td>
                            <td>
                              <span className={`badge ${
                                status === 'success' || status === 'confirmed' ? 'badge-success' : 
                                status === 'pending' ? 'badge-warning' : 'badge-danger'
                              }`}>
                                {(status === 'confirmed' ? 'SUCCESS' : status).toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {bookingId ? (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 10px', fontSize: '0.75rem' }} 
                                  onClick={() => viewQRReceipt(bookingId)}
                                  title="View Digital QR Ticket"
                                >
                                  <i className="fa-solid fa-qrcode" style={{ color: 'var(--primary-color)', marginRight: '4px' }}></i> Ticket
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '35px 20px', color: 'var(--text-secondary)' }}>
                          <i className="fa-solid fa-receipt" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block', opacity: 0.5 }}></i>
                          No payment transactions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= USER VIEW: VEHICLE & PROFILE ================= */}
          {activeTab === 'user-profile' && (
            <div className="booking-split-container">
              <div className="glass-card">
                <h3>Profile Settings</h3>
                <form onSubmit={handleSaveProfile} style={{ marginTop: '20px' }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" className="form-control" disabled value={user.email} />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Save Profile</button>
                </form>
              </div>

              <div className="glass-card">
                <h3>Manage Registered Vehicles</h3>
                <form onSubmit={handleAddVehicle} style={{ marginTop: '20px', marginBottom: '24px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Vehicle Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="DL-3C-AB-1234"
                        value={newVehicleNum}
                        onChange={(e) => setNewVehicleNum(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Vehicle Type</label>
                      <select 
                        className="form-control"
                        value={newVehicleType}
                        onChange={(e) => setNewVehicleType(e.target.value)}
                      >
                        <option value="car">Car (Four-wheeler)</option>
                        <option value="bike">Bike (Two-wheeler)</option>
                        <option value="ev">Electric Car (EV)</option>
                        <option value="disabled">Disabled vehicle</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-success" style={{ width: '100%' }}>Add Vehicle</button>
                </form>

                <h4>Registered Vehicles</h4>
                <div style={{ marginTop: '15px' }}>
                  {user.vehicles && user.vehicles.length > 0 ? (
                    user.vehicles.map(v => {
                      let icon = 'fa-car';
                      if (v.vehicleType === 'bike') icon = 'fa-motorcycle';
                      if (v.vehicleType === 'ev') icon = 'fa-charging-station';
                      if (v.vehicleType === 'disabled') icon = 'fa-wheelchair';
                      
                      return (
                        <div key={v.vehicleNumber} className="vehicle-badge-item">
                          <div className="vehicle-badge-info">
                            <i className={`fa-solid ${icon}`} style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}></i>
                            <div>
                              <strong>{v.vehicleNumber}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>{v.vehicleType}</span>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteVehicle(v.vehicleNumber)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            Delete
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No vehicles added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= USER VIEW: NOTIFICATIONS ================= */}
          {activeTab === 'notifications' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Alert Inbox ({unreadNotifications} Unread)</h3>
                <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={markAllNotifications}>
                  Mark all as read
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notificationsList.length > 0 ? (
                  notificationsList.map(n => {
                    let icon = 'fa-info-circle';
                    let color = 'info';
                    if (n.type === 'payment_success') { icon = 'fa-credit-card'; color = 'success'; }
                    if (n.type === 'booking_confirmed') { icon = 'fa-calendar-check'; color = 'success'; }
                    if (n.type === 'entry_success') { icon = 'fa-car'; color = 'success'; }
                    if (n.type === 'exit_success') { icon = 'fa-flag-checkered'; color = 'info'; }
                    if (n.type === 'cancelled') { icon = 'fa-xmark'; color = 'danger'; }
                    if (n.type === 'reminder') { icon = 'fa-clock'; color = 'warning'; }

                    return (
                      <div 
                        key={n._id} 
                        className={`notification-list-item ${n.isRead ? '' : 'unread'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => markSingleNotification(n._id)}
                      >
                        <div className={`notification-list-icon ${color}`}>
                          <i className={`fa-solid ${icon}`}></i>
                        </div>
                        <div className="notification-list-content">
                          <strong>{n.title || 'Notification alert'}</strong>
                          <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{n.message}</div>
                          <div className="notification-list-time">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                    <p>Alert inbox is empty.</p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ================= ADMIN VIEW: ANALYTICS ================= */}
          {activeTab === 'admin-dash' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card glass-card">
                  <div className="stat-info">
                    <h3>{adminStats.totalLots}</h3>
                    <p>Total Locations</p>
                  </div>
                  <div className="stat-icon primary"><i className="fa-solid fa-parking"></i></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-info">
                    <h3>{adminStats.availableSlots} / {adminStats.totalSlots}</h3>
                    <p>Slots Free Ratio</p>
                  </div>
                  <div className="stat-icon success"><i className="fa-solid fa-circle-check"></i></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-info">
                    <h3>{adminStats.todayBookings}</h3>
                    <p>Today's Bookings</p>
                  </div>
                  <div className="stat-icon warning"><i className="fa-solid fa-calendar-day"></i></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-info">
                    <h3>₹{adminStats.todayRevenue}</h3>
                    <p>Today's Revenue</p>
                  </div>
                  <div className="stat-icon danger"><i className="fa-solid fa-indian-rupee-sign"></i></div>
                </div>
              </div>

              <div className="charts-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                <div className="glass-card chart-card" style={{ minHeight: '340px' }}>
                  <h3>Occupancy Distribution</h3>
                  <div style={{ height: '240px', marginTop: '20px', position: 'relative' }}>
                    <Doughnut 
                      data={doughnutData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: textLabelColor } } }
                      }} 
                    />
                  </div>
                </div>
                
                <div className="glass-card chart-card" style={{ minHeight: '340px' }}>
                  <h3>Weekly Revenue (Last 7 Days)</h3>
                  <div style={{ height: '240px', marginTop: '20px', position: 'relative' }}>
                    <Bar data={barChartConfig} options={barChartOptions} />
                  </div>
                </div>
              </div>

              <div className="glass-card chart-card" style={{ marginTop: '24px', minHeight: '340px' }}>
                <h3>Peak Occupancy distribution</h3>
                <div style={{ height: '240px', marginTop: '20px', position: 'relative' }}>
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </div>
            </div>
          )}

          {/* ================= ADMIN VIEW: LOT MANAGEMENT ================= */}
          {activeTab === 'admin-parking' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Parking Lot inventory</h3>
                <button className="btn btn-primary" onClick={() => openLotModal()}>
                  <i className="fa-solid fa-plus"></i> Add Parking Lot
                </button>
              </div>

              <div className="glass-card">
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Lot Name</th>
                        <th>City</th>
                        <th>Address</th>
                        <th>Base Rate</th>
                        <th>Peak Rate</th>
                        <th>Capacity</th>
                        <th>Open</th>
                        <th>Close</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLots.length > 0 ? (
                        allLots.map(lot => (
                          <tr key={lot._id}>
                            <td><strong>{lot.name}</strong></td>
                            <td>{lot.city}</td>
                            <td style={{ fontSize: '0.85rem' }}>{lot.address}</td>
                            <td>₹{lot.pricePerHour}/hr</td>
                            <td>₹{lot.peakPricePerHour}/hr</td>
                            <td><strong>{lot.availableSlots} / {lot.totalSlots}</strong></td>
                            <td>{lot.openingTime}</td>
                            <td>{lot.closingTime}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => openLotModal(lot)}>Edit</button>
                                <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => handleDeleteLot(lot._id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="9" style={{ textAlign: 'center' }}>No parking locations setup.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= ADMIN VIEW: ALL BOOKINGS ================= */}
          {activeTab === 'admin-bookings' && (
            <div className="glass-card">
              <h3>System Booking Logs</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Driver Name</th>
                      <th>Location</th>
                      <th>Slot ID</th>
                      <th>Vehicle Plate</th>
                      <th>Time range</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookings.length > 0 ? (
                      adminBookings.map(b => (
                        <tr key={b._id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b._id}</td>
                          <td>
                            <strong>{b.userId?.name || 'User'}</strong>
                            <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>{b.userId?.phone}</span>
                          </td>
                          <td>{b.parkingLotId?.name || 'Deleted'}</td>
                          <td>{b.slotId?.slotNumber || 'N/A'}</td>
                          <td>{b.vehicleNumber}</td>
                          <td style={{ fontSize: '0.8rem' }}>{new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleTimeString()}</td>
                          <td><strong>₹{b.amount}</strong></td>
                          <td><span className={`badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'active' ? 'badge-info' : b.status === 'cancelled' ? 'badge-danger' : 'badge-neutral'}`}>{b.status}</span></td>
                          <td>
                            {['confirmed', 'active', 'pending'].includes(b.status) ? (
                              <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => handleCancelBooking(b._id)}>Cancel</button>
                            ) : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="9" style={{ textAlign: 'center' }}>No system reservations booked.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= ADMIN VIEW: ALL USERS ================= */}
          {activeTab === 'admin-users' && (
            <div className="glass-card">
              <h3>System User Directory</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email Address</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Plates Registered</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.length > 0 ? (
                      adminUsers.map(u => (
                        <tr key={u._id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{u._id}</td>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>{u.phone}</td>
                          <td><span className="badge badge-info">{u.role.toUpperCase()}</span></td>
                          <td style={{ fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.vehicles?.map(v => `${v.vehicleNumber} (${v.vehicleType.toUpperCase()})`).join(', ') || 'None'}
                          </td>
                          <td>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleToggleUserStatus(u._id)}>
                              Active
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" style={{ textAlign: 'center' }}>No user accounts found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= ADMIN VIEW: ENTRY/EXIT GATES ================= */}
          {activeTab === 'admin-entry-exit' && (
            <div className="booking-split-container">
              {/* Entry scanning simulator */}
              <div className="glass-card">
                <h3>🚪 Gate Entry QR Scanner</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Scan or paste the driver's digital pass token to verify their reservation and open the entry barrier.
                </p>

                <form onSubmit={handleVerifyEntrySubmit} style={{ marginTop: '20px' }}>
                  <div className="form-group">
                    <label>Driver QR Pass Token</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Paste QR Pass Token or Booking ID..."
                      value={gateQrToken}
                      onChange={(e) => setGateQrToken(e.target.value)}
                      required 
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                    <i className="fa-solid fa-qrcode" style={{ marginRight: '6px' }}></i> Verify & Open Gate Barrier
                  </button>
                </form>

                {gateVerificationStatus && (
                  <div style={{ marginTop: '20px' }}>
                    {gateVerificationStatus === 'loading' ? (
                      <p className="text-secondary"><i className="fa-solid fa-spinner fa-spin"></i> Verifying pass in database...</p>
                    ) : gateVerificationStatus.success ? (
                      <div className="glass-card" style={{ border: '1px solid var(--success-color)', background: 'rgba(16,185,129,0.05)', padding: '16px' }}>
                        <h4 style={{ color: 'var(--success-color)', fontSize: '1.1rem', marginBottom: '8px' }}>
                          <i className="fa-solid fa-circle-check"></i> Entry Approved!
                        </h4>
                        <p style={{ fontSize: '0.95rem', margin: 0 }}>
                          Assigned Spot: <strong style={{ color: 'var(--success-color)' }}>{gateVerificationStatus.booking.slotId.slotNumber}</strong> &nbsp;|&nbsp; Vehicle: <strong>{gateVerificationStatus.booking.vehicleNumber}</strong>
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                          Location: {gateVerificationStatus.booking.parkingLotId.name}
                        </p>
                      </div>
                    ) : (
                      <div className="glass-card" style={{ border: '1px solid var(--danger-color)', background: 'rgba(239,68,68,0.05)', padding: '16px' }}>
                        <h4 style={{ color: 'var(--danger-color)', fontSize: '1.1rem', marginBottom: '8px' }}>
                          <i className="fa-solid fa-circle-xmark"></i> Verification Failed
                        </h4>
                        <p style={{ fontSize: '0.9rem', margin: 0 }}>{gateVerificationStatus.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Exit processing gate */}
              <div className="glass-card">
                <h3>🏁 Exit Gate & Vehicle Departures</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '15px' }}>
                  Vehicles currently parked inside. Click "Release & Open Exit" when they leave.
                </p>
                
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Spot</th>
                        <th>Vehicle Plate</th>
                        <th>Location</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeVehiclesList.length > 0 ? (
                        activeVehiclesList.map(b => (
                          <tr key={b._id}>
                            <td><strong style={{ color: 'var(--danger-color)' }}>{b.slotId?.slotNumber}</strong></td>
                            <td><strong>{b.vehicleNumber}</strong></td>
                            <td>{b.parkingLotId?.name}</td>
                            <td>
                              <button onClick={() => handleProcessExit(b._id)} className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                <i className="fa-solid fa-door-open" style={{ marginRight: '4px' }}></i> Open Exit Gate
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No vehicles currently parked inside.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= ADMIN VIEW: IOT SIMULATOR ================= */}
          {activeTab === 'admin-iot' && (
            <div>
              <div className="glass-card" style={{ marginBottom: '24px' }}>
                <label style={{ fontWeight: 600 }}>Choose Parking Location to Simulate:</label>
                <select 
                  className="form-control" 
                  style={{ marginTop: '8px' }}
                  value={iotSelectedLotId}
                  onChange={(e) => {
                    setIotSelectedLotId(e.target.value);
                    fetchIotSlots(e.target.value);
                  }}
                >
                  {allLots.map(lot => (
                    <option key={lot._id} value={lot._id}>{lot.name} ({lot.city})</option>
                  ))}
                </select>
              </div>

              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ margin: 0 }}>📡 Live Ultrasonic Sensor Simulator</h3>
                  <span className="badge badge-success"><i className="fa-solid fa-wifi"></i> Live Real-Time Socket Connected</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px', marginBottom: '20px' }}>
                  Simulate ultrasonic hardware sensors mounted on parking spots. Click <strong>"🚗 Park Car"</strong> to mark a spot occupied or <strong>"✨ Free Spot"</strong> to clear it. Updates broadcast instantly to all drivers.
                </p>

                <div className="iot-slots-layout">
                  {iotSlots.length > 0 ? (
                    iotSlots.map(slot => (
                      <div key={slot._id} className="iot-slot-card glass-card">
                        <div className="iot-slot-header">
                          <strong style={{ fontSize: '1.1rem' }}>Spot {slot.slotNumber}</strong>
                          <span className={`badge badge-${getStatusBadgeColorClass(slot.status)}`}>{slot.status.toUpperCase()}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 10px 0' }}>
                          Sensor ID: <span style={{ fontFamily: 'monospace' }}>{slot.sensorId || `US-${slot._id.slice(-6).toUpperCase()}`}</span>
                        </p>
                        <div className="iot-slot-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button 
                            onClick={() => handleIotSensorChange(slot._id, 'occupied')} 
                            className="btn btn-danger" 
                            style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                            title="Simulate car entering spot"
                          >
                            🚗 Park Car
                          </button>
                          <button 
                            onClick={() => handleIotSensorChange(slot._id, 'available')} 
                            className="btn btn-success" 
                            style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                            title="Simulate car leaving spot"
                          >
                            ✨ Free Spot
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No parking spots configured for this lot yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= ADMIN VIEW: PAYMENTS TRANSACTION ================= */}
          {activeTab === 'admin-payments' && (
            <div className="glass-card">
              <h3>System Payments Log</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Booking Ref</th>
                      <th>Customer Name</th>
                      <th>Parking Location</th>
                      <th>Amount Paid</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPayments.length > 0 ? (
                      adminPayments.map(p => (
                        <tr key={p._id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>{p.transactionId}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.bookingId?._id?.slice(-8) || 'N/A'}</td>
                          <td><strong>{p.userId?.name || 'Customer'}</strong></td>
                          <td>{p.bookingId?.parkingLotId?.name || 'Location'}</td>
                          <td><strong>₹{p.amount}.00</strong></td>
                          <td style={{ fontSize: '0.85rem' }}>{new Date(p.paidAt).toLocaleString()}</td>
                          <td><span className="badge badge-success">{p.status.toUpperCase()}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" style={{ textAlign: 'center' }}>No payments logged.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SIMULATED RAZORPAY PAYMENT MODAL */}
      {showPaymentModal && pendingBooking && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '460px', borderColor: 'var(--primary-color)' }}>
            <h3 style={{ textAlign: 'center', color: 'var(--primary-color)', margin: 0 }}>
              <i className="fa-solid fa-shield-halved"></i> Secure Digital Checkout
            </h3>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Razorpay & UPI Instant Settlement Gateway
            </p>
            
            <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '18px', margin: '16px 0', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Total Amount Due</p>
              <h2 style={{ fontSize: '2.4rem', color: 'var(--text-primary)', margin: '6px 0' }}>₹{pendingBooking.amount}.00</h2>
              <div style={{ display: 'inline-flex', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid var(--border-color)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span>Spot: <strong style={{ color: 'var(--success-color)' }}>{selectedSlot?.slotNumber || 'Assigned'}</strong></span>
                <span>•</span>
                <span>Plate: <strong>{pendingBooking.vehicleNumber}</strong></span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="form-group">
              <label>Select Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  className={`btn ${selectedPaymentMethod === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 4px', fontSize: '0.8rem' }}
                  onClick={() => setSelectedPaymentMethod('upi')}
                >
                  <i className="fa-solid fa-qrcode"></i> UPI / GPay
                </button>
                <button 
                  type="button" 
                  className={`btn ${selectedPaymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 4px', fontSize: '0.8rem' }}
                  onClick={() => setSelectedPaymentMethod('card')}
                >
                  <i className="fa-solid fa-credit-card"></i> Card
                </button>
                <button 
                  type="button" 
                  className={`btn ${selectedPaymentMethod === 'netbanking' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 4px', fontSize: '0.8rem' }}
                  onClick={() => setSelectedPaymentMethod('netbanking')}
                >
                  <i className="fa-solid fa-building-columns"></i> NetBank
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Gateway Test Authorization</label>
              <select 
                className="form-control"
                value={rzpStatus}
                onChange={(e) => setRzpStatus(e.target.value)}
              >
                <option value="success">🟢 Authorize & Confirm Pass (Instant Success)</option>
                <option value="failed">🔴 Decline Transaction (Failed Payment Simulation)</option>
              </select>
            </div>

            <div className="form-row" style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-secondary" 
                disabled={isProcessingPayment} 
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success" 
                disabled={isProcessingPayment} 
                onClick={processSandboxPayment}
                style={{ flex: 2, padding: '12px 16px', fontSize: '0.95rem' }}
              >
                {isProcessingPayment ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Confirming Pass...
                  </>
                ) : (
                  <>
                    Pay ₹{pendingBooking.amount}.00 & Generate Pass ➔
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PASS RECEIPT TICKET MODAL */}
      {showTicketModal && activeTicket && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: 'transparent', boxShadow: 'none', maxWidth: '385px', position: 'relative' }}>
            <button 
              onClick={() => setShowTicketModal(false)}
              style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '1.8rem' }}
              title="Close Pass"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="ticket-wrapper">
              <div className="ticket-card">
                <div className="ticket-header">
                  <h3>{activeTicket.parkingLotId?.name || 'Parking Location'}</h3>
                  <p>✓ Guaranteed Parking Pass</p>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <div className="ticket-info-row">
                    <span className="ticket-label">Driver Name:</span>
                    <span className="ticket-value">{activeTicket.userId?.name || user.name}</span>
                  </div>
                  <div className="ticket-info-row">
                    <span className="ticket-label">Your Spot:</span>
                    <span className="ticket-value" style={{ color: 'var(--success-color)', fontWeight: 700, fontSize: '1.1rem' }}>
                      {activeTicket.slotId?.slotNumber || 'Spot'} ({activeTicket.slotId?.vehicleType?.toUpperCase() || 'CAR'})
                    </span>
                  </div>
                  <div className="ticket-info-row">
                    <span className="ticket-label">Vehicle Plate:</span>
                    <span className="ticket-value">{activeTicket.vehicleNumber}</span>
                  </div>
                  <div className="ticket-info-row">
                    <span className="ticket-label">Valid Duration:</span>
                    <span className="ticket-value" style={{ fontSize: '0.8rem' }}>
                      {new Date(activeTicket.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(activeTicket.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(activeTicket.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="ticket-info-row">
                    <span className="ticket-label">Amount Paid:</span>
                    <span className="ticket-value" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>₹{activeTicket.amount}.00</span>
                  </div>
                  <div className="ticket-info-row">
                    <span className="ticket-label">Pass Status:</span>
                    <span className="ticket-value" style={{ color: 'var(--success-color)', fontWeight: 700 }}>
                      {activeTicket.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="ticket-qr-container">
                  <QRCodeSVG 
                    value={activeTicket.qrToken || `QR_${activeTicket._id}`}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                  <p style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '10px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    QR Pass Token: {activeTicket.qrToken?.slice(0, 16) || activeTicket._id}...
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      onClick={() => {
                        navigator.clipboard?.writeText(activeTicket.qrToken || activeTicket._id);
                        if (window.showToast) window.showToast('QR Token copied to clipboard!', 'success');
                      }}
                    >
                      <i className="fa-solid fa-copy"></i> Copy Token
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      onClick={() => window.print()}
                    >
                      <i className="fa-solid fa-print"></i> Print Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ADD/EDIT PARKING LOT MODAL */}
      {lotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setLotModalOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            <h3 style={{ marginBottom: '20px' }}>{editLotId ? 'Edit Parking Location' : 'Add Parking Lot'}</h3>
            
            <form onSubmit={handleSaveParkingLot}>
              <div className="form-group">
                <label>Parking Lot Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="Connaught Place Multi-Level"
                  value={lotNameForm}
                  onChange={(e) => setLotNameForm(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="Outer Circle, Connaught Place"
                  value={lotAddressForm}
                  onChange={(e) => setLotAddressForm(e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="Delhi"
                    value={lotCityForm}
                    onChange={(e) => setLotCityForm(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="Delhi"
                    value={lotStateForm}
                    onChange={(e) => setLotStateForm(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pincode</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="110001"
                    value={lotPincodeForm}
                    onChange={(e) => setLotPincodeForm(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Capacity slots</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    min="1"
                    placeholder="15"
                    value={lotTotalSlotsForm}
                    onChange={(e) => setLotTotalSlotsForm(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude Coords</label>
                  <input 
                    type="number" 
                    step="any" 
                    className="form-control" 
                    required 
                    placeholder="28.6304"
                    value={lotLatForm}
                    onChange={(e) => setLotLatForm(parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude Coords</label>
                  <input 
                    type="number" 
                    step="any" 
                    className="form-control" 
                    required 
                    placeholder="77.2177"
                    value={lotLngForm}
                    onChange={(e) => setLotLngForm(parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Base Price per Hour (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    min="1"
                    placeholder="40"
                    value={lotPriceForm}
                    onChange={(e) => setLotPriceForm(parseInt(e.target.value, 10))}
                  />
                </div>
                <div className="form-group">
                  <label>Peak Price per Hour (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    min="1"
                    placeholder="60"
                    value={lotPeakPriceForm}
                    onChange={(e) => setLotPeakPriceForm(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Peak Start Hour</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="17:00"
                    value={lotPeakStartForm}
                    onChange={(e) => setLotPeakStartForm(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Peak End Hour</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="21:00"
                    value={lotPeakEndForm}
                    onChange={(e) => setLotPeakEndForm(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Opening Time</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="00:00"
                    value={lotOpeningForm}
                    onChange={(e) => setLotOpeningForm(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Closing Time</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="23:59"
                    value={lotClosingForm}
                    onChange={(e) => setLotClosingForm(e.target.value)}
                  />
                </div>
              </div>

              {/* Parking Lot Image Upload & Preset Picker */}
              <div className="form-group" style={{ marginTop: '10px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  <i className="fa-solid fa-camera" style={{ color: 'var(--primary-color)', marginRight: '6px' }}></i> Parking Lot Photo
                </label>
                
                {/* Image Live Preview */}
                {lotImageForm && (
                  <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', margin: '10px 0', border: '1px solid var(--border-color)' }}>
                    <img src={lotImageForm} alt="Parking Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', color: '#fff' }}>
                      Preview Active
                    </div>
                  </div>
                )}

                {/* Upload from Device or Paste URL */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '8px 14px' }}>
                    <i className="fa-solid fa-upload"></i> Upload From Device
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Or Image URL:</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="https://images.unsplash.com/..." 
                    value={lotImageForm}
                    onChange={(e) => setLotImageForm(e.target.value)}
                    style={{ fontSize: '0.85rem', marginTop: '4px' }}
                  />
                </div>

                {/* Preset Themes Selector */}
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quick Parking Photo Presets:</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {presetParkingImages.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => setLotImageForm(preset.url)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '16px', padding: '12px' }}>
                <i className="fa-solid fa-cloud-arrow-up" style={{ marginRight: '6px' }}></i> Save Location & Slots
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
