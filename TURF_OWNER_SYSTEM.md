# Turf Owner Management System

## Overview
A complete turf owner portal has been added to Sporzo, allowing turf owners to manage their properties, view bookings, and handle their business operations separately from regular customers.

## Features Implemented

### 1. Authentication System
- **Separate Login Portal** (`/owner/login`)
  - Dedicated login page for turf owners
  - Demo credentials: `owner@sporzo.com` / `owner123`
  - Secure token-based authentication
  
- **Registration System** (`/owner/register`)
  - Complete registration form with business details
  - Validation and error handling
  - Automatic redirect to login after successful registration

### 2. Owner Dashboard (`/owner/dashboard`)
- **Statistics Overview**
  - Total turfs managed
  - Total bookings received
  - Revenue generated
  - Average rating across all turfs

- **Quick Actions**
  - Add new turf
  - View bookings
  - Access analytics

- **Turf Management Grid**
  - Visual cards for each turf
  - Quick edit, view, and delete actions
  - Image previews and key details

### 3. Turf Management (`/owner/turf/add` & `/owner/turf/edit/:id`)
- **Complete Turf Setup**
  - Basic information (name, location, price, description)
  - Specifications (capacity, size, surface type, operating hours)
  - Multiple image upload with preview
  - Amenities management (common + custom)

- **Features**
  - Image upload and management
  - Drag-and-drop amenities selection
  - Flexible operating hours configuration
  - Real-time form validation

### 4. Booking Management (`/owner/bookings`)
- **Comprehensive Booking View**
  - All bookings across owner's turfs
  - Status tracking (completed, pending, cancelled, confirmed)
  - Customer contact information
  - Payment method details

- **Advanced Filtering**
  - Filter by status, turf, date range
  - Search by customer name or booking ID
  - Real-time statistics

- **Booking Details**
  - Date and time slots
  - Customer information
  - Payment status and method
  - Direct links to turf pages

## Routes Added

### Public Routes
- `/owner/login` - Turf owner login
- `/owner/register` - Turf owner registration

### Protected Routes (Require Owner Authentication)
- `/owner/dashboard` - Main dashboard
- `/owner/turf/add` - Add new turf
- `/owner/turf/edit/:id` - Edit existing turf
- `/owner/bookings` - View all bookings

## Data Structure

### Owner Data (localStorage: `turfOwner`)
```javascript
{
  id: "owner1",
  name: "John Doe",
  email: "owner@sporzo.com",
  phone: "9999999999",
  businessName: "Elite Sports Arena",
  businessAddress: "123 Sports Complex, City",
  role: "turf_owner"
}
```

### Turf Data (localStorage: `ownerTurfs`)
```javascript
{
  id: 1,
  ownerId: "owner1",
  name: "Elite Turf Arena",
  location: "Downtown, Sector 1",
  price: 500,
  description: "Premium quality turf...",
  capacity: "11v11 (22 players)",
  size: "100m x 64m",
  surface: "Artificial Grass - FIFA Approved",
  operatingHours: { start: 6, end: 22, type: "Standard" },
  images: ["base64_image_data..."],
  amenities: ["Floodlights", "Changing Rooms", "Parking"],
  rating: 4.5,
  timings: "6 AM - 10 PM"
}
```

## Key Components Created

1. **TurfOwnerLogin.jsx** - Authentication for owners
2. **TurfOwnerRegister.jsx** - Owner registration form
3. **TurfOwnerDashboard.jsx** - Main dashboard with stats and turf grid
4. **TurfManagement.jsx** - Add/edit turf with full form
5. **TurfBookingManagement.jsx** - Booking management with filters

## Integration Points

- **App.js Updated** - All owner routes added with proper routing
- **Navbar Hidden** - Owner pages use their own navigation
- **Customer Login** - Added link to owner portal
- **Data Integration** - Owner turfs integrate with existing booking system

## Demo Credentials

For testing the system:
- **Email:** owner@sporzo.com
- **Password:** owner123

## Usage Flow

1. **Owner Registration/Login**
   - Navigate to `/owner/login`
   - Use demo credentials or register new account
   
2. **Add Turfs**
   - From dashboard, click "Add New Turf"
   - Fill in all details, upload images, select amenities
   - Save to make turf available for booking

3. **Manage Bookings**
   - View all bookings from "View Bookings" button
   - Filter and search through bookings
   - Track payment status and customer details

4. **Monitor Performance**
   - Dashboard shows key metrics
   - Track revenue, ratings, and booking volume

## Technical Features

- **Responsive Design** - Works on all device sizes
- **Real-time Updates** - Data syncs across components
- **Image Management** - Upload, preview, and delete images
- **Form Validation** - Comprehensive input validation
- **Error Handling** - User-friendly error messages
- **Loading States** - Smooth user experience with loading indicators

The system is now fully functional and ready for turf owners to manage their properties effectively!
