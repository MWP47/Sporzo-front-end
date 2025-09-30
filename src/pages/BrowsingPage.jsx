// TurfBrowse.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import Header from '../components/Header';

const TurfBrowse = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [favorites, setFavorites] = useState(new Set());

  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedType, setSelectedType] = useState('all');
  const [availableNow, setAvailableNow] = useState(false);

  // Turf data with images and details
  const turfImages = [
    "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
    "https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800",
    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800",
  ];

  const generateTurfs = () => {
    const locations = ['Downtown', 'Uptown', 'Midtown', 'Ernakulam', 'Kochi', 'Alangad', 'Aluva', 'Thrissur'];
    const turfNames = ['Elite Turf Arena', 'Pro Stadium', 'Champion Field', 'Victory Arena', 'Legends Ground', 'Golden Boot Stadium'];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      name: `${turfNames[i % turfNames.length]}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      price: 50 + Math.floor(Math.random() * 50) * 10, // 50-500 in multiples of 10
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      distance: Math.floor(Math.random() * 25),
      isPremium: Math.random() > 0.6,
      isAvailable: Math.random() > 0.3,
      image: turfImages[i % turfImages.length],
      phone: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
    }));
  };

  const [turfs, setTurfs] = useState(generateTurfs());
  const [filteredTurfs, setFilteredTurfs] = useState(turfs);

  useEffect(() => {
    let filtered = turfs.filter(turf => {
      if (searchQuery && !turf.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !turf.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedLocation && turf.location !== selectedLocation) return false;
      if (selectedType === 'premium' && !turf.isPremium) return false;
      if (selectedType === 'regular' && turf.isPremium) return false;
      if (availableNow && !turf.isAvailable) return false;
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance': return a.distance - b.distance;
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        default: return 0;
      }
    });

    setFilteredTurfs(filtered);
  }, [searchQuery, selectedLocation, sortBy, selectedType, availableNow, turfs]);

  const toggleFavorite = (turfId) => {
    const newFavorites = new Set(favorites);
    newFavorites.has(turfId) ? newFavorites.delete(turfId) : newFavorites.add(turfId);
    setFavorites(newFavorites);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setPriceRange([0, 5000]);
    setSelectedRating(0);
    setSelectedType('all');
    setAvailableNow(false);
  };

  const TurfCard = ({ turf }) => (
    <div className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:scale-105 hover:border-emerald-500/50">
      <div className="relative">
        <img src={turf.image} alt={turf.name} className="w-full h-48 object-cover" />
        {turf.isPremium && (
          <span className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            PREMIUM
          </span>
        )}
        {turf.isAvailable ? (
          <span className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
            Available Now
          </span>
        ) : (
          <span className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
            Busy
          </span>
        )}
        <div className="absolute bottom-4 left-4 flex items-center bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
          <span className="font-semibold text-white">{turf.rating}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2 text-white">{turf.name}</h3>
        <p className="text-gray-400 mb-1 text-sm">{turf.location} • {turf.distance.toFixed(1)} km away</p>
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-2xl font-bold text-emerald-400">₹{turf.price}</span>
            <span className="text-gray-400 text-sm ml-1">/ hour</span>
          </div>
          <button
            onClick={() => navigate(`/booking/${turf.id}`)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Header onLogout={() => navigate('/login')} />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Browse Football Turfs
          </h1>
          <p className="text-gray-400">Find and book the perfect turf for your game</p>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
            />

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">All Locations</option>
              <option value="Downtown">Downtown</option>
              <option value="Uptown">Uptown</option>
              <option value="Midtown">Midtown</option>
              <option value="Ernakulam">Ernakulam</option>
              <option value="Kochi">Kochi</option>
              <option value="Alangad">Alangad</option>
              <option value="Aluva">Aluva</option>
              <option value="Thrissur">Thrissur</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
            >
              <option value="distance">Sort by Distance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="premium">Premium Only</option>
              <option value="regular">Regular Only</option>
            </select>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableNow}
                onChange={e => setAvailableNow(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-gray-300">Available Now</span>
            </label>

            <button
              onClick={resetFilters}
              className="ml-auto bg-red-500/20 text-red-400 border border-red-500/50 px-6 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-400">
          Showing <span className="text-emerald-400 font-semibold">{filteredTurfs.length}</span> turf{filteredTurfs.length !== 1 ? 's' : ''}
        </div>

        {/* Turfs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTurfs.length ? filteredTurfs.map(turf => (
            <TurfCard key={turf.id} turf={turf} />
          )) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No turfs found matching your criteria</p>
              <button
                onClick={resetFilters}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurfBrowse;
