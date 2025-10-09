import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaRupeeSign,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaChartLine,
} from "react-icons/fa";
import turfOwnerService from "../services/turfOwnerService";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const StatCard = ({ icon, title, value, color = "emerald" }) => (
  <div className={`bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-${color}-500/50 transition-all`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className={`text-2xl font-bold text-${color}-400 mt-1`}>{value}</p>
      </div>
      <div className={`bg-${color}-500/20 p-3 rounded-lg`}>{icon}</div>
    </div>
  </div>
);

const OwnerAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turfs, setTurfs] = useState([]);
  const [selectedTurf, setSelectedTurf] = useState("all");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [overview, setOverview] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    avgBookingValue: 0,
  });
  const [dailyTrends, setDailyTrends] = useState([]); // [{date, bookings, revenue}]

  useEffect(() => {
    if (!turfOwnerService.isAuthenticated()) {
      navigate("/owner/login");
      return;
    }
    (async () => {
      try {
        const res = await turfOwnerService.getTurfs();
        if (res?.success) {
          setTurfs(res.turfs || []);
        }
      } catch (e) {
        // ignore; page will still work but only with All disabled
      }
    })();
  }, [navigate]);

  const ownerTurfOptions = useMemo(() => {
    return [
      { value: "all", label: "All Turfs" },
      ...turfs.map((t) => ({
        value: String(t.turfId || t._id || t.id),
        label: t.name || "Turf",
      })),
    ];
  }, [turfs]);

  const fetchStatsForTurf = async (tid) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (tid) params.append("turfId", tid);

    const resp = await fetch(`${API_BASE_URL}/bookings/stats/overview?${params.toString()}`);
    return resp.json();
  };

  const combineStats = (statsArray) => {
    const combined = {
      totalBookings: 0,
      totalRevenue: 0,
      completedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      avgBookingValue: 0,
    };
    const dailyMap = new Map(); // date -> {bookings, revenue}

    statsArray.forEach((s) => {
      if (!s?.success) return;
      const o = s.overview || {};
      combined.totalBookings += o.totalBookings || 0;
      combined.totalRevenue += o.totalRevenue || 0;
      combined.completedBookings += o.completedBookings || 0;
      combined.pendingBookings += o.pendingBookings || 0;
      combined.cancelledBookings += o.cancelledBookings || 0;
      // for avgBookingValue we’ll recalc later from totals

      (s.dailyTrends || []).forEach((d) => {
        const key = d._id || d.date || "unknown";
        const prev = dailyMap.get(key) || { bookings: 0, revenue: 0 };
        dailyMap.set(key, {
          bookings: prev.bookings + (d.bookings || 0),
          revenue: prev.revenue + (d.revenue || 0),
        });
      });
    });

    combined.avgBookingValue = combined.totalBookings > 0 ? Math.round((combined.totalRevenue / combined.totalBookings) * 10) / 10 : 0;

    const trends = Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    return { overview: combined, dailyTrends: trends };
  };

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      let statsResponses = [];
      if (selectedTurf === "all") {
        const ids = turfs.map((t) => String(t.turfId || t._id || t.id));
        if (ids.length === 0) {
          // No turfs; nothing to fetch
          setOverview({
            totalBookings: 0,
            totalRevenue: 0,
            completedBookings: 0,
            pendingBookings: 0,
            cancelledBookings: 0,
            avgBookingValue: 0,
          });
          setDailyTrends([]);
          setLoading(false);
          return;
        }
        statsResponses = await Promise.all(ids.map((tid) => fetchStatsForTurf(tid)));
      } else {
        statsResponses = [await fetchStatsForTurf(selectedTurf)];
      }

      const { overview: ov, dailyTrends: dt } = combineStats(statsResponses);
      setOverview(ov);
      setDailyTrends(dt);
    } catch (e) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTurf, startDate, endDate, turfs.length]);

  const maxBookings = useMemo(() => (dailyTrends.length ? Math.max(...dailyTrends.map((d) => d.bookings)) : 0), [dailyTrends]);
  const maxRevenue = useMemo(() => (dailyTrends.length ? Math.max(...dailyTrends.map((d) => d.revenue)) : 0), [dailyTrends]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/owner/dashboard")} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-gray-400">Insights across your bookings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Turf</label>
              <select
                value={selectedTurf}
                onChange={(e) => setSelectedTurf(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white text-sm"
              >
                {ownerTurfOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadAnalytics}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <StatCard icon={<FaCalendarAlt className="text-blue-400 text-xl" />} title="Total Bookings" value={overview.totalBookings} color="blue" />
          <StatCard icon={<FaRupeeSign className="text-yellow-400 text-xl" />} title="Revenue" value={`₹${overview.totalRevenue.toLocaleString()}`} color="yellow" />
          <StatCard icon={<FaCheckCircle className="text-green-400 text-xl" />} title="Paid" value={overview.completedBookings} color="green" />
          <StatCard icon={<FaHourglassHalf className="text-orange-400 text-xl" />} title="Pending" value={overview.pendingBookings} color="orange" />
          <StatCard icon={<FaTimesCircle className="text-red-400 text-xl" />} title="Cancelled" value={overview.cancelledBookings} color="red" />
          <StatCard icon={<FaChartLine className="text-emerald-400 text-xl" />} title="Avg Value" value={`₹${overview.avgBookingValue}`} color="emerald" />
        </div>

        {/* Daily Trends */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Daily Trends</h2>
            {loading && <div className="text-sm text-gray-400">Loading...</div>}
          </div>

          {dailyTrends.length === 0 ? (
            <div className="text-gray-400 text-sm">No data for the selected range.</div>
          ) : (
            <div className="space-y-3">
              {dailyTrends.map((d) => (
                <div key={d.date} className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
                  <div className="text-gray-300 text-sm w-36">{d.date}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400 w-16">Bookings</div>
                    <div className="flex-1 h-2 bg-gray-700 rounded">
                      <div
                        className="h-2 bg-blue-500 rounded"
                        style={{ width: `${maxBookings ? Math.round((d.bookings / maxBookings) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="text-gray-300 text-xs w-10 text-right">{d.bookings}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400 w-16">Revenue</div>
                    <div className="flex-1 h-2 bg-gray-700 rounded">
                      <div
                        className="h-2 bg-emerald-500 rounded"
                        style={{ width: `${maxRevenue ? Math.round((d.revenue / maxRevenue) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="text-gray-300 text-xs w-20 text-right">₹{d.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerAnalytics;
