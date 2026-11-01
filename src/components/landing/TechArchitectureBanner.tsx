'use client';

import React from 'react';
import {
  Cpu,
  Globe,
  Database,
  Sparkles,
  CloudRain,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface TechArchitectureBannerProps {
  onReportIssue?: () => void;
  onExploreMap?: () => void;
  onPortalAccess?: () => void;
}

const TECH_STACK = [
  {
    name: 'Next.js 16',
    role: 'App Router & Edge Handlers',
    icon: <Cpu className="w-5 h-5" />,
  },
  {
    name: 'Three.js & WebGL',
    role: '3D Geospatial Digital Twin',
    icon: <Globe className="w-5 h-5" />,
  },
  {
    name: 'Supabase Realtime',
    role: 'PostgreSQL WebSocket Mesh',
    icon: <Database className="w-5 h-5" />,
  },
  {
    name: 'Multimodal AI',
    role: 'Vision & Speech Triage Engine',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    name: 'Open-Meteo',
    role: 'Live Weather Telemetry',
    icon: <CloudRain className="w-5 h-5" />,
  },
  {
    name: 'HMAC-SHA256',
    role: 'Stateless Session Security',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
];

export function TechArchitectureBanner({
  onReportIssue,
  onExploreMap,
  onPortalAccess,
}: TechArchitectureBannerProps) {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-12 lg:py-16">
      {/* ─────────────────────────────────────────────────────────────
          ENGINEERED WITH PRODUCTION-GRADE INFRASTRUCTURE
         ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-[32px] bg-gradient-to-b from-zinc-50/90 via-white to-zinc-50/60 border border-zinc-200/80 p-6 sm:p-8 lg:p-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_12px_40px_-15px_rgba(0,0,0,0.05)] mb-14 overflow-hidden">
        {/* Soft Background Radial Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.04),transparent_70%)]"
        />

        {/* Section Header */}
        <div className="text-center relative z-10">
          {/* Overline Category Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50/90 border border-emerald-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-emerald-800 mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>ENGINEERED WITH PRODUCTION-GRADE INFRASTRUCTURE</span>
          </div>

          {/* Scaled-Up Dual-Tone Heading */}
          <h3 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-zinc-950 text-center mb-10 leading-[1.15]">
            <span>Modern </span>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
              Full-Stack Civic Architecture
            </span>
          </h3>
        </div>

        {/* 6-Card Tech Stack Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 relative z-10">
          {TECH_STACK.map((tech, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col items-center text-center rounded-2xl bg-white p-6 border border-zinc-200/90 shadow-[0_4px_20px_-4px_rgba(0,9,11,0.04)] hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_14px_30px_-10px_rgba(16,185,129,0.12)] transition-all duration-300"
            >
              {/* Icon Container with Light Glass Tint & Dark Inversion on Hover */}
              <div className="h-12 w-12 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-zinc-950 group-hover:text-emerald-400 group-hover:border-zinc-950 transition-all duration-300 shadow-2xs">
                {tech.icon}
              </div>

              {/* Tech Stack Name */}
              <span className="text-base font-bold text-zinc-950 mb-1.5 tracking-tight">
                {tech.name}
              </span>

              {/* Subtitle Description */}
              <span className="text-xs sm:text-[13px] leading-relaxed text-zinc-600 font-medium">
                {tech.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PRIMARY LANDING PAGE CALL TO ACTION CARD
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-sm border border-zinc-200 bg-zinc-50">
        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-zinc-200 bg-white text-zinc-700 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>INSTANT PARTICIPATION • ZERO SIGNUP REQUIRED</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-950">
            Ready to upgrade your city’s infrastructure?
          </h2>

          <p className="text-xs sm:text-sm text-zinc-600 max-w-lg mx-auto leading-relaxed">
            Submit a live report in seconds with automated AI routing, or open the live geospatial workspace to track issues across your municipal sector.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {onReportIssue && (
              <button
                type="button"
                onClick={onReportIssue}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-bold transition cursor-pointer active:scale-95 bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs hover:shadow-md"
              >
                <span>Report an Issue (Free)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}

            {onExploreMap && (
              <button
                type="button"
                onClick={onExploreMap}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-semibold transition cursor-pointer active:scale-95 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 shadow-xs"
              >
                <span>Launch Live 3D Globe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onPortalAccess && (
              <button
                type="button"
                onClick={onPortalAccess}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-medium transition cursor-pointer text-zinc-600 hover:text-zinc-950"
              >
                <span>Authority Admin Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
