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
    icon: <Cpu className="w-4 h-4 text-emerald-600" />,
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
    icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
  },
];

export function TechArchitectureBanner({
  onReportIssue,
  onExploreMap,
  onPortalAccess,
}: TechArchitectureBannerProps) {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-10">
      {/* Tech Stack Badges Strip */}
      <div className="rounded-3xl p-6 sm:p-8 mb-12 border border-zinc-200 bg-white shadow-xs">
        <div className="text-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-emerald-700">
            ENGINEERED WITH PRODUCTION-GRADE INFRASTRUCTURE
          </span>
          <h3 className="text-base sm:text-lg font-bold mt-1 text-zinc-950">
            Modern Full-Stack Civic Architecture
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TECH_STACK.map((tech, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl flex flex-col items-center text-center hover:-translate-y-0.5 transition-all border bg-zinc-50 border-zinc-200 hover:border-zinc-300"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs mb-2 border border-zinc-200 bg-white">
                {tech.icon}
              </div>
              <span className="text-xs font-bold text-zinc-950">
                {tech.name}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5 leading-tight">
                {tech.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Landing Page Call To Action Card */}
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
