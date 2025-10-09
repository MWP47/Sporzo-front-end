import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaUpload, 
  FaTimes, 
  FaRupeeSign,
  FaPlus
} from "react-icons/fa";
import Notification from "../components/Notification";
import LocationPicker from "../components/LocationPicker";
import turfOwnerService from "../services/turfOwnerService";

const TurfManagement = () => {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [owner, setOwner] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0); // Index of the main/profile image
  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "", // City/Area
    address: "", // Full address
    fieldConfigurations: [], // Start with empty array - let users add configurations
    surface: "Artificial Grass - FIFA Approved",
    operatingHours: {
      start: 6,
      end: 22,
      type: "Standard"
    },
    rating: 4.5,
    amenities: []
  });

  const fieldConfigurationTemplates = [
    {
      type: "5v5",
      name: "Small Field (5v5)",
      size: "40m x 30m",
      capacity: "10 players",
      description: "Perfect for small group games and training",
      price: "", // Base price to be set by owner
      pricing: {
        dayPrice: "",
        nightPrice: "",
        peakPrice: ""
      }
    },
    {
      type: "7v7",
      name: "Medium Field (7v7)", 
      size: "60m x 40m",
      capacity: "14 players",
      description: "Ideal for recreational matches",
      price: "", // Base price to be set by owner
      pricing: {
        dayPrice: "",
        nightPrice: "",
        peakPrice: ""
      }
    },
    {
      type: "9v9",
      name: "Large Field (9v9)",
      size: "80m x 50m", 
      capacity: "18 players",
      description: "Great for competitive games",
      price: "", // Base price to be set by owner
      pricing: {
        dayPrice: "",
        nightPrice: "",
        peakPrice: ""
      }
    },
    {
      type: "11v11",
      name: "Full Field (11v11)",
      size: "100m x 64m",
      capacity: "22 players", 
      description: "Professional standard full-size field",
      price: "", // Base price to be set by owner
      pricing: {
        dayPrice: "",
        nightPrice: "",
        peakPrice: ""
      }
    }
  ];

  const timeSlots = [
    { id: 'day', name: 'Day Time', time: '6 AM - 6 PM', icon: '☀️', description: 'Regular daytime hours' },
    { id: 'night', name: 'Night Time', time: '6 PM - 12 AM', icon: '🌙', description: 'Evening and night hours' },
    { id: 'peak', name: 'Peak Hours', time: '6 PM - 9 PM', icon: '⭐', description: 'High demand evening hours' }
  ];

  const surfaceOptions = [
    "Artificial Grass - FIFA Approved",
    "Hybrid Grass",
    "Natural Grass",
    "Synthetic Turf"
  ];

  const operatingHoursOptions = [
    { start: 6, end: 22, type: "Standard", display: "6 AM - 10 PM" },
    { start: 0, end: 23, type: "24 Hours", display: "24 Hours" },
    { start: 8, end: 20, type: "Day Only", display: "8 AM - 8 PM" },
    { start: 6, end: 23, type: "Extended", display: "6 AM - 11 PM" },
    { start: 7, end: 21, type: "Standard", display: "7 AM - 9 PM" }
  ];

  const commonAmenities = [
    "Floodlights", "Changing Rooms", "Parking", "Water Facility", 
    "First Aid", "Washrooms", "Cafeteria", "Equipment Rental",
    "Seating Area", "CCTV Security", "Wi-Fi", "Air Conditioning"
  ];

  const loadTurfData = useCallback(async (turfId) => {
    
    try {
      // Try to load from backend first
      const result = await turfOwnerService.getTurfs();
      
      if (result.success && result.turfs) {
        // Find turf by _id or turfId
        const turf = result.turfs.find(t => 
          t._id === turfId || 
          t.turfId === turfId || 
          t.id === parseInt(turfId)
        );
        
        if (turf) {
          
          // Handle backward compatibility for turfs without fieldConfigurations
          let fieldConfigurations = turf.fieldConfigurations;
          
          if (!fieldConfigurations || fieldConfigurations.length === 0) {
            // Create default configuration from legacy data
            fieldConfigurations = [
              {
                id: Date.now(),
                type: "11v11",
                name: turf.capacity || "Full Field (11v11)",
                size: turf.size || "100m x 64m",
                capacity: "22 players",
                price: turf.price || "",
                pricing: {
                  dayPrice: turf.price || "",
                  nightPrice: "",
                  peakPrice: ""
                },
                available: true
              }
            ];
          } else {
            // Ensure existing configurations have pricing structure and unique IDs
            fieldConfigurations = fieldConfigurations.map((config, index) => ({
              ...config,
              id: config.id || Date.now() + index,
              pricing: config.pricing || {
                dayPrice: config.price || "",
                nightPrice: "",
                peakPrice: ""
              }
            }));
          }

          const updatedTurf = {
            ...turf,
            fieldConfigurations
          };
          
          setFormData(updatedTurf);
          setImages(turf.images || []);
          setMainImageIndex(turf.mainImageIndex || 0);
          setAmenities(turf.amenities || []);
          setCoordinates(turf.coordinates || { lat: null, lng: null });
          return;
        }
      }
      
      // If not found in backend, show error
      console.error('TurfManagement: Turf not found');
      showNotification("error", "Turf not found");
      navigate("/owner/dashboard");
      
    } catch (error) {
      console.error('TurfManagement: Error loading turf:', error);
      showNotification("error", "Failed to load turf data");
      navigate("/owner/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    // Check if user is authenticated as turf owner
    const isAuthenticated = turfOwnerService.isAuthenticated();
    
    if (!isAuthenticated) {
      navigate("/owner/login");
      return;
    }
    
    const ownerData = turfOwnerService.getCurrentOwner();
    setOwner(ownerData);
    
    // Load existing turf data if in edit mode
    if (isEditMode) {
      loadTurfData(id);
    }
  }, [navigate, id, isEditMode, loadTurfData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOperatingHoursChange = (e) => {
    const selectedHours = operatingHoursOptions.find(option => option.display === e.target.value);
    setFormData(prev => ({
      ...prev,
      operatingHours: selectedHours
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Adjust main image index if needed
      if (index === mainImageIndex) {
        setMainImageIndex(0); // Reset to first image
      } else if (index < mainImageIndex) {
        setMainImageIndex(mainImageIndex - 1); // Adjust index
      }
      return newImages;
    });
  };

  const setMainImage = (index) => {
    setMainImageIndex(index);
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities(prev => [...prev, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const removeAmenity = (amenity) => {
    setAmenities(prev => prev.filter(a => a !== amenity));
  };

  const toggleCommonAmenity = (amenity) => {
    if (amenities.includes(amenity)) {
      // Remove if already selected
      setAmenities(prev => prev.filter(a => a !== amenity));
    } else {
      // Add if not selected
      setAmenities(prev => [...prev, amenity]);
    }
  };

  const addFieldConfiguration = (template) => {
    const newConfig = {
      ...template,
      id: Date.now(),
      available: true
    };
    
    setFormData(prev => {
      return {
        ...prev,
        fieldConfigurations: [...(prev.fieldConfigurations || []), newConfig]
      };
    });
  };

  const updateFieldConfiguration = (configId, field, value) => {
    setFormData(prev => ({
      ...prev,
      fieldConfigurations: (prev.fieldConfigurations || []).map(config =>
        config.id === configId ? { ...config, [field]: value } : config
      )
    }));
  };

  const removeFieldConfiguration = (configId) => {
    setFormData(prev => ({
      ...prev,
      fieldConfigurations: (prev.fieldConfigurations || []).filter(config => config.id !== configId)
    }));
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation with detailed logging
    console.log("TurfManagement: Validating form data:", {
      name: formData.name,
      location: formData.location,
      address: formData.address,
      description: formData.description,
      fieldConfigurations: formData.fieldConfigurations?.length
    });

    const missingFields = [];
    if (!formData.name?.trim()) missingFields.push("name");
    if (!formData.location?.trim()) missingFields.push("location");
    if (!formData.address?.trim()) missingFields.push("address");
    if (!formData.description?.trim()) missingFields.push("description");

    if (missingFields.length > 0) {
      console.log("TurfManagement: Missing fields:", missingFields);
      showNotification("error", `Please fill in the following required fields: ${missingFields.join(", ")}`);
      setIsLoading(false);
      return;
    }

    // Validate field configurations
    const fieldConfigs = formData.fieldConfigurations || [];
    const invalidConfigs = fieldConfigs.filter(config => {
      // Base price is required
      return !config.price || config.price <= 0;
    });
    
    if (invalidConfigs.length > 0) {
      showNotification("error", "Please set base price for all field configurations");
      setIsLoading(false);
      return;
    }

    if (fieldConfigs.length === 0) {
      showNotification("error", "Please add at least one field configuration");
      setIsLoading(false);
      return;
    }

    if (images.length === 0) {
      showNotification("error", "Please upload at least one image");
      setIsLoading(false);
      return;
    }

    try {
      const turfData = {
        ...formData,
        images,
        mainImageIndex,
        amenities,
        coordinates: coordinates.lat && coordinates.lng ? coordinates : null,
        timings: formData.operatingHours.type === "24 Hours" 
          ? "Open 24 Hours" 
          : formData.operatingHours.display,
        // Backward compatibility - use first configuration for legacy fields
        price: formData.fieldConfigurations[0]?.price || 0,
        capacity: formData.fieldConfigurations[0]?.name || "11v11 (22 players)",
        size: formData.fieldConfigurations[0]?.size || "100m x 64m",
        // Set main image as the primary image for backward compatibility
        image: images[mainImageIndex] || images[0] || ""
      };

      console.log("TurfManagement: Attempting to save turf with data:", turfData);
      console.log("TurfManagement: Is edit mode:", isEditMode);
      console.log("TurfManagement: Field configurations:", formData.fieldConfigurations);
      console.log("TurfManagement: Images:", images);
      console.log("TurfManagement: Amenities:", amenities);
      console.log("TurfManagement: Auth token present:", !!turfOwnerService.getAuthToken());
      console.log("TurfManagement: Current owner:", turfOwnerService.getCurrentOwner());

      showNotification("info", `${isEditMode ? 'Updating' : 'Creating'} turf...`);

      let result;
      if (isEditMode) {
        result = await turfOwnerService.updateTurf(id, turfData);
      } else {
        result = await turfOwnerService.createTurf(turfData);
      }

      console.log("TurfManagement: Save result:", result);

      if (result.success) {
        showNotification("success", result.message || `Turf ${isEditMode ? 'updated' : 'created'} successfully!`);
        
        // Navigate back to dashboard after a delay
        setTimeout(() => {
          navigate("/owner/dashboard");
        }, 2000);
      } else {
        // Backend returned error response - show the actual error
        console.error("TurfManagement: Save failed with result:", result);
        showNotification("error", result.message || "Failed to save turf. Please check all fields and try again.");
        setIsLoading(false);
        return; // Don't fall back to offline mode if backend responded with error
      }

    } catch (error) {
      console.error("TurfManagement: Error saving turf:", error);
      console.error("TurfManagement: Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Backend is unreachable - show clear error message
      showNotification("error", `Backend connection failed: ${error.message}. Please ensure the backend server is running at http://localhost:5000`);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!owner) {
    console.log("TurfManagement: Waiting for owner data...");
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading turf management...</div>
      </div>
    );
  }

  console.log("TurfManagement: Rendering component for owner:", owner.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/owner/dashboard")}
            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? 'Edit Turf' : 'Add New Turf'}
            </h1>
            <p className="text-gray-400">
              {isEditMode ? 'Update your turf details' : 'Add a new turf to your portfolio'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Turf Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Turf Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter turf name"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price per Hour (₹) *
                </label>
                <div className="relative">
                  <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter price per hour"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location and Address */}
            <div className="mt-6">
              <LocationPicker
                locationValue={formData.location}
                addressValue={formData.address}
                onLocationChange={(location) => {
                  console.log("TurfManagement: Location updated to:", location);
                  setFormData(prev => ({ ...prev, location }));
                }}
                onAddressChange={(address) => {
                  console.log("TurfManagement: Address updated to:", address);
                  setFormData(prev => ({ ...prev, address }));
                }}
                onCoordinatesChange={setCoordinates}
              />
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                placeholder="Describe your turf..."
              />
            </div>
          </div>

          {/* Field Configurations */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Field Configurations</h2>
              <div className="text-sm text-gray-400">
                Add different field sizes and pricing options
              </div>
            </div>

            {/* Current Configurations */}
            {(formData.fieldConfigurations || []).length > 0 ? (
              <div className="space-y-4 mb-6">
                {(formData.fieldConfigurations || []).map((config) => (
                <div key={config.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{config.name}</h3>
                      <p className="text-sm text-gray-400">{config.description}</p>
                    </div>
                    {(formData.fieldConfigurations || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFieldConfiguration(config.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Field Size
                        </label>
                        <input
                          type="text"
                          value={config.size}
                          onChange={(e) => updateFieldConfiguration(config.id, 'size', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded text-white text-sm"
                          placeholder="e.g., 40m x 30m"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Capacity
                        </label>
                        <input
                          type="text"
                          value={config.capacity}
                          onChange={(e) => updateFieldConfiguration(config.id, 'capacity', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded text-white text-sm"
                          placeholder="e.g., 10 players"
                        />
                      </div>
                    </div>

                    {/* Base Price */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        💰 Base Price (₹ per hour) *
                      </label>
                      <div className="relative max-w-xs">
                        <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="number"
                          value={config.price || ""}
                          onChange={(e) => {
                            updateFieldConfiguration(config.id, 'price', e.target.value);
                            // Also update day price if it's empty
                            if (!config.pricing?.dayPrice) {
                              const newPricing = {
                                ...config.pricing,
                                dayPrice: e.target.value
                              };
                              updateFieldConfiguration(config.id, 'pricing', newPricing);
                            }
                          }}
                          className="w-full pl-8 pr-4 py-3 bg-gray-700/50 border border-gray-500 rounded-lg text-white text-sm"
                          placeholder="Enter base price"
                          min="1"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">This will be used as default/day price if time-based pricing is not set</p>
                    </div>

                    {/* Time-based Pricing (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        🕐 Time-based Pricing (Optional - Override base price for specific times)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {timeSlots.map((timeSlot) => (
                          <div key={timeSlot.id} className="bg-gray-600/30 rounded-lg p-3 border border-gray-500">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{timeSlot.icon}</span>
                              <div>
                                <h4 className="text-sm font-semibold text-white">{timeSlot.name}</h4>
                                <p className="text-xs text-gray-400">{timeSlot.time}</p>
                              </div>
                            </div>
                            <div className="relative">
                              <FaRupeeSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                              <input
                                type="number"
                                value={config.pricing?.[`${timeSlot.id}Price`] || ""}
                                onChange={(e) => {
                                  const newPricing = {
                                    ...config.pricing,
                                    [`${timeSlot.id}Price`]: e.target.value
                                  };
                                  updateFieldConfiguration(config.id, 'pricing', newPricing);
                                }}
                                className="w-full pl-6 pr-3 py-2 bg-gray-700/50 border border-gray-400 rounded text-white text-sm"
                                placeholder={`Base: ₹${config.price || 0}`}
                                min="1"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {timeSlot.id === 'day' ? 'Overrides base price' : timeSlot.description}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Leave empty to use base price. Set specific prices to override for different times.
                      </p>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-6">
                <div className="text-6xl mb-4">🏟️</div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Field Configurations Added</h3>
                <p className="text-gray-400 text-sm">Start by adding your first field configuration below</p>
              </div>
            )}

            {/* Add New Configuration */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-200">Add Field Configuration</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fieldConfigurationTemplates.map((template) => {
                  const alreadyAdded = (formData.fieldConfigurations || []).some(config => config.type === template.type);
                  return (
                    <button
                      key={template.type}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!alreadyAdded) {
                          addFieldConfiguration(template);
                        }
                      }}
                      disabled={alreadyAdded}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                        alreadyAdded
                          ? 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed'
                          : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-600/30 hover:border-emerald-500/50 cursor-pointer'
                      }`}
                    >
                      <div className="font-bold">{template.type}</div>
                      <div className="text-xs opacity-80">{template.size}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Surface Type & Operating Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-600">
              {/* Surface Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Surface Type
                </label>
                <select
                  name="surface"
                  value={formData.surface}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                >
                  {surfaceOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Operating Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Operating Hours
                </label>
                <select
                  value={formData.operatingHours.display}
                  onChange={handleOperatingHoursChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                >
                  {operatingHoursOptions.map(option => (
                    <option key={option.display} value={option.display}>{option.display}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6">Turf Images</h2>
            
            {/* Upload Button */}
            <div className="mb-6">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                  <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">Click to upload images</p>
                  <p className="text-sm text-gray-500">Support: JPG, PNG, GIF (Max 5MB each)</p>
                </div>
              </label>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-200">Uploaded Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        index === mainImageIndex 
                          ? 'border-emerald-500 shadow-lg shadow-emerald-500/50' 
                          : 'border-gray-600'
                      }`}>
                        <img
                          src={image}
                          alt={`Turf ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        
                        {/* Main Image Badge */}
                        {index === mainImageIndex && (
                          <div className="absolute top-2 left-2 bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                            MAIN
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {index !== mainImageIndex && (
                            <button
                              type="button"
                              onClick={() => setMainImage(index)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs font-medium"
                            >
                              Set Main
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Image Info */}
                      <div className="mt-1 text-center">
                        <p className="text-xs text-gray-400">
                          {index === mainImageIndex ? 'Main Image' : `Image ${index + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Main Image Info */}
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <p className="text-sm text-emerald-400 font-medium">
                      Main image will be displayed as the turf's profile picture in listings and cards
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6">Amenities</h2>
            
            {/* Common Amenities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Common Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {commonAmenities.map(amenity => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleCommonAmenity(amenity)}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      amenities.includes(amenity)
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {amenities.includes(amenity) && <span className="mr-1">✓</span>}
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amenity */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Add Custom Amenity</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter custom amenity"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                >
                  <FaPlus className="text-sm" />
                  Add
                </button>
              </div>
            </div>

            {/* Selected Amenities */}
            {amenities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Selected Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map(amenity => (
                    <span
                      key={amenity}
                      className="bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-full text-sm border border-emerald-600/30 flex items-center gap-2"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/owner/dashboard")}
              className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {isEditMode ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {isEditMode ? 'Update Turf' : 'Add Turf'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TurfManagement;
