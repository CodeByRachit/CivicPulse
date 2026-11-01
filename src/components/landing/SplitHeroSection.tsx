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
    <div className="w-full h-full flex flex-col items-center justify-center bg-white text-zinc-400 text-xs font-mono gap-3 min-h-[460px]">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
  const [selectedDefect, setSelectedDefect] = useState<CityDefect>(
    CITY_DEFECTS[0]
  );

  return (
    <section className="relative w-full min-h-[660px] lg:min-h-[720px] flex items-center overflow-hidden bg-white text-zinc-900 transition-colors duration-200">
      {/* ─────────────────────────────────────────────────────────────
          SUBTLE BOTTOM DIVIDER ACCENT
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 z-10 pointer-events-none">
        <div className="max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          HERO LAYOUT: LEFT TEXT & RIGHT COMPACT 3D CITY STAGE
         ───────────────────────────────────────────────────────────── */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center w-full">
          {/* Left Column: Authentic Brand Headline, Subtitle & Primary CTAs */}
          <div className="lg:col-span-5 relative z-20 pr-0 lg:pr-2 flex flex-col items-start text-left">
            {/* Platform Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-semibold tracking-wider border border-zinc-300 bg-white text-zinc-900 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>THE OPEN CIVIC TRIAGE PLATFORM</span>
            </div>

            {/* Two-Tone Display Headline */}
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight leading-[1.12]">
              <span className="block text-zinc-950">
                Smarter cities.
              </span>
              <span className="block mt-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
                Transparent solutions.
              </span>
            </h1>

            {/* Subheadline Description */}
            <p className="mt-4 max-w-xl text-xs sm:text-sm md:text-base leading-relaxed text-zinc-700 font-normal">
              Submit photos or voice reports of local issues like potholes, leaks,
              and damage. Watch them get auto-routed, AI-triaged, and resolved in
              real-time.
            </p>

            {/* Feature Cues Micro-Pills */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold shadow-xs border bg-zinc-50 border-zinc-200 text-zinc-800">
                🏙️ 3D Digital Twin &amp; Lidar
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold shadow-xs border bg-zinc-50 border-zinc-200 text-zinc-800">
                🎙️ Voice &amp; Photo Triage
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold shadow-xs border bg-zinc-50 border-zinc-200 text-zinc-800">
                ⚡ 20m Spatial Clustering
              </span>
            </div>

            {/* Dual Call-To-Action Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={onReportIssue}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm hover:shadow-md"
              >
                <span>Report an Issue (Free)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
              <button
                type="button"
                onClick={onExploreMap}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 shadow-xs"
              >
                <span>Explore Active Map</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-700" />
              </button>
            </div>

            {/* Micro-copy */}
            <p className="mt-3 text-xs font-medium text-zinc-500">
              No login required to submit.
            </p>

            {/* Fast Action Pill */}
            <div className="mt-4">
              <button
                type="button"
                onClick={onExploreMap}
                className="text-[11px] font-semibold px-3.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 hover:text-zinc-950 hover:border-zinc-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Launch Live Full-Screen Triage Mesh</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Right Column: Unified 3D Digital Twin Stage + Closely Grouped HUD */}
          <div className="lg:col-span-7 relative z-10 lg:-ml-4 xl:-ml-6 h-[560px] sm:h-[600px] lg:h-[640px] w-full flex flex-col justify-between">
            {/* Inner WebGL Canvas Container */}
            <div className="absolute inset-0 w-full h-full z-0 bg-white rounded-3xl overflow-hidden">
              <CityInfrastructure3D
                activeDefectId={selectedDefect.id}
                onSelectDefect={(d) => setSelectedDefect(d)}
              />
            </div>

            {/* Foreground HUD Grouped Closely Around 3D Perimeter */}
            <div className="relative z-20 pointer-events-none p-2 sm:p-4 flex flex-col justify-between h-full">
              {/* Unified Floating Top Header Dock: Cleanly Pinned at Top with Generous Breathing Room Above Towers */}
              <div className="flex items-center justify-center w-full pointer-events-none pt-2 sm:pt-3">
                <div className="inline-flex items-center gap-2 sm:gap-3 p-1.5 px-3 sm:px-3.5 rounded-full bg-white/95 border border-zinc-200/90 shadow-md backdrop-blur-md pointer-events-auto">
                  {/* Status indicator */}
                  <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-zinc-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-bold text-zinc-900 tracking-tight">
                      3D Urban Twin
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">
                      • Drag to rotate
                    </span>
                  </div>

                  {/* Department filter pills */}
                  <div className="flex items-center gap-1">
                    {CITY_DEFECTS.map((d) => {
                      const isSelected = d.id === selectedDefect.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDefect(d)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                            isSelected
                              ? "bg-zinc-950 text-white shadow-xs"
                              : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                          }`}
                        >
                          {d.departmentCode.split("-")[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom-Right Telemetry HUD: Mouse-Gyro 3D Tilt Card Anchored Snugly with Full Bottom Clearance */}
              <div className="self-end sm:mr-4 mb-3 sm:mb-4 pointer-events-auto w-full max-w-[290px]">
                <TiltCard3D maxTilt={9} glare={true} className="rounded-2xl">
                  <div className="rounded-2xl p-3.5 space-y-2 border border-zinc-200/90 bg-white/95 text-zinc-900 shadow-xl backdrop-blur-md transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border bg-zinc-100 border-zinc-200 text-zinc-900">
                        {selectedDefect.department}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-red-700 bg-red-50 border-red-200">
                        ★ {selectedDefect.severity}/10
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold leading-snug text-zinc-950">
                        {selectedDefect.title}
                      </h4>
                      <p className="text-[11px] mt-0.5 leading-relaxed text-zinc-600 font-normal">
                        {selectedDefect.diagnosis}
                      </p>
                    </div>

                    <div className="pt-1.5 flex items-center justify-between text-[11px] border-t border-zinc-200">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>AI Scanned</span>
                      </span>
                      <button
                        type="button"
                        onClick={onExploreMap}
                        className="font-bold text-zinc-950 hover:text-emerald-700 transition flex items-center gap-1 cursor-pointer"
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
      </div>
    </section>
  );
}
