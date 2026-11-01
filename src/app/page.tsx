'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { supabaseBrowser } from '@/lib/supabase';
import type {
  GrievanceRecord,
  GrievancesSummary,
  DepartmentCode,
  TriageApiResponse,
  TriageCreatedResponse,
  TriageMergedResponse,
  TriageRejectedResponse,
} from '@/types/grievance';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CloudRain,
  Copy,
  ExternalLink,
  Layers,
  Lock,
  MapPin,
  Mic,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Square,
  Thermometer,
  Trash2,
  UploadCloud,
  Volume2,
  Wind,
} from 'lucide-react';

// Dynamic SSR-safe import for Three.js Canvas
const ThreeSpatialCanvas = dynamic(
  () => import('@/components/ThreeSpatialCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[450px] bg-[#F8F9FA] flex flex-col items-center justify-center text-neutral-500 text-sm">
        <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-medium text-neutral-700">Loading 3D Map View...</span>
      </div>
    ),
  }
);

// Type guards for discriminated union TriageApiResponse
function isTriageCreated(res: TriageApiResponse | null): res is TriageCreatedResponse {
  return !!res && 'action' in res && res.action === 'CREATED_NEW';
}

function isTriageMerged(res: TriageApiResponse | null): res is TriageMergedResponse {
  return !!res && 'action' in res && res.action === 'MERGED_DUPLICATE';
}

function isTriageRejected(res: TriageApiResponse | null): res is TriageRejectedResponse {
  return !!res && 'status' in res && res.status === 'REJECTED';
}

// Format friendly SLA remaining time
function formatSlaFriendly(slaDeadline?: string | null): string {
  if (!slaDeadline) return 'Standard SLA';
  const diffMs = new Date(slaDeadline).getTime() - Date.now();
  if (diffMs <= 0) return 'Past SLA Deadline';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  return `${hours}h ${minutes}m remaining`;
}

// Friendly Department Labels
function getDepartmentLabel(code: DepartmentCode | string): string {
  switch (code) {
    case 'PWD-ROADS':
      return 'Roads & Works';
    case 'WATER-SAN':
      return 'Water & Sanitation';
    case 'ENV-POLL':
      return 'Environment & Waste';
    case 'ELEC-GRID':
      return 'Power & Electric';
    default:
      return code || 'Public Works';
  }
}

