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
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs bg-zinc-950 text-white ring-1 ring-black/10 group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-zinc-950">
              CivicPulse
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-zinc-700 bg-zinc-100 border-zinc-200">
              Global Triage
            </span>
          </div>
        </div>

        {/* Centre Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-medium text-zinc-600">
          <a
            href="#platform-features"
            className="hover:text-zinc-950 transition-colors"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            className="hover:text-zinc-950 transition-colors"
          >
            How It Works
          </a>
          <a
            href="#ai-simulator"
            className="hover:text-zinc-950 transition-colors"
          >
            AI Simulator
          </a>
          <a
            href="#faq"
            className="hover:text-zinc-950 transition-colors"
          >
            FAQ
          </a>
          <button
            type="button"
            onClick={onExploreMap}
            className="cursor-pointer flex items-center gap-1.5 hover:text-zinc-950 transition-colors"
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
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs bg-zinc-950 text-white border border-zinc-900">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate max-w-[120px]">{currentUser.name}</span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-zinc-100 text-zinc-800 border-zinc-200">
                  <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate max-w-[120px]">{currentUser.name}</span>
                </div>
              )}

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign Out"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 text-xs font-medium transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer px-2 py-1"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={onPortalAccess}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer hidden sm:inline-block"
          >
            Portal Access
          </button>

          <button
            type="button"
            onClick={onReportIssue}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
          >
            <span>Report Issue</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] text-emerald-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
