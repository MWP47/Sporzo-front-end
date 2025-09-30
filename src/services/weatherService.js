// Weather Service for fetching real-time weather data
const OPENWEATHER_API_KEY = 'f126c477fb37fd8be6ba0d97e179023f'; // Your OpenWeatherMap API key
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get user's current location using browser geolocation
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        // Default to a location if user denies (e.g., Kochi, India)
        console.warn('Location access denied, using default location');
        resolve({
          lat: 9.9312,
          lon: 76.2673,
          isDefault: true,
        });
      }
    );
  });
};

/**
 * Fetch current weather data
 */
export const getCurrentWeather = async (lat, lon) => {
  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      main: data.weather[0].main,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      location: data.name,
    };
  } catch (error) {
    console.error('Error fetching current weather:', error);
    return null;
  }
};

/**
 * Fetch hourly forecast (next 48 hours)
 */
export const getHourlyForecast = async (lat, lon) => {
  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      console.warn('API key invalid or API call failed, using mock data');
      return generateMockWeatherData();
    }
    
    const data = await response.json();
    
    // Process forecast data for next 24 hours
    const hourlyData = data.list.slice(0, 8).map((item, index) => {
      const date = new Date(item.dt * 1000);
      const hour = date.getHours();
      
      return {
        hour,
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        description: item.weather[0].description,
        main: item.weather[0].main,
        icon: item.weather[0].icon,
        windSpeed: item.wind.speed,
        rainProbability: item.pop * 100, // Probability of precipitation
        score: calculateWeatherScore(item),
      };
    });
    
    return hourlyData;
  } catch (error) {
    console.error('Error fetching hourly forecast:', error);
    return generateMockWeatherData();
  }
};

/**
 * Fetch weather forecast for a specific date (up to 7 days)
 */
export const getWeatherForDate = async (lat, lon, targetDate) => {
  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      console.warn('API key invalid or API call failed, using mock data');
      return generateMockWeatherForDate(targetDate);
    }
    
    const data = await response.json();
    
    // Parse target date (format: YYYY-MM-DD)
    const [year, month, day] = targetDate.split('-').map(Number);
    
    // Filter forecast data for the target date
    const dayForecasts = data.list.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return (
        itemDate.getFullYear() === year &&
        itemDate.getMonth() + 1 === month &&
        itemDate.getDate() === day
      );
    });
    
    console.log('Target date:', targetDate);
    console.log('Found forecasts:', dayForecasts.length);
    
    // If we have data for this date, process it
    if (dayForecasts.length > 0) {
      return processDayForecasts(dayForecasts);
    }
    
    // If no exact match, try to get closest available data
    const targetDateObj = new Date(targetDate);
    const daysDiff = Math.floor((targetDateObj - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 0) {
      // For today, use all available data and interpolate
      console.log('Using today\'s data with interpolation');
      return processDayForecasts(data.list.slice(0, 8));
    }
    
    if (daysDiff > 5) {
      return generatePredictedWeather(data.list, targetDate);
    }
    
    return generateMockWeatherForDate(targetDate);
  } catch (error) {
    console.error('Error fetching weather for date:', error);
    return generateMockWeatherForDate(targetDate);
  }
};

/**
 * Process forecast data for a specific day
 */
