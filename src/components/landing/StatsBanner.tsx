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
      className="w-full max-w-4xl mx-auto px-6 pt-4 pb-16"
    >
      <div className="border-t border-[#E4E1D6] pt-8 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            {totalReports}
          </span>
          <span className="text-xs font-medium text-neutral-600">
            Citizen Reports
          </span>
        </div>

        <div className="hidden sm:block h-6 w-px bg-[#E4E1D6]" />

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            {resolvedRate}
          </span>
          <span className="text-xs font-medium text-neutral-600">
            Resolved Rate
          </span>
        </div>

        <div className="hidden sm:block h-6 w-px bg-[#E4E1D6]" />

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            {avgTriageSpeed}
          </span>
          <span className="text-xs font-medium text-neutral-600">
            Avg Triage Speed
          </span>
        </div>

        <div className="hidden sm:block h-6 w-px bg-[#E4E1D6]" />

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            {departmentsCount}
          </span>
          <span className="text-xs font-medium text-neutral-600">
            Major Depts Integrated
          </span>
        </div>
      </div>
    </footer>
  );
}
