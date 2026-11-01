"use client";

import React from "react";

interface StatsBannerProps {
  totalReports?: string;
  resolvedRate?: string;
  avgTriageSpeed?: string;
  departmentsCount?: number;
}

export function StatsBanner({
  totalReports = "12,800+",
  resolvedRate = "94%",
  avgTriageSpeed = "35m",
  departmentsCount = 4,
}: StatsBannerProps) {
  return (
    <footer
      id="impact-stats"
      className="w-full max-w-5xl mx-auto px-6 pt-4 pb-14"
    >
      <div className="pt-8 flex flex-wrap items-center justify-between gap-4 sm:gap-6 border-t border-zinc-200">
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            {totalReports}
          </span>
          <span className="text-xs font-medium text-zinc-600">
            Citizen Reports
          </span>
        </div>

        <div className="hidden sm:block h-6 w-px bg-zinc-200" />

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            {resolvedRate}
          </span>
          <span className="text-xs font-medium text-zinc-600">
            Resolved Rate
          </span>
        </div>

        <div className="hidden sm:block h-6 w-px bg-zinc-200" />

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            {avgTriageSpeed}
          </span>
          <span className="text-xs font-medium text-zinc-600">
            Avg Triage Speed
          </span>
        </div>

        <div className="hidden sm:block h-6 w-px bg-zinc-200" />

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            {departmentsCount}
          </span>
          <span className="text-xs font-medium text-zinc-600">
            Live Departments
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
        <p>© 2026 CivicPulse Platform. Open Public Infrastructure Intelligence.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-600">Global Cluster 01 Online</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
