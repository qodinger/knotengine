"use client";

import React from "react";

export function AuthBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#050505]">
      {/* Premium Base Texture */}
      <div
        className="absolute inset-0 scale-[1.02] animate-pulse bg-cover bg-center bg-no-repeat opacity-60 mix-blend-luminosity duration-[15s]"
        style={{ backgroundImage: "url('/auth-bg.png')" }}
      />

      <svg
        className="absolute inset-0 h-full w-full opacity-30 mix-blend-screen"
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

        {/* Neutral mesh accents for depth */}
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="infinite animate-pulse duration-[10s] ease-in-out">
          <circle cx="50%" cy="50%" r="50%" fill="url(#grad1)" />
        </g>
      </svg>

      {/* Cyberpunk Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(circle at center, transparent 20%, black 100%)",
        }}
      />

      {/* Deep Vignette for Text Clarity */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_140%)] opacity-90" />
      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60" />
    </div>
  );
}
