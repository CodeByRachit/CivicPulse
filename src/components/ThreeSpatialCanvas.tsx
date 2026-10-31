'use client';

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { GrievanceRecord } from '@/types/grievance';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type * as LeafletType from 'leaflet';
import { Globe, MapPin, ZoomIn, RotateCcw, Satellite, ArrowLeft, Crosshair } from 'lucide-react';

export interface ThreeSpatialCanvasProps {
  grievances: GrievanceRecord[];
  selectedId: string | null;
  onSelectGrievance: (grievance: GrievanceRecord) => void;
  userCoords: { lat: number; lng: number } | null;
}

const GLOBE_RADIUS = 2.5;

/**
 * WGS-84 (lat, lng) -> 3D Cartesian (x, y, z) on sphere
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
 * 3D Cartesian (x, y, z) -> WGS-84 (lat, lng) on sphere
 */
export function cartesianToLatLng(
  x: number,
  y: number,
  z: number,
  radius: number = GLOBE_RADIUS
): [number, number] {
  const normY = Math.max(-1, Math.min(1, y / radius));
  const phi = Math.acos(normY);
  const lat = 90 - (phi * 180) / Math.PI;
  const theta = Math.atan2(z, -x);
  let lng = (theta * 180) / Math.PI - 180;
  while (lng < -180) lng += 360;
  while (lng > 180) lng -= 360;
  return [Number(lat.toFixed(4)), Number(lng.toFixed(4))];
}

/**
 * 3D Pin on Globe Surface
 */
function GlobePin({
  grievance,
  isSelected,
  onSelect,
  onZoomToSatellite,
}: {
  grievance: GrievanceRecord;
  isSelected: boolean;
  onSelect: (g: GrievanceRecord) => void;
  onZoomToSatellite: (lat: number, lng: number, g: GrievanceRecord) => void;
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
                onZoomToSatellite(grievance.lat, grievance.lng, grievance);
              }}
              className="mt-1.5 w-full py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Satellite className="w-3 h-3 text-sky-400" />
              <span>Zoom to Satellite View</span>
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
 * Camera Flight Controller
 * - Smoothly tracks coordinates facing the user
 * - Automatically triggers satellite zoom if user zooms in close (dist < 3.25)
 * - Throttles React state updates to prevent 60 FPS re-renders
 */
function CameraFlightController({
  targetFocusCoords,
  isUserInteracting,
  onFacingUpdate,
  onAutoZoomTrigger,
}: {
  targetFocusCoords: { lat: number; lng: number } | null;
  isUserInteracting: boolean;
  onFacingUpdate: (lat: number, lng: number) => void;
  onAutoZoomTrigger: (lat: number, lng: number) => void;
}) {
  const { camera } = useThree();
  const lastUpdateRef = useRef<number>(0);
  const isZoomingInRef = useRef<boolean>(false);

  useFrame((_, delta) => {
    // If target coords are provided and user is not actively orbiting, lerp camera towards it
    if (targetFocusCoords && !isUserInteracting && !isZoomingInRef.current) {
      const [tx, ty, tz] = latLngToCartesian(targetFocusCoords.lat, targetFocusCoords.lng, 5.5);
      camera.position.lerp(new THREE.Vector3(tx, ty, tz), delta * 2.5);
      camera.lookAt(0, 0, 0);
    }

    const dist = camera.position.length();

    // Calculate exact point on globe directly facing camera
    const [centerLat, centerLng] = cartesianToLatLng(
      camera.position.x,
      camera.position.y,
      camera.position.z,
      dist
    );

    // If user zooms in very close with mouse wheel or pinch, dive into Satellite view of that spot!
    if (dist < 3.2 && !isZoomingInRef.current) {
      isZoomingInRef.current = true;
      onAutoZoomTrigger(centerLat, centerLng);
    }

    // Throttle UI update to every 120ms so React doesn't re-render 60 times/sec
    const now = performance.now();
    if (now - lastUpdateRef.current > 120) {
      lastUpdateRef.current = now;
      onFacingUpdate(centerLat, centerLng);
    }
  });

  return null;
}

/**
 * Photorealistic 3D Earth Globe Model
 * - Raycast DISABLED on clouds and atmosphere so clicks penetrate to Earth surface
 * - Click or Double-Click detects exact (lat, lng) and initiates zoom
 */
