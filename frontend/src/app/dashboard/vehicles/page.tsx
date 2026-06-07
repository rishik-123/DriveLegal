"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Plus, Search, Fuel, Calendar, Shield, Thermometer, X, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface Vehicle {
  id: string;
  registration_number: string;
  owner_name?: string;
  make?: string;
  model?: string;
  fuel_type?: string;
  vehicle_type?: string;
  insurance_expiry?: string;
  puc_valid_until?: string;
  registration_date?: string;
  nickname?: string;
  data_source: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [regNo, setRegNo] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchVehicles = async () => {
    const res = await api.getVehicles();
    if (res.ok) {
      const data = res.data as { vehicles: Vehicle[] };
      setVehicles(data.vehicles);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.addVehicle(regNo, nickname || undefined);
      if (res.ok) {
        setShowAddModal(false);
        setRegNo("");
        setNickname("");
        fetchVehicles();
      } else {
        setError((res.data as { detail?: string }).detail || "Failed to add vehicle");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Vehicles</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage your vehicle garage. {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} registered.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {/* Vehicle Grid */}
      {vehicles.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated p-12 text-center">
          <Car size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h3 className="text-lg font-bold mb-2">No vehicles yet</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Add your first vehicle to get started with DriveVerse.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Your First Vehicle
          </button>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-5 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
                    <Car size={20} style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div>
                    <div className="font-bold text-lg tracking-wider">{v.registration_number}</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{v.nickname || `${v.make || ""} ${v.model || ""}`.trim() || "Vehicle"}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {v.owner_name && <InfoRow icon={Search} label="Owner" value={v.owner_name} />}
                {v.fuel_type && <InfoRow icon={Fuel} label="Fuel" value={v.fuel_type} />}
                {v.registration_date && <InfoRow icon={Calendar} label="Registered" value={v.registration_date} />}
                {v.insurance_expiry && <InfoRow icon={Shield} label="Insurance" value={v.insurance_expiry} isDate />}
                {v.puc_valid_until && <InfoRow icon={Thermometer} label="PUC" value={v.puc_valid_until} isDate />}
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--accent-dim)", color: "var(--accent-primary)" }}>
                  {v.data_source === "vahan_api" ? "RTO Verified" : "Manual Entry"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="card-elevated p-6 w-full max-w-md relative">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 bg-transparent border-none cursor-pointer" style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
              <h2 className="text-xl font-bold mb-1">Add Vehicle</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Enter your vehicle registration number</p>

              {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--error-dim)", color: "var(--error)" }}>{error}</div>}

              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Registration Number</label>
                  <input type="text" value={regNo} onChange={(e) => setRegNo(e.target.value.toUpperCase())} placeholder="MH12AB3456" className="input font-mono text-lg tracking-wider" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Nickname (Optional)</label>
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="My Daily Driver" className="input" />
                </div>
                <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={16} /> Add Vehicle</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isDate }: { icon: React.ComponentType<{ size: number }>; label: string; value: string; isDate?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
        <Icon size={14} /> {label}
      </div>
      <span className={`font-medium ${isDate ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
