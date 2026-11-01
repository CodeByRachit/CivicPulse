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
  Activity,
  Layers,
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
    icon: <Cpu className="w-4 h-4 text-neutral-900" />,
  },
  {
    name: 'Three.js & WebGL',
    role: '3D Geospatial Digital Twin',
    icon: <Globe className="w-4 h-4 text-sky-600" />,
  },
  {
    name: 'Supabase Realtime',
    role: 'PostgreSQL WebSocket Mesh',
    icon: <Database className="w-4 h-4 text-emerald-600" />,
  },
  {
    name: 'Multimodal AI',
    role: 'Vision & Speech Triage Engine',
    icon: <Sparkles className="w-4 h-4 text-purple-600" />,
  },
  {
    name: 'Open-Meteo',
    role: 'Live Weather Telemetry',
    icon: <CloudRain className="w-4 h-4 text-blue-600" />,
  },
  {
    name: 'HMAC-SHA256',
    role: 'Stateless Session Security',
    icon: <ShieldCheck className="w-4 h-4 text-neutral-900" />,
  },
];

export function TechArchitectureBanner({
  onReportIssue,
  onExploreMap,
  onPortalAccess,
}: TechArchitectureBannerProps) {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-12">
      {/* Tech Stack Badges Strip */}
      <div className="rounded-3xl border border-[#E4E1D6] bg-white/90 backdrop-blur-md p-6 sm:p-8 shadow-xs mb-12">
        <div className="text-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 font-mono">
            ENGINEERED WITH PRODUCTION-GRADE INFRASTRUCTURE
          </span>
          <h3 className="text-base sm:text-lg font-bold text-neutral-950 mt-1">
            Modern Full-Stack Civic Architecture
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TECH_STACK.map((tech, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#F8F6F0] border border-[#E4E1D6] flex flex-col items-center text-center hover:-translate-y-0.5 transition-transform"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E4E1D6] flex items-center justify-center shadow-2xs mb-2">
                {tech.icon}
              </div>
              <span className="text-xs font-bold text-neutral-950 block">
                {tech.name}
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5 leading-snug">
                {tech.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* High-Impact Final Call To Action Card */}
      <div className="rounded-3xl bg-neutral-950 text-white p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.18)] relative overflow-hidden text-center flex flex-col items-center">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-emerald-400 mb-4 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>JOIN OVER 12,000 CITIZENS NATIONWIDE</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight max-w-2xl leading-tight">
          Ready to Make Your Neighborhood Smarter &amp; Safer?
        </h2>

        <p className="mt-3 text-xs sm:text-sm text-neutral-300 max-w-lg leading-relaxed font-normal">
          Capture photographic or voice evidence of any infrastructure defect. Watch the autonomous AI engine triage, dispatch, and track it until it is 100% resolved.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5 relative z-10">
          {onReportIssue && (
            <button
              type="button"
              onClick={onReportIssue}
              className="inline-flex items-center gap-2 rounded-full bg-white text-neutral-950 hover:bg-neutral-100 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Submit First Report (Free)</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-950" />
            </button>
          )}

          {onExploreMap && (
            <button
              type="button"
              onClick={onExploreMap}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-900 text-neutral-200 px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <span>Launch Live Triage Mesh</span>
            </button>
          )}

          {onPortalAccess && (
            <button
              type="button"
              onClick={onPortalAccess}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white px-4 py-2.5 text-xs font-medium transition cursor-pointer"
            >
              <span>Authority Console</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

