"use client";

import React from "react";
import { Camera, Mic, GitFork, Route } from "lucide-react";
import { TiltCard3D } from "./TiltCard3D";

export function ProcessSteps() {
  return (
    <section
      id="how-it-works"
      className="w-full max-w-4xl mx-auto px-6 py-10"
    >
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">
          Three steps to a better neighborhood
        </h2>
        <p className="mt-2 text-xs sm:text-sm font-normal text-zinc-600">
          From citizen submission to municipal resolution in three autonomous stages
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Step 1 with 3D Tilt */}
        <TiltCard3D maxTilt={6} glare={true} className="rounded-2xl">
          <div className="h-full rounded-2xl p-5 transition-all duration-300 border border-zinc-200/90 bg-white shadow-xs hover:shadow-md hover:border-zinc-300">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl border border-zinc-200 bg-zinc-100 flex items-center justify-center shadow-2xs text-zinc-900">
                <Camera className="w-4 h-4 shrink-0 text-emerald-600" />
              </div>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 text-zinc-600">
                <Mic className="w-3.5 h-3.5 shrink-0" />
              </div>
            </div>
            <h3 className="mt-3.5 text-sm sm:text-base font-bold text-zinc-950">
              01 · Capture &amp; Send
            </h3>
            <p className="mt-2 text-xs leading-relaxed font-normal text-zinc-600">
              Take a photo or record a quick voice report directly on your phone.
              High-accuracy GPS attaches automatically.
            </p>
          </div>
        </TiltCard3D>

        {/* Step 2 with 3D Tilt */}
        <TiltCard3D maxTilt={6} glare={true} className="rounded-2xl">
          <div className="h-full rounded-2xl p-5 transition-all duration-300 border border-zinc-200/90 bg-white shadow-xs hover:shadow-md hover:border-zinc-300">
            <div className="w-9 h-9 rounded-xl border border-zinc-200 bg-zinc-100 flex items-center justify-center shadow-2xs text-zinc-900">
              <GitFork className="w-4 h-4 shrink-0 text-emerald-600" />
            </div>
            <h3 className="mt-3.5 text-sm sm:text-base font-bold text-zinc-950">
              02 · AI Triage
            </h3>
            <p className="mt-2 text-xs leading-relaxed font-normal text-zinc-600">
              Our multimodal AI immediately categorizes, evaluates severity, clusters
              duplicate reports, and alerts the right city department.
            </p>
          </div>
        </TiltCard3D>

        {/* Step 3 with 3D Tilt */}
        <TiltCard3D maxTilt={6} glare={true} className="rounded-2xl">
          <div className="h-full rounded-2xl p-5 transition-all duration-300 border border-zinc-200/90 bg-white shadow-xs hover:shadow-md hover:border-zinc-300">
            <div className="w-9 h-9 rounded-xl border border-zinc-200 bg-zinc-100 flex items-center justify-center shadow-2xs text-zinc-900">
              <Route className="w-4 h-4 shrink-0 text-emerald-600" />
            </div>
            <h3 className="mt-3.5 text-sm sm:text-base font-bold text-zinc-950">
              03 · Track Live
            </h3>
            <p className="mt-2 text-xs leading-relaxed font-normal text-zinc-600">
              Watch real-time progress on the public map from dispatch to complete
              photographic verification and SLA resolution.
            </p>
          </div>
        </TiltCard3D>
      </div>
    </section>
  );
}
