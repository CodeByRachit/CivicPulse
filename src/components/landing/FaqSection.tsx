'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

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
    <section className="w-full max-w-4xl mx-auto px-6 py-14">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DFDACD] bg-[#EAE6DC] px-3.5 py-1 text-[10px] font-semibold tracking-wider text-neutral-700 shadow-2xs mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-neutral-600" />
          <span>EVERYTHING YOU NEED TO KNOW</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600">
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
              className="rounded-2xl border border-[#E4E1D6] bg-white overflow-hidden shadow-xs transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => toggleIndex(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F8F6F0]/60 transition-colors"
                aria-expanded={isOpen}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1 font-mono">
                    {item.category}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-neutral-950 leading-snug">
                    {item.question}
                  </span>
                </div>
                <div
                  className={`w-7 h-7 rounded-xl bg-[#EAE6DC] flex items-center justify-center text-neutral-700 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-neutral-950 text-white' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-[#F0ECE1]">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

