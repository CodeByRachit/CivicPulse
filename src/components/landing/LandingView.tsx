"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { MapPreviewCard } from "./MapPreviewCard";
import { ProcessSteps } from "./ProcessSteps";
import { StatsBanner } from "./StatsBanner";

interface LandingViewProps {
  onReportIssue: () => void;
  onExploreMap: () => void;
  onPortalAccess: () => void;
  totalReports?: string;
  resolvedRate?: string;
  avgTriageSpeed?: string;
  departmentsCount?: number;
}

export function LandingView({
  onReportIssue,
  onExploreMap,
  onPortalAccess,
  totalReports,
  resolvedRate,
  avgTriageSpeed,
  departmentsCount,
}: LandingViewProps) {
  return (
    <div className="min-h-screen w-full bg-canvas-pattern bg-[#F4F2EA] text-[#1C1A16] flex flex-col antialiased selection:bg-neutral-900 selection:text-white relative overflow-x-hidden">
      {/* Subtle Ambient Radial Glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_35%_at_50%_-5%,rgba(16,185,129,0.06),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar
          onReportIssue={onReportIssue}
          onExploreMap={onExploreMap}
          onPortalAccess={onPortalAccess}
        />
        <main className="flex-1">
          <HeroSection
            onReportIssue={onReportIssue}
            onExploreMap={onExploreMap}
          />
          <MapPreviewCard />
          <ProcessSteps />
        </main>
        <StatsBanner
          totalReports={totalReports}
          resolvedRate={resolvedRate}
          avgTriageSpeed={avgTriageSpeed}
          departmentsCount={departmentsCount}
        />
      </div>
    </div>
  );
}
