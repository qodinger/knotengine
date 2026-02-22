"use client";

import React from "react";

export function CyberpunkBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#050505]">
      <svg
        className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.6"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter="url(#noiseFilter)"
          opacity="0.1"
        />

        {/* Animated Mesh Gradients */}
        <g className="animate-pulse duration-[10s] ease-in-out infinite">
          <circle cx="20%" cy="30%" r="40%" fill="url(#grad1)" />
          <circle cx="80%" cy="70%" r="45%" fill="url(#grad2)" />
          <circle cx="50%" cy="50%" r="35%" fill="url(#grad3)" />
        </g>

        {/* Particles */}
        <g className="opacity-60">
          <circle cx="15%" cy="25%" r="2" fill="#10b981" />
          <circle cx="85%" cy="75%" r="2" fill="#3b82f6" />
          <circle cx="55%" cy="45%" r="2" fill="#8b5cf6" />
        </g>

        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="grad3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-80" />
    </div>
  );
}
