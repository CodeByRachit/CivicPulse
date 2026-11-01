"use client";

import React from "react";
import { MapPin, Clock } from "lucide-react";

const PIN_POSITIONS = [
  { top: "28%", left: "26%" },
  { top: "48%", left: "44%" },
  { top: "64%", left: "16%" },
  { top: "72%", left: "62%" },
  { top: "82%", left: "36%" },
  { top: "34%", left: "76%" },
];

export function MapPreviewCard() {
  return (
    <section className="w-full max-w-4xl mx-auto px-6 mt-4">
      <div className="relative max-w-2xl mx-auto">
        {/* Browser Mockup Frame in Warm Linen UI */}
        <div className="rounded-2xl border border-[#E4E1D6] bg-white overflow-hidden shadow-[0_20px_60px_rgba(40,35,25,0.08)]">
          {/* Browser Window Top Bar */}
          <div className="bg-[#F8F6F0] px-4 py-2.5 border-b border-[#E4E1D6] flex items-center justify-between">
            {/* Window Controls */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E57373]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB74D]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#81C784]/80" />
            </div>

            {/* URL / Live Breadcrumb Pill */}
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EAE6DC]/70 border border-[#DFDACD] text-[11px] font-medium text-neutral-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>civicpulse.org/live-grid</span>
            </div>

            {/* Mode Indicator */}
            <span className="text-[10px] font-semibold text-neutral-500 bg-white/80 px-2 py-0.5 rounded-md border border-[#E4E1D6]">
              Live Mesh
            </span>
          </div>

          {/* Simulated Geospatial Vector Map Canvas */}
          <div className="relative h-52 sm:h-60 w-full bg-[#0E1626] overflow-hidden">
            {/* Map Grid Lines */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #334155 1px, transparent 1px),
                  linear-gradient(to bottom, #334155 1px, transparent 1px)
                `,
                backgroundSize: "32px 32px",
              }}
            />

            {/* Vector Arterial Roads */}
            <svg
              className="absolute inset-0 w-full h-full opacity-35"
              viewBox="0 0 400 200"
              fill="none"
            >
              <path
                d="M-20 40 L180 120 L420 90 M80 -10 L140 210 M260 -10 L210 210"
                stroke="#64748B"
                strokeWidth="2.5"
              />
            </svg>

            {/* Glowing Geospatial Pins */}
            {PIN_POSITIONS.map((pos, idx) => (
              <div
                key={idx}
                style={{ top: pos.top, left: pos.left }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-6 w-6 rounded-full bg-emerald-400/25 animate-ping duration-1000" />
                  <MapPin className="relative w-4 h-4 text-emerald-400 fill-emerald-400/30 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Resolution Inspection Card */}
        <div className="absolute -right-2 sm:-right-6 bottom-4 w-48 sm:w-56 rounded-2xl border border-[#E4E1D6] bg-white/95 backdrop-blur-xl p-3 shadow-[0_16px_40px_rgba(40,35,25,0.14)] z-10">
          {/* Pothole Thumbnail Preview with real photo or clean fallback */}
          <div className="relative h-20 sm:h-24 w-full rounded-xl overflow-hidden bg-neutral-100 border border-[#E4E1D6]">
            <img
              src="/images/pothole.jpg"
              alt="Resolved road pothole"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            {/* Fallback Vector Graphic */}
            <svg
              viewBox="0 0 200 100"
              className="w-full h-full object-cover"
              preserveAspectRatio="none"
            >
              <rect width="200" height="100" fill="#475569" />
              <path d="M0 30 L200 30" stroke="#64748B" strokeWidth="2" />
              <line
                x1="100"
                y1="70"
                x2="100"
                y2="100"
                stroke="#FACC15"
                strokeWidth="4"
                strokeDasharray="8 4"
              />
              <ellipse cx="100" cy="58" rx="34" ry="14" fill="#1E293B" />
              <ellipse cx="102" cy="60" rx="26" ry="9" fill="#0F172A" />
            </svg>
          </div>

          {/* SLA Status Pill */}
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              <span>✓ RESOLVED (SLA Met)</span>
            </span>
          </div>

          {/* Resolution Timestamp */}
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-500 font-medium">
            <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Resolved in 18 hours</span>
          </div>
        </div>
      </div>

      {/* Full-Width Section Divider Line */}
      <div className="w-full border-b border-[#E4E1D6] mt-12" />
    </section>
  );
}
