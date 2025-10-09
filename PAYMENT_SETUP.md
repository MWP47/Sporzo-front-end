# Payment System Setup Guide

## Overview
The Sporzo app includes a complete payment system with both Razorpay integration and manual payment options.

## Features
- ✅ Razorpay online payment integration
- ✅ Manual payment (pay at venue) option
- ✅ Payment history tracking
- ✅ Booking confirmation system
- ✅ Error handling and user feedback
- ✅ Test mode for development

## Quick Start

### 1. Test the Payment System
Visit `/payment-demo` in your app to test both payment methods:
- **Razorpay Test**: Uses test cards, no real money charged
- **Manual Payment**: Simulates pay-at-venue booking

### 2. Test Payment Details
For Razorpay testing, use these test card details:
- **Card Number**: 4111 1111 1111 1111 (Visa) or 5555 5555 5555 4444 (Mastercard)
- **CVV**: Any 3 digits (e.g., 123)
- **Expiry**: Any future date (e.g., 12/25)
- **Name**: Any name

### 3. Live Payment Setup

#### Step 1: Get Razorpay Account
1. Sign up at [razorpay.com](https://razorpay.com)
2. Complete KYC verification
3. Get your live API keys from the dashboard

#### Step 2: Update Configuration
Replace the test key in `src/services/paymentService.js`:
```javascript
const RAZORPAY_CONFIG = {
  key: "rzp_live_YOUR_LIVE_KEY_HERE", // Replace with your live key
  // ... rest of config
};
```

#### Step 3: Environment Variables (Recommended)
Create a `.env` file in your project root:
```
REACT_APP_RAZORPAY_KEY=rzp_live_YOUR_LIVE_KEY_HERE
```

Then update the service:
```javascript
const RAZORPAY_CONFIG = {
  key: process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_1DP5mmOlF5G5ag",
  // ... rest of config
};
```

## Payment Flow

### Online Payment (Razorpay)
1. User selects slots and clicks "Proceed to Payment"
2. Payment modal opens with booking summary
3. User clicks "Pay Now with Razorpay"
4. Razorpay checkout opens
5. User completes payment
6. Booking is confirmed and slots are reserved
7. Payment record is saved locally

### Manual Payment
1. User selects slots and clicks "Proceed to Payment"
2. Payment modal opens with booking summary
3. User clicks "Pay at Venue"
4. Booking is confirmed with "pending" payment status
5. User pays at the venue when they arrive

## Data Storage
- **Bookings**: Stored in `localStorage` under "turfBookings"
- **Payments**: Stored in `localStorage` under "payments"
- **Format**: JSON arrays with detailed payment/booking information

## Security Notes
- Never expose live API keys in client-side code
- Use environment variables for sensitive data
- Implement server-side payment verification for production
- The current implementation is for demo/development purposes

## Payment Records Structure
```javascript
{
  id: "pay_1234567890",
  bookingId: "BK1234567890123",
  turfId: "1",
  turfName: "Elite Turf Arena",
  date: "2024-01-15",
  slots: ["slot-10", "slot-11"],
  amount: 1000,
  paymentMethod: "razorpay", // or "manual"
  status: "completed", // or "pending"
  paymentData: {
    paymentId: "pay_xyz123",
    orderId: "order_abc456",
    signature: "signature_def789"
  },
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

## Testing Checklist
- [ ] Razorpay payment completes successfully
- [ ] Manual payment creates pending booking
- [ ] Payment history displays correctly
- [ ] Error handling works (cancelled payments, network issues)
- [ ] Booking slots are properly reserved
- [ ] Notifications show appropriate messages

## Production Deployment
1. Replace test keys with live keys
2. Set up webhook endpoints for payment verification
3. Implement server-side booking validation
4. Add proper error logging and monitoring
5. Test with small amounts before going live

## Support
For Razorpay integration issues, refer to:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

## Demo Access
Visit `http://localhost:3000/payment-demo` to test the payment system without going through the full booking flow.
