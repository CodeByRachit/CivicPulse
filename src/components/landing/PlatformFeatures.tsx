'use client';

import React, { useState } from 'react';
import { TiltCard3D } from './TiltCard3D';
import {
  Globe,
  Camera,
  Mic,
  Cpu,
  Layers,
  CloudRain,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
  badgeColor: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'geospatial',
    tag: 'SPATIAL INTELLIGENCE',
    title: '3D Spherical Geospatial Globe',
    subtitle: 'Interactive WebGL Digital Twin of Municipal Infrastructure',
    description:
      'Explore active civic grievances mapped directly onto an interactive 3D Earth Globe with realistic atmospheric lighting, smooth raycasted pin selection, and seamless dive zoom into ultra-high-resolution satellite street imagery.',
    icon: <Globe className="w-5 h-5 text-sky-600" />,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    highlights: [
      'Raycasted 3D pins with animated pulse waves',
      'One-click dive from orbit into street satellite view',
      'Automatic GPS geolocation alignment with custom nudging',
      'Inertial drag rotation, auto-spin toggle, and camera reset',
    ],
  },
  {
    id: 'multimodal',
    tag: 'EVIDENCE CAPTURE',
    title: 'Dual-Channel Photo & Voice Intake',
    subtitle: '3D Floating Evidence Slots with Zero Friction',
    description:
      'Citizens can report defects using visual evidence, spoken voice recordings, or both. Our custom 3D floating upload cards deliver a tactile, luxury physical feel with synchronized bobbing animations and live audio recording rings.',
    icon: <Camera className="w-5 h-5 text-emerald-600" />,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    highlights: [
      'Tactile 3D floating folder with expandable cover layers',
      'Floating acoustic microphone capsule with real-time waveform pulse',
      'In-browser Speech-to-Text transcript generation',
      'Expandable radial delete menu for one-click evidence management',
    ],
  },
  {
    id: 'ai-triage',
    tag: 'AUTONOMOUS TRIAGE',
    title: 'Multimodal AI Defect Classification',
    subtitle: 'Automated Severity Scoring & Instant Department Routing',
    description:
      'Incoming submissions are evaluated by our vision and speech AI pipeline. The system diagnoses the failure root cause, assigns a precise 0–10 severity rating, calculates a strict SLA deadline, and drafts an official municipal work order.',
    icon: <Cpu className="w-5 h-5 text-purple-600" />,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    highlights: [
      'Automatic routing to Roads, Sanitation, Drainage, or Electric',
      'Strict SLA calculation (24h critical to 7-day low priority)',
      'Automated contractor work order draft with required equipment',
      'Transparent AI reasoning breakdown displayed for citizens',
    ],
  },
  {
    id: 'clustering',
    tag: 'DEDUPLICATION',
    title: 'Spatial Deduplication & Clustering',
    subtitle: 'Autonomous 20-Meter Radius Proximity Merging',
    description:
      'Never flood municipal crews with duplicate tickets for the same pothole. CivicPulse detects reports submitted within 20 meters of existing issues, automatically merging them into a high-priority cluster and aggregating citizen upvotes.',
    icon: <Layers className="w-5 h-5 text-amber-600" />,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    highlights: [
      'Haversine spatial clustering within 20m geographic radius',
      'Automatic severity boost proportional to citizen report density',
      'Community upvoting mechanism with live vote tally',
      'Eliminates duplicate municipal dispatch tickets',
    ],
  },
  {
    id: 'telemetry',
    tag: 'ENVIRONMENTAL INTELLIGENCE',
    title: 'Real-Time Weather Risk Multiplier',
    subtitle: 'Live Open-Meteo Meteorological Telemetry',
    description:
      'Defects become significantly more hazardous during adverse weather. CivicPulse automatically enriches each report location with live precipitation, wind velocity, and temperature telemetry, dynamically elevating urgency during rainstorms.',
    icon: <CloudRain className="w-5 h-5 text-blue-600" />,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    highlights: [
      'Real-time rainfall, wind speed, and ambient temperature telemetry',
      'Rainfall hazard multiplier for open potholes and electrical cables',
      'High-wind risk elevation for overhead line and tree debris reports',
      'Sub-second telemetry enrichment without user friction',
    ],
  },
  {
    id: 'authority',
    tag: 'GOVERNANCE & AUDIT',
    title: 'Authority Console & Verified Archive',
    subtitle: 'Cryptographically Authenticated Resolution Pipeline',
    description:
      'Strict role separation between Citizens and Municipal Authorities. Municipal administrators unlock dispatch controls with HMAC-SHA256 authenticated sessions to dispatch field contractors and archive completed works with cryptographic seals.',
    icon: <ShieldCheck className="w-5 h-5 text-neutral-900" />,
    badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300',
    highlights: [
      'HMAC-SHA256 signed stateless session tokens with HttpOnly cookies',
      'Restricted "Mark Resolved" and "Dispatch" authority controls',
      'Dedicated "Completed Works" resolution archive with verified timestamps',
      'Quick-fill demo access for hackathon judges & municipal auditors',
    ],
  },
];