const processDayForecasts = (forecasts) => {
  const weatherByHour = {};
  
  // First, store all available data points
  forecasts.forEach(item => {
    const date = new Date(item.dt * 1000);
    const hour = date.getHours();
    
    weatherByHour[hour] = {
      hour,
      time: `${hour.toString().padStart(2, '0')}:00`,
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      description: item.weather[0].description,
      main: item.weather[0].main,
      icon: item.weather[0].icon,
      windSpeed: item.wind.speed,
      rainProbability: item.pop * 100,
      score: calculateWeatherScore(item),
    };
  });
  
  // Interpolate missing hours (6 AM to 11 PM)
  for (let hour = 6; hour <= 22; hour++) {
    if (!weatherByHour[hour]) {
      // Find nearest available data points
      let before = null;
      let after = null;
      
      for (let h = hour - 1; h >= 6; h--) {
        if (weatherByHour[h]) {
          before = weatherByHour[h];
          break;
        }
      }
      
      for (let h = hour + 1; h <= 22; h++) {
        if (weatherByHour[h]) {
          after = weatherByHour[h];
          break;
        }
      }
      
      // Interpolate or use nearest
      if (before && after) {
        // Average between before and after
        weatherByHour[hour] = {
          hour,
          time: `${hour.toString().padStart(2, '0')}:00`,
          temp: Math.round((before.temp + after.temp) / 2),
          feelsLike: Math.round((before.feelsLike + after.feelsLike) / 2),
          humidity: Math.round((before.humidity + after.humidity) / 2),
          description: before.description,
          main: before.main,
          icon: before.icon,
          windSpeed: (before.windSpeed + after.windSpeed) / 2,
          rainProbability: (before.rainProbability + after.rainProbability) / 2,
          score: Math.round((before.score + after.score) / 2),
        };
      } else if (before) {
        // Use before data
        weatherByHour[hour] = { ...before, hour, time: `${hour.toString().padStart(2, '0')}:00` };
      } else if (after) {
        // Use after data
        weatherByHour[hour] = { ...after, hour, time: `${hour.toString().padStart(2, '0')}:00` };
      }
    }
  }
  
  return weatherByHour;
};

/**
 * Generate predicted weather for dates beyond 5 days using pattern analysis
 */
const generatePredictedWeather = (recentData, targetDate) => {
  // Analyze recent weather patterns
  const avgTemp = recentData.reduce((sum, item) => sum + item.main.temp, 0) / recentData.length;
  const avgHumidity = recentData.reduce((sum, item) => sum + item.main.humidity, 0) / recentData.length;
  const avgWind = recentData.reduce((sum, item) => sum + item.wind.speed, 0) / recentData.length;
  
  // Get most common weather condition
  const conditions = recentData.map(item => item.weather[0].main);
  const mostCommon = conditions.sort((a,b) =>
    conditions.filter(v => v === a).length - conditions.filter(v => v === b).length
  ).pop();
  
  return generateMockWeatherForDate(targetDate, {
    baseTemp: avgTemp,
    baseHumidity: avgHumidity,
    baseWind: avgWind,
    condition: mostCommon
  });
};

/**
 * Generate realistic mock weather data for testing
 */
const generateMockWeatherData = () => {
  const weatherConditions = [
    { main: 'Clear', description: 'clear sky', temp: 28, humidity: 55, wind: 3.5, rain: 0 },
    { main: 'Clear', description: 'clear sky', temp: 30, humidity: 50, wind: 4.0, rain: 0 },
    { main: 'Clouds', description: 'few clouds', temp: 27, humidity: 60, wind: 3.0, rain: 10 },
    { main: 'Clouds', description: 'scattered clouds', temp: 26, humidity: 65, wind: 3.5, rain: 15 },
    { main: 'Clear', description: 'clear sky', temp: 29, humidity: 52, wind: 2.5, rain: 0 },
    { main: 'Clouds', description: 'broken clouds', temp: 25, humidity: 70, wind: 4.5, rain: 20 },
    { main: 'Rain', description: 'light rain', temp: 24, humidity: 80, wind: 5.0, rain: 60 },
    { main: 'Clear', description: 'clear sky', temp: 27, humidity: 58, wind: 3.0, rain: 5 },
  ];

  const currentHour = new Date().getHours();
  
  return weatherConditions.map((condition, index) => {
    const hour = (currentHour + index * 3) % 24;
    const mockItem = {
      main: { temp: condition.temp, feels_like: condition.temp - 1, humidity: condition.humidity },
      weather: [{ main: condition.main, description: condition.description, icon: '01d' }],
      wind: { speed: condition.wind },
      pop: condition.rain / 100,
    };
    
    return {
      hour,
      time: `${hour.toString().padStart(2, '0')}:00`,
      temp: condition.temp,
      feelsLike: condition.temp - 1,
      humidity: condition.humidity,
      description: condition.description,
      main: condition.main,
      icon: '01d',
      windSpeed: condition.wind,
      rainProbability: condition.rain,
      score: calculateWeatherScore(mockItem),
    };
  });
};

/**
 * Generate mock weather for a specific date
 */
