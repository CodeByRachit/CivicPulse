"use client";

import React from "react";
import { Camera, Mic, GitFork, Route, Sparkles } from "lucide-react";
import { TiltCard3D } from "./TiltCard3D";

export function ProcessSteps() {
  return (
    <section
      id="how-it-works"
      className="w-full max-w-6xl mx-auto px-6 py-14 lg:py-20"
    >
      {/* Centered Display Header */}
      <div className="text-center max-w-3xl mx-auto">
        {/* Overline Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50/90 border border-emerald-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-emerald-800 mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AUTONOMOUS WORKFLOW</span>
        </div>

        {/* Scaled-up Display Heading with Signature Gradient Typography */}
        <h2 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight leading-[1.12]">
          <span className="text-zinc-950">Three steps to a </span>
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
            better neighborhood
          </span>
        </h2>

        {/* Upgraded Subtitle Typography */}
        <p className="mt-4 text-base sm:text-lg font-medium text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          From citizen submission to municipal resolution in three autonomous stages
        </p>
      </div>

      {/* Subtle Recessed Outer Architectural Stage Tray */}
      <div className="mt-12 relative rounded-[32px] bg-gradient-to-b from-zinc-50/80 via-white to-zinc-50/50 border border-zinc-200/70 p-4 sm:p-6 lg:p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,1)]">
        {/* Faint Center Radial Aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)]"
        />

        {/* Connected Desktop Pipeline Track */}
        <div
          className="hidden md:block absolute top-1/2 left-[12%] right-[12%] h-[2px] -translate-y-1/2 bg-gradient-to-r from-zinc-200 via-emerald-500/40 to-zinc-200 z-0 pointer-events-none"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 relative z-10">
          {/* ─────────────────────────────────────────────────────────────
              STEP 1: CAPTURE & SEND
             ───────────────────────────────────────────────────────────── */}
          <TiltCard3D maxTilt={6} glare={true} className="rounded-2xl h-full">
            <div className="group relative z-10 flex flex-col justify-between h-full bg-white rounded-2xl p-7 sm:p-8 border border-zinc-200/95 ring-1 ring-zinc-950/[0.03] shadow-[0_10px_30px_-10px_rgba(9,9,11,0.06)] hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.14)] transition-all duration-300 overflow-hidden">
              {/* Sleek top-edge highlight bar */}
              <div
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-[2.5px] rounded-b-full bg-gradient-to-r from-emerald-500/80 via-teal-500 to-emerald-400/80 opacity-85 group-hover:inset-x-0 group-hover:opacity-100 transition-all duration-300"
              />

              {/* Oversized Step Watermark */}
              <div
                aria-hidden="true"
                className="absolute top-5 right-6 text-5xl font-black tracking-tighter text-zinc-100/90 group-hover:text-emerald-500/15 transition-colors duration-300 select-none pointer-events-none"
              >
                01
              </div>

              <div>
                {/* Icon Containers with Emerald-Tinted Glass */}
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-700 shadow-xs flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-emerald-400 group-hover:border-zinc-950 transition-all duration-300">
                    <Camera className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-100/80 border border-zinc-200/60 flex items-center justify-center text-zinc-500 group-hover:text-zinc-800 transition-colors">
                    <Mic className="w-4 h-4 shrink-0" />
                  </div>
                </div>

                {/* Title with Emerald Number Prefix */}
                <h3 className="mt-6 mb-3 text-xl sm:text-[22px] font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
                  <span className="text-emerald-600 font-black font-mono">01</span>
                  <span className="text-zinc-300 font-normal">·</span>
                  <span>Capture &amp; Send</span>
                </h3>

                {/* High Readability Description with Emphasized Keywords */}
                <p className="text-[15px] sm:text-base leading-relaxed text-zinc-600 font-normal">
                  Take a photo or record a quick voice report directly on your phone.{" "}
                  <span className="font-semibold text-zinc-800">High-accuracy GPS</span>{" "}
                  coordinates attach automatically.
                </p>
              </div>

              {/* Structured Bottom Telemetry Footer */}
              <div className="mt-7 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-700">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>EXIF + GPS Auto-Lock</span>
                </span>
                <span className="rounded-md bg-zinc-100 border border-zinc-200/80 px-2.5 py-1 text-[11px] font-bold tracking-wider text-zinc-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors">
                  STAGE 1
                </span>
              </div>
            </div>
          </TiltCard3D>

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: AI TRIAGE
             ───────────────────────────────────────────────────────────── */}
          <TiltCard3D maxTilt={6} glare={true} className="rounded-2xl h-full">
            <div className="group relative z-10 flex flex-col justify-between h-full bg-white rounded-2xl p-7 sm:p-8 border border-zinc-200/95 ring-1 ring-zinc-950/[0.03] shadow-[0_10px_30px_-10px_rgba(9,9,11,0.06)] hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.14)] transition-all duration-300 overflow-hidden">
              {/* Sleek top-edge highlight bar */}
              <div
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-[2.5px] rounded-b-full bg-gradient-to-r from-emerald-500/80 via-teal-500 to-emerald-400/80 opacity-85 group-hover:inset-x-0 group-hover:opacity-100 transition-all duration-300"
              />

              {/* Oversized Step Watermark */}
              <div
                aria-hidden="true"
                className="absolute top-5 right-6 text-5xl font-black tracking-tighter text-zinc-100/90 group-hover:text-emerald-500/15 transition-colors duration-300 select-none pointer-events-none"
              >
                02
              </div>

              <div>
                {/* Icon Container with Emerald-Tinted Glass */}
                <div className="w-11 h-11 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-700 shadow-xs flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-emerald-400 group-hover:border-zinc-950 transition-all duration-300">
                  <GitFork className="w-5 h-5 shrink-0" />
                </div>

                {/* Title with Emerald Number Prefix */}
                <h3 className="mt-6 mb-3 text-xl sm:text-[22px] font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
                  <span className="text-emerald-600 font-black font-mono">02</span>
                  <span className="text-zinc-300 font-normal">·</span>
                  <span>AI Triage</span>
                </h3>

                {/* High Readability Description with Emphasized Keywords */}
                <p className="text-[15px] sm:text-base leading-relaxed text-zinc-600 font-normal">
                  Our{" "}
                  <span className="font-semibold text-zinc-800">multimodal AI</span>{" "}
                  immediately categorizes, evaluates severity, clusters duplicate
                  reports, and alerts the right city department.
                </p>
              </div>

              {/* Structured Bottom Telemetry Footer */}
              <div className="mt-7 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-700">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                  <span>Gemini Multimodal Triage</span>
                </span>
                <span className="rounded-md bg-zinc-100 border border-zinc-200/80 px-2.5 py-1 text-[11px] font-bold tracking-wider text-zinc-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors">
                  STAGE 2
                </span>
              </div>
            </div>
          </TiltCard3D>

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: TRACK LIVE
             ───────────────────────────────────────────────────────────── */}
          <TiltCard3D maxTilt={6} glare={true} className="rounded-2xl h-full">
            <div className="group relative z-10 flex flex-col justify-between h-full bg-white rounded-2xl p-7 sm:p-8 border border-zinc-200/95 ring-1 ring-zinc-950/[0.03] shadow-[0_10px_30px_-10px_rgba(9,9,11,0.06)] hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.14)] transition-all duration-300 overflow-hidden">
              {/* Sleek top-edge highlight bar */}
              <div
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-[2.5px] rounded-b-full bg-gradient-to-r from-emerald-500/80 via-teal-500 to-emerald-400/80 opacity-85 group-hover:inset-x-0 group-hover:opacity-100 transition-all duration-300"
              />

              {/* Oversized Step Watermark */}
              <div
                aria-hidden="true"
                className="absolute top-5 right-6 text-5xl font-black tracking-tighter text-zinc-100/90 group-hover:text-emerald-500/15 transition-colors duration-300 select-none pointer-events-none"
              >
                03
              </div>

              <div>
                {/* Icon Container with Emerald-Tinted Glass */}
                <div className="w-11 h-11 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-700 shadow-xs flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-emerald-400 group-hover:border-zinc-950 transition-all duration-300">
                  <Route className="w-5 h-5 shrink-0" />
                </div>

                {/* Title with Emerald Number Prefix */}
                <h3 className="mt-6 mb-3 text-xl sm:text-[22px] font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
                  <span className="text-emerald-600 font-black font-mono">03</span>
                  <span className="text-zinc-300 font-normal">·</span>
                  <span>Track Live</span>
                </h3>

                {/* High Readability Description with Emphasized Keywords */}
                <p className="text-[15px] sm:text-base leading-relaxed text-zinc-600 font-normal">
                  Watch real-time progress on the public map from dispatch to complete
                  photographic verification and{" "}
                  <span className="font-semibold text-zinc-800">SLA resolution</span>.
                </p>
              </div>

              {/* Structured Bottom Telemetry Footer */}
              <div className="mt-7 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-700">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                  <span>Live SLA &amp; WebSocket Sync</span>
                </span>
                <span className="rounded-md bg-zinc-100 border border-zinc-200/80 px-2.5 py-1 text-[11px] font-bold tracking-wider text-zinc-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors">
                  STAGE 3
                </span>
              </div>
            </div>
          </TiltCard3D>
        </div>
      </div>
    </section>
  );
}
