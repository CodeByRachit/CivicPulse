"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { TiltCard3D } from "./TiltCard3D";
import type { CityDefect } from "./CityInfrastructure3D";
import { CITY_DEFECTS } from "./CityInfrastructure3D";

// Dynamic SSR-safe import for 3D City Infrastructure Digital Twin
const CityInfrastructure3D = dynamic(() => import("./CityInfrastructure3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B132B] text-neutral-400 text-xs font-mono gap-3 min-h-[460px] rounded-3xl">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      <span>Rendering 3D Isometric Urban Grid...</span>
    </div>
  ),
});

interface SplitHeroSectionProps {
  onReportIssue: () => void;
  onExploreMap: () => void;
}

export function SplitHeroSection({
  onReportIssue,
  onExploreMap,
}: SplitHeroSectionProps) {
  const [selectedDefect, setSelectedDefect] = useState<CityDefect>(CITY_DEFECTS[0]);

  return (
    <section className="w-full max-w-7xl mx-auto px-6 sm:px-8 pt-6 pb-12">
      {/* 2-Column Split Layout: Text on Left, 3D City on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Authentic Brand Headline, Subtitle & Action Buttons */}
        <div className="lg:col-span-6 flex flex-col items-start text-left z-10 py-2">
          {/* Platform Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DFDACD] bg-[#EAE6DC] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-neutral-700 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>THE OPEN CIVIC TRIAGE PLATFORM</span>
          </div>

          {/* Two-Tone Display Headline */}
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.12]">
            <span className="block text-neutral-950">Smarter cities.</span>
            <span className="block mt-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-neutral-900 bg-clip-text text-transparent">
              Transparent solutions.
            </span>
          </h1>

          {/* Subheadline Description */}
          <p className="mt-4 max-w-xl text-xs sm:text-sm md:text-base text-neutral-600 leading-relaxed font-normal">
            Submit photos or voice reports of local issues like potholes, leaks, and
            damage. Watch them get auto-routed, AI-triaged, and resolved in real-time.
          </p>

          {/* Feature Cues Micro-Pills */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/80 border border-[#E4E1D6] text-[11px] font-medium text-neutral-700 shadow-2xs">
              🏙️ 3D Digital Twin &amp; Lidar
            </span>
            <span className="px-3 py-1 rounded-full bg-white/80 border border-[#E4E1D6] text-[11px] font-medium text-neutral-700 shadow-2xs">
              🎙️ Voice &amp; Photo Triage
            </span>
            <span className="px-3 py-1 rounded-full bg-white/80 border border-[#E4E1D6] text-[11px] font-medium text-neutral-700 shadow-2xs">
              ⚡ 20m Spatial Clustering
            </span>
          </div>

          {/* Dual Call-To-Action Buttons */}
          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={onReportIssue}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 hover:bg-neutral-800 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Report an Issue (Free)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
            <button
              type="button"
              onClick={onExploreMap}
              className="inline-flex items-center gap-2 rounded-full border border-[#E4E1D6] bg-white hover:bg-[#F8F6F0] px-5 py-3 text-xs sm:text-sm font-medium text-neutral-800 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <span>Explore Active Map</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-600" />
            </button>
          </div>

          {/* Micro-copy */}
          <p className="mt-3.5 text-xs text-neutral-500 font-medium">
            No login required to submit.
          </p>
        </div>

        {/* Right Column: 3D Urban Twin / City Infrastructure (Not in Book / Frameless) */}
        <div className="lg:col-span-6 relative w-full h-[480px] sm:h-[540px] lg:h-[580px] flex items-center justify-center">
          {/* Frameless High-End 3D Viewport Container */}
          <div className="w-full h-full rounded-3xl overflow-hidden bg-[#0B132B] border border-neutral-800 shadow-[0_24px_60px_rgba(11,19,43,0.22)] relative">
            {/* Interactive 3D Canvas */}
            <CityInfrastructure3D
              activeDefectId={selectedDefect.id}
              onSelectDefect={(d) => setSelectedDefect(d)}
            />

            {/* Top-Left Telemetry Pill */}
            <div className="absolute top-4 left-4 pointer-events-none z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/85 backdrop-blur-md border border-neutral-700/80 text-[11px] font-medium text-neutral-300 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>3D Urban Digital Twin • Drag to Rotate</span>
            </div>

            {/* Top-Right Department Hazard Filter Buttons */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
              {CITY_DEFECTS.map((d) => {
                const isSelected = d.id === selectedDefect.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDefect(d)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-700/60"
                    }`}
                  >
                    {d.departmentCode.split("-")[0]}
                  </button>
                );
              })}
            </div>

            {/* Bottom-Left Action Pill */}
            <div className="absolute bottom-4 left-4 z-10">
              <button
                type="button"
                onClick={onExploreMap}
                className="text-[11px] font-semibold text-neutral-300 bg-neutral-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-neutral-700/70 inline-flex items-center gap-1.5 hover:text-white hover:border-emerald-400 transition-colors cursor-pointer shadow-md"
              >
                <span>Launch Live Full-Screen Triage Mesh</span>
                <span>→</span>
              </button>
            </div>

            {/* Floating 3D Tilt Defect Telemetry HUD Card (Overlaid Bottom Right) */}
            <div className="absolute right-4 bottom-4 w-60 sm:w-64 z-20">
              <TiltCard3D maxTilt={10} glare={true} className="rounded-2xl">
                <div className="rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur-xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white bg-neutral-950">
                      {selectedDefect.department}
                    </span>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                      ★ {selectedDefect.severity}/10
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-neutral-950 leading-snug">
                      {selectedDefect.title}
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                      {selectedDefect.diagnosis}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>AI Scanned</span>
                    </span>
                    <button
                      type="button"
                      onClick={onExploreMap}
                      className="font-bold text-neutral-900 hover:text-emerald-700 transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </TiltCard3D>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Section Divider Line */}
      <div className="w-full border-b border-[#E4E1D6] mt-10" />
    </section>
  );
}