const generateMockWeatherForDate = (targetDate, baseData = null) => {
  const weatherByHour = {};
  const date = new Date(targetDate);
  const dayOfWeek = date.getDay();
  
  // Use base data if provided (for predictions), otherwise use defaults
  const baseTemp = baseData?.baseTemp || 27;
  const baseHumidity = baseData?.baseHumidity || 60;
  const baseWind = baseData?.baseWind || 3.5;
  const baseCondition = baseData?.condition || 'Clear';
  
  // Generate weather for each hour (6 AM to 11 PM)
  for (let hour = 6; hour <= 22; hour++) {
    // Add some variation based on time of day
    const tempVariation = Math.sin((hour - 6) / 16 * Math.PI) * 4; // Warmer in afternoon
    const temp = Math.round(baseTemp + tempVariation + (Math.random() * 2 - 1));
    
    // Determine weather condition with some randomness
    let main = baseCondition;
    let description = 'clear sky';
    let rainProb = 5;
    
    if (Math.random() > 0.7) {
      main = 'Clouds';
      description = 'few clouds';
      rainProb = 15;
    }
    
    if (Math.random() > 0.9) {
      main = 'Rain';
      description = 'light rain';
      rainProb = 60;
    }
    
    const mockItem = {
      main: { temp, feels_like: temp - 1, humidity: baseHumidity + Math.floor(Math.random() * 10) },
      weather: [{ main, description, icon: '01d' }],
      wind: { speed: baseWind + (Math.random() * 2 - 1) },
      pop: rainProb / 100,
    };
    
    weatherByHour[hour] = {
      hour,
      time: `${hour.toString().padStart(2, '0')}:00`,
      temp,
      feelsLike: temp - 1,
      humidity: mockItem.main.humidity,
      description,
      main,
      icon: '01d',
      windSpeed: mockItem.wind.speed,
      rainProbability: rainProb,
      score: calculateWeatherScore(mockItem),
    };
  }
  
  return weatherByHour;
};

/**
 * Calculate weather score for football playing conditions (0-100)
 */
const calculateWeatherScore = (weatherData) => {
  let score = 100;
  
  // Temperature factor (ideal: 15-25°C)
  const temp = weatherData.main.temp;
  if (temp < 10 || temp > 35) score -= 30;
  else if (temp < 15 || temp > 30) score -= 15;
  
  // Rain factor
  const rain = weatherData.pop || 0;
  score -= rain * 50; // Heavy penalty for rain
  
  // Weather condition factor
  const condition = weatherData.weather[0].main.toLowerCase();
  if (condition.includes('rain') || condition.includes('storm')) score -= 40;
  else if (condition.includes('cloud')) score -= 10;
  else if (condition.includes('clear')) score += 10;
  
  // Wind factor (ideal: < 20 km/h)
  const windSpeed = weatherData.wind.speed * 3.6; // Convert m/s to km/h
  if (windSpeed > 30) score -= 20;
  else if (windSpeed > 20) score -= 10;
  
  // Humidity factor (ideal: 40-70%)
  const humidity = weatherData.main.humidity;
  if (humidity > 80) score -= 15;
  else if (humidity < 30) score -= 10;
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Get weather icon URL from OpenWeatherMap
 */
export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

/**
 * Determine weather condition category
 */
export const getWeatherCategory = (main) => {
  const mainLower = main.toLowerCase();
  if (mainLower.includes('rain') || mainLower.includes('drizzle')) return 'rainy';
  if (mainLower.includes('clear')) return 'sunny';
  if (mainLower.includes('cloud')) return 'cloudy';
  if (mainLower.includes('snow')) return 'snowy';
  if (mainLower.includes('storm') || mainLower.includes('thunder')) return 'stormy';
  return 'clear';
};

/**
 * Get weather-based recommendation
 */
export const getWeatherRecommendation = (score, condition) => {
  if (score >= 80) return { text: 'Perfect conditions!', color: 'text-green-400' };
  if (score >= 60) return { text: 'Good for playing', color: 'text-emerald-400' };
  if (score >= 40) return { text: 'Fair conditions', color: 'text-yellow-400' };
  if (score >= 20) return { text: 'Not ideal', color: 'text-orange-400' };
  return { text: 'Poor conditions', color: 'text-red-400' };
};
