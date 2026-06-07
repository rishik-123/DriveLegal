"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, AlertTriangle, Search, Volume2, VolumeX, Eye } from "lucide-react";
import api from "@/lib/api";

interface Location {
  lat: number;
  lng: number;
}

export default function NavigationPage() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState("");
  const [activeDestination, setActiveDestination] = useState("");
  const [locationError, setLocationError] = useState("");
  const [currentTheme, setCurrentTheme] = useState("neo-black");
  
  // Real-time speed and limit states
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedLimit, setSpeedLimit] = useState(40);
  const [speedUnit, setSpeedUnit] = useState("km/h");
  const [voiceAlerts, setVoiceAlerts] = useState(true);
  const [zoneAlert, setZoneAlert] = useState("");
  
  const lastPositionRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const speechRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("driveverse_theme") || "neo-black";
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Haversine Distance Formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Speaks warning alerts if speeding
  const triggerVoiceWarning = (text: string) => {
    if (!voiceAlerts || typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Prevent spamming speech synthesis
    if (speechRef.current) return;
    speechRef.current = true;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => {
      // Re-enable warnings after 10 seconds
      setTimeout(() => {
        speechRef.current = false;
      }, 10000);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Sync geofence limits when location changes
  const checkGeofencedLimit = async (lat: number, lng: number) => {
    try {
      const res = await api.post("/api/laws/geofence", { latitude: lat, longitude: lng });
      if (res.ok) {
        const data = res.data as any;
        setSpeedLimit(data.speed_limit || 40);
        setSpeedUnit(data.speed_unit || "km/h");
        setZoneAlert(data.driving_brief || "");
      }
    } catch (err) {
      console.warn("Geofence lookup failed. Using default speed limit.", err);
    }
  };

  // Start real-time watchPosition GPS
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          const currentTimestamp = pos.timestamp;
          
          setCurrentLocation({ lat: latitude, lng: longitude });

          // Determine speed (use native speed if available, otherwise calculate from delta coords)
          if (speed !== null && speed >= 0) {
            // Speed comes in m/s, convert to km/h
            const speedKmh = Math.round(speed * 3.6);
            setCurrentSpeed(speedKmh);
          } else if (lastPositionRef.current) {
            const last = lastPositionRef.current;
            const distance = calculateDistance(last.lat, last.lng, latitude, longitude); // km
            const timeDiff = (currentTimestamp - last.timestamp) / 1000; // seconds

            if (timeDiff > 0.5 && distance > 0.001) {
              const calculatedSpeed = Math.round((distance / timeDiff) * 3600); // km/h
              
              // Apply low pass filter to prevent GPS jitter
              setCurrentSpeed((prev) => {
                const smoothed = Math.round(0.3 * calculatedSpeed + 0.7 * prev);
                return smoothed > 2 ? smoothed : 0;
              });
            }
          }

          lastPositionRef.current = { lat: latitude, lng: longitude, timestamp: currentTimestamp };
          
          // Verify geofenced limits for current zone
          checkGeofencedLimit(latitude, longitude);
        },
        (err) => {
          console.error("GPS access error:", err);
          setLocationError("Location tracking failed. Please enable high-accuracy GPS.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Check speeding alerts
  useEffect(() => {
    if (currentSpeed > speedLimit) {
      triggerVoiceWarning(`Warning. You are exceeding the speed limit of ${speedLimit} ${speedUnit}. Your current speed is ${currentSpeed}. Please slow down.`);
    }
  }, [currentSpeed, speedLimit]);

  const roadAlerts = [
    { type: "speed_breaker", label: "Speed Breaker Ahead", icon: "⚠️", distance: "200m" },
    { type: "school_zone", label: "School Zone — 25 km/h", icon: "🏫", distance: "500m" },
    { type: "accident_zone", label: "Accident Prone Area", icon: "🚧", distance: "1.2km" },
    { type: "toll", label: "Toll Plaza Ahead", icon: "🛣️", distance: "3km" },
  ];

  const isSpeeding = currentSpeed > speedLimit;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="p-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Navigation Center</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Live navigation with road alerts • Powered by Google Maps
            </p>
          </div>
          {currentLocation && (
            <div className="badge badge-success">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              GPS Tracking Active
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-default)" }}>
            <Search size={16} style={{ color: "var(--text-tertiary)" }} />
            <input 
              type="text" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setActiveDestination(destination);
                }
              }}
              placeholder="Enter destination (e.g. Dubai Marina, UCLA, Anna Salai)" 
              className="bg-transparent border-none outline-none text-sm flex-1" 
              style={{ color: "var(--text-primary)" }} 
            />
          </div>
          <button 
            className="btn btn-primary px-4" 
            onClick={() => setActiveDestination(destination)}
          >
            <Navigation size={16} /> Navigate
          </button>
        </div>
      </div>

      {locationError && (
        <div className="mx-6 p-3 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20">
          {locationError}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative">
          <iframe
            width="100%"
            height="100%"
            style={{ 
              border: 0, 
              filter: currentTheme === "light" ? "none" : "invert(90%) hue-rotate(180deg) contrast(1.1) brightness(0.95)"
            }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={
              activeDestination
                ? `https://maps.google.com/maps?q=${encodeURIComponent(activeDestination)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
                : `https://maps.google.com/maps?q=${currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : "12.9915,80.2336"}&t=&z=14&ie=UTF8&iwloc=&output=embed`
            }
          />
        </div>

        {/* Speedometer & Road Alerts Sidebar */}
        <div className="w-full lg:w-80 overflow-y-auto flex-shrink-0 p-4 space-y-4" style={{ borderLeft: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>
          
          {/* Active Speedometer */}
          <div className="card p-5 relative overflow-hidden flex flex-col items-center justify-center">
            {isSpeeding && (
              <span className="absolute inset-0 bg-red-500/5 animate-pulse border-2 border-red-500 rounded-xl" />
            )}
            <div className="text-xs font-bold uppercase tracking-wider mb-2 z-10" style={{ color: "var(--text-tertiary)" }}>
              Current Speed
            </div>
            
            {/* Speed Display */}
            <div className="flex items-baseline gap-1 z-10">
              <span className={`text-5xl font-black ${isSpeeding ? "text-red-500 animate-bounce" : "text-white"}`}>
                {currentSpeed}
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                {speedUnit}
              </span>
            </div>

            {isSpeeding && (
              <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 animate-pulse z-10 flex items-center gap-1">
                <AlertTriangle size={10} /> Speeding Warning!
              </div>
            )}
          </div>

          {/* Speed Limit indicator */}
          <div className="card p-4 flex items-center justify-around">
            <div className="text-center">
              <div className="text-xxs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Zone Limit
              </div>
              <div 
                className="w-12 h-12 rounded-full border-4 mx-auto mt-1 flex items-center justify-center text-sm font-extrabold text-white"
                style={{ borderColor: "var(--error)" }}
              >
                {speedLimit}
              </div>
            </div>
            <div className="h-8 w-px" style={{ background: "var(--border-subtle)" }} />
            <div className="text-center">
              <div className="text-xxs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Alert Tone
              </div>
              <button 
                onClick={() => setVoiceAlerts(!voiceAlerts)} 
                className={`btn p-2 rounded-lg mt-1 ${voiceAlerts ? "bg-indigo-500/10 text-indigo-400" : "bg-neutral-800 text-neutral-500"}`}
              >
                {voiceAlerts ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>
          </div>

          {/* Geofence Driving Alerts Banner */}
          {zoneAlert && (
            <div className="p-3 rounded-lg border text-xs" style={{ background: "var(--warning-dim)", borderColor: "rgba(245,158,11,0.2)" }}>
              <div className="font-bold flex items-center gap-1" style={{ color: "var(--warning)" }}>
                <AlertTriangle size={12} /> Zone Warnings
              </div>
              <p className="mt-1" style={{ color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {zoneAlert}
              </p>
            </div>
          )}

          {/* Road Alerts */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
              Live Road Infrastructure
            </div>

            {roadAlerts.map((alert, i) => (
              <div key={i} className="card p-3 flex items-center gap-3">
                <span className="text-lg">{alert.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold">{alert.label}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>in {alert.distance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
