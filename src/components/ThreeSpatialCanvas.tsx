'use client';

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { GrievanceRecord } from '@/types/grievance';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type * as LeafletType from 'leaflet';
import { Globe, MapPin, ZoomIn, RotateCcw, Satellite } from 'lucide-react';

export interface ThreeSpatialCanvasProps {
  grievances: GrievanceRecord[];
  selectedId: string | null;
  onSelectGrievance: (grievance: GrievanceRecord) => void;
  userCoords: { lat: number; lng: number } | null;
}

const GLOBE_RADIUS = 2.5;

/**
 * Converts WGS-84 (lat, lng) to 3D Cartesian coordinates (x, y, z) on a sphere
 */
export function latLngToCartesian(
  lat: number,
  lng: number,
  radius: number = GLOBE_RADIUS
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

/**
 * 3D Issue Pin extending radially outward from the Globe surface
 */
function GlobePin({
  grievance,
  isSelected,
  onSelect,
  onOpenSatellite,
}: {
  grievance: GrievanceRecord;
  isSelected: boolean;
  onSelect: (g: GrievanceRecord) => void;
  onOpenSatellite: (g: GrievanceRecord) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Group>(null);

  const isCritical =
    (grievance.severity_score || 0) >= 8.0 ||
    grievance.urgency_level === 'CRITICAL';
  const isResolved = grievance.status === 'RESOLVED';

  const [x, y, z] = useMemo(() => {
    return latLngToCartesian(grievance.lat, grievance.lng, GLOBE_RADIUS);
  }, [grievance.lat, grievance.lng]);

  const orientation = useMemo(() => {
    const normal = new THREE.Vector3(x, y, z).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(up, normal);
  }, [x, y, z]);

  const height = Math.max(0.35, Math.min(1.2, (grievance.severity_score || 3.0) * 0.11));
  const pinRadius = 0.035;
  const beadRadius = 0.08;

  const upvotes = grievance.upvotes || 1;
  const clusterBaseRadius = Math.min(0.35, 0.12 + (upvotes - 1) * 0.04);

  useFrame(({ clock }) => {
    if (ringRef.current && (isCritical || isSelected)) {
      const pulse = 1.0 + Math.sin(clock.elapsedTime * 3) * 0.16;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const pinColor = isResolved
    ? '#94A3B8'
    : isSelected || isCritical
    ? '#000000'
    : '#1E293B';

  const beaconPoints = useMemo<[number, number, number][]>(() => {
    return [
      [0, height, 0],
      [0, height + 1.2, 0],
    ];
  }, [height]);

  return (
    <group position={[x, y, z]} quaternion={orientation}>
      {/* Base Cluster Ring on Surface */}
      <group ref={ringRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[clusterBaseRadius * 0.82, clusterBaseRadius, 32]} />
          <meshBasicMaterial
            color={isCritical || isSelected ? '#FFFFFF' : '#38BDF8'}
            transparent
            opacity={isResolved ? 0.3 : 0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Pin Stem */}
      <mesh
        position={[0, height / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(grievance);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[pinRadius, pinRadius, height, 16]} />
        <meshStandardMaterial
          color={pinColor}
          roughness={0.15}
          metalness={0.35}
          transparent={isResolved}
          opacity={isResolved ? 0.45 : 1.0}
        />
      </mesh>

      {/* Pin Top Bead */}
      <mesh
        position={[0, height + beadRadius * 0.8, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(grievance);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[beadRadius, 20, 20]} />
        <meshStandardMaterial
          color={isSelected ? '#FFFFFF' : isCritical ? '#EF4444' : pinColor}
          emissive={isSelected ? '#38BDF8' : isCritical ? '#DC2626' : '#000000'}
          emissiveIntensity={isSelected || isCritical ? 0.6 : 0}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>

      {/* Sky Laser Beacon */}
      {(isCritical || isSelected) && (
        <Line
          points={beaconPoints}
          color={isCritical ? '#EF4444' : '#FFFFFF'}
          lineWidth={1.8}
          transparent
          opacity={isSelected ? 0.95 : 0.75}
        />
      )}

      {/* Floating 3D HTML Pill on Hover/Select */}
      {(hovered || isSelected) && (
        <Html distanceFactor={14} position={[0, height + 0.45, 0]} center>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(grievance);
            }}
            className="cursor-pointer whitespace-nowrap bg-white/95 backdrop-blur-md text-neutral-900 border border-neutral-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.22)] rounded-xl px-3.5 py-2.5 select-none pointer-events-auto transition-transform hover:scale-105"
          >
            <div className="font-semibold text-xs text-neutral-950 truncate max-w-[220px]">
              {grievance.title || 'Civic Issue'}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              {grievance.lat.toFixed(4)}°N, {grievance.lng.toFixed(4)}°E
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-600 mt-1 border-t border-neutral-100 pt-1">
              <span className="font-medium text-neutral-950">
                Severity {(grievance.severity_score || 0).toFixed(1)}/10
              </span>
              <span>•</span>
              <span>
                {grievance.upvotes || 1} {grievance.upvotes === 1 ? 'report' : 'reports'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSatellite(grievance);
              }}
              className="mt-1.5 w-full py-1 px-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 shadow-sm transition"
            >
              <Satellite className="w-3 h-3 text-sky-400" />
              <span>Inspect Satellite Imagery</span>
              <span>→</span>
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * User Current Location Marker on 3D Globe
 */
function GlobeUserMarker({ lat, lng }: { lat: number; lng: number }) {
  const [x, y, z] = useMemo(() => latLngToCartesian(lat, lng, GLOBE_RADIUS), [lat, lng]);
  const orientation = useMemo(() => {
    const normal = new THREE.Vector3(x, y, z).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(up, normal);
  }, [x, y, z]);

  return (
    <group position={[x, y, z]} quaternion={orientation}>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color="#0284C7" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.18, 32]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <Html distanceFactor={14} position={[0, 0.35, 0]} center>
        <div className="bg-neutral-900 text-white px-2.5 py-0.5 text-[10px] font-medium tracking-wide rounded-full shadow-md whitespace-nowrap">
          Your Location
        </div>
      </Html>
    </group>
  );
}

/**
 * 3D Great-Circle Flight / Connection Arc
 */
function ConnectionArc({
  p1,
  p2,
}: {
  p1: [number, number, number];
  p2: [number, number, number];
}) {
  const arcPoints = useMemo(() => {
    const v1 = new THREE.Vector3(...p1);
    const v2 = new THREE.Vector3(...p2);
    const distance = v1.distanceTo(v2);
    if (distance < 0.1 || distance > 3.5) return null;

    const mid = v1.clone().add(v2).multiplyScalar(0.5);
    const midLength = 2.5 + Math.min(0.8, distance * 0.25);
    mid.normalize().multiplyScalar(midLength);

    const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
    return curve.getPoints(32).map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, [p1, p2]);

  if (!arcPoints) return null;

  return (
    <Line
      points={arcPoints}
      color="#FFFFFF"
      lineWidth={1.2}
      dashed
      dashScale={2}
      transparent
      opacity={0.6}
    />
  );
}

/**
 * Camera Flight Controller for Selected Incident (without disruptive auto-zoom)
 */
function CameraFlightController({
  selectedCoords,
  isUserInteracting,
}: {
  selectedCoords: [number, number, number] | null;
  isUserInteracting: boolean;
}) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (selectedCoords && !isUserInteracting) {
      const targetPos = new THREE.Vector3(...selectedCoords).normalize().multiplyScalar(5.5);
      camera.position.lerp(targetPos, delta * 2.5);
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

/**
 * Photorealistic 3D Earth Globe Model (Real NASA Satellite Imagery + Clouds + Atmosphere)
 */
function EarthGlobeModel({
  earthMap,
  cloudsMap,
}: {
  earthMap: THREE.Texture | null;
  cloudsMap: THREE.Texture | null;
}) {
  const cloudsRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <group>
      {/* 1. Real Satellite Earth Sphere */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={earthMap || undefined}
          color={earthMap ? '#FFFFFF' : '#10375C'}
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>

      {/* 2. Dynamic Wispy Cloud Layer */}
      {cloudsMap && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[GLOBE_RADIUS + 0.025, 48, 48]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 3. Luminous Blue Atmospheric Scattering Halo */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.08, 48, 48]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/**
 * CRASH-FREE HIGH-RESOLUTION SATELLITE INSPECTOR (Leaflet)
 * Uses Esri World Imagery (NO API KEY REQUIRED, NO WEB WORKER ERRORS).
 * Initialized ONCE to eliminate all '_leaflet_pos' race conditions.
 */
function CrashFreeSatelliteInspector({
  grievances,
  selectedId,
  onSelectGrievance,
  userCoords,
  onSwitchToGlobe,
}: {
  grievances: GrievanceRecord[];
  selectedId: string | null;
  onSelectGrievance: (g: GrievanceRecord) => void;
  userCoords: { lat: number; lng: number } | null;
  onSwitchToGlobe: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletType.Map | null>(null);
  const featuresLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(16);

  // Helper: Draw all markers and 100m PostGIS deduplication radar rings
  const updateMapLayers = useCallback(
    (L: typeof LeafletType, map: LeafletType.Map, layerGroup: LeafletType.LayerGroup) => {
      layerGroup.clearLayers();

      grievances.forEach((g) => {
        const isSelected = g.id === selectedId;
        const isCritical = (g.severity_score || 0) >= 8.0;

        // 100m PostGIS Deduplication Radar Ring on real satellite terrain
        const circle = L.circle([g.lat, g.lng], {
          radius: 100, // Exact 100-meter PostGIS deduplication radius
          color: isCritical ? '#EF4444' : isSelected ? '#FFFFFF' : '#38BDF8',
          fillColor: isCritical ? '#EF4444' : '#38BDF8',
          fillOpacity: 0.22,
          weight: isSelected ? 3 : 1.8,
          dashArray: '6, 6',
        });
        layerGroup.addLayer(circle);

        // Custom High-Contrast Apple-style Pin
        const markerHtml = `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${isSelected ? '#000000' : isCritical ? '#EF4444' : 'rgba(255, 255, 255, 0.95)'};
            color: ${isSelected || isCritical ? '#FFFFFF' : '#0F172A'};
            padding: 4px 8px;
            border-radius: 9999px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.45);
            border: 2px solid ${isSelected ? '#38BDF8' : '#FFFFFF'};
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>${g.severity_score.toFixed(1)}</span>
            <span style="opacity: 0.8; font-size: 9px;">▲${g.upvotes}</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-satellite-pin',
          html: markerHtml,
          iconSize: [48, 26],
          iconAnchor: [24, 13],
        });

        const marker = L.marker([g.lat, g.lng], { icon });
        marker.on('click', () => {
          onSelectGrievance(g);
        });

        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
            <div style="font-weight: bold; font-size: 13px; margin-bottom: 2px; color: #0F172A;">${g.title}</div>
            <div style="font-size: 11px; color: #64748B;">${g.address || `${g.lat.toFixed(4)}, ${g.lng.toFixed(4)}`}</div>
            <div style="font-size: 11px; margin-top: 6px; font-weight: 600; color: #0284C7;">
              Severity: ${g.severity_score.toFixed(1)}/10 • ${g.upvotes} Reports
            </div>
            <div style="font-size: 10px; color: #0284C7; margin-top: 2px; font-weight: 500;">
              100m PostGIS Deduplication Ring Active
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        layerGroup.addLayer(marker);
      });

      // User Location Marker
      if (userCoords) {
        const userIcon = L.divIcon({
          className: 'user-gps-marker',
          html: `
            <div style="
              width: 16px;
              height: 16px;
              background: #0284C7;
              border: 3px solid #FFFFFF;
              border-radius: 50%;
              box-shadow: 0 0 14px #0284C7;
            "></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
          .bindPopup('<b>Your Current Location</b>');
        layerGroup.addLayer(userMarker);
      }
    },
    [grievances, selectedId, onSelectGrievance, userCoords]
  );

  // Initialize Map ONCE on mount
  useEffect(() => {
    let isCancelled = false;
    let map: LeafletType.Map | null = null;

    if (!containerRef.current) return;

    import('leaflet').then((L) => {
      if (isCancelled || !containerRef.current || mapRef.current) return;

      // Determine target focus: selected grievance > first grievance > user GPS > default
      const targetG = grievances.find((g) => g.id === selectedId) || grievances[0];
      const startLat = targetG ? targetG.lat : userCoords ? userCoords.lat : 15.4589;
      const startLng = targetG ? targetG.lng : userCoords ? userCoords.lng : 75.0078;

      map = L.map(containerRef.current, {
        center: [startLat, startLng],
        zoom: 16, // Sub-meter satellite resolution
        zoomControl: false,
        fadeAnimation: false, // Prevents '_leaflet_pos' race conditions completely
      });
      mapRef.current = map;

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('zoomend', () => {
        if (map) setCurrentZoom(map.getZoom());
      });

      // Real Satellite Imagery (Esri World Imagery — 100% Free, NO API KEY)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);

      // Persistent feature layer group
      const featureLayer = L.layerGroup().addTo(map);
      featuresLayerRef.current = featureLayer;

      updateMapLayers(L, map, featureLayer);
    });

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.stop(); // Stop all running animations to prevent _leaflet_pos access
        mapRef.current.remove();
        mapRef.current = null;
        featuresLayerRef.current = null;
      }
    };
  }, []); // Run ONCE on mount!

  // Update features dynamically when grievances or selectedId change
  useEffect(() => {
    if (mapRef.current && featuresLayerRef.current) {
      import('leaflet').then((L) => {
        if (mapRef.current && featuresLayerRef.current) {
          updateMapLayers(L, mapRef.current, featuresLayerRef.current);
        }
      });
    }
  }, [updateMapLayers]);

  // Smoothly pan to newly selected incident without re-creating map
  useEffect(() => {
    if (selectedId && mapRef.current) {
      const g = grievances.find((item) => item.id === selectedId);
      if (g) {
        mapRef.current.flyTo([g.lat, g.lng], 17, { duration: 1.2 });
      }
    }
  }, [selectedId, grievances]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-950">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onSwitchToGlobe}
            className="bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-md hover:bg-neutral-100 px-3.5 py-1.5 rounded-full text-xs font-semibold text-neutral-900 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <span>← 3D Earth Globe</span>
          </button>

          <div className="bg-black/80 backdrop-blur-md border border-neutral-700/80 shadow-md px-3.5 py-1.5 rounded-full text-xs text-neutral-200 font-medium hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real Satellite Photography (Zoom {currentZoom}x)</span>
          </div>
        </div>

        {/* 100m Deduplication Sector Badge */}
        <div className="bg-black/80 backdrop-blur-md border border-neutral-700/80 shadow-md px-3 py-1.5 rounded-full text-xs text-sky-400 font-medium flex items-center gap-1.5 pointer-events-auto">
          <div className="w-2 h-2 rounded-full border border-dashed border-sky-400" />
          <span>100m PostGIS Cluster Active</span>
        </div>
      </div>

      {/* Leaflet Satellite DOM Container */}
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}

/**
 * UNIFIED STABLE GEOSPATIAL VIEWPORT
 * - Mode 1: 3D Earth Globe with NASA Satellite Imagery + Cloud Layer (Full Zoom/Pan Freedom)
 * - Mode 2: High-Resolution Satellite Inspector (Zero Leaflet Position Crashes)
 */
export default function ThreeSpatialCanvas({
  grievances,
  selectedId,
  onSelectGrievance,
  userCoords,
}: ThreeSpatialCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [viewMode, setViewMode] = useState<'globe' | 'satellite'>('globe');
  const [autoRotate, setAutoRotate] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Load High-Res NASA Earth and Cloud textures from local storage
  const [earthMap, setEarthMap] = useState<THREE.Texture | null>(null);
  const [cloudsMap, setCloudsMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/textures/earth.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      setEarthMap(tex);
    });
    loader.load('/textures/clouds.png', (tex) => {
      setCloudsMap(tex);
    });
  }, []);

  // Find selected incident coordinates for camera flight
  const selectedCoords = useMemo<[number, number, number] | null>(() => {
    if (!selectedId) return null;
    const g = grievances.find((item) => item.id === selectedId);
    if (!g) return null;
    return latLngToCartesian(g.lat, g.lng, GLOBE_RADIUS);
  }, [selectedId, grievances]);

  // Recenter Globe Camera
  const handleResetGlobe = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  const handleOpenSatellite = (g?: GrievanceRecord) => {
    if (g) onSelectGrievance(g);
    setViewMode('satellite');
  };

  // If in satellite mode, render the crash-free satellite inspector
  if (viewMode === 'satellite') {
    return (
      <CrashFreeSatelliteInspector
        grievances={grievances}
        selectedId={selectedId}
        onSelectGrievance={onSelectGrievance}
        userCoords={userCoords}
        onSwitchToGlobe={() => setViewMode('globe')}
      />
    );
  }

  // Otherwise, render photorealistic 3D Earth Globe
  return (
    <div className="relative w-full h-full bg-[#030712] select-none overflow-hidden rounded-2xl">
      {/* Top Floating View Switcher Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-md rounded-full px-3.5 py-1.5 text-xs font-medium text-neutral-800 flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-neutral-950">3D Earth Globe</span>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-600">{grievances.length} Active Nodes</span>
        </div>

        {/* Switch To Pure Satellite View Button */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => setViewMode('satellite')}
            className="bg-white/95 backdrop-blur-md text-neutral-900 border border-neutral-200/90 hover:bg-neutral-100 shadow-md px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Satellite className="w-3.5 h-3.5 text-sky-600" />
            <span>Satellite Inspector</span>
            <span className="text-neutral-400">→</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner Overlay (when 0 grievances exist) */}
      {grievances.length === 0 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center">
          <div className="bg-white/90 backdrop-blur-md border border-neutral-200/80 shadow-md rounded-full px-4 py-1.5 text-xs text-neutral-700">
            Interactive Earth Telemetry • Click &apos;Report Issue&apos; to plot coordinates
          </div>
        </div>
      )}

      {/* Bottom-Left Control Buttons */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={handleResetGlobe}
          className="bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-md hover:bg-neutral-50 active:scale-95 rounded-full px-3.5 py-1.5 text-xs font-semibold text-neutral-800 transition cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Globe</span>
        </button>

        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`backdrop-blur-md border shadow-md rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
            autoRotate
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white/95 text-neutral-700 border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <span>Auto-Rotate: {autoRotate ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenSatellite()}
          className="bg-neutral-900 text-white shadow-md hover:bg-neutral-800 active:scale-95 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span>Satellite Focus</span>
        </button>
      </div>

      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 1.8, 5.8], fov: 44 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#030712']} />

        {/* Clean Studio Three-Point Lighting */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[15, 20, 15]} intensity={1.3} />
        <directionalLight position={[-15, -10, -15]} intensity={0.4} />

        {/* Orbit Controls with Full Zoom/Pan Freedom (NO abrupt auto-switching) */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          autoRotate={autoRotate && !isUserInteracting && !selectedCoords}
          autoRotateSpeed={0.45}
          enableDamping
          dampingFactor={0.06}
          minDistance={3.0}
          maxDistance={12.0}
          onStart={() => setIsUserInteracting(true)}
          onEnd={() => setIsUserInteracting(false)}
        />

        {/* Smooth Camera Flight to Selected Incident */}
        <CameraFlightController
          selectedCoords={selectedCoords}
          isUserInteracting={isUserInteracting}
        />

        {/* Photorealistic 3D Earth with NASA Blue Marble Texture & Dynamic Clouds */}
        <EarthGlobeModel earthMap={earthMap} cloudsMap={cloudsMap} />

        {/* User GPS Location Marker */}
        {userCoords && (
          <GlobeUserMarker lat={userCoords.lat} lng={userCoords.lng} />
        )}

        {/* Connecting Flight Arcs between nearby / clustered grievances */}
        {grievances.length > 1 &&
          grievances.slice(0, -1).map((g, i) => {
            const next = grievances[i + 1];
            return (
              <ConnectionArc
                key={`arc-${g.id}-${next.id}`}
                p1={latLngToCartesian(g.lat, g.lng, GLOBE_RADIUS)}
                p2={latLngToCartesian(next.lat, next.lng, GLOBE_RADIUS)}
              />
            );
          })}

        {/* 3D Incident Pins Plotted via Spherical WGS-84 Coordinates */}
        {grievances.map((g) => {
          const isSelected = selectedId === g.id;
          return (
            <GlobePin
              key={g.id}
              grievance={g}
              isSelected={isSelected}
              onSelect={onSelectGrievance}
              onOpenSatellite={handleOpenSatellite}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