interface PlatformFeaturesProps {
  onExploreFeatures?: () => void;
}

export function PlatformFeatures({ onExploreFeatures }: PlatformFeaturesProps) {
  const [activeFeatureId, setActiveFeatureId] = useState<string>('geospatial');

  const selectedFeature =
    FEATURES.find((f) => f.id === activeFeatureId) || FEATURES[0];

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-16">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DFDACD] bg-[#EAE6DC] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-neutral-700 shadow-2xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AUTONOMOUS INFRASTRUCTURE SUITE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-950">
          Engineered for Total Municipal Transparency
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
          From the instant a citizen taps record to the second municipal contractors close a work order, every step is automated, auditable, and beautifully visualized.
        </p>
      </div>

      {/* Feature Selector Tabs (Pill Grid) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {FEATURES.map((feature) => {
          const isActive = feature.id === activeFeatureId;
          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => setActiveFeatureId(feature.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-950 text-white shadow-sm ring-1 ring-black/10 scale-102'
                  : 'bg-white/80 hover:bg-white text-neutral-600 hover:text-neutral-950 border border-[#E4E1D6]'
              }`}
            >
              <span className={isActive ? 'text-emerald-400' : 'text-neutral-500'}>
                {feature.icon}
              </span>
              <span>{feature.title.split(' ')[0]} {feature.title.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Spotlight Feature Card (Apple / Linear Showcase Card) */}
      <div className="rounded-3xl border border-[#E4E1D6] bg-white/95 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-[0_16px_50px_rgba(40,35,25,0.06)] relative overflow-hidden transition-all duration-300">
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/40 via-transparent to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Detailed Description & Checklist */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${selectedFeature.badgeColor}`}
              >
                {selectedFeature.tag}
              </span>
              <span className="text-[11px] text-neutral-400 font-medium">
                Core Capability
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-neutral-950">
              {selectedFeature.title}
            </h3>

            <p className="text-xs sm:text-sm text-neutral-700 font-medium">
              {selectedFeature.subtitle}
            </p>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
              {selectedFeature.description}
            </p>

            {/* Checklist items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
              {selectedFeature.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-xs text-neutral-700 font-medium leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {onExploreFeatures && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onExploreFeatures}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <span>Launch Live Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Visual Mini-Card Simulation with 3D Tilt */}
          <div className="lg:col-span-5">
            <TiltCard3D maxTilt={7} glare={true} className="rounded-2xl">
              <div className="rounded-2xl border border-[#E4E1D6] bg-[#F8F6F0] p-5 shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E1D6]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      CP
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-950">
                        Live Engine State
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Cluster Node #IND-7502
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 text-[10px] font-semibold border border-emerald-300/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>ONLINE</span>
                  </span>
                </div>

                {/* Dynamic simulated content based on selected feature */}
                {selectedFeature.id === 'geospatial' && (
                  <div className="space-y-3">
                    <div className="bg-neutral-900 text-white p-3.5 rounded-xl space-y-2 font-mono text-[11px]">
                      <div className="text-neutral-400 text-[10px]">
                        // Three.js Raycaster Telemetry
                      </div>
                      <div className="text-sky-300">Target: 15.39408°N, 75.02424°E</div>
                      <div className="text-neutral-300">Camera Alt: 2.38R (Mesosphere)</div>
                      <div className="text-emerald-400">Projection: WGS84 Cartesian</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E4E1D6] text-xs space-y-1">
                      <span className="font-semibold text-neutral-900 block">
                        Orbital Dive Supported
                      </span>
                      <span className="text-[11px] text-neutral-500 block">
                        Double-click anywhere on Earth to transition from planetary view directly to high-res satellite imagery.
                      </span>
                    </div>
                  </div>
                )}

                {selectedFeature.id === 'multimodal' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white rounded-xl border border-[#E4E1D6] text-center">
                        <div className="text-[10px] font-semibold text-neutral-500 uppercase">
                          Slot 1
                        </div>
                        <div className="text-xs font-bold text-neutral-900 mt-1">
                          3D Folder Photo
                        </div>
                        <div className="text-[10px] text-emerald-600 mt-0.5">
                          ✓ EXIF Timestamp
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#E4E1D6] text-center">
                        <div className="text-[10px] font-semibold text-neutral-500 uppercase">
                          Slot 2
                        </div>
                        <div className="text-xs font-bold text-neutral-900 mt-1">
                          3D Mic Capsule
                        </div>
                        <div className="text-[10px] text-purple-600 mt-0.5">
                          ✓ WebM Audio
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E4E1D6] text-xs font-mono text-neutral-700">
                      &quot;Deep pothole spanning both lanes near civil hospital entrance. Water accumulates quickly.&quot;
                    </div>
                  </div>
                )}

                {selectedFeature.id === 'ai-triage' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-600">Assigned Dept:</span>
                      <span className="font-bold text-neutral-900 bg-white px-2 py-0.5 rounded-md border border-[#E4E1D6]">
                        Roads &amp; Public Works
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-600">Severity Rating:</span>
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                        8.9 / 10 (Urgent)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-600">Contractor SLA:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        1d 23h Target
                      </span>
                    </div>
                    <div className="p-2.5 bg-neutral-900 text-neutral-200 rounded-xl text-[10px] font-mono">
                      Dispatch: Cold-mix asphalt batch + roller compaction team
                    </div>
                  </div>
                )}

                {selectedFeature.id === 'clustering' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-xl border border-[#E4E1D6] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-neutral-900">Cluster #C-4091</span>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Merged 4 Reports
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Haversine Radius: 14.2 meters (Within 20m threshold)
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-600 bg-white p-2.5 rounded-xl border border-[#E4E1D6]">
                      <span>Aggregated Community Upvotes:</span>
                      <span className="font-bold text-neutral-950">▲ 18 Votes</span>
                    </div>
                  </div>
                )}

                {selectedFeature.id === 'telemetry' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-white rounded-xl border border-[#E4E1D6]">
                        <div className="text-[10px] text-neutral-400 font-medium">Temp</div>
                        <div className="text-xs font-bold text-neutral-900 mt-0.5">27.4°C</div>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#E4E1D6]">
                        <div className="text-[10px] text-neutral-400 font-medium">Rain</div>
                        <div className="text-xs font-bold text-blue-600 mt-0.5">14 mm</div>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#E4E1D6]">
                        <div className="text-[10px] text-neutral-400 font-medium">Wind</div>
                        <div className="text-xs font-bold text-neutral-900 mt-0.5">18 km/h</div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-snug">
                      <span className="font-semibold">Weather Alert:</span> Active precipitation amplifies road pothole severity score by +1.2.
                    </div>
                  </div>
                )}

                {selectedFeature.id === 'authority' && (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-neutral-950 text-white rounded-xl space-y-1.5 font-mono text-[11px]">
                      <div className="text-neutral-400 text-[10px]">
                        // Cryptographic Authentication
                      </div>
                      <div className="text-amber-400">Role: MUNICIPAL_ADMIN</div>
                      <div className="text-neutral-300">Sign: HMAC-SHA256 Token</div>
                      <div className="text-emerald-400">Access: Dispatch + Resolve Authorized</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-600 bg-white p-2.5 rounded-xl border border-[#E4E1D6]">
                      <span>Resolution Status:</span>
                      <span className="text-emerald-700 font-bold">✓ SLA Verified &amp; Cleared</span>
                    </div>
                  </div>
                )}
              </div>
            </TiltCard3D>
          </div>
        </div>
      </div>
    </section>
  );
}

