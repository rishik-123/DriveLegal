import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  glow?: boolean;
}

export default function Logo({
  className = "",
  size = 36,
  showText = false,
  glow = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl transition-all duration-300"
        style={{
          width: size,
          height: size,
          background: "var(--accent-gradient)",
          boxShadow: glow ? "0 0 20px var(--accent-glow)" : "none",
        }}
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        >
          {/* Outer Shield/Wheel */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" />
          {/* Inner Steering Wheel spokes */}
          <circle cx="12" cy="11" r="5" strokeWidth="2" />
          <line x1="12" y1="11" x2="12" y2="6" strokeWidth="2.5" />
          <line x1="12" y1="11" x2="8" y2="14" strokeWidth="2.5" />
          <line x1="12" y1="11" x2="16" y2="14" strokeWidth="2.5" />
        </svg>
      </div>
      {showText && (
        <span className="text-xl font-extrabold tracking-tight">
          Drive<span className="gradient-text">Verse</span>
        </span>
      )}
    </div>
  );
}
