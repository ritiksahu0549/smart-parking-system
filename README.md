# 🅿️ Smart Parking System — Full MERN Stack Real-Time Platform

A production-grade, full-stack **Smart Parking Slot Booking & Management System** built with the **MERN stack (MongoDB, Express.js, React.js, Node.js)**, featuring real-time Socket.IO synchronization, dynamic QR-code tickets, simulated IoT sensor hardware layer, online payment gateway (Razorpay/Mock Sandbox), comprehensive administrative analytics, and a modern responsive UI.

---

## 🌟 Key Features

### 👤 Driver / Customer Features
- **User Authentication & Profiles:** Secure registration, login, JWT session persistence, password hashing with bcrypt, and profile manager.
- **Multi-Vehicle Registry:** Save multiple vehicles with custom license plate numbers and types (*Car, Bike, Electric Vehicle / EV, Accessible/Disabled*).
- **India-wide & Local Smart Search:** Search parking lots by city (Delhi, Mumbai, Bengaluru, Indore, Bhopal, Pune, Hyderabad, Jaipur, etc.), area, landmark, or with one-click **"Use My Location" (GPS)** distance sorting.
- **Interactive Live Slot Grid:** Real-time visual slot grid with instant status indicators:
  - 🟢 **Available** (Ready for booking)
  - 🟡 **Reserved** (Booked by customer, awaiting vehicle arrival)
  - 🔴 **Occupied** (Vehicle physically parked on slot)
  - ⚫ **Maintenance** (Temporarily closed)
- **Time Window & Conflict Validation:** Select start/end booking times; backend automatically prevents double-booking and overlapping reservations.
- **Dynamic Pricing Engine:** Base hourly rate + peak hour surge multipliers (5:00 PM – 9:00 PM) + vehicle type adjustments (EV / Bike).
- **Online Payment Gateway:** Integrated Razorpay sandbox and instant simulated checkout modal.
- **Digital QR Code Pass:** Generates a unique digital ticket with an encoded high-resolution QR code (`QRCodeSVG`), booking reference, slot number, vehicle plate, and time window.
- **Booking & Payment History:** Review past and active reservations, view digital receipts, download/view QR tickets, and cancel active reservations.
- **Ratings & Reviews:** Community-driven star ratings (1–5 ⭐) and verified user feedback.
- **In-App Notification Center:** Real-time notifications for booking confirmations, upcoming arrival reminders, payment success, and slot status updates.

### 🛡️ Admin & Parking Operator Features
- **Real-Time Analytics Dashboard:**
  - Key operational KPIs: Total Parking Locations, Total Capacity, Live Available Slots, Today's Bookings Count, and Today's Gross Revenue.
  - Interactive **Chart.js** visualizations:
    - *Occupancy Distribution Doughnut Chart* (Available vs Reserved vs Occupied)
    - *7-Day Revenue & Booking Volume Combo Chart*
    - *Hourly Peak Occupancy Distribution Line Chart*
- **Parking Lot Management (CRUD):** Add, update, and manage parking lots across any city, configure base rates, peak rates, operational hours, total slot counts, amenities, and geographic coordinates.
- **Live Booking & User Directory:** View all system bookings with status filtering, cancel bookings, view registered users, and inspect vehicle profiles.
- **Gate Entry / Exit Operator Controller:**
  - **Entry Gate:** Scan or enter digital QR token to verify ticket validity, open gate, and mark slot as occupied.
  - **Exit Gate:** One-click vehicle release upon exit, marking reservation completed and instantly freeing up the slot.
- **Simulated IoT Sensor Hardware Layer:**
  - Interactive ultrasonic parking sensor interface (`sensor-lotid-slotnum`).
  - Simulates physical vehicle detection (*Park / Vehicle Detected*) and vacancy (*Clear / Slot Vacated*).
  - Ready for future hardware integration (ESP32 / Arduino / MQTT / REST API `/api/iot/slot/:id/status`).
