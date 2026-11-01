'use client';

import React, { useState } from 'react';
import { TiltCard3D } from './TiltCard3D';
import {
  Sparkles,
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle2,
  CloudRain,
  Shield,
  ArrowRight,
  FileText,
  Volume2,
  Camera,
} from 'lucide-react';

interface Scenario {
  id: string;
  department: string;
  departmentCode: string;
  title: string;
  location: string;
  severity: number;
  sla: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  weather: {
    temp: string;
    rain: string;
    wind: string;
  };
  evidenceType: string;
  aiDiagnosis: string;
  workOrderDraft: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'pothole',
    department: 'Roads & Public Works',
    departmentCode: 'PWD-ROADS',
    title: 'Severe Arterial Road Defect & Pothole Cluster',
    location: 'Sector 4, Main Link Road (15.39408°N, 75.02424°E)',
    severity: 8.9,
    sla: '1d 23h remaining',
    urgency: 'HIGH',
    weather: { temp: '26°C', rain: '12 mm', wind: '15 km/h' },
    evidenceType: 'Photo + Voice Note (Dual Evidence)',
    aiDiagnosis:
      'Pavement subsurface scouring with multi-layer subbase failure. Standing rainwater is accelerating structural breakdown across both traffic lanes.',
    workOrderDraft:
      'Dispatch rapid-fill hot asphalt compaction crew with pneumatic tamper and dual hazard safety signage.',
  },
  {
    id: 'electrical',
    department: 'Power & Electric',
    departmentCode: 'ELEC-POWER',
    title: 'Exposed High-Voltage Distribution Cable Near Walkway',
    location: 'North Avenue, Block 7 (15.41200°N, 75.05100°E)',
    severity: 9.6,
    sla: '6h remaining',
    urgency: 'CRITICAL',
    weather: { temp: '28°C', rain: '8 mm', wind: '24 km/h' },
    evidenceType: 'High-Res Photo Evidence',
    aiDiagnosis:
      'Torn insulation sleeve on 440V aerial drop conductor. Immediate human electrocution hazard compounded by active rainfall and high wind velocity.',
    workOrderDraft:
      'Urgent circuit isolation required at Feeder Station 4B. Dispatch lineman emergency crew with bucket truck and replacement XLPE sleeve.',
  },
  {
    id: 'drainage',
    department: 'Water & Drainage',
    departmentCode: 'WATER-DRAIN',
    title: 'Major Stormwater Main Backflow & Roadway Flooding',
    location: 'Market Crossing, South Culvert (15.38550°N, 75.01250°E)',
    severity: 8.2,
    sla: '1d 12h remaining',
    urgency: 'HIGH',
    weather: { temp: '24°C', rain: '22 mm', wind: '19 km/h' },
    evidenceType: 'Voice Memo Report',
    aiDiagnosis:
      'Silt and debris accumulation at culvert gate preventing gravity drainage, resulting in 40cm roadway standing water and building basement risk.',
    workOrderDraft:
      'Deploy industrial vacuum suction tanker and high-pressure jetting machine. Clear culvert intake within 2 hours.',
  },
  {
    id: 'sanitation',
    department: 'Sanitation & Solid Waste',
    departmentCode: 'SAN-WASTE',
    title: 'Unauthorized Chemical & Waste Disposal on Public Lot',
    location: 'Industrial Bypass, Gate 2 (15.42900°N, 75.06800°E)',
    severity: 7.8,
    sla: '2d 18h remaining',
    urgency: 'MEDIUM',
    weather: { temp: '30°C', rain: '0 mm', wind: '10 km/h' },
    evidenceType: 'Geotagged Photo Evidence',
    aiDiagnosis:
      'Secondary municipal boundary dumping. Uncontrolled accumulation of organic and industrial packaging creating pest infestation and groundwater runoff risk.',
    workOrderDraft:
      'Dispatch heavy hydraulic compactor truck and environmental sanitization sprayer. Install permanent solar surveillance deterrent.',
  },
];

interface InteractiveTriagePreviewProps {
  onReportIssue?: () => void;
  onExploreMap?: () => void;
}