function EarthGlobeModel({
  earthMap,
  cloudsMap,
  onGlobeClick,
}: {
  earthMap: THREE.Texture | null;
  cloudsMap: THREE.Texture | null;
  onGlobeClick: (lat: number, lng: number) => void;
}) {
  const cloudsRef = useRef<THREE.Mesh>(null);
  const pointerDownRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group>
      {/* 1. Real Satellite Earth Sphere with Raycasting Click-to-Zoom */}
      <mesh
        receiveShadow
        castShadow
        onPointerDown={(e) => {
          pointerDownRef.current = {
            x: e.clientX,
            y: e.clientY,
            time: performance.now(),
          };
        }}
        onPointerUp={(e) => {
          if (!pointerDownRef.current) return;
          const dx = e.clientX - pointerDownRef.current.x;
          const dy = e.clientY - pointerDownRef.current.y;
          const dt = performance.now() - pointerDownRef.current.time;
          // Only trigger if this was a genuine click, not a drag-to-rotate gesture
          if (Math.hypot(dx, dy) < 8 && dt < 400) {
            e.stopPropagation();
            const [lat, lng] = cartesianToLatLng(e.point.x, e.point.y, e.point.z, GLOBE_RADIUS);
            onGlobeClick(lat, lng);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          const [lat, lng] = cartesianToLatLng(e.point.x, e.point.y, e.point.z, GLOBE_RADIUS);
          onGlobeClick(lat, lng);
        }}
      >
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={earthMap || undefined}
          color={earthMap ? '#FFFFFF' : '#10375C'}
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>

      {/* 2. Dynamic Wispy Cloud Layer - RAYCAST DISABLED */}
      {cloudsMap && (
        <mesh ref={cloudsRef} raycast={() => null}>
          <sphereGeometry args={[GLOBE_RADIUS + 0.025, 48, 48]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 3. Luminous Blue Atmospheric Scattering Halo - RAYCAST DISABLED */}
      <mesh raycast={() => null}>
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
 * STABLE HIGH-RESOLUTION SATELLITE INSPECTOR (Leaflet)
 * - PURE ESRI SATELLITE IMAGERY (NO ROADS, NO API KEYS, NO WATERMARKS)
 * - Complete immunity to '_leaflet_pos' runtime error via animation controls
 * - Smoothly transitions back to 3D globe if zoomed out past level 3
 */
function StableSatelliteInspector({
  targetCoords,
  grievances,
  selectedId,
  onSelectGrievance,
  userCoords,
  onSwitchToGlobe,
}: {
  targetCoords: { lat: number; lng: number };
  grievances: GrievanceRecord[];
  selectedId: string | null;
  onSelectGrievance: (g: GrievanceRecord) => void;
  userCoords: { lat: number; lng: number } | null;
  onSwitchToGlobe: (coords: { lat: number; lng: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletType.Map | null>(null);
  const layerGroupRef = useRef<LeafletType.LayerGroup | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(16);

  // Render all markers & PostGIS 100m radar circles
  const renderMarkers = useCallback(
    (L: typeof LeafletType, layerGroup: LeafletType.LayerGroup) => {
      layerGroup.clearLayers();

      // Plot All Grievances on real satellite terrain
      grievances.forEach((g) => {
        const isSelected = g.id === selectedId;
        const isCritical = (g.severity_score || 0) >= 8.0;

        // 100m PostGIS Deduplication Radar Ring
        const circle = L.circle([g.lat, g.lng], {
          radius: 100, // Exact 100-meter PostGIS perimeter
          color: isCritical ? '#EF4444' : isSelected ? '#FFFFFF' : '#38BDF8',
          fillColor: isCritical ? '#EF4444' : '#38BDF8',
          fillOpacity: 0.22,
          weight: isSelected ? 3 : 1.8,
          dashArray: '6, 6',
        });
        layerGroup.addLayer(circle);

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
              100m PostGIS Cluster Active
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        layerGroup.addLayer(marker);
      });

      // Target Focus Crosshair Marker if inspecting arbitrary point
      const isViewingIncident = grievances.some(
        (g) => Math.abs(g.lat - targetCoords.lat) < 0.001 && Math.abs(g.lng - targetCoords.lng) < 0.001
      );

      if (!isViewingIncident) {
        const inspectIcon = L.divIcon({
          className: 'inspect-crosshair',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background: #0284C7;
              color: #FFFFFF;
              padding: 4px 8px;
              border-radius: 9999px;
              border: 2px solid #FFFFFF;
              box-shadow: 0 4px 14px rgba(0,0,0,0.4);
              font-size: 10px;
              font-weight: 600;
              white-space: nowrap;
            ">
              <span>● Satellite Focus Target</span>
            </div>
          `,
          iconSize: [140, 24],
          iconAnchor: [70, 12],
        });
        const inspectMarker = L.marker([targetCoords.lat, targetCoords.lng], { icon: inspectIcon });
        layerGroup.addLayer(inspectMarker);
      }

      // User GPS Location Marker
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
    [grievances, selectedId, targetCoords, onSelectGrievance, userCoords]
  );

  // Initialize Map ONCE on mount
  useEffect(() => {
    let isCancelled = false;

    if (!containerRef.current) return;

    import('leaflet').then((L) => {
      if (isCancelled || !containerRef.current || mapRef.current) return;

      // Disabling fadeAnimation & zoomAnimation permanently eliminates '_leaflet_pos' race conditions
      const map = L.map(containerRef.current, {
        center: [targetCoords.lat, targetCoords.lng],
        zoom: 16,
        zoomControl: false,
        fadeAnimation: false,
        zoomAnimation: false,
      });
      mapRef.current = map;

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('zoomend', () => {
        if (!map) return;
        const z = map.getZoom();
        setCurrentZoom(z);

        // If user zooms all the way out past level 3 (global scale), return to 3D Globe!
        if (z <= 3) {
          const center = map.getCenter();
          onSwitchToGlobe({ lat: center.lat, lng: center.lng });
        }
      });

      // Pure Satellite Imagery (Esri World Imagery — NO ROADS, NO API KEYS, HIGH RESOLUTION)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
          minZoom: 2,
        }
      ).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      renderMarkers(L, layerGroup);
    });

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.stop();
          mapRef.current.off();
          mapRef.current.remove();
        } catch {
          // ignore unmount errors
        }
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []); // Run ONCE on mount!

  // Update markers when grievances list or selectedId updates
  useEffect(() => {
    if (mapRef.current && layerGroupRef.current) {
      import('leaflet').then((L) => {
        if (mapRef.current && layerGroupRef.current) {
          renderMarkers(L, layerGroupRef.current);
        }
      });
    }
  }, [renderMarkers]);

  // Pan to new target coordinates smoothly when changed
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo([targetCoords.lat, targetCoords.lng]);
    }
  }, [targetCoords]);

  const handleReturnToGlobe = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      onSwitchToGlobe({ lat: center.lat, lng: center.lng });
    } else {
      onSwitchToGlobe(targetCoords);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-950">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleReturnToGlobe}
            className="bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-md hover:bg-neutral-100 px-3.5 py-1.5 rounded-full text-xs font-semibold text-neutral-900 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-700" />
            <span>← Return to 3D Globe</span>
          </button>

          <div className="bg-black/80 backdrop-blur-md border border-neutral-700/80 shadow-md px-3.5 py-1.5 rounded-full text-xs text-neutral-200 font-medium hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Satellite Focus: {targetCoords.lat.toFixed(4)}°N, {targetCoords.lng.toFixed(4)}°E (Zoom {currentZoom}x)
            </span>
          </div>
        </div>

        {/* 100m Deduplication Sector Badge */}
        <div className="bg-black/80 backdrop-blur-md border border-neutral-700/80 shadow-md px-3 py-1.5 rounded-full text-xs text-sky-400 font-medium flex items-center gap-1.5 pointer-events-auto">
          <div className="w-2 h-2 rounded-full border border-dashed border-sky-400" />
          <span>100m PostGIS Radar Active</span>
        </div>
      </div>

      {/* Leaflet Satellite DOM Container */}
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}

/**
 * UNIFIED DUAL-ENGINE GEOSPATIAL VIEWPORT
 * - Mode 1: 3D Earth Globe with NASA Satellite Imagery + Click / Scroll to dive into satellite
 * - Mode 2: High-Resolution Satellite Inspector (Centers directly on clicked coordinates, no roads)
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

  // Dynamic initial coordinates based on user GPS or first grievance or Greenwich
  const initialCenter = useMemo<{ lat: number; lng: number }>(() => {
    if (userCoords) return userCoords;
    if (selectedId) {
      const g = grievances.find((item) => item.id === selectedId);
      if (g) return { lat: g.lat, lng: g.lng };
    }
    if (grievances.length > 0) {
      return { lat: grievances[0].lat, lng: grievances[0].lng };
    }
    return { lat: 20.0, lng: 0.0 };
  }, [userCoords, selectedId, grievances]);

  // Coordinates currently facing user on 3D globe
  const [facingCoords, setFacingCoords] = useState<{ lat: number; lng: number }>(initialCenter);

  // Target coordinates for satellite inspector
  const [satelliteTarget, setSatelliteTarget] = useState<{ lat: number; lng: number }>(initialCenter);

  // Target coordinates to steer 3D globe camera towards
  const [targetFocusCoords, setTargetFocusCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  // Update target when an incident is selected
  useEffect(() => {
    if (selectedId) {
      const g = grievances.find((item) => item.id === selectedId);
      if (g) {
        setTargetFocusCoords({ lat: g.lat, lng: g.lng });
        setSatelliteTarget({ lat: g.lat, lng: g.lng });
      }
    }
  }, [selectedId, grievances]);

  // Recenter Globe Camera
  const handleResetGlobe = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  // Click directly on 3D Globe -> Open satellite view at clicked (lat, lng)!
  const handleGlobeClick = (lat: number, lng: number) => {
    setSatelliteTarget({ lat, lng });
    setViewMode('satellite');
  };

  // Zoom to specific incident pin
  const handlePinZoom = (lat: number, lng: number, g: GrievanceRecord) => {
    onSelectGrievance(g);
    setSatelliteTarget({ lat, lng });
    setViewMode('satellite');
  };

  // Zoom into whatever location is currently facing the camera
  const handleZoomFacing = () => {
    setSatelliteTarget(facingCoords);
    setViewMode('satellite');
  };

  // Auto-triggered when user scrolls in close on the 3D globe
  const handleAutoZoomIn = (lat: number, lng: number) => {
    setSatelliteTarget({ lat, lng });
    setViewMode('satellite');
  };

  // Return from satellite to 3D globe, facing the same coordinates
  const handleSwitchToGlobe = (coords: { lat: number; lng: number }) => {
    setTargetFocusCoords(coords);
    setFacingCoords(coords);
    setViewMode('globe');
  };

  // Calculate initial camera position facing initial coordinates
  const initialCameraPos = useMemo<[number, number, number]>(() => {
    return latLngToCartesian(initialCenter.lat, initialCenter.lng, 5.8);
  }, [initialCenter]);

  // If in satellite mode, render the crash-free satellite inspector
  if (viewMode === 'satellite') {
    return (
      <StableSatelliteInspector
        targetCoords={satelliteTarget}
        grievances={grievances}
        selectedId={selectedId}
        onSelectGrievance={onSelectGrievance}
        userCoords={userCoords}
        onSwitchToGlobe={handleSwitchToGlobe}
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
          <span className="text-neutral-600 font-mono text-[11px]">
            Facing: {facingCoords.lat.toFixed(1)}°N, {facingCoords.lng.toFixed(1)}°E
          </span>
        </div>

        {/* Zoom into Facing Location Button */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={handleZoomFacing}
            className="bg-white/95 backdrop-blur-md text-neutral-900 border border-neutral-200/90 hover:bg-neutral-100 shadow-md px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <ZoomIn className="w-3.5 h-3.5 text-sky-600" />
            <span>Zoom into Satellite View</span>
            <span className="text-neutral-400">→</span>
          </button>
        </div>
      </div>

      {/* Helpful Hint Overlay */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center">
        <div className="bg-black/75 backdrop-blur-md border border-neutral-700/80 shadow-md rounded-full px-4 py-1.5 text-xs text-neutral-200">
          💡 Click or double-click anywhere on Earth, or scroll inward to dive into satellite imagery
        </div>
      </div>

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
      </div>

      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: initialCameraPos, fov: 44 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#030712']} />

        {/* Clean Studio Three-Point Lighting */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[15, 20, 15]} intensity={1.3} />
        <directionalLight position={[-15, -10, -15]} intensity={0.4} />

        {/* Orbit Controls with Smooth Damping and Zoom */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          autoRotate={autoRotate && !isUserInteracting && !targetFocusCoords}
          autoRotateSpeed={0.45}
          enableDamping
          dampingFactor={0.06}
          minDistance={2.9}
          maxDistance={12.0}
          onStart={() => setIsUserInteracting(true)}
          onEnd={() => setIsUserInteracting(false)}
        />

        {/* Camera Flight & Zoom Controller */}
        <CameraFlightController
          targetFocusCoords={targetFocusCoords}
          isUserInteracting={isUserInteracting}
          onFacingUpdate={(lat, lng) => setFacingCoords({ lat, lng })}
          onAutoZoomTrigger={handleAutoZoomIn}
        />

        {/* Photorealistic 3D Earth with Direct Click-to-Zoom */}
        <EarthGlobeModel
          earthMap={earthMap}
          cloudsMap={cloudsMap}
          onGlobeClick={handleGlobeClick}
        />

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
              onZoomToSatellite={handlePinZoom}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
