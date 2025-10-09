// Payment Service for handling Razorpay and manual payments

// Backend API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Razorpay configuration
const RAZORPAY_CONFIG = {
  key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_RP5bC8UGjmg9jA", // Your actual Razorpay test key
  currency: "INR",
  name: "Sporzo",
  description: "Football Turf Booking",
  image: "/logo192.png", // Your app logo
  theme: {
    color: "#10B981" // Emerald color matching your theme
  },
  // Enable all payment methods
  method: {
    netbanking: true,
    card: true,
    wallet: true,
    upi: true,
    paylater: true
  }
};

/**
 * Load Razorpay script dynamically
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== 'undefined') {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

/**
 * Fallback payment simulation
 */
const simulatePayment = (paymentData) => {
  return new Promise((resolve, reject) => {
    const confirmPayment = window.confirm(
      `💳 Payment Simulation\n\n` +
      `Amount: ₹${paymentData.amount}\n` +
      `Booking: ${paymentData.bookingId}\n\n` +
      `Click OK to simulate successful payment\n` +
      `Click Cancel to simulate payment failure`
    );
    
    setTimeout(() => {
      if (confirmPayment) {
        resolve({
          success: true,
          paymentId: `pay_sim_${Date.now()}`,
          orderId: `order_sim_${Date.now()}`,
          signature: `sig_sim_${Date.now()}`,
          method: 'simulation'
        });
      } else {
        reject(new Error('Payment cancelled by user'));
      }
    }, 1000);
  });
};

/**
 * Create Razorpay order via backend
 */
const createRazorpayOrder = async (amount, bookingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        receipt: bookingId,
        notes: {
          bookingId,
          source: 'sporzo_frontend'
        }
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create order');
    }

    return data.order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Verify payment via backend
 */
const verifyPaymentWithBackend = async (paymentResponse, bookingData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        bookingData
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Payment verification failed');
    }

    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Create manual booking via backend
 */
const createManualBookingWithBackend = async (bookingData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/manual-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingData })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create manual booking');
    }

    return data;
  } catch (error) {
    console.error('Error creating manual booking:', error);
    throw error;
  }
};

/**
 * Initialize Razorpay payment
 */
