"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { SplitHeroSection } from "./SplitHeroSection";
import { PlatformFeatures } from "./PlatformFeatures";
import { ProcessSteps } from "./ProcessSteps";
import { InteractiveTriagePreview } from "./InteractiveTriagePreview";
import { FaqSection } from "./FaqSection";
import { TechArchitectureBanner } from "./TechArchitectureBanner";
import { StatsBanner } from "./StatsBanner";

interface LandingViewProps {
  onReportIssue: () => void;
  onExploreMap: () => void;
  onPortalAccess: () => void;
  totalReports?: string;
  resolvedRate?: string;
  avgTriageSpeed?: string;
  departmentsCount?: number;
  currentUser?: {
    email: string;
    name: string;
    role: "CITIZEN" | "ADMIN";
  } | null;
  onSignOut?: () => void;
}

export function LandingView({
  onReportIssue,
  onExploreMap,
  onPortalAccess,
  totalReports,
  resolvedRate,
  avgTriageSpeed,
  departmentsCount,
  currentUser,
  onSignOut,
}: LandingViewProps) {
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen w-full bg-canvas-pattern bg-[#F4F2EA] text-[#1C1A16] flex flex-col antialiased selection:bg-neutral-900 selection:text-white relative overflow-x-hidden scroll-smooth">
      {/* Top Luxury Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-all duration-75 ease-out shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

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
          currentUser={currentUser}
          onSignOut={onSignOut}
        />
        <main className="flex-1 space-y-4">
          <SplitHeroSection
            onReportIssue={onReportIssue}
            onExploreMap={onExploreMap}
          />

          {/* Interactive Feature Deep-Dive */}
          <div id="platform-features">
            <PlatformFeatures onExploreFeatures={onExploreMap} />
          </div>

          {/* 3-Step Process Breakdown */}
          <div id="how-it-works">
            <ProcessSteps />
          </div>

          {/* Live Interactive AI Triage Simulator */}
          <div id="ai-simulator">
            <InteractiveTriagePreview
              onReportIssue={onReportIssue}
              onExploreMap={onExploreMap}
            />
          </div>

          {/* Comprehensive FAQ Section */}
          <div id="faq">
            <FaqSection />
          </div>

          {/* Developer Architecture & Call to Action */}
          <TechArchitectureBanner
            onReportIssue={onReportIssue}
            onExploreMap={onExploreMap}
            onPortalAccess={onPortalAccess}
          />
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
