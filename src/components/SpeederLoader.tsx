'use client';

import React from 'react';

interface SpeederLoaderProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export default function SpeederLoader({
  title = 'Synchronizing CivicPulse Network...',
  subtitle = 'Routing live telemetry, satellite imagery, and municipal records',
  compact = false,
}: SpeederLoaderProps) {
  return (
    <div className={`speeder-wrap flex flex-col items-center justify-center select-none ${compact ? 'scale-75' : ''}`}>
      <div className="speeder-stage relative w-[260px] h-[110px] overflow-hidden">
        <div className="loader">
          <span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
          <div className="base">
            <span></span>
            <div className="face"></div>
          </div>
        </div>
        <div className="longfazers">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {title && (
        <div className="mt-4 text-center space-y-1 z-10">
          <div className="font-semibold text-sm tracking-tight text-neutral-900 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{title}</span>
          </div>
          {subtitle && (
            <p className="text-xs text-neutral-500 max-w-sm mx-auto font-normal">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

