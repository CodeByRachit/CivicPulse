'use client';

import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';

interface RadialDeleteButtonProps {
  onDelete: () => void;
  tooltipDelete?: string;
  tooltipCancel?: string;
}

export default function RadialDeleteButton({
  onDelete,
  tooltipDelete = 'Delete',
  tooltipCancel = 'Cancel',
}: RadialDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="radial-delete-menu" onClick={(e) => e.stopPropagation()}>
      <div className="btn">
        <input
          type="checkbox"
          className="menu-input"
          checked={isOpen}
          onChange={(e) => setIsOpen(e.target.checked)}
          title="Delete options"
        />
        {isOpen ? (
          <X className="btn-svg w-3.5 h-3.5 text-white" />
        ) : (
          <Trash2 className="btn-svg w-3.5 h-3.5 text-white" />
        )}
      </div>

      <div className="options">
        <div
          className="option"
          style={{ '--i': 1 } as React.CSSProperties}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            onDelete();
          }}
        >
          <div className="option-inner" data-tooltip={tooltipDelete}>
            <Trash2 className="svg w-3.5 h-3.5 text-red-600" />
          </div>
        </div>

        <div
          className="option"
          style={{ '--i': 2 } as React.CSSProperties}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div className="option-inner" data-tooltip={tooltipCancel}>
            <X className="svg w-3.5 h-3.5 text-neutral-600" />
          </div>
        </div>
      </div>

      <div className="menu-ring" />
      <div className="selector-light" />
    </div>
  );
}

