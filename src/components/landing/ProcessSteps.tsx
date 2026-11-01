"use client";

import React from "react";
import { Camera, Mic, GitFork, Route } from "lucide-react";

export function ProcessSteps() {
  return (
    <section
      id="how-it-works"
      className="w-full max-w-4xl mx-auto px-6 pt-10 pb-8"
    >
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
          Three steps to a better neighborhood
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-neutral-500 font-normal">
          From citizen submission to municipal resolution in three autonomous stages
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Step 1 */}
        <div className="rounded-2xl border border-[#E4E1D6] bg-white/95 backdrop-blur-sm p-5 shadow-[0_4px_24px_rgba(40,35,25,0.02)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(40,35,25,0.06)] hover:border-neutral-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EAE6DC] border border-[#DFDACD] flex items-center justify-center text-neutral-900 shadow-2xs">
              <Camera className="w-4 h-4 text-neutral-900 shrink-0" />
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#F8F6F0] flex items-center justify-center text-neutral-500">
              <Mic className="w-3.5 h-3.5 shrink-0" />
            </div>
          </div>
          <h3 className="mt-3.5 text-sm sm:text-base font-bold text-neutral-950">
            01 · Capture &amp; Send
          </h3>
          <p className="mt-2 text-xs text-neutral-600 leading-relaxed font-normal">
            Take a photo or record a quick voice report directly on your phone.
            High-accuracy GPS attaches automatically.
          </p>
        </div>

        {/* Step 2 */}
        <div className="rounded-2xl border border-[#E4E1D6] bg-white/95 backdrop-blur-sm p-5 shadow-[0_4px_24px_rgba(40,35,25,0.02)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(40,35,25,0.06)] hover:border-neutral-300 transition-all duration-300">
          <div className="w-9 h-9 rounded-xl bg-[#EAE6DC] border border-[#DFDACD] flex items-center justify-center text-neutral-900 shadow-2xs">
            <GitFork className="w-4 h-4 text-neutral-900 shrink-0" />
          </div>
          <h3 className="mt-3.5 text-sm sm:text-base font-bold text-neutral-950">
            02 · AI Triage
          </h3>
          <p className="mt-2 text-xs text-neutral-600 leading-relaxed font-normal">
            Our multimodal AI immediately categorizes, evaluates severity, clusters
            duplicate reports, and alerts the right city department.
          </p>
        </div>

        {/* Step 3 */}
        <div className="rounded-2xl border border-[#E4E1D6] bg-white/95 backdrop-blur-sm p-5 shadow-[0_4px_24px_rgba(40,35,25,0.02)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(40,35,25,0.06)] hover:border-neutral-300 transition-all duration-300">
          <div className="w-9 h-9 rounded-xl bg-[#EAE6DC] border border-[#DFDACD] flex items-center justify-center text-neutral-900 shadow-2xs">
            <Route className="w-4 h-4 text-neutral-900 shrink-0" />
          </div>
          <h3 className="mt-3.5 text-sm sm:text-base font-bold text-neutral-950">
            03 · Track Live
          </h3>
          <p className="mt-2 text-xs text-neutral-600 leading-relaxed font-normal">
            Watch real-time progress on the public map from dispatch to complete
            photographic verification and SLA resolution.
          </p>
        </div>
      </div>
    </section>
  );
}
