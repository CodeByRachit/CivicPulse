"use client";

import React from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, Shield, User, LogOut } from "lucide-react";

interface NavbarProps {
  onReportIssue: () => void;
  onExploreMap: () => void;
  onPortalAccess: () => void;
  currentUser?: {
    email: string;
    name: string;
    role: "CITIZEN" | "ADMIN";
  } | null;
  onSignOut?: () => void;
}

export function Navbar({
  onReportIssue,
  onExploreMap,
  onPortalAccess,
  currentUser,
  onSignOut,
}: NavbarProps) {
  return (
    <header className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      {/* Brand Logo with Linen UI Theme */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <div className="w-8 h-8 rounded-xl bg-neutral-950 flex items-center justify-center text-white shadow-sm ring-1 ring-black/10 group-hover:scale-105 transition-transform">
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-neutral-950">
            CivicPulse
          </span>
          <span className="text-[10px] font-medium text-neutral-600 bg-[#EAE6DC] px-2 py-0.5 rounded-full border border-[#DFDACD]">
            Global Triage
          </span>
        </div>
      </div>

      {/* Centre Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-medium text-neutral-600">
        <a
          href="#platform-features"
          className="hover:text-neutral-950 transition-colors"
        >
          Capabilities
        </a>
        <a
          href="#how-it-works"
          className="hover:text-neutral-950 transition-colors"
        >
          How It Works
        </a>
        <a
          href="#ai-simulator"
          className="hover:text-neutral-950 transition-colors"
        >
          AI Simulator
        </a>
        <a
          href="#faq"
          className="hover:text-neutral-950 transition-colors"
        >
          FAQ
        </a>
        <button
          type="button"
          onClick={onExploreMap}
          className="hover:text-neutral-950 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>Live Workspace</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </nav>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-2">
            {currentUser.role === "ADMIN" ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold shadow-sm border border-neutral-800">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[120px]">{currentUser.name}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold border border-[#E4E1D6]">
                <User className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                <span className="truncate max-w-[120px]">{currentUser.name}</span>
              </div>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                title="Sign Out"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E4E1D6] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 text-xs font-medium text-neutral-700 shadow-xs transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer px-2 py-1"
          >
            Sign In
          </Link>
        )}

        <button
          type="button"
          onClick={onPortalAccess}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer hidden sm:inline-block"
        >
          Portal Access
        </button>

        <button
          type="button"
          onClick={onReportIssue}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 hover:bg-neutral-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95"
        >
          <span>Report Issue</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
}
