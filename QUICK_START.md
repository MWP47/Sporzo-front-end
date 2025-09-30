# 🚀 Sporzo Quick Start Guide

Get your Sporzo football turf booking app up and running in minutes!

---

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser
- OpenWeatherMap API key (free)

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
cd d:\Projects\Sporzo\sporzo-frond-end
npm install
```

### Step 2: Get Weather API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Click "Sign Up" (it's free!)
3. Verify your email
4. Go to "API Keys" section
5. Copy your API key

### Step 3: Configure API Key

Open `src/services/weatherService.js` and replace line 2:

```javascript
// Before
const OPENWEATHER_API_KEY = '8f3c6e2d4a5b7c9e1f2a3b4c5d6e7f8a';

// After
const OPENWEATHER_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

### Step 4: Start the App

```bash
npm start
```

The app will open at `http://localhost:3000` 🎉

---

## 🎯 Testing the Features

### 1. Hero Section
- Visit home page
- See full-screen hero with football turf background
- No gap between header and hero

### 2. Weather Intelligence
- Scroll to "Weather Intelligence" section
- Allow location access when prompted (or it uses default location)
- See 8 hourly weather cards with:
  - Weather icons (sun/cloud/rain)
  - Temperature
  - Weather score (0-100)
  - Playing conditions
- Click "Refresh" to reload weather data

### 3. Browse Turfs
- Click "View Venues" or navigate to `/browse`
- See 24 turfs with images
- Try filters:
  - Search by name/location
  - Select location from dropdown
  - Sort by price/rating/distance
  - Filter by Premium/Regular
  - Toggle "Available Now"
- Click "Reset Filters" to clear

### 4. Book a Turf
- Click "Book Now" on any turf card
- See detailed turf information:
  - Images, rating, location
  - Amenities, capacity, surface type
  - Price per hour
- Select today's date to see weather data
- Choose time slots (6 AM - 11 PM)
- See weather info in each slot:
  - Weather icon
  - Temperature
  - Weather score (color-coded)
- Select multiple slots
- Review booking summary
- Click "Confirm Booking"
- See success notification

### 5. Verify Booking
- Try booking the same slot again
- Should show "This slot is already booked!" error
- Slot should be red and disabled

---

## 🔧 Configuration Options

### Environment Variables (Recommended for Production)

Create `.env` file in root:

```env
REACT_APP_OPENWEATHER_API_KEY=your_api_key_here
REACT_APP_API_BASE_URL=http://localhost:5000
```

Update `src/services/weatherService.js`:

```javascript
const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || 'fallback_key';
```

### Customizing Default Location

In `src/services/weatherService.js`, line 21:

```javascript
// Default location if user denies geolocation
resolve({
  lat: 9.9312,  // Change latitude
  lon: 76.2673, // Change longitude
  isDefault: true,
});
```

---

## 🎨 Customization

### Change Theme Colors

Edit Tailwind classes in components:

```javascript
// Primary color (currently emerald)
className="bg-emerald-500"  // Change to bg-blue-500, bg-purple-500, etc.

// Gradient
className="from-emerald-400 to-cyan-400"  // Change colors
```

### Add More Turfs

Edit `src/pages/FootballTurfBooking.jsx` and `src/pages/TurfDetails.jsx`:

```javascript
const turfs = [
  {
    id: 4,  // New ID
    name: "Your Turf Name",
    location: "Your Location",
    price: 80,
    rating: 4.9,
    image: "https://your-image-url.com/image.jpg",
    premium: true
  },
  // ... existing turfs
];
```

Also add to `turfsData` object in `TurfDetails.jsx`.

### Change Time Slots

Edit `src/pages/TurfDetails.jsx`, line 64:

```javascript
// Change start and end hours
for (let hour = 6; hour <= 22; hour++) {  // Currently 6 AM to 11 PM
  // Change to: for (let hour = 5; hour <= 23; hour++)  // 5 AM to 12 AM
}
```

---

## 📱 Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🐛 Troubleshooting

### Weather Not Loading?

**Problem**: Weather cards show "Loading..." forever

**Solutions**:
1. Check API key is correct
2. Open browser console (F12) and check for errors
3. Verify internet connection
4. Check OpenWeatherMap API status
5. Ensure you haven't exceeded API quota (60 calls/minute free tier)

**Test API Key**:
```bash
# Replace YOUR_API_KEY with your actual key
curl "https://api.openweathermap.org/data/2.5/weather?lat=9.9312&lon=76.2673&appid=YOUR_API_KEY"
```

### Location Not Detected?

**Problem**: Shows "Demo Data" instead of your location

**Solutions**:
1. Click the location icon in browser address bar
2. Allow location access
3. Refresh the page
4. If still not working, it will use default location (Kochi, India)

