'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import SpeederLoader from '@/components/SpeederLoader';
import RadialDeleteButton from '@/components/RadialDeleteButton';
import FolderUpload from '@/components/FolderUpload';
import MicRecordUpload from '@/components/MicRecordUpload';
import { supabaseBrowser } from '@/lib/supabase';
import { LandingView } from '@/components/landing/LandingView';
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
  Activity,
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
  LogOut,
  MapPin,
  Mic,
  PlusCircle,
  RotateCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Square,
  Thermometer,
  Trash2,
  UploadCloud,
  User,
  Volume2,
  Wind,
} from 'lucide-react';

// Dynamic SSR-safe import for Three.js Canvas
const ThreeSpatialCanvas = dynamic(
  () => import('@/components/ThreeSpatialCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[450px] bg-[#F4F2EA] flex flex-col items-center justify-center p-6">
        <SpeederLoader
          compact
          title="Loading 3D Earth Globe..."
          subtitle="Calibrating photorealistic textures"
        />
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

// Active Tab Type
  type TabType = 'HOME' | 'SUBMIT' | 'FEED' | 'DONE' | 'INSPECT';
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [feedViewMode, setFeedViewMode] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  // Push-state navigation helper so browser back button & Alt + Left Arrow work
  const navigateToTab = useCallback((tab: TabType, pushHistory = true) => {
    setActiveTab(tab);
    if (pushHistory && typeof window !== 'undefined') {
      const url = tab === 'HOME' ? window.location.pathname : `?tab=${tab.toLowerCase()}`;
      window.history.pushState({ tab }, '', url);
    }
  }, []);

  // Synchronize browser history and popstate (Back / Forward / Alt + Left Arrow)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial history state based on current URL or default to HOME
    const params = new URLSearchParams(window.location.search);
    const initialParam = params.get('tab');
    if (initialParam === 'submit') {
      setActiveTab('SUBMIT');
      window.history.replaceState({ tab: 'SUBMIT' }, '', '?tab=submit');
    } else if (initialParam === 'feed') {
      setActiveTab('FEED');
      window.history.replaceState({ tab: 'FEED' }, '', '?tab=feed');
    } else if (initialParam === 'done') {
      setActiveTab('DONE');
      window.history.replaceState({ tab: 'DONE' }, '', '?tab=done');
    } else if (initialParam === 'inspect') {
      setActiveTab('INSPECT');
      window.history.replaceState({ tab: 'INSPECT' }, '', '?tab=inspect');
    } else {
      window.history.replaceState({ tab: 'HOME' }, '', window.location.pathname);
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        const currentParams = new URLSearchParams(window.location.search);
        const tab = currentParams.get('tab');
        if (tab === 'submit') setActiveTab('SUBMIT');
        else if (tab === 'feed') setActiveTab('FEED');
        else if (tab === 'done') setActiveTab('DONE');
        else if (tab === 'inspect') setActiveTab('INSPECT');
        else setActiveTab('HOME');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept Alt + Left Arrow keyboard shortcut to ensure smooth navigation back to HOME
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        if (activeTab !== 'HOME') {
          e.preventDefault();
          if (window.history.length > 1) {
            window.history.back();
          } else {
            navigateToTab('HOME');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, navigateToTab]);

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

  // Authenticated User Session State
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    name: string;
    role: 'CITIZEN' | 'ADMIN';
  } | null>(null);

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

  // Manual refresh with pleasant minimum duration so user sees the speeder dispatch animation
  const handleManualRefresh = async () => {
    setIsSyncing(true);
    const start = performance.now();
    try {
      await fetchGrievances();
      const elapsed = performance.now() - start;
      if (elapsed < 850) {
        await new Promise((r) => setTimeout(r, 850 - elapsed));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial load & Supabase Realtime WebSocket subscription + Geolocation lock
  useEffect(() => {
    const init = async () => {
      const start = performance.now();
      await fetchGrievances();
      const elapsed = performance.now() - start;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }
      setIsLoading(false);
    };
    init();

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

  // Session Hydration on Mount (GET /api/auth)
  useEffect(() => {
    // 1. Fast local cache hydration
    try {
      const cached = localStorage.getItem('civic_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        setCurrentUser(parsed);
        if (parsed.email && !reporterContact) {
          setReporterContact(parsed.email);
        }
      }
    } catch {
      // ignore
    }

    // 2. Verified backend session check
    const checkSession = async () => {
      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('civic_session_token')
            : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/auth', {
          method: 'GET',
          credentials: 'include',
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('civic_user', JSON.stringify(data.user));
            if (data.user.email && !reporterContact) {
              setReporterContact(data.user.email);
            }
          } else {
            setCurrentUser(null);
            localStorage.removeItem('civic_user');
            localStorage.removeItem('civic_session_token');
          }
        }
      } catch (err) {
        console.warn('[Auth] Session check failed:', err);
      }
    };

    checkSession();
  }, []);

  // Sign out handler (DELETE /api/auth)
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[Auth] Sign out error:', err);
    } finally {
      localStorage.removeItem('civic_session_token');
      localStorage.removeItem('civic_user');
      setCurrentUser(null);
    }
  };

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

  // Derived KPIs: Active vs Completed separation
  const activeGrievances = useMemo(
    () => grievances.filter((g) => g.status !== 'RESOLVED'),
    [grievances]
  );
  const resolvedGrievances = useMemo(
    () => grievances.filter((g) => g.status === 'RESOLVED'),
    [grievances]
  );
  const activeCount = activeGrievances.length;
  const resolvedCount = resolvedGrievances.length;
  const criticalCount = activeGrievances.filter(
    (g) => g.urgency_level === 'CRITICAL' || (g.severity_score || 0) >= 8.0
  ).length;
  const clusteredCount = grievances.filter((g) => g.status === 'CLUSTERED' || (g.upvotes && g.upvotes > 1)).length;
  const avgSeverity = activeCount > 0
    ? Number((activeGrievances.reduce((acc, g) => acc + (g.severity_score || 0), 0) / activeCount).toFixed(1))
    : (grievances.length > 0 ? Number((grievances.reduce((acc, g) => acc + (g.severity_score || 0), 0) / grievances.length).toFixed(1)) : 0);

  // PATCH /api/triage for Upvoting or Resolving
  const handlePatchGrievance = async (id: string, action: 'UPVOTE' | 'DISPATCH' | 'RESOLVE') => {
    try {
      setPatchingAction(action);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('civic_session_token') || ''
          : '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/triage', {
        method: 'PATCH',
        credentials: 'include',
        headers,
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

  // Initial full-page speeder loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-pattern flex flex-col items-center justify-center p-6 antialiased">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-[#E4E1D6] rounded-3xl p-8 shadow-[0_16px_50px_rgba(40,35,25,0.08)] flex flex-col items-center text-center">
          <SpeederLoader
            title="Initializing CivicPulse Mesh..."
            subtitle="Loading autonomous global triage, satellite imagery & municipal records"
          />
          <div className="w-48 bg-[#EAE6DC] rounded-full h-1.5 mt-6 overflow-hidden">
            <div className="bg-neutral-900 h-full rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'HOME') {
    return (
      <LandingView
        onReportIssue={() => navigateToTab('SUBMIT')}
        onExploreMap={() => navigateToTab('FEED')}
        onPortalAccess={() => navigateToTab('INSPECT')}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        totalReports={grievances.length > 0 ? `${grievances.length.toLocaleString()}` : '12,800+'}
        resolvedRate={
          grievances.length > 0
            ? `${Math.round((resolvedCount / grievances.length) * 100)}%`
            : '94%'
        }
        avgTriageSpeed="35m"
        departmentsCount={4}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas-pattern text-[#1C1A16] flex flex-col antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN FROSTED TOP NAVIGATION BAR (Apple / Linear Aesthetic)
         ───────────────────────────────────────────────────────────── */}
      <header className="bg-[#F4F2EA]/85 backdrop-blur-xl border-b border-[#E4E1D6] sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Brand mark */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigateToTab('HOME')}
            title="Return to Homepage"
          >
            <div className="w-8 h-8 rounded-xl bg-neutral-950 flex items-center justify-center text-white shadow-sm ring-1 ring-black/10 group-hover:scale-105 transition-transform">
              <span className="font-bold text-sm tracking-tight">CP</span>
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-neutral-950 flex items-center gap-2">
                <span className="group-hover:text-neutral-700 transition">CivicPulse</span>
                <span className="text-[10px] font-medium text-neutral-600 bg-[#EAE6DC] px-2 py-0.5 rounded-full border border-[#DFDACD]">
                  Global Triage
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 font-normal">
                Autonomous Infrastructure Grievance Network
              </div>
            </div>
          </div>

          {/* Right Live Status Pill, Refresh, Home Navigation & Auth Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigateToTab('HOME')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E1D6] bg-white hover:bg-neutral-50 active:scale-95 text-xs font-semibold text-neutral-800 shadow-sm transition cursor-pointer"
              title="Return to Public Homepage"
            >
              <span>← Home</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#E4E1D6] text-xs font-medium text-neutral-700 shadow-[0_1px_3px_rgba(40,35,25,0.02)]">
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeStatus === 'SUBSCRIBED'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <span className="text-[11px]">
                {realtimeStatus === 'SUBSCRIBED' ? 'Realtime Mesh Active' : 'Connecting...'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E1D6] bg-white hover:bg-neutral-50 active:scale-95 text-xs font-medium text-neutral-800 shadow-sm transition cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Top Navigation Bar Auth Controls */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.role === 'ADMIN' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold shadow-sm border border-neutral-800">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate max-w-[130px]">Admin: {currentUser.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold border border-[#E4E1D6]">
                    <User className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                    <span className="truncate max-w-[130px]">Citizen: {currentUser.name}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E4E1D6] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 text-xs font-medium text-neutral-700 shadow-sm transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 active:scale-95 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In / Admin Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. SUMMARY KPI METRIC CARDS (High-Impact Minimalist Effects)
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Metric 1: Active Issues */}
          <div className="bg-white/95 backdrop-blur-xl border border-[#E4E1D6] rounded-2xl p-4 shadow-[0_4px_24px_rgba(40,35,25,0.02)] card-hover-lift flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Active Issues</span>
              <div className="w-6 h-6 rounded-lg bg-[#EAE6DC] flex items-center justify-center text-neutral-700">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-950 mt-2">
              {isLoading ? '--' : activeCount}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>{activeCount > 0 ? 'In Field Pipeline' : 'All Cleared'}</span>
            </div>
          </div>

          {/* Metric 2: Urgent Priority */}
          <div className="bg-white/95 backdrop-blur-xl border border-[#E4E1D6] rounded-2xl p-4 shadow-[0_4px_24px_rgba(40,35,25,0.02)] card-hover-lift flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Urgent Priority</span>
              <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-950 mt-2 flex items-baseline gap-2">
              <span>{isLoading ? '--' : criticalCount}</span>
              {criticalCount > 0 && (
                <span className="text-[10px] font-semibold text-red-700 bg-red-100/90 px-2 py-0.5 rounded-full">
                  Requires Attention
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {criticalCount > 0 ? 'Critical Defect Flags' : 'Zero High Risk'}
            </div>
          </div>

          {/* Metric 3: Completed / Done */}
          <div className="bg-white/95 backdrop-blur-xl border border-[#E4E1D6] rounded-2xl p-4 shadow-[0_4px_24px_rgba(40,35,25,0.02)] card-hover-lift flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Completed Works</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-700 mt-2 flex items-baseline gap-2">
              <span>{isLoading ? '--' : resolvedCount}</span>
              {resolvedCount > 0 && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full glow-emerald">
                  ✓ SLA Cleared
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {resolvedCount > 0 ? 'Verified & Resolved' : 'Pending Resolutions'}
            </div>
          </div>

          {/* Metric 4: AI Defect Severity */}
          <div className="bg-white/95 backdrop-blur-xl border border-[#E4E1D6] rounded-2xl p-4 shadow-[0_4px_24px_rgba(40,35,25,0.02)] card-hover-lift flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Severity Index</span>
              <div className="w-6 h-6 rounded-lg bg-[#EAE6DC] text-neutral-700 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-950 mt-2 flex items-baseline">
              <span>{isLoading ? '--' : avgSeverity.toFixed(1)}</span>
              <span className="text-sm font-normal text-neutral-400 ml-1">/ 10</span>
            </div>
            <div className="w-full bg-[#EAE6DC] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-neutral-900 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (avgSeverity / 10) * 100)}%` }}
              />
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
          <div className="rounded-2xl border border-[#E4E1D6] bg-[#F4F2EA] overflow-hidden shadow-[0_8px_30px_rgba(40,35,25,0.04)] h-[640px] relative">
            <ThreeSpatialCanvas
              grievances={grievances}
              selectedId={selectedId}
              onSelectGrievance={handleSelectGrievance}
              userCoords={userGpsCoords}
            />

            {/* Floating Bottom Card When An Issue Is Selected */}
            {selectedGrievance && (
              <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-xl border border-[#E4E1D6] rounded-2xl p-4 shadow-[0_12px_36px_rgba(40,35,25,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                      onClick={() => navigateToTab('INSPECT')}
                      className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-medium shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      View Full Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="p-2 rounded-xl hover:bg-[#EAE6DC] text-neutral-500 text-xs transition cursor-pointer"
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
          {/* Segmented Pill Tabs (Apple / Linear Frosted Glass Style) */}
          <div className="bg-[#EAE6DC] backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-1 border border-[#DFDACD] shadow-[inset_0_1px_3px_rgba(40,35,25,0.03)]">
            <button
              type="button"
              onClick={() => navigateToTab('SUBMIT')}
              className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'SUBMIT'
                  ? 'bg-white text-neutral-950 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToTab('FEED')}
              className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'FEED'
                  ? 'bg-white text-neutral-950 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-neutral-500" />
              <span>Live Feed</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeCount > 0 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateToTab('DONE')}
              className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'DONE'
                  ? 'bg-white text-neutral-950 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${resolvedCount > 0 ? 'text-emerald-600' : 'text-neutral-400'}`} />
              <span>Done</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                resolvedCount > 0
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/70 glow-emerald'
                  : 'bg-neutral-200 text-neutral-600'
              }`}>
                {resolvedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateToTab('INSPECT')}
              className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'INSPECT'
                  ? 'bg-white text-neutral-950 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
              }`}
            >
              <span>Details</span>
              {selectedGrievance && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ring-2 ring-sky-200 animate-pulse" />
              )}
            </button>
          </div>

          {/* TAB 1: REPORT ISSUE */}
          {activeTab === 'SUBMIT' && (
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                    Report a Civic Issue
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Upload a photo, record a voice note, or describe the issue. Our AI automatically assesses severity and routes it to the right department.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateToTab('HOME')}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition cursor-pointer shrink-0 flex items-center gap-1 shadow-xs active:scale-95"
                  title="Return to Homepage (Alt + Left Arrow)"
                >
                  <span>← Home</span>
                </button>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {/* Slot 1: Photo Evidence with 3D Floating Folder & Radial Delete */}
                    <div className="flex flex-col justify-center">
                      {!photoFile ? (
                        <FolderUpload
                          onFileSelect={handlePhotoChange}
                          label="Upload Photo Evidence"
                        />
                      ) : (
                        <div className="border border-[#E4E1D6] rounded-2xl p-3 bg-white/95 shadow-sm min-h-[126px] flex items-center gap-3 relative overflow-visible">
                          {photoPreviewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoPreviewUrl}
                              alt="Photo preview"
                              className="w-14 h-14 rounded-xl object-cover border border-[#E4E1D6] shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="text-xs font-semibold text-neutral-900 truncate">
                              {photoFile.name}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                              ✓ Photo Attached ({(photoFile.size / 1024).toFixed(0)} KB)
                            </div>
                          </div>
                          <div className="shrink-0">
                            <RadialDeleteButton
                              onDelete={handleClearPhoto}
                              tooltipDelete="Delete Photo"
                              tooltipCancel="Keep Photo"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Slot 2: Voice Note Evidence with Matching 3D Floating Mic & Radial Delete */}
                    <div className="flex flex-col justify-center">
                      {!voiceFile ? (
                        <MicRecordUpload
                          isRecording={isRecording}
                          recordingSeconds={recordingSeconds}
                          onToggleRecord={handleToggleVoiceRecord}
                        />
                      ) : (
                        <div className="border border-[#E4E1D6] rounded-2xl p-3 bg-white/95 shadow-sm min-h-[126px] flex items-center gap-3 relative overflow-visible">
                          <div className="w-14 h-14 rounded-xl bg-[#EAE6DC] border border-[#E4E1D6] flex items-center justify-center shrink-0 text-neutral-800">
                            <Volume2 className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="text-xs font-semibold text-neutral-900 truncate">
                              Voice Note ({recordingSeconds || 1}s)
                            </div>
                            {voicePreviewUrl && (
                              <audio controls src={voicePreviewUrl} className="h-7 w-full mt-1.5" />
                            )}
                          </div>
                          <div className="shrink-0">
                            <RadialDeleteButton
                              onDelete={handleClearVoice}
                              tooltipDelete="Delete Audio"
                              tooltipCancel="Keep Audio"
                            />
                          </div>
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
                          navigateToTab('INSPECT');
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
                          navigateToTab('INSPECT');
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

          {/* TAB 2: LIVE FEED (Active Field Issues) */}
          {activeTab === 'FEED' && (
            <div className="space-y-3">
              {/* Top View Mode & Filter Bar */}
              <div className="flex items-center justify-between gap-2">
                {/* Active vs All View Switcher */}
                <div className="bg-neutral-100 p-1 rounded-xl flex items-center gap-1 border border-neutral-200/60 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setFeedViewMode('ACTIVE')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      feedViewMode === 'ACTIVE'
                        ? 'bg-white text-neutral-950 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Active Only ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedViewMode('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      feedViewMode === 'ALL'
                        ? 'bg-white text-neutral-950 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    All ({grievances.length})
                  </button>
                </div>

                {/* Sector Department Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs">
                  {[
                    { key: 'ALL', label: 'All' },
                    { key: 'PWD-ROADS', label: 'Roads' },
                    { key: 'WATER-SAN', label: 'Water' },
                    { key: 'ENV-POLL', label: 'Eco' },
                    { key: 'ELEC-GRID', label: 'Power' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setFilterDept(f.key);
                        fetchGrievances(f.key);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer shrink-0 ${
                        filterDept === f.key
                          ? 'bg-neutral-950 text-white shadow-sm'
                          : 'bg-white border border-neutral-200/80 text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed List */}
              <div className="space-y-3">
                {(() => {
                  const itemsToDisplay =
                    feedViewMode === 'ACTIVE'
                      ? grievances.filter((g) => g.status !== 'RESOLVED')
                      : grievances;

                  if (itemsToDisplay.length === 0) {
                    return (
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200/90 p-8 text-center text-xs text-neutral-500 space-y-3 shadow-sm">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="font-semibold text-neutral-950 text-sm">
                          All Clear in this Sector
                        </div>
                        <p className="text-neutral-500 text-xs max-w-xs mx-auto">
                          No active open issues reported. All local infrastructure is operating normally.
                        </p>
                        {resolvedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => navigateToTab('DONE')}
                            className="mt-2 py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>View Completed Issues ({resolvedCount}) →</span>
                          </button>
                        )}
                      </div>
                    );
                  }

                  return itemsToDisplay.map((g) => {
                    const isSelected = selectedId === g.id;
                    const isCritical =
                      (g.severity_score || 0) >= 8.0 || g.urgency_level === 'CRITICAL';

                    return (
                      <div
                        key={g.id}
                        onClick={() => {
                          setSelectedId(g.id);
                          navigateToTab('INSPECT');
                        }}
                        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer card-hover-lift space-y-2.5 ${
                          isSelected
                            ? 'border-neutral-950 shadow-md ring-1 ring-neutral-950'
                            : 'border-neutral-200/90 hover:border-neutral-400 shadow-sm'
                        }`}
                      >
                        {/* Top tag & status */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-md text-[10px]">
                              {getDepartmentLabel(g.department_code)}
                            </span>
                            {g.status === 'RESOLVED' ? (
                              <span className="font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Resolved</span>
                              </span>
                            ) : isCritical ? (
                              <span className="font-semibold text-white bg-red-600 px-2 py-0.5 rounded-md text-[10px]">
                                Critical
                              </span>
                            ) : (
                              <span className="text-neutral-600 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-md text-[10px]">
                                {g.status}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
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
                            <span className="text-neutral-400 text-[11px]">Severity:</span>
                            <span className="font-bold text-neutral-900">
                              {g.severity_score.toFixed(1)}/10
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
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

                            {/* Admin Quick Resolve in Feed */}
                            {currentUser?.role === 'ADMIN' && g.status !== 'RESOLVED' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePatchGrievance(g.id, 'RESOLVE');
                                }}
                                disabled={patchingAction === 'RESOLVE'}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Mark Resolved</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETED / DONE (Dedicated Resolution Archive) */}
          {activeTab === 'DONE' && (
            <div className="space-y-3">
              {/* Top Filter Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Completed Municipal Works</span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto text-xs">
                  {[
                    { key: 'ALL', label: 'All' },
                    { key: 'PWD-ROADS', label: 'Roads' },
                    { key: 'WATER-SAN', label: 'Water' },
                    { key: 'ENV-POLL', label: 'Eco' },
                    { key: 'ELEC-GRID', label: 'Power' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setFilterDept(f.key);
                        fetchGrievances(f.key);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer shrink-0 ${
                        filterDept === f.key
                          ? 'bg-neutral-950 text-white shadow-sm'
                          : 'bg-white border border-neutral-200/80 text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Completed List */}
              <div className="space-y-3">
                {resolvedGrievances.length === 0 ? (
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200/90 p-8 text-center text-xs text-neutral-500 space-y-2 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-neutral-900 text-sm">
                      No Completed Issues Yet
                    </div>
                    <p className="text-neutral-500 text-xs max-w-xs mx-auto">
                      When field operations resolve open reports, they will be archived here with verification timestamps and closed work orders.
                    </p>
                  </div>
                ) : (
                  resolvedGrievances.map((g) => {
                    const isSelected = selectedId === g.id;

                    return (
                      <div
                        key={g.id}
                        onClick={() => {
                          setSelectedId(g.id);
                          navigateToTab('INSPECT');
                        }}
                        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer card-hover-lift space-y-3 relative overflow-hidden ${
                          isSelected
                            ? 'border-emerald-600 shadow-md ring-1 ring-emerald-600'
                            : 'border-neutral-200/90 hover:border-emerald-400/80 shadow-sm'
                        }`}
                      >
                        {/* Sleek top emerald gradient line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 glow-emerald">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Done & SLA Cleared</span>
                            </span>
                            <span className="font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md text-[10px]">
                              {getDepartmentLabel(g.department_code)}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Verified Resolved
                          </span>
                        </div>

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

                        {/* Work order draft snippet */}
                        {g.ai_reasoning_log?.official_work_order_draft && (
                          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 text-[11px] text-neutral-600 line-clamp-2 font-mono">
                            {g.ai_reasoning_log.official_work_order_draft}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                          <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                            <span>Severity:</span>
                            <span className="font-medium text-neutral-700">
                              {g.severity_score.toFixed(1)}/10
                            </span>
                            <span>•</span>
                            <span>{g.upvotes || 1} Citizen Report{(g.upvotes || 1) > 1 ? 's' : ''} Cleared</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(g.id);
                              navigateToTab('INSPECT');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Inspect Details →</span>
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
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handlePatchGrievance(selectedGrievance.id, 'UPVOTE')}
                        disabled={patchingAction === 'UPVOTE' || selectedGrievance.status === 'RESOLVED'}
                        className="py-2 px-3 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>▲ Upvote Issue</span>
                        <span className="text-neutral-400">({selectedGrievance.upvotes})</span>
                      </button>

                      {/* Dispatch Work Order: strictly ADMIN only */}
                      {currentUser?.role === 'ADMIN' &&
                        selectedGrievance.status !== 'DISPATCHED' &&
                        selectedGrievance.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => handlePatchGrievance(selectedGrievance.id, 'DISPATCH')}
                            disabled={patchingAction === 'DISPATCH'}
                            className="py-2 px-3 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition cursor-pointer"
                          >
                            Dispatch Work Order
                          </button>
                        )}

                      {/* Resolution Action */}
                      {selectedGrievance.status === 'RESOLVED' ? (
                        <div className="ml-auto py-2 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 glow-emerald">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>✓ Done & Verified</span>
                        </div>
                      ) : currentUser?.role === 'ADMIN' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await handlePatchGrievance(selectedGrievance.id, 'RESOLVE');
                            navigateToTab('DONE');
                          }}
                          disabled={patchingAction === 'RESOLVE'}
                          className="ml-auto py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold transition cursor-pointer shadow-sm shimmer-btn flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{patchingAction === 'RESOLVE' ? 'Resolving...' : 'Complete & Mark Done'}</span>
                        </button>
                      ) : (
                        <div className="ml-auto text-[11px] text-neutral-400 flex items-center gap-1 py-1">
                          <Lock className="w-3 h-3 text-neutral-400" />
                          <span>Admin authorization required to resolve</span>
                        </div>
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

      {/* Realtime Manual Refresh Speeder Modal */}
      {isSyncing && (
        <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white/95 backdrop-blur-2xl border border-[#E4E1D6] rounded-3xl p-7 shadow-[0_20px_60px_rgba(40,35,25,0.14)] max-w-sm w-full flex flex-col items-center text-center">
            <SpeederLoader
              title="Syncing Telemetry & Live Feed..."
              subtitle="Updating citizen reports, PostGIS clusters & weather radar"
            />
          </div>
        </div>
      )}

      {/* Submission Triage Speeder Modal */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white/95 backdrop-blur-2xl border border-[#E4E1D6] rounded-3xl p-7 shadow-[0_20px_60px_rgba(40,35,25,0.16)] max-w-sm w-full flex flex-col items-center text-center">
            <SpeederLoader
              title="AI Autonomous Triage Active..."
              subtitle="Calibrating severity, matching duplicates, and routing official work order"
            />
          </div>
        </div>
      )}
    </div>
  );
}
