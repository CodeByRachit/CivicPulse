'use client';

import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface FolderUploadProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  label?: string;
}

export default function FolderUpload({
  onFileSelect,
  accept = 'image/*',
  label = 'Upload Photo Evidence',
}: FolderUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="folder-upload-container"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={label}
    >
      <div className="folder">
        <div className="front-side">
          <div className="tip"></div>
          <div className="cover"></div>
        </div>
        <div className="back-side cover"></div>
      </div>

      <div className="custom-file-upload">
        <UploadCloud className="w-3.5 h-3.5 text-neutral-800" />
        <span>{label}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
}

