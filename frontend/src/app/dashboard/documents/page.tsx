"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Share2, CheckCircle, ExternalLink, Link2, Upload, X, Loader2 } from "lucide-react";
import api from "@/lib/api";

const documentTypes = [
  { type: "DL", label: "Driving License", icon: "🪪", color: "#6366f1", desc: "Your driving licence details" },
  { type: "RC", label: "Registration Certificate", icon: "📋", color: "#22c55e", desc: "Vehicle registration document" },
  { type: "Insurance", label: "Vehicle Insurance", icon: "🛡️", color: "#3b82f6", desc: "Insurance policy details" },
  { type: "PUC", label: "PUC Certificate", icon: "🌿", color: "#10b981", desc: "Pollution under control cert" },
  { type: "Permit", label: "Driving Permit", icon: "📄", color: "#f59e0b", desc: "Transport/travel permit" },
  { type: "Aadhaar", label: "Aadhaar Card", icon: "🆔", color: "#ec4899", desc: "Aadhaar identification" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [digiLockerConnected, setDigiLockerConnected] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.getDocuments();
      if (response.ok) {
        const data = response.data as { documents: any[] };
        setDocuments(data.documents || []);
        const hasDigilocker = data.documents.some((d: any) => d.source === "digilocker");
        setDigiLockerConnected(hasDigilocker);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleConnectDigiLocker = async () => {
    try {
      const response = await api.connectDigiLocker();
      if (response.data && (response.data as any).status === "redirect") {
        setIframeUrl((response.data as any).auth_url);
      } else {
        setIframeUrl("https://digilocker.gov.in/");
      }
      setShowIframe(true);
    } catch (err) {
      console.error("Failed to connect to DigiLocker:", err);
      setIframeUrl("https://digilocker.gov.in/");
      setShowIframe(true);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Document Vault</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Store and manage all your vehicle documents securely
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary text-sm">
            <Upload size={14} /> Upload Document
          </button>
          <button className="btn btn-primary text-sm" onClick={handleConnectDigiLocker}>
            <Link2 size={14} /> Connect DigiLocker
          </button>
        </div>
      </div>

      {/* DigiLocker Status */}
      <div 
        className="card p-4 flex items-center gap-4 cursor-pointer" 
        onClick={handleConnectDigiLocker}
        style={{ background: digiLockerConnected ? "var(--success-dim)" : "var(--bg-secondary)", border: `1px solid ${digiLockerConnected ? "rgba(34,197,94,0.2)" : "var(--border-subtle)"}` }}
      >

        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "var(--bg-tertiary)" }}>📦</div>
        <div className="flex-1">
          <div className="font-bold text-sm">{digiLockerConnected ? "DigiLocker Connected" : "Connect DigiLocker"}</div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {digiLockerConnected
              ? "Your documents are synced from DigiLocker"
              : "Link your DigiLocker account to auto-import verified DL, RC, Insurance, and PUC documents"}
          </div>
        </div>
        {digiLockerConnected ? (
          <CheckCircle size={20} style={{ color: "var(--success)" }} />
        ) : (
          <ExternalLink size={16} style={{ color: "var(--text-tertiary)" }} />
        )}
      </div>

      {/* Document Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentTypes.map((doc, i) => {
          const userDoc = documents.find((d) => (d as { doc_type: string }).doc_type === doc.type);
          const hasDoc = !!userDoc;

          return (
            <motion.div
              key={doc.type}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card p-5 group relative overflow-hidden"
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: hasDoc ? doc.color : "var(--border-subtle)" }} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{doc.icon}</span>
                  <div>
                    <div className="font-bold">{doc.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{doc.desc}</div>
                  </div>
                </div>
                {hasDoc && <CheckCircle size={16} style={{ color: "var(--success)" }} />}
              </div>

              {hasDoc ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: "var(--success-dim)", color: "var(--success)" }}>
                      <CheckCircle size={10} /> Verified
                    </span>
                    <span className="text-[10px] uppercase font-semibold" style={{ color: "var(--text-tertiary)" }}>
                      {userDoc.source}
                    </span>
                  </div>

                  {userDoc.metadata && (
                    <div className="text-[11px] space-y-1 p-2.5 rounded-lg border font-mono" style={{ background: "rgba(0,0,0,0.25)", borderColor: "var(--border-subtle)" }}>
                      {doc.type === "DL" && (
                        <>
                          <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>License No:</span> <span className="font-bold text-white">{(userDoc.metadata as any).license_no || "N/A"}</span></div>
                          <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Class:</span> <span className="text-white">{(userDoc.metadata as any).class || "N/A"}</span></div>
                        </>
                      )}
                      {doc.type === "RC" && (
                        <>
                          <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Reg No:</span> <span className="font-bold text-white">{(userDoc.metadata as any).vehicle_no || "N/A"}</span></div>
                          <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Model:</span> <span className="text-white">{(userDoc.metadata as any).model || "N/A"}</span></div>
                        </>
                      )}
                      {doc.type === "Insurance" && (
                        <>
                          <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Policy:</span> <span className="font-bold text-white">{(userDoc.metadata as any).policy_no || "N/A"}</span></div>
                          <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Premium:</span> <span className="text-white">₹{(userDoc.metadata as any).premium?.toLocaleString() || "N/A"}</span></div>
                        </>
                      )}
                      {doc.type === "PUC" && (
                        <>
                          <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>PUC No:</span> <span className="font-bold text-white">{(userDoc.metadata as any).certificate_no || "N/A"}</span></div>
                          <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Status:</span> <span className="text-emerald-400">{(userDoc.metadata as any).emission_level || "PASS"}</span></div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button className="btn btn-ghost text-xs px-3 py-1.5 flex-1"><FileText size={12} /> View</button>
                    <button className="btn btn-ghost text-xs px-3 py-1.5 flex-1"><Download size={12} /> Download</button>
                    <button className="btn btn-ghost text-xs px-3 py-1.5 flex-1"><Share2 size={12} /> Share</button>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <div className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
                    Not yet added. Upload or connect DigiLocker.
                  </div>
                  <button className="btn btn-secondary text-xs w-full py-2">
                    <Upload size={12} /> Upload {doc.label}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Info */}
      <div className="card p-4 flex items-start gap-3" style={{ background: "var(--info-dim)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <FileText size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--info)" }}>DigiLocker Integration</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            DigiLocker API access requires government partner registration. Once configured, your verified documents will auto-sync here. Visit{" "}
            <a href="https://digilocker.gov.in/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--info)" }}>digilocker.gov.in</a> to manage documents directly.
          </div>
        </div>
      </div>

      {/* DigiLocker Iframe Modal */}
      {showIframe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl border overflow-hidden shadow-2xl" style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}>
            {/* Iframe Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>DigiLocker Portal</h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Securely link and view your documents</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(iframeUrl, "_blank")}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open in New Tab
                </button>
                <button 
                  onClick={() => { setShowIframe(false); setIframeUrl(""); }}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors border-none cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Iframe Content */}
            <div className="flex-1 bg-white relative">
              <iframe 
                src={iframeUrl} 
                className="w-full h-full border-none" 
                title="DigiLocker"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
