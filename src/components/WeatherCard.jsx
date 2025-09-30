import React from "react";
import { FaTint, FaWind, FaTemperatureHigh, FaSun, FaCloud, FaCloudRain, FaSnowflake, FaBolt } from "react-icons/fa";
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm } from "react-icons/wi";

const WeatherCard = ({ weather }) => {
  const getWeatherIcon = (main) => {
    const mainLower = main?.toLowerCase() || '';
    if (mainLower.includes('clear')) return <WiDaySunny className="text-yellow-400 text-5xl" />;
    if (mainLower.includes('cloud')) return <WiCloudy className="text-gray-400 text-5xl" />;
    if (mainLower.includes('rain') || mainLower.includes('drizzle')) return <WiRain className="text-blue-400 text-5xl" />;
    if (mainLower.includes('snow')) return <WiSnow className="text-blue-200 text-5xl" />;
    if (mainLower.includes('storm') || mainLower.includes('thunder')) return <WiThunderstorm className="text-purple-400 text-5xl" />;
    return <WiCloudy className="text-gray-400 text-5xl" />;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    if (score >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  const getWeatherBg = (main) => {
    const mainLower = main?.toLowerCase() || '';
    if (mainLower.includes('clear')) return 'from-yellow-500/10 to-orange-500/10 border-yellow-500/30';
    if (mainLower.includes('rain')) return 'from-blue-500/10 to-cyan-500/10 border-blue-500/30';
    if (mainLower.includes('cloud')) return 'from-gray-500/10 to-slate-500/10 border-gray-500/30';
    return 'from-gray-800/30 to-gray-900/30 border-gray-700/50';
  };

  return (
    <div className={`bg-gradient-to-br ${getWeatherBg(weather.main)} rounded-xl p-4 border transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
      {/* Header with Time */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-white">{weather.time}</h3>
          {weather.score >= 80 && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full mt-1 inline-block">
              Ideal Conditions
            </span>
          )}
        </div>
        <div className={`text-2xl font-bold ${getScoreColor(weather.score)}`}>
          {weather.score}
        </div>
      </div>

      {/* Weather Icon and Temp */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.main)}
          <div>
            <div className="text-3xl font-bold text-white">{weather.temp}°C</div>
            <div className="text-sm text-gray-300 capitalize">{weather.description}</div>
          </div>
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-3">
        <div className="flex items-center gap-2">
          <FaTint className="text-blue-400" />
          <span>Rain: {Math.round(weather.rainProbability)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <FaWind className="text-gray-400" />
          <span>{Math.round(weather.windSpeed * 3.6)} km/h</span>
        </div>
        <div className="flex items-center gap-2">
          <FaTemperatureHigh className="text-orange-400" />
          <span>Feels: {weather.feelsLike}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <FaTint className="text-cyan-400" />
          <span>Humidity: {weather.humidity}%</span>
        </div>
      </div>

      {/* Score Badge */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Playing Conditions</span>
          <span className={`text-sm font-semibold ${getScoreColor(weather.score)}`}>
            {weather.score >= 80 ? 'Excellent' : weather.score >= 60 ? 'Good' : weather.score >= 40 ? 'Fair' : 'Poor'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