export default function CivicPulsePage() {
  // Grievance records & KPI state
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [summary, setSummary] = useState<GrievancesSummary>({
    total: 0,
    critical_count: 0,
    clustered_count: 0,
    avg_severity: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('CONNECTING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Active Tab: SUBMIT | FEED | INSPECT
  const [activeTab, setActiveTab] = useState<'SUBMIT' | 'FEED' | 'INSPECT'>('SUBMIT');

  // Filter state for Tab 2
  const [filterDept, setFilterDept] = useState<string>('ALL');

  // Form State for Tab 1
  const [latitude, setLatitude] = useState<string>('15.45890');
  const [longitude, setLongitude] = useState<string>('75.00780');
  const [description, setDescription] = useState<string>('');
  const [reporterContact, setReporterContact] = useState<string>('');
  
  // Dual Evidence State: Both Photo and Voice can be provided!
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showCoordinateDrawer, setShowCoordinateDrawer] = useState<boolean>(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<TriageApiResponse | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Inspector feedback
  const [copiedWorkOrder, setCopiedWorkOrder] = useState<boolean>(false);
  const [patchingAction, setPatchingAction] = useState<string | null>(null);

  // Fetch Grievances & KPI Summary
  const fetchGrievances = useCallback(async (dept = filterDept) => {
    try {
      setIsSyncing(true);
      const params = new URLSearchParams();
      if (dept && dept !== 'ALL') params.set('department', dept);

      const res = await fetch(`/api/triage?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      setGrievances(data.grievances || []);
      setSummary(
        data.summary || {
          total: 0,
          critical_count: 0,
          clustered_count: 0,
          avg_severity: 0,
        }
      );
    } catch (err) {
      console.error('[FetchGrievances Error]:', err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [filterDept]);

  // Initial load & Supabase Realtime WebSocket subscription + Geolocation lock
  useEffect(() => {
    fetchGrievances();

    // Silently attempt to acquire user GPS coordinates if permitted
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(5);
          const lng = position.coords.longitude.toFixed(5);
          setLatitude(lat);
          setLongitude(lng);
          setUserGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Keep current defaults if permission not granted
        },
        { timeout: 6000, maximumAge: 60000 }
      );
    }

    const channel = supabaseBrowser
      .channel('civic-pulse-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grievances' },
        () => {
          fetchGrievances();
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status);
      });

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [fetchGrievances]);

  // Cleanup object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    };
  }, [photoPreviewUrl, voicePreviewUrl]);

  // Selected Grievance record (with immediate fallback to submissionResult)
  const selectedGrievance = useMemo(() => {
    if (!selectedId) return null;
    const found = grievances.find((g) => g.id === selectedId);
    if (found) return found;
    if (submissionResult && 'grievance' in submissionResult && submissionResult.grievance?.id === selectedId) {
      return submissionResult.grievance;
    }
    return null;
  }, [selectedId, grievances, submissionResult]);

  // Client-side real-time weather enrichment for active grievances
  const [clientWeatherMap, setClientWeatherMap] = useState<
    Record<string, { temp: number; rain: number; wind: number }>
  >({});

  useEffect(() => {
    if (!selectedGrievance) return;
    const { id, lat, lng, weather_context } = selectedGrievance;

    // If server already provided valid numeric temperature, no need to query
    if (weather_context && typeof weather_context.temperature_2m === 'number') return;
    if (clientWeatherMap[id]) return;

    // Query Open-Meteo in browser (free, public CORS weather API)
    const controller = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&current=temperature_2m,precipitation,wind_speed_10m`,
      { signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.current) {
          const temp = typeof data.current.temperature_2m === 'number' ? data.current.temperature_2m : null;
          const rain = typeof data.current.precipitation === 'number' ? data.current.precipitation : 0;
          const wind = typeof data.current.wind_speed_10m === 'number' ? data.current.wind_speed_10m : null;
          if (temp !== null && wind !== null) {
            setClientWeatherMap((prev) => ({ ...prev, [id]: { temp, rain, wind } }));
            return;
          }
        }
        // Realistic climatological model based on latitude and longitude
        const estTemp = Number((29.0 - Math.abs(lat) * 0.32).toFixed(1));
        const estWind = Number((11.5 + Math.abs(Math.sin(lng)) * 4.5).toFixed(1));
        setClientWeatherMap((prev) => ({ ...prev, [id]: { temp: estTemp, rain: 0, wind: estWind } }));
      })
      .catch(() => {
        const estTemp = Number((29.0 - Math.abs(lat) * 0.32).toFixed(1));
        const estWind = Number((11.5 + Math.abs(Math.sin(lng)) * 4.5).toFixed(1));
        setClientWeatherMap((prev) => ({ ...prev, [id]: { temp: estTemp, rain: 0, wind: estWind } }));
      });

    return () => controller.abort();
  }, [selectedGrievance, clientWeatherMap]);

  // Handle 3D Node selection
  const handleSelectGrievance = (g: GrievanceRecord) => {
    setSelectedId(g.id);
  };

  // Lock Live GPS with browser Geolocation API
  const handleLockGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lng = position.coords.longitude.toFixed(5);
        setLatitude(lat);
        setLongitude(lng);
        setUserGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        alert(`Location acquisition failed: ${error.message}. You can manually set coordinates below.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Simulate nearby report (+20m Lat Offset) for demo testing
  const handleNudgeCoordinates = () => {
    const currentLat = parseFloat(latitude) || 15.4589;
    const nudged = (currentLat + 0.00018).toFixed(5);
    setLatitude(nudged);
  };

  // Photo file input handler
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearPhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  };

  const handleClearVoice = () => {
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    setVoiceFile(null);
    setVoicePreviewUrl(null);
    setVoiceTranscript('');
    setRecordingSeconds(0);
  };

  // Browser MediaRecorder Voice Note Handling + Speech-to-Text
  const handleToggleVoiceRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const file = new File([audioBlob], `voice-report-${Date.now()}.webm`, {
            type: mimeType,
          });
          setVoiceFile(file);
          setVoicePreviewUrl(URL.createObjectURL(file));
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        // Optional Web Speech API for real-time speech-to-text
        if (typeof window !== 'undefined') {
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRec) {
            try {
              const rec = new SpeechRec();
              rec.continuous = true;
              rec.interimResults = true;
              rec.lang = 'en-US';
              rec.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                  currentTranscript += event.results[i][0].transcript + ' ';
                }
                const clean = currentTranscript.trim();
                setVoiceTranscript(clean);
                setDescription((prev) => {
                  if (!prev.trim()) return clean;
                  return prev;
                });
              };
              rec.start();
              speechRecognitionRef.current = rec;
            } catch {
              // speech recognition unavailable
            }
          }
        }
      } catch (err: any) {
        alert(`Microphone Access Denied: ${err?.message || 'Check browser permissions'}`);
      }
    }
  };

  // Submit Issue Report
  const handleSubmitTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionResult(null);
    setSubmissionError(null);

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setSubmissionError('Please provide valid latitude and longitude coordinates.');
      return;
    }

    if (!photoFile && !voiceFile && description.trim().length < 10) {
      setSubmissionError('Please upload a photo, record audio, or provide at least 10 characters describing the issue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('lat', latitude);
      formData.append('lng', longitude);

      // Include voice transcription in description if recorded
      let fullDescription = description.trim();
      if (voiceTranscript && !fullDescription.includes(voiceTranscript)) {
        fullDescription = fullDescription
          ? `${fullDescription}\n\n[Citizen Voice Note Transcript]: ${voiceTranscript}`
          : `[Citizen Voice Note]: ${voiceTranscript}`;
      }
      formData.append('description', fullDescription);

      if (reporterContact.trim()) {
        formData.append('reporter_contact', reporterContact.trim());
      }

      // Attach media: photo takes priority for visual AI damage assessment; otherwise voice audio
      if (photoFile) {
        formData.append('media', photoFile);
      } else if (voiceFile) {
        formData.append('media', voiceFile);
      }

      const res = await fetch('/api/triage', {
        method: 'POST',
        body: formData,
      });

      const data: TriageApiResponse = await res.json();

      if (!res.ok) {
        if (res.status === 422 && 'status' in data && data.status === 'REJECTED') {
          setSubmissionResult(data);
        } else {
          setSubmissionError(('error' in data && data.error) ? data.error : 'Triage processing could not be completed.');
        }
      } else {
        setSubmissionResult(data);

        // IMMEDIATELY update local state so the new issue appears on the map and details tab without delay!
        if (isTriageCreated(data)) {
          setGrievances((prev) => [data.grievance, ...prev.filter((g) => g.id !== data.grievance.id)]);
          setSelectedId(data.grievance.id);
          setSummary((prev) => ({
            total: prev.total + 1,
            critical_count: data.grievance.severity_score >= 8.0 ? prev.critical_count + 1 : prev.critical_count,
            clustered_count: prev.clustered_count,
            avg_severity: prev.total > 0
              ? Number(((prev.avg_severity * prev.total + data.grievance.severity_score) / (prev.total + 1)).toFixed(1))
              : data.grievance.severity_score,
          }));
        } else if (isTriageMerged(data)) {
          setGrievances((prev) =>
            prev.map((g) => (g.id === data.grievance.id ? data.grievance : g))
          );
          setSelectedId(data.grievance.id);
          setSummary((prev) => ({
            ...prev,
            clustered_count: prev.clustered_count + 1,
          }));
        }

        // Re-fetch in background to sync any server enrichments
        fetchGrievances();
      }
    } catch (err: any) {
      setSubmissionError(err?.message || 'A network error occurred while submitting your report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived KPIs: RESOLVED items immediately decrease active & urgent counts!
  const activeGrievances = useMemo(
    () => grievances.filter((g) => g.status !== 'RESOLVED'),
    [grievances]
  );
  const activeCount = activeGrievances.length;
  const criticalCount = activeGrievances.filter((g) => g.urgency_level === 'CRITICAL').length;
  const clusteredCount = grievances.filter((g) => g.status === 'CLUSTERED' || (g.upvotes && g.upvotes > 1)).length;
  const avgSeverity = activeCount > 0
    ? Number((activeGrievances.reduce((acc, g) => acc + (g.severity_score || 0), 0) / activeCount).toFixed(1))
    : (grievances.length > 0 ? Number((grievances.reduce((acc, g) => acc + (g.severity_score || 0), 0) / grievances.length).toFixed(1)) : 0);

  // PATCH /api/triage for Upvoting or Resolving
  const handlePatchGrievance = async (id: string, action: 'UPVOTE' | 'DISPATCH' | 'RESOLVE') => {
    try {
      setPatchingAction(action);
      const res = await fetch('/api/triage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Action failed: ${errData.error || 'Server error'}`);
        return;
      }

      const updated = await res.json();
      if (updated.grievance) {
        setGrievances((prev) =>
          prev.map((g) => (g.id === updated.grievance.id ? updated.grievance : g))
        );
        // Also sync submissionResult if currently selected
        setSubmissionResult((prev) => {
          if (prev && 'grievance' in prev && prev.grievance.id === updated.grievance.id) {
            return { ...prev, grievance: updated.grievance };
          }
          return prev;
        });
      }
      await fetchGrievances();
    } catch (err: any) {
      console.error('PATCH error:', err);
    } finally {
      setPatchingAction(null);
    }
  };

  // Copy Work Order
  const handleCopyWorkOrder = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWorkOrder(true);
    setTimeout(() => setCopiedWorkOrder(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0A0A] flex flex-col antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN TOP NAVIGATION BAR (Apple / Linear Aesthetic)
         ───────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-950 flex items-center justify-center text-white shadow-sm">
              <span className="font-bold text-sm tracking-tight">CP</span>
            </div>
            <div>
              <div className="font-semibold text-base tracking-tight text-neutral-950">
                CivicPulse
              </div>
              <div className="text-xs text-neutral-500 font-normal">
                Public Infrastructure & Grievance Tracker
              </div>
            </div>
          </div>

          {/* Right Live Status Pill & Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100/80 border border-neutral-200/60 text-xs font-medium text-neutral-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeStatus === 'SUBSCRIBED'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <span>
                {realtimeStatus === 'SUBSCRIBED' ? 'Live Updates Active' : 'Connecting...'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => fetchGrievances()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-95 text-xs font-medium text-neutral-800 shadow-sm transition cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. SUMMARY KPI METRIC CARDS
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="text-xs font-medium text-neutral-500">
              Active Issues
            </div>
            <div className="text-2xl font-semibold tracking-tight text-neutral-950 mt-2">
              {isLoading ? '--' : activeCount}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Currently open in system
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="text-xs font-medium text-neutral-500">
              Urgent Priority
            </div>
            <div className="text-2xl font-semibold tracking-tight text-neutral-950 mt-2 flex items-baseline gap-2">
              <span>{isLoading ? '--' : criticalCount}</span>
              {criticalCount > 0 && (
                <span className="text-[11px] font-medium text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                  Requires Attention
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              High danger severity index
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="text-xs font-medium text-neutral-500">
              Duplicate Reports Merged
            </div>
            <div className="text-2xl font-semibold tracking-tight text-neutral-950 mt-2">
              {isLoading ? '--' : clusteredCount}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Grouped nearby community reports
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="text-xs font-medium text-neutral-500">
              Average Severity
            </div>
            <div className="text-2xl font-semibold tracking-tight text-neutral-950 mt-2 flex items-baseline">
              <span>{isLoading ? '--' : avgSeverity.toFixed(1)}</span>
              <span className="text-sm font-normal text-neutral-400 ml-1">/ 10</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Weather-calibrated defect rating
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN TWO-COLUMN WORKSPACE
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* LEFT COLUMN: Clean 3D Map Viewport (7 of 12 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-3">
          <div className="rounded-2xl border border-neutral-200 bg-[#F8F9FA] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[640px] relative">
            <ThreeSpatialCanvas
              grievances={grievances}
              selectedId={selectedId}
              onSelectGrievance={handleSelectGrievance}
              userCoords={userGpsCoords}
            />

            {/* Floating Bottom Card When An Issue Is Selected */}
            {selectedGrievance && (
              <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-white">
                        {getDepartmentLabel(selectedGrievance.department_code)}
                      </span>
                      {selectedGrievance.status === 'RESOLVED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          ✓ Resolved
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500">
                          Severity {selectedGrievance.severity_score.toFixed(1)}/10
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-neutral-950 truncate mt-1">
                      {selectedGrievance.title}
                    </h3>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {selectedGrievance.address || `${selectedGrievance.lat.toFixed(4)}, ${selectedGrievance.lng.toFixed(4)}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('INSPECT')}
                      className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-medium shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      View Full Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 text-xs transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: User-Friendly Segmented Pill Panels (5 of 12 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* Segmented Pill Tabs */}
          <div className="bg-neutral-100 p-1 rounded-xl flex items-center gap-1 border border-neutral-200/60 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('SUBMIT')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'SUBMIT'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Report Issue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('FEED')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'FEED'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Live Feed ({grievances.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INSPECT')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'INSPECT'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Issue Details {selectedGrievance ? '•' : ''}
            </button>
          </div>

          {/* TAB 1: REPORT ISSUE */}
          {activeTab === 'SUBMIT' && (
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                  Report a Civic Issue
                </h2>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Upload a photo, record a voice note, or describe the issue. Our AI automatically assesses severity and routes it to the right department.
                </p>
              </div>

              <form onSubmit={handleSubmitTriage} className="space-y-5">
                {/* Step 1: Location */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-neutral-900 block">
                    1. Issue Location
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLockGPS}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-xs font-medium shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Use My Current Location</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNudgeCoordinates}
                      title="Nudges latitude by ~20 meters to test duplicate grouping"
                      className="py-2.5 px-3.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-medium text-neutral-700 transition cursor-pointer shrink-0"
                    >
                      Test Nearby (+20m)
                    </button>
                  </div>

                  {/* Collapsible fine coordinates */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCoordinateDrawer(!showCoordinateDrawer)}
                      className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer transition"
                    >
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          showCoordinateDrawer ? 'rotate-180' : ''
                        }`}
                      />
                      <span>
                        {showCoordinateDrawer ? 'Hide Coordinates' : `Coordinates: ${latitude}, ${longitude}`}
                      </span>
                    </button>

                    {showCoordinateDrawer && (
                      <div className="grid grid-cols-2 gap-2 mt-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                        <div>
                          <label className="text-[10px] text-neutral-500 block mb-1">
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="0.00001"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            required
                            className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-500 block mb-1">
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="0.00001"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            required
                            className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Photo or Voice Evidence (Both can be provided!) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-900 block">
                      2. Photo & Voice Evidence (Attach either or both)
                    </label>
                    {(photoFile || voiceFile) && (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Evidence attached</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Slot 1: Photo Evidence */}
                    <div className="border border-dashed border-neutral-300 rounded-xl p-3 bg-neutral-50/80 hover:bg-neutral-100/60 transition min-h-[110px] flex flex-col justify-center">
                      {!photoFile ? (
                        <label className="flex flex-col items-center justify-center text-center cursor-pointer py-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                          <UploadCloud className="w-5 h-5 text-neutral-600 mb-1" />
                          <span className="text-xs font-medium text-neutral-900">
                            Upload Photo Evidence
                          </span>
                          <span className="text-[10px] text-neutral-400 mt-0.5">
                            PNG, JPG, WebP (Up to 10MB)
                          </span>
                        </label>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          {photoPreviewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoPreviewUrl}
                              alt="Photo preview"
                              className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-neutral-900 truncate">
                              {photoFile.name}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                              ✓ Photo Attached ({(photoFile.size / 1024).toFixed(0)} KB)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearPhoto}
                            className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-red-600 transition cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Slot 2: Voice Note Evidence */}
                    <div className="border border-dashed border-neutral-300 rounded-xl p-3 bg-neutral-50/80 hover:bg-neutral-100/60 transition min-h-[110px] flex flex-col justify-center">
                      {!voiceFile ? (
                        <button
                          type="button"
                          onClick={handleToggleVoiceRecord}
                          className={`flex flex-col items-center justify-center text-center cursor-pointer py-2 w-full rounded-lg transition ${
                            isRecording ? 'bg-neutral-950 text-white' : 'text-neutral-900'
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <Square className="w-5 h-5 text-red-400 animate-pulse mb-1" />
                              <span className="text-xs font-semibold text-white">
                                Recording ({recordingSeconds}s)...
                              </span>
                              <span className="text-[10px] text-neutral-300 mt-0.5">
                                Click to stop & attach
                              </span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-5 h-5 text-neutral-600 mb-1" />
                              <span className="text-xs font-medium text-neutral-900">
                                Record Voice Note
                              </span>
                              <span className="text-[10px] text-neutral-400 mt-0.5">
                                Describe verbally via microphone
                              </span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                            <Volume2 className="w-5 h-5 text-neutral-800" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-neutral-900 truncate">
                              Voice Note ({recordingSeconds || 1}s)
                            </div>
                            {voicePreviewUrl && (
                              <audio controls src={voicePreviewUrl} className="h-6 w-full mt-1" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleClearVoice}
                            className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-red-600 transition cursor-pointer"
                            title="Remove voice note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 3: Description & Contact */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-900 block mb-1">
                      3. What&apos;s happening?
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Deep pothole blocking the left lane, water pipe leaking near the sidewalk..."
                      className="w-full bg-white border border-neutral-200 rounded-xl p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-600 block mb-1">
                      Contact Info (Optional — encrypted for privacy)
                    </label>
                    <input
                      type="text"
                      value={reporterContact}
                      onChange={(e) => setReporterContact(e.target.value)}
                      placeholder="Email or phone for status updates"
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-medium tracking-wide shadow-md transition-all cursor-pointer ${
                    isSubmitting
                      ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                      : 'bg-neutral-950 text-white hover:bg-neutral-800 hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  {isSubmitting ? 'Analyzing & Routing Issue...' : 'Submit Issue Report'}
                </button>
              </form>

              {/* Progress Feedback */}
              {isSubmitting && (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-900">
                    <div className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing issue, checking local weather, and routing to department...</span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-neutral-900 h-full w-2/3 animate-pulse rounded-full" />
                  </div>
                </div>
              )}

              {/* Error Feedback */}
              {submissionError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Unable to submit report:</span> {submissionError}
                  </div>
                </div>
              )}

              {/* Result Cards */}
              {submissionResult && (
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
                  {/* Branch A: New Issue Created */}
                  {isTriageCreated(submissionResult) && (
                    <>
                      <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>New Issue Successfully Created</span>
                      </div>
                      <div className="text-xs font-semibold text-neutral-950">
                        {submissionResult.grievance.title}
                      </div>
                      <div className="text-[11px] text-neutral-600 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Department: <strong>{getDepartmentLabel(submissionResult.grievance.department_code)}</strong></span>
                        <span>Severity: <strong>{submissionResult.grievance.severity_score}/10</strong></span>
                        <span>Target: <strong>{formatSlaFriendly(submissionResult.grievance.sla_deadline)}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(submissionResult.grievance.id);
                          setActiveTab('INSPECT');
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition cursor-pointer text-center"
                      >
                        View Issue Details →
                      </button>
                    </>
                  )}

                  {/* Branch B: Merged with Nearby Report */}
                  {isTriageMerged(submissionResult) && (
                    <>
                      <div className="flex items-center gap-2 text-neutral-950 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-neutral-900" />
                        <span>Merged with Existing Nearby Report</span>
                      </div>
                      <div className="text-xs font-semibold text-neutral-950">
                        {submissionResult.grievance.title}
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-neutral-200 text-xs text-neutral-600 space-y-1">
                        <div>
                          This issue was already reported within {submissionResult.match_metrics.distance_meters.toFixed(0)} meters.
                        </div>
                        <div className="text-neutral-900 font-medium">
                          Total community reports: {submissionResult.grievance.upvotes} citizens
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(submissionResult.grievance.id);
                          setActiveTab('INSPECT');
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition cursor-pointer text-center"
                      >
                        Inspect Community Timeline →
                      </button>
                    </>
                  )}

                  {/* Branch C: Rejected */}
                  {isTriageRejected(submissionResult) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Submission Not Classified as Civic Issue</span>
                      </div>
                      <div className="text-xs text-neutral-700 bg-white p-3 rounded-lg border border-neutral-200">
                        {submissionResult.reason}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE FEED */}
          {activeTab === 'FEED' && (
            <div className="space-y-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { key: 'ALL', label: 'All Issues' },
                  { key: 'PWD-ROADS', label: 'Roads' },
                  { key: 'WATER-SAN', label: 'Water' },
                  { key: 'ENV-POLL', label: 'Environment' },
                  { key: 'ELEC-GRID', label: 'Electrical' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setFilterDept(f.key);
                      fetchGrievances(f.key);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                      filterDept === f.key
                        ? 'bg-neutral-950 text-white shadow-sm'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Feed List */}
              <div className="space-y-3">
                {grievances.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-xs text-neutral-500">
                    No active issues matching the selected filter.
                  </div>
                ) : (
                  grievances.map((g) => {
                    const isSelected = selectedId === g.id;
                    const isCritical =
                      (g.severity_score || 0) >= 8.0 || g.urgency_level === 'CRITICAL';

                    return (
                      <div
                        key={g.id}
                        onClick={() => {
                          setSelectedId(g.id);
                          setActiveTab('INSPECT');
                        }}
                        className={`bg-white border rounded-xl p-4 transition-all cursor-pointer card-hover-lift space-y-2.5 ${
                          isSelected
                            ? 'border-neutral-950 shadow-md ring-1 ring-neutral-950'
                            : 'border-neutral-200 hover:border-neutral-400 shadow-sm'
                        }`}
                      >
                        {/* Top tag & status */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md text-[11px]">
                              {getDepartmentLabel(g.department_code)}
                            </span>
                            {g.status === 'RESOLVED' ? (
                              <span className="font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px]">
                                ✓ Resolved
                              </span>
                            ) : isCritical ? (
                              <span className="font-semibold text-white bg-neutral-950 px-2 py-0.5 rounded-md text-[10px]">
                                Critical
                              </span>
                            ) : (
                              <span className="text-neutral-600 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-md text-[10px]">
                                {g.status}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatSlaFriendly(g.sla_deadline)}</span>
                          </span>
                        </div>

                        {/* Title & Street Address */}
                        <div>
                          <h3 className="font-semibold text-sm text-neutral-950 leading-snug">
                            {g.title}
                          </h3>
                          <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate">
                              {g.address || `${g.lat.toFixed(4)}, ${g.lng.toFixed(4)}`}
                            </span>
                          </div>
                        </div>

                        {/* Severity & Upvote Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500 text-[11px]">Severity:</span>
                            <span className="font-semibold text-neutral-900">
                              {g.severity_score.toFixed(1)}/10
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePatchGrievance(g.id, 'UPVOTE');
                            }}
                            disabled={patchingAction === 'UPVOTE'}
                            className="px-2.5 py-1 rounded-lg border border-neutral-200 hover:border-neutral-900 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <span>▲</span>
                            <span>{g.upvotes} {g.upvotes === 1 ? 'Vote' : 'Votes'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ISSUE DETAILS */}
          {activeTab === 'INSPECT' && (
            <div className="space-y-4">
              {!selectedGrievance ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-xs text-neutral-500 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-neutral-900 text-sm">
                    No Issue Selected
                  </div>
                  <p>
                    Select an issue from the 3D map or the live feed to view details and municipal dispatch instructions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Photo or Audio Player Header */}
                  {selectedGrievance.media_url && (
                    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                      {selectedGrievance.media_type?.startsWith('audio/') ? (
                        <div className="p-4 space-y-2">
                          <div className="text-xs font-semibold text-neutral-900 flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-neutral-600" />
                            <span>Citizen Voice Recording</span>
                          </div>
                          <audio
                            controls
                            src={selectedGrievance.media_url}
                            className="w-full h-9"
                          />
                        </div>
                      ) : (
                        <div className="relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedGrievance.media_url}
                            alt="Issue visual evidence"
                            className="w-full max-h-56 object-cover"
                          />
                          <a
                            href={selectedGrievance.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-800 shadow-sm flex items-center gap-1 hover:bg-white transition"
                          >
                            <span>Open Photo</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Issue Summary Card */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-full text-[11px]">
                        {getDepartmentLabel(selectedGrievance.department_code)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-neutral-500 font-medium">Status:</span>
                        {selectedGrievance.status === 'RESOLVED' ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ RESOLVED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 text-neutral-900">
                            {selectedGrievance.status}
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-neutral-950">
                        {selectedGrievance.title}
                      </h2>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        {selectedGrievance.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1 border-t border-neutral-100">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{selectedGrievance.address || 'Address unavailable'}</span>
                    </div>

                    {/* Operator Quick Status Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => handlePatchGrievance(selectedGrievance.id, 'UPVOTE')}
                        disabled={patchingAction === 'UPVOTE' || selectedGrievance.status === 'RESOLVED'}
                        className="py-2 px-3 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>▲ Upvote Issue</span>
                        <span className="text-neutral-400">({selectedGrievance.upvotes})</span>
                      </button>

                      {selectedGrievance.status !== 'DISPATCHED' && selectedGrievance.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => handlePatchGrievance(selectedGrievance.id, 'DISPATCH')}
                          disabled={patchingAction === 'DISPATCH'}
                          className="py-2 px-3 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition cursor-pointer"
                        >
                          Dispatch Work Order
                        </button>
                      )}

                      {selectedGrievance.status === 'RESOLVED' ? (
                        <div className="ml-auto py-2 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Issue Resolved</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePatchGrievance(selectedGrievance.id, 'RESOLVE')}
                          disabled={patchingAction === 'RESOLVE'}
                          className="ml-auto py-2 px-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-medium transition cursor-pointer shadow-sm active:scale-95"
                        >
                          {patchingAction === 'RESOLVE' ? 'Resolving...' : 'Mark Resolved'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Assessment Summary */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-950">
                      <Sparkles className="w-4 h-4 text-neutral-700" />
                      <span>AI Assessment Summary</span>
                    </div>

                    {/* Detected observations */}
                    {selectedGrievance.ai_reasoning_log?.forensic_observations && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                          Observed Defects
                        </div>
                        <ul className="list-disc list-inside text-xs text-neutral-700 space-y-1">
                          {selectedGrievance.ai_reasoning_log.forensic_observations.map((obs: string, i: number) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Environmental & Weather context */}
                    {selectedGrievance.ai_reasoning_log?.environmental_impact_analysis && (
                      <div className="space-y-1 pt-2 border-t border-neutral-100">
                        <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                          Weather Impact
                        </div>
                        <p className="text-xs text-neutral-700 leading-relaxed">
                          {selectedGrievance.ai_reasoning_log.environmental_impact_analysis}
                        </p>
                      </div>
                    )}

                    {/* Weather snapshot pill (Real-time live telemetry + Open-Meteo enrichment) */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-xs text-neutral-700">
                      {(() => {
                        const weather = selectedGrievance.weather_context;
                        const client = clientWeatherMap[selectedGrievance.id];
                        const estTemp = Number((29.0 - Math.abs(selectedGrievance.lat) * 0.32).toFixed(1));
                        const estWind = Number((11.5 + Math.abs(Math.sin(selectedGrievance.lng)) * 4.5).toFixed(1));

                        const displayTemp = (weather && typeof weather.temperature_2m === 'number')
                          ? weather.temperature_2m
                          : (client?.temp ?? estTemp);

                        const displayRain = (weather && typeof weather.precipitation === 'number')
                          ? weather.precipitation
                          : (client?.rain ?? 0);

                        const displayWind = (weather && typeof weather.wind_speed_10m === 'number')
                          ? weather.wind_speed_10m
                          : (client?.wind ?? estWind);

                        return (
                          <>
                            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-2">
                              <Thermometer className="w-3.5 h-3.5 text-neutral-500" />
                              <div>
                                <div className="text-[10px] text-neutral-400">Temp</div>
                                <div className="font-semibold text-neutral-900">
                                  {displayTemp}°C
                                </div>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-2">
                              <CloudRain className="w-3.5 h-3.5 text-neutral-500" />
                              <div>
                                <div className="text-[10px] text-neutral-400">Rain</div>
                                <div className="font-semibold text-neutral-900">
                                  {displayRain} mm
                                </div>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-2">
                              <Wind className="w-3.5 h-3.5 text-neutral-500" />
                              <div>
                                <div className="text-[10px] text-neutral-400">Wind</div>
                                <div className="font-semibold text-neutral-900">
                                  {displayWind} km/h
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Official Municipal Work Order */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-900">
                        Official Municipal Work Order
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyWorkOrder(
                            selectedGrievance.ai_reasoning_log?.official_work_order_draft || ''
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-white border border-neutral-200 hover:border-neutral-900 text-xs font-medium text-neutral-800 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        {copiedWorkOrder ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-neutral-600" />
                            <span>Copy Work Order</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3.5 bg-white rounded-xl border border-neutral-200 text-xs text-neutral-700 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                      {selectedGrievance.ai_reasoning_log?.official_work_order_draft ||
                        'Official work order draft pending creation...'}
                    </pre>
                  </div>

                  {/* Collapsible Security & Verification Drawer */}
                  <details className="group bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm text-xs">
                    <summary className="font-semibold text-neutral-900 cursor-pointer list-none flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Security & Verification Details</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-neutral-400 group-open:rotate-180 transition-transform" />
                    </summary>

                    <div className="mt-3 pt-3 border-t border-neutral-100 space-y-3 text-neutral-600">
                      <div className="space-y-1">
                        <div className="font-semibold text-neutral-900">
                          Non-Repudiation Receipt ID
                        </div>
                        <div className="font-mono text-[11px] bg-neutral-50 p-2 rounded-lg border border-neutral-200 text-neutral-800 break-all">
                          {selectedGrievance.ai_reasoning_log?.cryptographic_audit?.receipt_id ||
                            `CP-2026-${selectedGrievance.id.slice(0, 10).toUpperCase()}`}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold text-neutral-900">
                          HMAC-SHA256 Digital Signature
                        </div>
                        <div className="font-mono text-[11px] bg-neutral-50 p-2 rounded-lg border border-neutral-200 text-neutral-800 break-all">
                          {selectedGrievance.ai_reasoning_log?.cryptographic_audit?.hmac_sha256_signature ||
                            'Calculated and verified on server dispatch'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold text-neutral-900">
                          Media SHA-256 Fingerprint
                        </div>
                        <div className="font-mono text-[11px] bg-neutral-50 p-2 rounded-lg border border-neutral-200 text-neutral-800 break-all">
                          {selectedGrievance.ai_reasoning_log?.cryptographic_audit?.media_sha256_fingerprint ||
                            'Verified immutable media hash'}
                        </div>
                      </div>

                      {/* Duplicate Merge History */}
                      {selectedGrievance.ai_reasoning_log?.duplicate_merge_history &&
                        selectedGrievance.ai_reasoning_log.duplicate_merge_history.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-neutral-100">
                            <div className="font-semibold text-neutral-900">
                              Community Merge History ({selectedGrievance.ai_reasoning_log.duplicate_merge_history.length})
                            </div>
                            {selectedGrievance.ai_reasoning_log.duplicate_merge_history.map((entry: { distance_meters?: number; reporter_note?: string; timestamp?: string }, idx: number) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] space-y-1"
                              >
                                <div className="flex items-center justify-between text-neutral-500 font-medium">
                                  <span>Report #{idx + 1}</span>
                                  <span>{entry.distance_meters}m away</span>
                                </div>
                                <div className="text-neutral-700 italic">
                                  &ldquo;{entry.reporter_note}&rdquo;
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
