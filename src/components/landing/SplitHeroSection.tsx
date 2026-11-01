"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { UploadCloud, ArrowRight } from "lucide-react";
import { TiltCard3D } from "./TiltCard3D";
import type { CityDefect } from "./CityInfrastructure3D";
import { CITY_DEFECTS } from "./CityInfrastructure3D";

// Dynamic SSR-safe import for 3D City Infrastructure Digital Twin
const CityInfrastructure3D = dynamic(() => import("./CityInfrastructure3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B132B] text-neutral-400 text-xs font-mono gap-3 min-h-[460px] rounded-3xl">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      <span>Rendering 3D Isometric Urban Digital Twin...</span>
    </div>
  ),
});

interface SplitHeroSectionProps {
  onReportIssue: () => void;
  onExploreMap: () => void;
}

export const PRELOADED_SAMPLES = [
  {
    id: "sample-pothole",
    emoji: "🛣️",
    title: "1. Arterial Pothole Cluster",
    meta: "6-Hour PWD SLA",
    defectId: "defect-road",
    simulatorId: "pothole",
  },
  {
    id: "sample-cable",
    emoji: "⚡",
    title: "2. Exposed 440V Cable",
    meta: "High Voltage Hazard Shield",
    defectId: "defect-power",
    simulatorId: "electrical",
  },
  {
    id: "sample-flood",
    emoji: "🌊",
    title: "3. Stormwater Culvert Flooding",
    meta: "20m Spatial Cluster",
    defectId: "defect-water",
    simulatorId: "drainage",
  },
  {
    id: "sample-dump",
    emoji: "☣️",
    title: "4. Hazardous Waste Dumping",
    meta: "Contractor Work Order Draft",
    defectId: "defect-road",
    simulatorId: "sanitation",
  },
];

export function SplitHeroSection({
  onReportIssue,
  onExploreMap,
}: SplitHeroSectionProps) {
  const [selectedDefect, setSelectedDefect] = useState<CityDefect>(CITY_DEFECTS[0]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onReportIssue();
  };

  const handleSelectSample = (sample: typeof PRELOADED_SAMPLES[0]) => {
    // Select defect in 3D City Twin
    const matched = CITY_DEFECTS.find((d) => d.id === sample.defectId);
    if (matched) {
      setSelectedDefect(matched);
    }
    // Also notify simulator if user scrolls down
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("civic_select_scenario", {
          detail: { scenarioId: sample.simulatorId },
        })
      );
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-6 sm:px-8 pt-4 pb-12">
      {/* 2-Column Split Layout matching Reference Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Headlines, Action Button & Quick-Launch Samples */}
        <div className="lg:col-span-6 flex flex-col items-start text-left z-10 py-2">
          {/* Top Pill Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DFDACD] bg-[#EAE6DC] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-neutral-700 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AUTONOMOUS MUNICIPAL TRIAGE • CIVIC-2026</span>
          </div>

          {/* High-Impact Display Headline */}
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#1C1A16] leading-[1.06]">
            Your Autonomous <br />
            City Triage Engine. <br />
            <span className="text-[#1C1A16]">100% In Real-Time.</span>
          </h1>

          {/* Subtitle Description */}
          <p className="mt-4 max-w-xl text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
            Report municipal infrastructure defects with photo or voice evidence.
            Zero bureaucracy—instant AI diagnosis, automated contractor work order
            routing, and real-time SLA verification.
          </p>

          {/* Primary Action Button: Elevated Pill with Drag & Drop */}
          <div className="mt-7 w-full max-w-md">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={onReportIssue}
              className={`group relative flex items-center justify-between p-2 pl-3 pr-4 rounded-full bg-white border cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/10 scale-[1.02]"
                  : "border-[#DFDACD] hover:border-neutral-400 shadow-[0_12px_36px_rgba(40,35,25,0.08)] hover:shadow-[0_18px_44px_rgba(40,35,25,0.12)] active:scale-[0.99]"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Dark Circle Upload Icon Badge matching Reference Image */}
                <div className="w-10 h-10 rounded-full bg-[#1C1A16] text-white flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                  <UploadCloud className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                    ↑ Report Civic Grievance
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Click to launch or drop evidence file
                  </span>
                </div>
              </div>

              {/* Supported File Types Pill Badge */}
              <span className="text-[11px] font-mono font-medium text-neutral-600 bg-[#F4F2EA] border border-[#E4E1D6] px-2.5 py-1 rounded-full shrink-0">
                .JPG, .PNG or Voice
              </span>
            </div>

            {/* Cryptographic Trust Indicator */}
            <div className="mt-3 flex items-center gap-2 pl-3 text-[11px] font-medium text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cryptographic Citizen Vault (AES-256) • No login required to submit</span>
            </div>
          </div>

          {/* Quick-Launch Pre-Loaded Samples Section */}
          <div className="mt-9 w-full max-w-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-neutral-500 tracking-wider uppercase">
                Or instantly launch a pre-loaded sample:
              </p>
              <button
                type="button"
                onClick={onExploreMap}
                className="text-[11px] font-semibold text-neutral-600 hover:text-emerald-700 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Live Map View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 2x2 Grid of Preloaded Scenarios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRELOADED_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="group flex items-center justify-between p-3 rounded-xl bg-white border border-[#E4E1D6] hover:border-neutral-400 hover:shadow-xs transition-all duration-150 text-left cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F4F2EA] border border-[#E4E1D6] flex items-center justify-center text-sm shrink-0">
                      {sample.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors truncate">
                        {sample.title}
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate">
                        {sample.meta}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Urban Twin / City Infrastructure (Not in Book / Frameless) */}
        <div className="lg:col-span-6 relative w-full h-[520px] sm:h-[580px] lg:h-[620px] flex items-center justify-center">
          {/* Frameless High-End 3D Viewport Container */}
          <div className="w-full h-full rounded-3xl overflow-hidden bg-[#0B132B] border border-neutral-800 shadow-[0_24px_60px_rgba(11,19,43,0.25)] relative">
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
