import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FarmerAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const farmerName = location.state?.farmerName || "Unknown Farmer";

  const [timeRange, setTimeRange] = useState("1M"); // 💡 Defaulting to 1M to see the daily view!
  const [rawData, setRawData] = useState([]); // 💡 Store raw records instead of pre-computed months
  const [loading, setLoading] = useState(true);

  // 1. FETCH THE RAW DATA ONCE
  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8080/api/v1/collections/farmer/${id}/analytics`);

        if (!response.ok) throw new Error("Failed to fetch");

        const records = await response.json();
        setRawData(records); // Just save the raw data, let the logic below handle the sorting
      } catch (error) {
        console.error("Failed to load analytics data", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAndProcessData();
    }
  }, [id]);

  // 2. DYNAMICALLY BUILD BUCKETS BASED ON THE TOGGLE
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const today = new Date();
    const cutoffDate = new Date();
    const totals = {};

    if (timeRange === "1M") {
      // 💡 1M VIEW: Group by DAY (Last 30 Days)
      cutoffDate.setDate(today.getDate() - 30);
      
      // Initialize 30 empty daily buckets
      for (let i = 30; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        // Formats date to "May 15"
        const labelStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); 
        
        totals[key] = { label: labelStr, liters: 0, timestamp: d.getTime() };
      }

      rawData.forEach((record) => {
        const recordDate = new Date(record.deliveryDate || record.timestamp || record.date);
        if (recordDate >= cutoffDate) {
          const key = `${recordDate.getFullYear()}-${recordDate.getMonth()}-${recordDate.getDate()}`;
          if (totals[key]) {
            totals[key].liters += parseFloat(record.quantityLiters || 0);
          }
        }
      });

    } else {
      // 💡 3M, 6M, 9M, 12M VIEW: Group by MONTH
      const monthsDiff = timeRange === "3M" ? 3 : timeRange === "6M" ? 6 : timeRange === "9M" ? 9 : 12;
      cutoffDate.setMonth(today.getMonth() - monthsDiff);
      
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Initialize empty monthly buckets
      for (let i = monthsDiff - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        totals[key] = { label: months[d.getMonth()], liters: 0, timestamp: d.getTime() };
      }

      rawData.forEach((record) => {
        const recordDate = new Date(record.deliveryDate || record.timestamp || record.date);
        if (recordDate >= cutoffDate) {
          const key = `${recordDate.getFullYear()}-${recordDate.getMonth()}`;
          if (totals[key]) {
            totals[key].liters += parseFloat(record.quantityLiters || 0);
          }
        }
      });
    }

    // 💡 FORMATTING: Sort by time and force strict 2 decimal points
    return Object.values(totals)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => ({
        ...item,
        liters: Number(item.liters.toFixed(2)) // Locks decimals exactly
      }));

  }, [rawData, timeRange]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in antialiased">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate("/manager-dashboard", { state: { targetTab: "directory" } })}
            className="text-slate-400 hover:text-emerald-700 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-3 transition"
          >
            &larr; Back to Directory
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Delivery Analytics</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Viewing records for <strong className="text-emerald-700">{farmerName}</strong> (ID: {id})</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-base font-bold text-slate-900">Total Volume Supplied</h2>
          <div className="bg-slate-100 p-1 rounded-lg flex text-[10px] sm:text-xs font-bold uppercase tracking-wider w-full sm:w-auto overflow-x-auto">
            {['1M', '3M', '6M', '9M', '12M'].map(range => (
                <button 
                  key={range} 
                  onClick={() => setTimeRange(range)} 
                  className={`flex-1 px-3 py-1.5 rounded-md transition-all ${timeRange === range ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    {range}
                </button>
            ))}
          </div>
        </div>

        <div className="h-[320px] w-full relative">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">Loading graph...</div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                {/* 💡 XAxis now uses our dynamic "label" (either 'May 15' or 'May') */}
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} dy={10} minTickGap={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                
                {/* 💡 Tooltip locked to 2 decimal points */}
                <Tooltip 
                  formatter={(value) => [Number(value).toFixed(2) + " Liters", "Volume"]} 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  labelStyle={{ fontWeight: "black", color: "#0f172a", marginBottom: "4px" }}
                />
                
                <Area type="monotone" dataKey="liters" stroke="#0ea5e9" strokeWidth={3} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">No data found for this period.</div>
          )}
        </div>
      </div>
    </div>
  );
}