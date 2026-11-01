'use client';

import React from 'react';
import { Mic, Square } from 'lucide-react';

interface MicRecordUploadProps {
  isRecording: boolean;
  recordingSeconds: number;
  onToggleRecord: () => void;
  disabled?: boolean;
}

export default function MicRecordUpload({
  isRecording,
  recordingSeconds,
  onToggleRecord,
  disabled = false,
}: MicRecordUploadProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onToggleRecord();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onToggleRecord();
    }
  };

  return (
    <div
      className={`mic-record-container ${isRecording ? 'is-recording' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
    >
      <div className="mic-3d-stage">
        {/* Subtle acoustic soundwave rings when recording */}
        <div className="mic-pulse-ring ring-1"></div>
        <div className="mic-pulse-ring ring-2"></div>

        {/* 3D Floating Mic Device */}
        <div className="mic-floating-device">
          <div className="mic-outer-disc">
            <div className="mic-inner-rim">
              <div className="mic-core">
                {isRecording ? (
                  <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-[#faf7ee]" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Pill Button */}
      <div className={`custom-mic-button ${isRecording ? 'recording-active' : ''}`}>
        {isRecording ? (
          <>
            <Square className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse shrink-0" />
            <span className="text-red-700 font-semibold truncate">
              Stop Recording ({recordingSeconds}s)
            </span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
            <span className="truncate">Record Voice Note</span>
          </>
        )}
      </div>
    </div>
  );
}

