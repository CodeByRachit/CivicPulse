'use client';

import React, { useState } from 'react';
import { TiltCard3D } from './TiltCard3D';
import {
  Sparkles,
  AlertCircle,
  Clock,
  MapPin,
  CloudRain,
  Shield,
  ArrowRight,
  FileText,
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
}: InteractiveTriagePreviewProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('pothole');

  const activeScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-semibold tracking-wider shadow-2xs mb-2 border border-zinc-200 bg-white text-emerald-700">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>INTERACTIVE AI TRIAGE ENGINE SIMULATOR</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            See the AI Engine in Action
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm max-w-xl leading-relaxed text-zinc-600">
            Select an infrastructure crisis below to see how CivicPulse extracts evidence, diagnoses the defect, evaluates severity, and drafts the municipal work order in real time.
          </p>
        </div>

        {/* Action button */}
        {onReportIssue && (
          <button
            type="button"
            onClick={onReportIssue}
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs"
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
                  ? 'bg-white border-zinc-950 shadow-md ring-1 ring-black/10'
                  : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-zinc-950'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider truncate text-zinc-500">
                {scenario.department.split('&')[0]}
              </div>
              <div className="text-xs font-bold truncate mt-0.5 text-zinc-950">
                {scenario.title.split(' ')[0]} {scenario.title.split(' ')[1]}
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-mono">
                <span className="text-red-600 font-bold">
                  ★ {scenario.severity}
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-600">
                  {scenario.sla.split(' ')[0]} SLA
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Simulator Display Card with 3D Tilt */}
      <TiltCard3D maxTilt={5} glare={true} className="rounded-3xl">
        <div className="rounded-3xl p-6 sm:p-8 space-y-6 border border-zinc-200 bg-white shadow-sm">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-zinc-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-zinc-100 text-zinc-800 border-zinc-300">
                  {activeScenario.department}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {activeScenario.departmentCode}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-950">
                {activeScenario.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border text-red-700 bg-red-50 border-red-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Severity: {activeScenario.severity} / 10</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border text-emerald-800 bg-emerald-50 border-emerald-200">
                <Clock className="w-3.5 h-3.5" />
                <span>{activeScenario.sla}</span>
              </span>
            </div>
          </div>

          {/* Grid: Context & Evidence Extraction */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location & GPS */}
            <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Geospatial Coordinates</span>
              </div>
              <p className="text-xs font-medium text-zinc-900">
                {activeScenario.location}
              </p>
              <div className="text-[10px] text-zinc-500 font-mono">
                Accuracy: ±1.8m (RTK Differential)
              </div>
            </div>

            {/* Weather Telemetry */}
            <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
                <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                <span>Live Open-Meteo Telemetry</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-900">
                <span>{activeScenario.weather.temp}</span>
                <span>•</span>
                <span className="text-sky-600">{activeScenario.weather.rain}</span>
                <span>•</span>
                <span>{activeScenario.weather.wind}</span>
              </div>
              <div className="text-[10px] text-zinc-500">
                Risk Factor: Rainfall Elevation Active
              </div>
            </div>

            {/* Evidence Slot */}
            <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
                <Camera className="w-3.5 h-3.5 text-purple-600" />
                <span>Intake Modality</span>
              </div>
              <p className="text-xs font-medium text-zinc-900">
                {activeScenario.evidenceType}
              </p>
              <div className="text-[10px] text-emerald-600 font-semibold">
                ✓ Cryptographically Sealed &amp; Verified
              </div>
            </div>
          </div>

          {/* AI Reasoning & Work Order Draft */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* AI Diagnosis */}
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Multimodal AI Diagnosis Breakdown</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  98.4% Confidence
                </span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-700">
                {activeScenario.aiDiagnosis}
              </p>
            </div>

            {/* Drafted Contractor Work Order */}
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-500" />
                  <span>Autonomous Work Order Draft</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                  Auto-Dispatched
                </span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-700">
                {activeScenario.workOrderDraft}
              </p>
            </div>
          </div>

          {/* Bottom Security Seal */}
          <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-200">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tamper-evident HMAC-SHA256 audit log attached</span>
            </span>
            <span className="font-mono text-[10px] text-zinc-400">
              Latency: 480ms Triage Speed
            </span>
          </div>
        </div>
      </TiltCard3D>
    </section>
  );
}
