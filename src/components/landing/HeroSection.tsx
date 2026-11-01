"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onReportIssue: () => void;
  onExploreMap: () => void;
}

export function HeroSection({ onReportIssue, onExploreMap }: HeroSectionProps) {
  return (
    <section className="w-full max-w-4xl mx-auto px-6 pt-10 pb-6 text-center flex flex-col items-center">
      {/* Platform Pill Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-[#DFDACD] bg-[#EAE6DC] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-neutral-700 shadow-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>THE OPEN CIVIC TRIAGE PLATFORM</span>
      </div>

      {/* Two-Tone Display Headline */}
      <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.12]">
        <span className="block text-neutral-950">Smarter cities.</span>
        <span className="block mt-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-neutral-900 bg-clip-text text-transparent">
          Transparent solutions.
        </span>
      </h1>

      {/* Subheadline */}
      <p className="mt-4 max-w-xl text-xs sm:text-sm md:text-base text-neutral-600 leading-relaxed font-normal">
        Submit photos or voice reports of local issues like potholes, leaks, and
        damage. Watch them get auto-routed, AI-triaged, and resolved in real-time.
      </p>

      {/* Dual Call-To-Action Buttons */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
        <button
          type="button"
          onClick={onReportIssue}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-950 hover:bg-neutral-800 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
        >
          <span>Report an Issue (Free)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
        <button
          type="button"
          onClick={onExploreMap}
          className="inline-flex items-center gap-2 rounded-full border border-[#E4E1D6] bg-white hover:bg-[#F8F6F0] px-5 py-2.5 text-xs sm:text-sm font-medium text-neutral-800 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <span>Explore Active Map</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-600" />
        </button>
      </div>

      {/* Micro-copy */}
      <p className="mt-3.5 text-xs text-neutral-500 font-medium">
        No login required to submit.
      </p>
    </section>
  );
}