export function InteractiveTriagePreview({
  onReportIssue,
  onExploreMap,
}: InteractiveTriagePreviewProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('pothole');

  const activeScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DFDACD] bg-[#EAE6DC] px-3 py-0.5 text-[10px] font-semibold tracking-wider text-neutral-700 shadow-2xs mb-2">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>INTERACTIVE AI TRIAGE ENGINE SIMULATOR</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            See the AI Engine in Action
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 max-w-xl">
            Select an infrastructure crisis below to see how CivicPulse extracts evidence, diagnoses the defect, evaluates severity, and drafts the municipal work order in real time.
          </p>
        </div>

        {/* Action button */}
        {onReportIssue && (
          <button
            type="button"
            onClick={onReportIssue}
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <span>Submit a Live Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Scenario Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {SCENARIOS.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => setSelectedScenarioId(scenario.id)}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-neutral-950 shadow-md ring-1 ring-black/10'
                  : 'bg-white/80 hover:bg-white border-[#E4E1D6] hover:border-neutral-300'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">
                {scenario.department.split('&')[0]}
              </div>
              <div className="text-xs font-bold text-neutral-950 truncate mt-0.5">
                {scenario.title.split(' ')[0]} {scenario.title.split(' ')[1]}
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-mono">
                <span className={scenario.severity >= 9 ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>
                  ★ {scenario.severity}/10
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Simulation Display Card with 3D Tilt */}
      <TiltCard3D maxTilt={4} glare={true} className="rounded-3xl">
        <div className="rounded-3xl border border-[#E4E1D6] bg-white p-6 sm:p-8 shadow-[0_16px_50px_rgba(40,35,25,0.06)] space-y-6">
          {/* Top Header Row of the Report */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E4E1D6]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-950 text-white">
                  {activeScenario.department}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {activeScenario.departmentCode}
                </span>
                {activeScenario.urgency === 'CRITICAL' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>CRITICAL HAZARD</span>
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-950">
                {activeScenario.title}
              </h3>
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{activeScenario.location}</span>
              </div>
            </div>

            {/* Severity & SLA Pills */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-neutral-400 font-medium uppercase">
                  AI Severity Score
                </div>
                <div className="text-xl sm:text-2xl font-black text-neutral-950 flex items-baseline justify-end gap-1">
                  <span>{activeScenario.severity}</span>
                  <span className="text-xs text-neutral-400 font-normal">/ 10</span>
                </div>
              </div>

              <div className="h-10 w-px bg-[#E4E1D6]" />

              <div className="text-right">
                <div className="text-[10px] text-neutral-400 font-medium uppercase">
                  SLA Target
                </div>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{activeScenario.sla}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Diagnostic Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Evidence Ingested */}
            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E4E1D6] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-950">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-neutral-700" />
                  <span>Evidence Ingestion</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Verified</span>
              </div>
              <p className="text-xs text-neutral-600">
                {activeScenario.evidenceType}
              </p>
              <div className="pt-2 border-t border-[#E4E1D6] flex items-center justify-between text-[11px] text-neutral-500">
                <span>GPS Geotag:</span>
                <span className="font-mono text-neutral-800">±1.4m Accuracy</span>
              </div>
            </div>

            {/* Column 2: Environmental Telemetry */}
            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E4E1D6] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-950">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-blue-600" />
                  <span>Weather Telemetry</span>
                </span>
                <span className="text-[10px] text-blue-700 font-semibold">Live Open-Meteo</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono text-[11px]">
                <div>
                  <span className="text-[9px] text-neutral-400 block">TEMP</span>
                  <strong className="text-neutral-900">{activeScenario.weather.temp}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 block">RAIN</span>
                  <strong className="text-blue-600">{activeScenario.weather.rain}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 block">WIND</span>
                  <strong className="text-neutral-900">{activeScenario.weather.wind}</strong>
                </div>
              </div>
            </div>

            {/* Column 3: Citizen Protection */}
            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E4E1D6] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-950">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Privacy &amp; Security</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Encrypted</span>
              </div>
              <p className="text-xs text-neutral-600">
                Contact info encrypted with AES-256. Tamper-evident receipt generated.
              </p>
              <div className="pt-2 border-t border-[#E4E1D6] flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                <span>Receipt Hash:</span>
                <span className="truncate max-w-[100px] text-neutral-800">0x7f4a...92b</span>
              </div>
            </div>
          </div>

          {/* AI Root Cause Diagnosis Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 text-white space-y-2 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous AI Defect Diagnosis &amp; Reasoning</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal">
              &quot;{activeScenario.aiDiagnosis}&quot;
            </p>
          </div>

          {/* Official Work Order Draft Snippet */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F6F0] border border-[#E4E1D6] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-neutral-700" />
                <span>Official Municipal Work Order Draft</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Contractor Ready
              </span>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed font-mono">
              {activeScenario.workOrderDraft}
            </p>
          </div>
        </div>
      </TiltCard3D>
    </section>
  );
}