### Slots Not Showing Weather?

**Problem**: Time slots don't show weather info

**Solutions**:
1. Ensure you selected today's date (weather only available for today)
2. Wait for weather data to load
3. Check browser console for errors
4. Refresh the page

### Bookings Not Saving?

**Problem**: Bookings disappear after refresh

**Solutions**:
1. Check browser localStorage is enabled
2. Don't use incognito/private mode
3. Check browser console for localStorage errors
4. Clear browser cache and try again

### Images Not Loading?

**Problem**: Turf images show broken image icon

**Solutions**:
1. Check internet connection
2. Images are from Unsplash CDN
3. Try different network
4. Replace with local images if needed

---

## 🔐 Security Notes

### For Development
- API key in code is fine for testing
- Use localhost only

### For Production
- **MUST** use environment variables
- **NEVER** commit `.env` file
- Add `.env` to `.gitignore`
- Use backend proxy for API calls
- Implement rate limiting

---

## 📊 API Usage Limits

### OpenWeatherMap Free Tier
- **60 calls/minute**
- **1,000,000 calls/month**
- **Current weather data**
- **5-day forecast**

### How App Uses API
- Home page: 1 call on load + 1 per refresh
- Booking page: 1 call per date selection
- Average: ~10-20 calls per user session

**Tip**: Implement caching to reduce API calls!

---

## 🎓 Learning the Codebase

### Key Files to Understand

1. **`src/pages/FootballTurfBooking.jsx`**
   - Home page with weather section
   - Weather data fetching logic

2. **`src/pages/TurfDetails.jsx`**
   - Booking page with slot selection
   - Weather integration with slots

3. **`src/services/weatherService.js`**
   - Weather API calls
   - Weather scoring algorithm
   - Geolocation handling

4. **`src/components/WeatherCard.jsx`**
   - Weather display component
   - Visual weather indicators

5. **`src/components/Notification.jsx`**
   - Toast notification system

### Data Flow

```
User Opens App
    ↓
getUserLocation() → Get lat/lon
    ↓
getHourlyForecast(lat, lon) → Fetch weather
    ↓
calculateWeatherScore() → Score each hour
    ↓
Display in WeatherCard components
    ↓
User selects date in booking
    ↓
fetchWeatherForDate() → Get weather for slots
    ↓
Display weather in each time slot
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Creates optimized build in `build/` folder.

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables in Production

Add these in your hosting platform:
- `REACT_APP_OPENWEATHER_API_KEY`
- `REACT_APP_API_BASE_URL`

---

## 📈 Performance Tips

### Optimize Images
- Use WebP format
- Compress images
- Use CDN for hosting

### Reduce API Calls
- Cache weather data (5-10 minutes)
- Store in localStorage with timestamp
- Only fetch when cache expires

### Code Splitting
- Lazy load routes
- Dynamic imports for heavy components

---

## 🎯 Next Steps

1. **Backend Integration**
   - Set up Node.js/Express backend
   - Create booking API endpoints
   - Add database (MongoDB/PostgreSQL)

2. **Payment Integration**
   - Integrate Razorpay/Stripe
   - Add payment confirmation
   - Generate booking receipts

3. **User Features**
   - User dashboard
   - Booking history
   - Profile management
   - Reviews and ratings

4. **Admin Panel**
   - Manage turfs
   - View bookings
   - Analytics dashboard
   - User management

---

## 📞 Need Help?

### Resources
- 📖 [Full Documentation](./IMPLEMENTATION_SUMMARY.md)
- 🌤️ [Weather Integration Guide](./WEATHER_INTEGRATION.md)
- 🔧 [React Documentation](https://react.dev)
- 🌐 [OpenWeatherMap API Docs](https://openweathermap.org/api)

### Common Issues
- Check browser console for errors
- Verify all dependencies installed
- Ensure API key is valid
- Test on different browsers

---

## ✅ Quick Checklist

Before going live:

- [ ] API key configured
- [ ] Environment variables set
- [ ] Images loading correctly
- [ ] Weather data fetching
- [ ] Bookings saving to localStorage
- [ ] Notifications working
- [ ] Responsive on mobile
- [ ] Tested on multiple browsers
- [ ] Error handling working
- [ ] Loading states showing
- [ ] Navigation working
- [ ] Filters functioning
- [ ] Search working
- [ ] Build successful
- [ ] Deployed and accessible

---

## 🎊 You're All Set!

Your Sporzo app is now ready to use! 

**Key Features Working:**
- ✅ Beautiful hero section
- ✅ Real-time weather intelligence
- ✅ Smart booking system
- ✅ Advanced turf browsing
- ✅ Weather-based recommendations
- ✅ Instant notifications

**Enjoy building the future of football turf booking! ⚽🌟**

---

*For detailed documentation, see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)*
