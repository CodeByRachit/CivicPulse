'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'PLATFORM OVERVIEW',
    question: 'What is CivicPulse and how is it different from standard city portals?',
    answer:
      'CivicPulse is an autonomous municipal infrastructure intelligence platform. Traditional grievance websites dump complaints into manual clerical queues that take weeks to review. CivicPulse uses multimodal AI (photo and voice ingestion), WebGL 3D geospatial mapping, live meteorological telemetry, and automated department routing to diagnose, triage, score severity, and draft contractor work orders in under 3 seconds.',
  },
  {
    category: 'CITIZEN REPORTING',
    question: 'Do I need to create an account or log in to report an issue?',
    answer:
      'No! Citizens can report civic issues completely friction-free without creating an account. High-accuracy GPS coordinates, camera photos, and voice notes attach immediately. Creating a Citizen profile or logging in lets you maintain a personal history of your submissions and receive status notifications when field crews mark them resolved.',
  },
  {
    category: 'AI ENGINE',
    question: 'How does the AI calculate severity ratings and contractor SLAs?',
    answer:
      'Our vision and speech AI analyzes the physical geometry of the defect (depth, perimeter, lane blockage, water pooling, live electrical hazards) and cross-references it with live weather conditions from Open-Meteo. Severe road craters and exposed live wires receive higher ratings (8–10/10) with an immediate 24-hour SLA deadline, while cosmetic issues receive standard 7-day targets.',
  },
  {
    category: 'DEDUPLICATION',
    question: 'What happens if five neighbors report the exact same pothole?',
    answer:
      'CivicPulse features automated spatial deduplication using a 20-meter Haversine radius filter. When a new report is submitted within 20m of an existing defect, the platform recognizes the match, merges the reports into a single unified cluster, and increments community upvotes instead of spamming municipal dispatchers with multiple duplicate work orders.',
  },
  {
    category: 'GEOSPATIAL GLOBE',
    question: 'How does the 3D Earth Globe and satellite imagery work?',
    answer:
      'The 3D Globe is rendered via Three.js and WebGL with custom GLSL shaders, orbital atmospheric halos, and raycasted geospatial pin markers. Users can drag to rotate the planet or click "Zoom into Satellite View" to dive smoothly through atmospheric layers directly into high-resolution satellite street imagery of the exact neighborhood sector.',
  },
  {
    category: 'AUTHORITY & RESOLUTION',
    question: 'How do municipal authorities dispatch crews and verify resolutions?',
    answer:
      'Municipal authorities log in with verified administrator credentials or passkeys via cryptographically signed HMAC-SHA256 session tokens. Admins can click "Dispatch Work Order" to notify field crews and "✓ Mark Resolved" once repairs are verified. Resolved reports are permanently archived in the public "Completed Works" tab with full SLA audit trails.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[10px] font-semibold tracking-wider shadow-2xs mb-2 border border-zinc-200 bg-white text-zinc-700">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>EVERYTHING YOU NEED TO KNOW</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600">
          Clear answers about how CivicPulse operates, from citizen privacy to automated municipal dispatch.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              onClick={() => toggleIndex(idx)}
              className={`group transition-all duration-300 cursor-pointer overflow-hidden ${
                isOpen
                  ? 'bg-white border border-zinc-300 border-l-4 border-l-emerald-500 rounded-2xl p-6 shadow-[0_8px_25px_-6px_rgba(0,0,0,0.07)]'
                  : 'bg-white hover:bg-zinc-50/70 border border-zinc-200/80 hover:border-zinc-300 rounded-2xl px-6 py-5'
              }`}
            >
              <div className="w-full text-left flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono">
                    {item.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-950">
                    {item.question}
                  </h3>
                </div>
                <div
                  className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen
                      ? 'bg-zinc-950 text-white rotate-180 shadow-sm'
                      : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200 group-hover:text-zinc-800'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Smooth CSS Grid Expand/Collapse Animation */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen
                    ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-zinc-100'
                    : 'grid-rows-[0fr] opacity-0 mt-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-600">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
