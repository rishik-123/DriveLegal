"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ShieldAlert, Navigation, Search, Bell, Shield, Info, WifiOff } from "lucide-react";
import api from "@/lib/api";

interface Law {
  id: string;
  section: string;
  rule_description: string;
  category: string;
  fine_amount: number;
}

export default function TrafficLawsPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState("");
  
  // Results
  const [locationDetails, setLocationDetails] = useState<{
    country: string;
    state: string;
    city: string;
    speed_limit: number;
    speed_unit: string;
    driving_brief: string;
  } | null>(null);
  
  const [laws, setLaws] = useState<Law[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Preset testing locations for user convenience
  const presets = [
    { name: "IIT Madras, Chennai 🇮🇳", lat: 12.9915, lng: 80.2336 },
    { name: "Dubai Marina, Dubai 🇦🇪", lat: 25.2048, lng: 55.2708 },
    { name: "Westwood (UCLA), Los Angeles 🇺🇸", lat: 34.0522, lng: -118.2437 },
    { name: "Connaught Place, New Delhi 🇮🇳", lat: 28.6139, lng: 77.2090 },
    { name: "Pune Central, Pune 🇮🇳", lat: 18.5204, lng: 73.8567 }
  ];

  // Sync offline status
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch geofence rules
  const lookupLocationRules = async (latitude: number, longitude: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/laws/geofence", { latitude, longitude });
      if (res.ok) {
        const data = res.data as any;
        setLocationDetails({
          country: data.country,
          state: data.state,
          city: data.city,
          speed_limit: data.speed_limit,
          speed_unit: data.speed_unit,
          driving_brief: data.driving_brief
        });
        setLaws(data.local_laws || []);
        
        // Cache to localStorage
        localStorage.setItem("cached_laws_details", JSON.stringify({
          country: data.country,
          state: data.state,
          city: data.city,
          speed_limit: data.speed_limit,
          speed_unit: data.speed_unit,
          driving_brief: data.driving_brief,
          laws: data.local_laws || []
        }));
      }
    } catch {
      // Fallback to cache if offline
      const cached = localStorage.getItem("cached_laws_details");
      if (cached) {
        const data = JSON.parse(cached);
        setLocationDetails({
          country: data.country,
          state: data.state,
          city: data.city,
          speed_limit: data.speed_limit,
          speed_unit: data.speed_unit,
          driving_brief: data.driving_brief
        });
        setLaws(data.laws || []);
      } else {
        setError("Network error. No offline cached rules found for these coordinates.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Browser Geolocation Trigger
  const triggerGPSLookup = () => {
    if (!navigator.geolocation) {
      setError("Browser geolocation is not supported.");
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        lookupLocationRules(lat, lng);
      },
      () => {
        setError("GPS access denied. Choose a testing preset below.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Trigger default lookup for IIT Madras on mount
  useEffect(() => {
    setCoords({ lat: 12.9915, lng: 80.2336 });
    lookupLocationRules(12.9915, 80.2336);
  }, []);

  const handlePresetSelect = (p: typeof presets[0]) => {
    setCoords({ lat: p.lat, lng: p.lng });
    lookupLocationRules(p.lat, p.lng);
  };

  const filteredLaws = laws.filter(l =>
    l.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.rule_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <MapPin className="text-[var(--accent-primary)]" /> Geo-Fenced Law Center
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Real-time compliance query based on active GPS coordinates
          </p>
        </div>
        {isOffline && (
          <div className="badge badge-error flex items-center gap-1.5 animate-pulse">
            <WifiOff size={12} />
            Offline Cache Active
          </div>
        )}
      </div>

      {/* Lookup Controls */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* GPS Button */}
        <button
          onClick={triggerGPSLookup}
          className="btn btn-primary p-4 text-sm flex items-center justify-center gap-2 font-bold select-none h-fit"
          disabled={loading}
        >
          <Navigation size={16} />
          {loading ? "Locating..." : "Query My Current GPS"}
        </button>

        {/* Preset Selectors */}
        <div className="md:col-span-2 card p-4 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Or Select Predefined Zones (Test Cases):
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetSelect(p)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer text-xs font-semibold"
                style={{
                  borderColor: coords?.lat === p.lat && coords?.lng === p.lng ? "var(--accent-primary)" : "var(--border-subtle)"
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "var(--error-dim)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Geofence Results Layout */}
      {locationDetails && (
        <div className="grid md:grid-cols-12 gap-6">
          {/* Zone Dashboard */}
          <div className="md:col-span-4 space-y-6">
            {/* Speed Limit Ring */}
            <div className="card p-6 text-center space-y-3 flex flex-col items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                Zone Speed Limit
              </span>
              <div
                className="w-28 h-28 rounded-full flex flex-col items-center justify-center relative shadow-[0_0_20px_var(--error-dim)]"
                style={{ border: "8px solid var(--error)", background: "var(--bg-secondary)" }}
              >
                <span className="text-3xl font-black text-white leading-none">
                  {locationDetails.speed_limit}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest mt-1 text-[var(--error)]">
                  {locationDetails.speed_unit}
                </span>
              </div>
              <div className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                Active in: {locationDetails.city}, {locationDetails.state}
              </div>
            </div>

            {/* Position Coordinates */}
            <div className="card p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>Latitude:</span>
                <span className="font-bold">{coords?.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>Longitude:</span>
                <span className="font-bold">{coords?.lng.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>Country:</span>
                <span className="font-bold uppercase">{locationDetails.country}</span>
              </div>
            </div>
          </div>

          {/* Compliance Rules list */}
          <div className="md:col-span-8 space-y-6">
            {/* Live Compliance Warning Banner */}
            <div
              className="p-5 rounded-xl border space-y-3"
              style={{
                background: "var(--warning-dim)",
                borderColor: "rgba(245,158,11,0.25)",
                boxShadow: "0 0 20px rgba(245,158,11,0.05)"
              }}
            >
              <div className="flex items-center gap-2 text-[var(--warning)] font-bold text-sm">
                <ShieldAlert size={16} /> Live Regional Alerts
              </div>
              <div
                className="text-xs font-medium leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--text-primary)" }}
              >
                {locationDetails.driving_brief}
              </div>
            </div>

            {/* List of Laws */}
            <div className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Local Statute Lookup
                </h3>
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-xs">
                  <Search size={12} style={{ color: "var(--text-tertiary)" }} />
                  <input
                    type="text"
                    placeholder="Search sections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-36"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredLaws.length === 0 ? (
                  <div className="py-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
                    No matching statutes found for this zone.
                  </div>
                ) : (
                  filteredLaws.map((law) => (
                    <div
                      key={law.id}
                      className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-start gap-3 justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--accent-dim)] text-[var(--accent-primary)] border border-[var(--accent-dim)]">
                          {law.section}
                        </span>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {law.rule_description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-black text-white">
                          {locationDetails.speed_unit === "mph" ? "$" : (locationDetails.country === "AE" ? "AED " : "₹")}
                          {law.fine_amount.toLocaleString()}
                        </span>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                          Compounding Fee
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
