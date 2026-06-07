"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, AlertTriangle, ShieldCheck, RefreshCw, Landmark, WifiOff } from "lucide-react";
import api from "@/lib/api";

interface FineSchedule {
  id: string;
  violation_name: string;
  base_fine: number;
  penalty_multiplier: number;
  legal_section: string;
  vehicle_type: string;
}

const countries = [
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", symbol: "₹" },
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", symbol: "$" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", currency: "AED", symbol: "AED " }
];

const vehicleTypes = [
  { code: "Car", label: "Car / LMV", icon: "🚗" },
  { code: "Two-wheeler", label: "Two-Wheeler", icon: "🏍️" },
  { code: "Commercial", label: "Commercial Vehicle", icon: "🚛" }
];

export default function ChallanCalculatorPage() {
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [selectedVehicleType, setSelectedVehicleType] = useState("Car");
  const [violations, setViolations] = useState<FineSchedule[]>([]);
  const [selectedViolationIds, setSelectedViolationIds] = useState<string[]>([]);
  const [offenseCounts, setOffenseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Calculated totals
  const [calculationResult, setCalculationResult] = useState<{
    total_fine: number;
    breakdown: Array<{
      violation: string;
      section: string;
      base_fine: number;
      offense_count: number;
      calculated_fine: number;
      is_repeat: boolean;
    }>;
  } | null>(null);

  // Sync network status
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

  // Fetch fine schedules
  const fetchFineSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/laws/fines?country=${selectedCountry}&vehicle_type=${selectedVehicleType}`);
      if (res.ok) {
        const data = res.data as { fines: FineSchedule[] };
        setViolations(data.fines || []);
        // Save to localStorage for offline access
        localStorage.setItem(`fines_${selectedCountry}_${selectedVehicleType}`, JSON.stringify(data.fines || []));
      }
    } catch {
      // Offline fallback: load from localStorage
      const cached = localStorage.getItem(`fines_${selectedCountry}_${selectedVehicleType}`);
      if (cached) {
        setViolations(JSON.parse(cached));
      } else {
        setViolations([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFineSchedules();
    setSelectedViolationIds([]);
    setOffenseCounts({});
    setCalculationResult(null);
  }, [selectedCountry, selectedVehicleType]);

  // Compute calculated values
  const handleCalculate = async () => {
    if (selectedViolationIds.length === 0) {
      setCalculationResult(null);
      return;
    }

    if (isOffline) {
      // Perform local offline calculation
      let total = 0;
      const breakdown = selectedViolationIds.map(id => {
        const violation = violations.find(v => v.id === id);
        if (!violation) return null;
        
        const count = offenseCounts[id] || 1;
        const multiplier = violation.penalty_multiplier || 1.0;
        const calculated_fine = violation.base_fine * Math.pow(multiplier, count - 1);
        total += calculated_fine;
        
        return {
          violation: violation.violation_name,
          section: violation.legal_section,
          base_fine: violation.base_fine,
          offense_count: count,
          calculated_fine: calculated_fine,
          is_repeat: count > 1
        };
      }).filter(Boolean) as any;

      setCalculationResult({
        total_fine: total,
        breakdown
      });
      return;
    }

    // Call backend API
    setLoading(true);
    try {
      const matchedSections = selectedViolationIds.map(id => {
        const v = violations.find(x => x.id === id);
        return v ? v.legal_section : "";
      }).filter(Boolean);

      const res = await api.post("/api/laws/calculate-challan", {
        violations: matchedSections,
        vehicle_type: selectedVehicleType,
        country: selectedCountry
      });

      if (res.ok) {
        const data = res.data as any;
        
        // Apply UI-specific offense counts overrides if selected manually
        const updatedBreakdown = data.breakdown.map((item: any) => {
          const violationObj = violations.find(v => v.legal_section.toLowerCase() === item.section.toLowerCase());
          if (violationObj) {
            const manualCount = offenseCounts[violationObj.id] || 1;
            if (manualCount > 1) {
              const base = item.base_fine;
              const mult = violationObj.penalty_multiplier || 1.0;
              const reCalced = base * Math.pow(mult, manualCount - 1);
              return {
                ...item,
                offense_count: manualCount,
                calculated_fine: reCalced,
                is_repeat: true
              };
            }
          }
          return item;
        });

        const totalFine = updatedBreakdown.reduce((sum: number, item: any) => sum + item.calculated_fine, 0);

        setCalculationResult({
          total_fine: totalFine,
          breakdown: updatedBreakdown
        });
      }
    } catch {
      // Local calculation fallback
      handleCalculate();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [selectedViolationIds, offenseCounts]);

  const toggleViolation = (id: string) => {
    setSelectedViolationIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    if (!offenseCounts[id]) {
      setOffenseCounts(prev => ({ ...prev, [id]: 1 }));
    }
  };

  const updateOffenseCount = (id: string, count: number) => {
    setOffenseCounts(prev => ({ ...prev, [id]: Math.max(1, count) }));
  };

  const currCountry = countries.find(c => c.code === selectedCountry)!;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Calculator className="text-[var(--accent-primary)]" /> Challan Calculator
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Estimate compound traffic fines based on location, vehicle class, and repeat offenses
          </p>
        </div>
        {isOffline && (
          <div className="badge badge-error flex items-center gap-1.5 animate-pulse">
            <WifiOff size={12} />
            Offline Mode
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - Configurations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Controls Card */}
          <div className="card p-5 space-y-5">
            {/* Country Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-tertiary)" }}>
                Select Jurisdiction
              </label>
              <div className="grid grid-cols-3 gap-2">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => setSelectedCountry(country.code)}
                    className="p-3 rounded-xl border font-bold text-sm bg-transparent flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: selectedCountry === country.code ? "var(--accent-primary)" : "var(--border-subtle)",
                      background: selectedCountry === country.code ? "var(--accent-dim)" : "transparent",
                      color: selectedCountry === country.code ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span>{country.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Type Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-tertiary)" }}>
                Vehicle Classification
              </label>
              <div className="grid grid-cols-3 gap-2">
                {vehicleTypes.map((v) => (
                  <button
                    key={v.code}
                    onClick={() => setSelectedVehicleType(v.code)}
                    className="p-3 rounded-xl border font-bold text-sm bg-transparent flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: selectedVehicleType === v.code ? "var(--accent-primary)" : "var(--border-subtle)",
                      background: selectedVehicleType === v.code ? "var(--accent-dim)" : "transparent",
                      color: selectedVehicleType === v.code ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    <span>{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Violations Checklist */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Select Infractions
            </h3>

            {loading ? (
              <div className="py-12 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" /> Loading violations...
              </div>
            ) : violations.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                No custom compounding guidelines found for this combination.
              </div>
            ) : (
              <div className="space-y-2">
                {violations.map((violation) => {
                  const isChecked = selectedViolationIds.includes(violation.id);
                  const count = offenseCounts[violation.id] || 1;
                  return (
                    <div
                      key={violation.id}
                      className="p-4 rounded-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      style={{
                        borderColor: isChecked ? "var(--border-strong)" : "var(--border-subtle)",
                        background: isChecked ? "var(--bg-tertiary)" : "transparent"
                      }}
                    >
                      <div className="flex items-start gap-3 cursor-pointer" onClick={() => toggleViolation(violation.id)}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by click
                          className="mt-1 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-sm">{violation.violation_name}</div>
                          <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                            Section: {violation.legal_section} • Base fine: {currCountry.symbol}{violation.base_fine}
                          </div>
                        </div>
                      </div>

                      {isChecked && (
                        <div className="flex items-center gap-3 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] w-fit self-end md:self-auto">
                          <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Offense:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateOffenseCount(violation.id, count - 1)}
                              className="w-6 h-6 rounded bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{count === 1 ? "1st" : count === 2 ? "2nd" : `${count}rd`}</span>
                            <button
                              onClick={() => updateOffenseCount(violation.id, count + 1)}
                              className="w-6 h-6 rounded bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Breakdown & Totals */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            {!calculationResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-elevated p-8 text-center"
              >
                <Calculator size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
                <h3 className="text-lg font-bold mb-1">Estimate Summary</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Select one or more infractions on the left to see dynamic fee estimation and penalty details.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-elevated p-6 space-y-6 relative overflow-hidden"
              >
                {/* Accent glow line */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "var(--accent-gradient)" }} />

                <div className="text-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                    Estimated Fine Total
                  </h3>
                  <div className="text-4xl font-black mt-2 gradient-text">
                    {currCountry.symbol}{calculationResult.total_fine.toLocaleString()}
                  </div>
                  <div className="text-xxs uppercase tracking-wider font-semibold mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Currency: {currCountry.currency}
                  </div>
                </div>

                <hr style={{ borderColor: "var(--border-subtle)" }} />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                    Breakdown
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {calculationResult.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold">{item.violation}</div>
                          <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                            {item.section} • {item.offense_count === 1 ? "First offense" : `${item.offense_count}nd repeat offense`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold">
                            {currCountry.symbol}{item.calculated_fine.toLocaleString()}
                          </div>
                          {item.is_repeat && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--warning-dim)] text-[var(--warning)] font-semibold border border-amber-500/20">
                              Multiplier Applied
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg flex items-start gap-2.5" style={{ background: "var(--info-dim)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <Landmark size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    This estimation is computed locally and includes the respective region's repeat offender multiplier where applicable. Settlement must be done via the official regional courts.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