export const initiateRazorpayPayment = async (paymentData) => {
  try {
    // Ensure Razorpay script is loaded
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      console.warn('Razorpay script failed to load, using simulation mode');
      return simulatePayment(paymentData);
    }

    // Validate the API key
    if (!RAZORPAY_CONFIG.key || RAZORPAY_CONFIG.key === 'rzp_test_YOUR_KEY_HERE') {
      console.error('Invalid Razorpay key');
      throw new Error('Payment configuration error. Please contact support.');
    }

    console.log('Initializing Razorpay payment with key:', RAZORPAY_CONFIG.key.substring(0, 15) + '...');

    // Create order via backend
    const order = await createRazorpayOrder(paymentData.amount, paymentData.bookingId);
    console.log('Order created:', order);

    return new Promise((resolve, reject) => {
      // Real Razorpay integration with all payment options
      const options = {
        key: RAZORPAY_CONFIG.key,
        amount: order.amount,
        currency: order.currency,
        name: RAZORPAY_CONFIG.name,
        description: `${RAZORPAY_CONFIG.description} - ${paymentData.bookingId}`,
        image: RAZORPAY_CONFIG.image,
        order_id: order.id,
      
      // Enable all payment methods
      method: {
        netbanking: true,
        card: true,
        wallet: true,
        upi: true,
        paylater: true,
        emi: true
      },
      
      // Prefill customer details
      prefill: {
        name: paymentData.customerName || "Customer",
        email: paymentData.customerEmail || "customer@sporzo.com",
        contact: paymentData.customerPhone || "9999999999"
      },
      
      // Additional notes for tracking
      notes: {
        turf_id: paymentData.turfId,
        booking_date: paymentData.date,
        slots: paymentData.slots.join(','),
        booking_id: paymentData.bookingId,
        app_name: "Sporzo"
      },
      
      // Theme customization
      theme: {
        color: RAZORPAY_CONFIG.theme.color,
        backdrop_color: "#000000"
      },
      
      // Success handler
      handler: async function (response) {
        console.log('Payment successful:', response);
        
        try {
          // Verify payment with backend
          const verificationResult = await verifyPaymentWithBackend(response, {
            bookingId: paymentData.bookingId,
            turfId: paymentData.turfId,
            turfName: paymentData.turfName || 'Turf',
            date: paymentData.date,
            slots: paymentData.slots,
            amount: paymentData.amount,
            customerDetails: {
              name: paymentData.customerName,
              email: paymentData.customerEmail,
              phone: paymentData.customerPhone
            }
          });

          resolve({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            method: response.method || 'unknown',
            booking: verificationResult.booking,
            backendVerified: true,
            // Echo customer details for downstream display/storage
            customerName: options.prefill?.name || paymentData.customerName,
            customerEmail: options.prefill?.email || paymentData.customerEmail,
            customerPhone: options.prefill?.contact || paymentData.customerPhone
          });
        } catch (error) {
          console.error('Backend verification failed:', error);
          // Still resolve with payment data, but mark as unverified
          resolve({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            method: response.method || 'unknown',
            backendVerified: false,
            verificationError: error.message,
            // Echo customer details for downstream display/storage
            customerName: options.prefill?.name || paymentData.customerName,
            customerEmail: options.prefill?.email || paymentData.customerEmail,
            customerPhone: options.prefill?.contact || paymentData.customerPhone
          });
        }
      },
      
      // Modal configuration
      modal: {
        ondismiss: function() {
          console.log('Payment modal dismissed');
          reject(new Error('Payment cancelled by user'));
        },
        // Prevent accidental dismissal
        escape: false,
        backdropclose: false
      },
      
      // Retry configuration
      retry: {
        enabled: true,
        max_count: 3
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      
      // Handle payment failure
      rzp.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);
        reject(new Error(response.error.description || response.error.reason || 'Payment failed'));
      });

      // Open the payment modal
      rzp.open();
      
      } catch (error) {
        console.error('Error initializing Razorpay:', error);
        reject(new Error('Failed to initialize payment gateway. Please try again.'));
      }
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

/**
 * Process manual payment (pay at venue)
 */
export const processManualPayment = async (bookingData) => {
  try {
    // Try to create booking via backend
    const result = await createManualBookingWithBackend({
      bookingId: bookingData.bookingId,
      turfId: bookingData.turfId,
      turfName: bookingData.turfName || 'Turf',
      date: bookingData.date,
      slots: bookingData.slots,
      // In our UI flow, manual booking uses 'total'; fallback if 'amount' isn't present
      amount: bookingData.amount ?? bookingData.total,
      customerDetails: {
        name: bookingData.customerName || 'Customer',
        email: bookingData.customerEmail || 'customer@sporzo.com',
        phone: bookingData.customerPhone || '9999999999'
      }
    });

    return {
      success: true,
      paymentMethod: 'manual',
      bookingId: bookingData.bookingId,
      status: 'pending',
      booking: result.booking,
      backendCreated: true
    };
  } catch (error) {
    console.error('Backend manual booking failed, using local storage:', error);
    
    // Fallback to local processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          paymentMethod: 'manual',
          bookingId: bookingData.bookingId,
          status: 'pending',
          backendCreated: false,
          error: error.message
        });
      }, 1500);
    });
  }
};

/**
 * Save payment record to localStorage
 */
export const savePaymentRecord = (paymentRecord) => {
  try {
    const payments = JSON.parse(localStorage.getItem("payments")) || [];
    payments.push({
      ...paymentRecord,
      id: `pay_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem("payments", JSON.stringify(payments));
    return true;
  } catch (error) {
    console.error('Error saving payment record:', error);
    return false;
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = () => {
  try {
    return JSON.parse(localStorage.getItem("payments")) || [];
  } catch (error) {
    console.error('Error retrieving payment history:', error);
    return [];
  }
};

/**
 * Verify payment status (mock implementation)
 */
export const verifyPayment = async (paymentId) => {
  // In a real implementation, this would call your backend to verify with Razorpay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        verified: true,
        status: 'captured',
        amount: 1000 // This would come from your backend
      });
    }, 1000);
  });
};

/**
 * Generate booking ID
 */
export const generateBookingId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `BK${timestamp}${random}`;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};
