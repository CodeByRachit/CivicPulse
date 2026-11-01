"use client";

import React from "react";
import { Activity, ArrowUpRight } from "lucide-react";

interface NavbarProps {
  onReportIssue: () => void;
  onExploreMap: () => void;
  onPortalAccess: () => void;
}

export function Navbar({
  onReportIssue,
  onExploreMap,
  onPortalAccess,
}: NavbarProps) {
  return (
    <header className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      {/* Brand Logo with Linen UI Theme */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <div className="w-8 h-8 rounded-xl bg-neutral-950 flex items-center justify-center text-white shadow-sm ring-1 ring-black/10 group-hover:scale-105 transition-transform">
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-neutral-950">
            CivicPulse
          </span>
          <span className="text-[10px] font-medium text-neutral-600 bg-[#EAE6DC] px-2 py-0.5 rounded-full border border-[#DFDACD]">
            Global Triage
          </span>
        </div>
      </div>

      {/* Centre Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-neutral-600">
        <a
          href="#how-it-works"
          className="hover:text-neutral-950 transition-colors"
        >
          How It Works
        </a>
        <button
          type="button"
          onClick={onExploreMap}
          className="hover:text-neutral-950 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>Live Map</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </button>
        <a
          href="#impact-stats"
          className="hover:text-neutral-950 transition-colors"
        >
          Impact
        </a>
      </nav>

      {/* Right Action Controls */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPortalAccess}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
        >
          Portal Access
        </button>
        <button
          type="button"
          onClick={onReportIssue}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 hover:bg-neutral-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95"
        >
          <span>Report an Issue</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
}