- **Payments Transaction Ledger:** Comprehensive financial logs with transaction IDs, customer details, timestamps, and payment statuses.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React.js 19, React Router v7, Vite, Chart.js, React-ChartJS-2, QRCode.react, FontAwesome 6, CSS3 Variables (Dark & Light Mode) |
| **Backend** | Node.js, Express.js, RESTful APIs |
| **Real-time Layer** | Socket.IO (Bidirectional WebSocket events: `slotUpdated`, `vehicleEntered`, `vehicleExited`) |
| **Database** | MongoDB + Mongoose ODM |
| **Security & Auth** | JSON Web Tokens (JWT), bcryptjs (Salted Password Hashing), Role-Based Access Control (User / Admin) |
| **Payment** | Razorpay Sandbox API + Embedded Mock Gateway Controller |
| **Scheduled Worker** | Node background cron timer for upcoming reservation alerts |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** running locally on default port `27017` (or MongoDB Atlas connection URI)

### 2. Installation
```bash
# Navigate to project directory
cd smart-parking

# Install backend dependencies
npm install

# Install client dependencies
cd client
npm install
npm run build
cd ..
```

### 3. Environment Variables
Check or create `.env` in the root `smart-parking/` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart-parking
JWT_SECRET=supersecretjwtkeyforparking123
RAZORPAY_KEY_ID=rzp_test_mockkeyid123
RAZORPAY_KEY_SECRET=mockkeysecret123
```

### 4. Seed Database with Demo Data
Populate 22 Indian multi-city parking lots, slots, demo users, active bookings, and notifications:
```bash
npm run seed
```

### 5. Start Server
```bash
npm start
# or for live reload:
npm run dev
```

Open your browser at: **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Demo Login Credentials

You can use the **1-Click Quick Demo Login** buttons on the login page or enter:

| Role | Email | Password |
|---|---|---|
| **Driver (User)** | `user@parking.com` | `user123` |
| **Administrator / Operator** | `admin@parking.com` | `admin123` |

---

## ⚡ Real-Time IoT & Socket.IO Test Guide

1. Open two browser windows side-by-side:
   - **Window 1:** Log in as **Driver** (`user@parking.com`), click **Find Parking** -> select a lot (e.g. *Vijay Nagar Smart Parking Lot*).
   - **Window 2:** Log in as **Admin** (`admin@parking.com`), click **IoT Simulator** -> select the same lot.
2. In Window 2 (Admin), click **Park** on Slot `S-02`.
3. In Window 1 (Driver), Slot `S-02` will **instantaneously turn 🔴 Occupied** without reloading the page!
4. Click **Clear** in Window 2, and Window 1 will immediately update to 🟢 **Available**.

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new customer or operator |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT token |
| `GET` | `/api/auth/profile` | Get logged-in user profile |
| `PUT` | `/api/auth/profile` | Update profile details and registered vehicles |
| `GET` | `/api/parking` | List active parking lots with search/city filter |
| `GET` | `/api/parking/:id/slots` | Get live slot occupancy layout for a lot |
| `POST` | `/api/parking/:id/reviews`| Post user rating and review |
| `POST` | `/api/bookings` | Create new slot reservation with overlap validation |
| `GET` | `/api/bookings/my` | Get user's reservation history |
| `POST` | `/api/bookings/estimate` | Estimate dynamic parking cost |
| `PUT` | `/api/bookings/:id/cancel` | Cancel an active booking |
| `POST` | `/api/payment/create-order`| Initialize Razorpay payment order |
| `POST` | `/api/payment/verify` | Verify payment and activate reservation pass |
| `POST` | `/api/entry/verify` | Gate Operator: Verify QR token and allow entry |
| `POST` | `/api/entry/exit` | Gate Operator: Process vehicle departure |
| `PATCH`| `/api/iot/slot/:id/status`| Hardware/Simulated IoT sensor state update |
| `GET` | `/api/admin/dashboard` | Admin: Aggregated KPI statistics & chart datasets |
| `GET` | `/api/admin/bookings` | Admin: Fetch all system bookings |
| `GET` | `/api/admin/users` | Admin: System user management |
| `GET` | `/api/admin/payments` | Admin: Full transaction payment history |
| `GET` | `/api/notifications` | Fetch user alerts and reminders |
