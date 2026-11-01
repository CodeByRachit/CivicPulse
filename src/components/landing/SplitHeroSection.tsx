"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { UploadCloud, ArrowRight, ArrowUpRight } from "lucide-react";

// Dynamic SSR-safe import for Floating 3D Holographic Orb
const FloatingOrb3D = dynamic(() => import("./FloatingOrb3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center text-neutral-400 text-xs font-mono gap-3">
      <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-neutral-500 font-sans tracking-wide text-xs">
        Rendering 3D Holographic Civic Orb...
      </span>
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
    targetId: "pothole",
  },
  {
    id: "sample-cable",
    emoji: "⚡",
    title: "2. Exposed 440V Cable",
    meta: "High Voltage Hazard Shield",
    targetId: "electrical",
  },
  {
    id: "sample-flood",
    emoji: "🌊",
    title: "3. Stormwater Culvert Flooding",
    meta: "20m Spatial Cluster",
    targetId: "drainage",
  },
  {
    id: "sample-dump",
    emoji: "☣️",
    title: "4. Hazardous Waste Dumping",
    meta: "Contractor Work Order Draft",
    targetId: "sanitation",
  },
];

export function SplitHeroSection({
  onReportIssue,
  onExploreMap,
}: SplitHeroSectionProps) {
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
    // Notify simulator of chosen scenario
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("civic_select_scenario", {
          detail: { scenarioId: sample.targetId },
        })
      );
    }
    // Smoothly scroll down to AI Simulator
    const simSection = document.getElementById("ai-simulator");
    if (simSection) {
      simSection.scrollIntoView({ behavior: "smooth" });
    } else {
      onReportIssue();
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-6 sm:px-8 pt-4 pb-10">
      {/* 2-Column Split Layout matching Reference Image 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center min-h-[600px]">
        {/* Left Column: Headlines, Action Button & Quick-Launch Samples */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-10 py-4">
          {/* Top Pill Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DFDACD] bg-[#EAE6DC] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-neutral-700 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AUTONOMOUS MUNICIPAL TRIAGE • CIVIC-2026</span>
          </div>

          {/* High-Impact Display Headline matching Reference Image */}
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[58px] font-extrabold tracking-tight text-[#1C1A16] leading-[1.06]">
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

            {/* Cryptographic Trust Indicator matching Reference Image */}
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

        {/* Right Column: Prominent Free-Floating 3D Hologram Orb & Ribbons */}
        <div className="lg:col-span-5 flex items-center justify-center relative w-full h-[480px] sm:h-[560px] lg:h-[640px]">
          {/* Ambient Warm Halo behind the 3D Orb */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),rgba(124,58,237,0.06),transparent_72%)] pointer-events-none"
            aria-hidden="true"
          />

          {/* Floating 3D Orb Component - Large and Centered */}
          <div className="w-full h-full relative">
            <FloatingOrb3D />
          </div>
        </div>
      </div>

      {/* Subtle Horizontal Divider */}
      <div className="w-full border-b border-[#E4E1D6] mt-8" />
    </section>
  );
}
