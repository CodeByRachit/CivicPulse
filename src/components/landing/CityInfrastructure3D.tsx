'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, Billboard } from '@react-three/drei';
import * as THREE from 'three';

// 3D Defect Incidents situated visibly across the terraced urban digital twin
export interface CityDefect {
  id: string;
  department: string;
  departmentCode: string;
  title: string;
  severity: number;
  color: string;
  position: [number, number, number];
  diagnosis: string;
  targetRotY: number; // Optimal viewing angle for turntable rotation
}

export const CITY_DEFECTS: CityDefect[] = [
  {
    id: 'defect-road',
    department: 'Roads & Works',
    departmentCode: 'PWD-ROADS',
    title: 'Arterial Asphalt Failure',
    severity: 8.9,
    color: '#ef4444',
    position: [-0.4, 1.65, -0.2],
    diagnosis: 'Structural subbase collapse detected on East Arterial Lane.',
    targetRotY: 0.25,
  },
  {
    id: 'defect-water',
    department: 'Water & Drainage',
    departmentCode: 'WATER-DRAIN',
    title: 'Stormwater Culvert Flooding',
    severity: 8.2,
    color: '#06b6d4',
    position: [0.45, 1.65, 1.1],
    diagnosis: 'Debris blockage causing 35cm surface water backflow.',
    targetRotY: -1.05,
  },
  {
    id: 'defect-power',
    department: 'Power & Electric',
    departmentCode: 'ELEC-POWER',
    title: 'High-Voltage Cable Exposure',
    severity: 9.4,
    color: '#a855f7',
    position: [1.1, 1.65, -0.35],
    diagnosis: 'Insulation abrasion on 440V aerial junction node.',
    targetRotY: 1.15,
  },
];

// Building definition for terraced urban massing
interface BuildingData {
  id: string;
  name: string;
  pos: [number, number, number];
  size: [number, number, number];
  department: string;
  deptColor: string;
  hasSteppedRoof?: boolean;
  hasAntenna?: boolean;
}

// Procedural 3D Billboard Badge Textures (Zero DOM / Zero React 19 Root Unmount Errors)
function usePillTextures() {
  return useMemo(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return { defectBadges: {}, buildingTooltips: {} };
    }

    const defectBadges: Record<string, THREE.CanvasTexture> = {};
    CITY_DEFECTS.forEach((d) => {
      const canvas = document.createElement('canvas');
      canvas.width = 440;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark glass container
      ctx.fillStyle = 'rgba(9, 9, 11, 0.94)';
      ctx.beginPath();
      ctx.roundRect(4, 4, 440 - 8, 80 - 8, 38);
      ctx.fill();

      // Border in defect accent
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Glowing dot
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(40, 40, 10, 0, Math.PI * 2);
      ctx.fill();

      // Severity text
      ctx.fillStyle = d.color;
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${d.severity} CRITICAL`, 66, 48);

      // Status text
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('• LIVE SENSOR', 255, 47);

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      defectBadges[d.id] = texture;
    });

    const buildingTooltips: Record<string, THREE.CanvasTexture> = {};
    const buildingNames: Record<string, string> = {
      'b-nw-1': 'Tower NW-1 (Civic Spire)',
      'b-nw-2': 'Block NW-2 (Arterial Center)',
      'b-ne-1': 'Tower NE-1 (Grid Plaza)',
      'b-ne-2': 'Block NE-2 (Power Terminal)',
      'b-sw-1': 'Building SW-1 (Water Works)',
      'b-sw-2': 'Pavilion SW-2 (Culvert Node)',
      'b-se-1': 'Building SE-1 (Municipal Hub)',
      'b-se-2': 'Terrace SE-2 (Telemetry Wing)',
    };

    Object.entries(buildingNames).forEach(([id, name]) => {
      const canvas = document.createElement('canvas');
      canvas.width = 460;
      canvas.height = 70;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = 'rgba(9, 9, 11, 0.94)';
      ctx.beginPath();
      ctx.roundRect(3, 3, 460 - 6, 70 - 6, 16);
      ctx.fill();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(name, 22, 43);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace';
      ctx.fillText('• Nominal', 355, 42);

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      buildingTooltips[id] = texture;
    });

    return { defectBadges, buildingTooltips };
  }, []);
}

// Realistic Modern Curtain-Wall Window Texture Generator (512x1024)
// High-resolution architectural glass & steel texture with visible unlit panes & warm/cool daylight illumination
function useModernCurtainWallTexture() {
  return useMemo(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return { diffuse: null, emissive: null };
    }

    const width = 512;
    const height = 1024;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { diffuse: null, emissive: null };

    const emissiveCanvas = document.createElement('canvas');
    emissiveCanvas.width = width;
    emissiveCanvas.height = height;
    const eCtx = emissiveCanvas.getContext('2d');
    if (!eCtx) return { diffuse: null, emissive: null };

    // 1. Core architectural slate-navy wall background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Emissive base black (zero glow on solid structural spandrels)
    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, width, height);

    // 2. Continuous Floor Grid Across Entire Height (12 floors)
    const topMargin = Math.round(height * 0.08); // 82px solid parapet
    const bottomMargin = Math.round(height * 0.08); // 82px solid lobby
    const usableHeight = height - topMargin - bottomMargin; // 860px

    const rows = 12; // 12 floors
    const floorH = usableHeight / rows; // ~71.6px
    const spandrelH = 22; // 22px dark slate spandrel
    const windowH = Math.round(floorH - spandrelH); // ~50px window pane

    const cols = 4; // 4 columns per face
    const sideMargin = 22;
    const mullionW = 8; // 8px vertical structural mullion
    const usableWidth = width - sideMargin * 2;
    const windowW = Math.round((usableWidth - mullionW * (cols - 1)) / cols); // ~110px

    // Fixed deterministic pseudo-random seed
    let seed = 8921;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Draw horizontal floor spandrel bands
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r <= rows; r++) {
      const y = topMargin + r * floorH - spandrelH / 2;
      ctx.fillRect(0, y, width, spandrelH);
    }

    // Draw vertical structural mullions
    ctx.fillStyle = '#334155';
    for (let c = 0; c < cols - 1; c++) {
      const x = sideMargin + (c + 1) * windowW + c * mullionW;
      ctx.fillRect(x, topMargin, mullionW, usableHeight);
    }

    // Realistic interior light tones (warm daylight white & soft sky ice-blue)
    const litTones = [
      { diffuse: '#fef3c7', emissive: '#fef3c7' }, // Soft warm incandescent white
      { diffuse: '#f8fafc', emissive: '#f8fafc' }, // Pure daylight white
      { diffuse: '#bae6fd', emissive: '#7dd3fc' }, // Sky ice-blue daylight reflection
      { diffuse: '#cbd5e1', emissive: '#94a3b8' }, // Subdued overcast daylight
    ];

    // Populate every window slot with visible glass and 25%-30% natural horizontal office illumination
    for (let r = 0; r < rows; r++) {
      const y = topMargin + r * floorH + Math.round(spandrelH * 0.5);

      // Determine if this floor has an active illuminated office cluster
      const floorLitSeed = pseudoRandom();
      const isFloorActive = floorLitSeed < 0.45;
      const litStartIndex = isFloorActive ? Math.floor(pseudoRandom() * 2) : -1;
      const litCount = isFloorActive ? (pseudoRandom() > 0.4 ? 2 : 3) : 0;
      const floorTone = litTones[Math.floor(pseudoRandom() * litTones.length)];

      for (let c = 0; c < cols; c++) {
        const x = sideMargin + c * (windowW + mullionW);

        // Window recess border
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x - 1, y - 1, windowW + 2, windowH + 2);

        const isSlotLit =
          isFloorActive && c >= litStartIndex && c < litStartIndex + litCount;

        if (isSlotLit) {
          // Lit office interior
          ctx.fillStyle = floorTone.diffuse;
          ctx.fillRect(x, y, windowW, windowH);

          // Subtle horizontal window mullion divider inside each pane
          ctx.fillStyle = '#64748b';
          ctx.fillRect(x, y + Math.round(windowH * 0.48), windowW, 2);

          // Emissive map glow
          eCtx.fillStyle = floorTone.emissive;
          eCtx.fillRect(x, y, windowW, windowH);
        } else {
          // Visible unlit architectural steel-blue / slate glass tone
          const unlitTone = pseudoRandom() > 0.5 ? '#334155' : '#3b4f6b';
          ctx.fillStyle = unlitTone;
          ctx.fillRect(x, y, windowW, windowH);

          // Subtle internal glazing mullion
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y + Math.round(windowH * 0.48), windowW, 2);
        }
      }
    }

    const diffuseTexture = new THREE.CanvasTexture(canvas);
    diffuseTexture.wrapS = THREE.RepeatWrapping;
    diffuseTexture.wrapT = THREE.RepeatWrapping;
    diffuseTexture.magFilter = THREE.LinearFilter;
    diffuseTexture.minFilter = THREE.LinearMipmapLinearFilter;

    const emissiveTexture = new THREE.CanvasTexture(emissiveCanvas);
    emissiveTexture.wrapS = THREE.RepeatWrapping;
    emissiveTexture.wrapT = THREE.RepeatWrapping;
    emissiveTexture.magFilter = THREE.LinearFilter;
    emissiveTexture.minFilter = THREE.LinearMipmapLinearFilter;

    return { diffuse: diffuseTexture, emissive: emissiveTexture };
  }, []);
}

// Visible 3D Defect Beacon with Laser Tether & Ground Radar Wave
function DefectBeacon({
  defect,
  isSelected,
  onSelect,
  badgeTexture,
}: {
  defect: CityDefect;
  isSelected: boolean;
  onSelect: (d: CityDefect) => void;
  badgeTexture?: THREE.CanvasTexture;
}) {
  const ringRef = useRef<THREE.Group>(null);
  const pinRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.scale.x += delta * 1.4;
      ringRef.current.scale.y += delta * 1.4;
      if (ringRef.current.scale.x > 3.0) {
        ringRef.current.scale.set(1, 1, 1);
      }
    }
    if (pinRef.current) {
      pinRef.current.position.y =
        defect.position[1] + Math.sin(state.clock.elapsedTime * 3.5) * 0.08;
      pinRef.current.rotation.y += delta * 1.8;
    }
  });

  return (
    <group position={[defect.position[0], 0, defect.position[2]]}>
      {/* Ground Target Ring at y = 0.03 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.16, 0.22, 32]} />
        <meshBasicMaterial color={defect.color} transparent opacity={0.9} />
      </mesh>

      {/* Pulsing Ground Radar Wave Ring at y = 0.025 */}
      <group ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <mesh>
          <ringGeometry args={[0.2, 0.28, 32]} />
          <meshBasicMaterial color={defect.color} transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Vertical Glowing Laser Tether connecting ground to beacon head */}
      <mesh position={[0, defect.position[1] / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, defect.position[1], 12]} />
        <meshBasicMaterial
          color={defect.color}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Floating 3D Octahedron Beacon Head */}
      <mesh
        ref={pinRef}
        position={[0, defect.position[1], 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(defect);
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <octahedronGeometry args={[isSelected ? 0.22 : 0.16, 0]} />
        <meshStandardMaterial
          color={defect.color}
          emissive={defect.color}
          emissiveIntensity={isSelected ? 1.6 : 0.9}
          roughness={0.15}
          metalness={0.8}
        />
      </mesh>

      {/* Active Sensor 3D Billboard Telemetry Badge (Pure WebGL - Zero DOM unmount error) */}
      {isSelected && badgeTexture && (
        <Billboard
          position={[0, defect.position[1] + 0.45, 0]}
          follow={true}
        >
          <mesh renderOrder={999}>
            <planeGeometry args={[1.5, 0.28]} />
            <meshBasicMaterial
              map={badgeTexture}
              transparent
              opacity={0.96}
              depthTest={false}
            />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

// Expanding LiDAR Scan Wave Triggered on Department Switch
function LidarScanWave({
  accentColor,
  triggerKey,
}: {
  accentColor: string;
  triggerKey: number;
}) {
  const waveRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [triggerKey]);

  useFrame((_, delta) => {
    if (progress < 1) {
      const nextP = Math.min(1, progress + delta * 1.2);
      setProgress(nextP);
      if (waveRef.current) {
        const radius = THREE.MathUtils.lerp(0.2, 5.5, nextP);
        waveRef.current.scale.set(radius, radius, 1);
        (waveRef.current.material as THREE.MeshBasicMaterial).opacity =
          (1 - nextP) * 0.75;
      }
    }
  });

  return (
    <mesh
      ref={waveRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.04, 0]}
    >
      <ringGeometry args={[0.95, 1.0, 48]} />
      <meshBasicMaterial
        color={accentColor}
        transparent
        opacity={progress < 1 ? (1 - progress) * 0.75 : 0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Ambient Autonomous Traffic Telemetry Streaks on Roadways
function AmbientTrafficTelemetry() {
  const streaksRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!streaksRef.current) return;
    const t = state.clock.elapsedTime;
    const children = streaksRef.current.children;

    // North-South Lane 1 (Moving South)
    if (children[0]) {
      children[0].position.z = -2.0 + ((t * 0.9) % 4.0);
    }
    // North-South Lane 2 (Moving North)
    if (children[1]) {
      children[1].position.z = 2.0 - ((t * 1.1 + 1.2) % 4.0);
    }
    // East-West Lane 1 (Moving East)
    if (children[2]) {
      children[2].position.x = -2.0 + ((t * 0.85 + 0.6) % 4.0);
    }
    // East-West Lane 2 (Moving West)
    if (children[3]) {
      children[3].position.x = 2.0 - ((t * 1.05 + 2.0) % 4.0);
    }
  });

  return (
    <group ref={streaksRef} position={[0, 0.03, 0]}>
      {/* NS Southbound Cyan */}
      <mesh position={[0.16, 0, -1.0]}>
        <boxGeometry args={[0.07, 0.02, 0.28]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      {/* NS Northbound Red */}
      <mesh position={[-0.16, 0, 1.0]}>
        <boxGeometry args={[0.07, 0.02, 0.28]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
      {/* EW Eastbound Amber */}
      <mesh position={[-1.0, 0, 0.16]}>
        <boxGeometry args={[0.28, 0.02, 0.07]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      {/* EW Westbound Cyan */}
      <mesh position={[1.0, 0, -0.16]}>
        <boxGeometry args={[0.28, 0.02, 0.07]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

// Single Interactive Terraced Skyscraper Building
function InteractiveBuilding({
  building,
  diffuse,
  emissive,
  isSelectedDepartment,
  onSelectDepartment,
  tooltipTexture,
}: {
  building: BuildingData;
  diffuse: THREE.CanvasTexture | null;
  emissive: THREE.CanvasTexture | null;
  isSelectedDepartment: boolean;
  onSelectDepartment: (deptId: string) => void;
  tooltipTexture?: THREE.CanvasTexture;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetScaleY = isHovered ? 1.04 : 1.0;
    meshRef.current.scale.y = THREE.MathUtils.lerp(
      meshRef.current.scale.y,
      targetScaleY,
      delta * 8
    );
  });

  const edgeColor = isHovered
    ? '#10b981'
    : isSelectedDepartment
    ? building.deptColor
    : '#475569';

  return (
    <group
      ref={meshRef}
      position={[building.pos[0], building.pos[1], building.pos[2]]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectDepartment(building.department);
      }}
    >
      {/* Core Architectural Slate Building Volume */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry
          args={[building.size[0], building.size[1], building.size[2]]}
        />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.35}
          metalness={0.25}
          map={diffuse ?? undefined}
          emissiveMap={emissive ?? undefined}
          emissive="#e2e8f0"
          emissiveIntensity={0.45}
        />
        {/* CAD Architectural Wireframe Edges */}
        <Edges threshold={15} color={edgeColor} />
      </mesh>

      {/* Rooftop Stepped Podium / Mechanical Tier in Lighter Steel-Slate (#334155) */}
      <mesh position={[0, building.size[1] / 2 + 0.06, 0]}>
        <boxGeometry
          args={[building.size[0] * 0.75, 0.12, building.size[2] * 0.75]}
        />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
        <Edges threshold={15} color="#64748b" />
      </mesh>

      {/* Secondary Top HVAC Box on Tall Buildings */}
      {building.hasSteppedRoof && (
        <mesh position={[0, building.size[1] / 2 + 0.16, 0]}>
          <boxGeometry
            args={[building.size[0] * 0.45, 0.09, building.size[2] * 0.45]}
          />
          <meshStandardMaterial color="#475569" roughness={0.5} />
          <Edges threshold={15} color="#94a3b8" />
        </mesh>
      )}

      {/* Rooftop Spire / Communication Antenna on Landmark Towers */}
      {building.hasAntenna && (
        <mesh position={[0, building.size[1] / 2 + 0.35, 0]}>
          <cylinderGeometry args={[0.012, 0.02, 0.45, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

      {/* Sleek Floating 3D Billboard Micro-Tooltip on Hover (Zero DOM / Zero React 19 Unmount Error) */}
      {isHovered && tooltipTexture && (
        <Billboard
          position={[0, building.size[1] / 2 + 0.42, 0]}
          follow={true}
        >
          <mesh renderOrder={999}>
            <planeGeometry args={[1.6, 0.25]} />
            <meshBasicMaterial
              map={tooltipTexture}
              transparent
              opacity={0.96}
              depthTest={false}
            />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

// 3D Isometric Terraced City Block with Stadium Hierarchy
function TerracedIsometricCity({
  onSelectDefect,
  selectedDefectId,
  selectedDefect,
}: {
  onSelectDefect: (d: CityDefect) => void;
  selectedDefectId: string | null;
  selectedDefect: CityDefect;
}) {
  const { diffuse, emissive } = useModernCurtainWallTexture();
  const { defectBadges, buildingTooltips } = usePillTextures();
  const [scanTrigger, setScanTrigger] = useState(0);

  useEffect(() => {
    setScanTrigger((prev) => prev + 1);
  }, [selectedDefectId]);

  // Terraced Building Hierarchy (Back = Tall high-rises 2.9-3.6, Front = Low mid-rises 1.2-1.7)
  const buildings: BuildingData[] = useMemo(
    () => [
      // ── BACK-LEFT QUADRANT (NW: Tall Landmark Towers) ──────────────
      {
        id: 'b-nw-1',
        name: 'Tower NW-1 (Civic Spire)',
        pos: [-1.25, 1.8, -1.25],
        size: [0.85, 3.6, 0.85],
        department: 'PWD-ROADS',
        deptColor: '#ef4444',
        hasSteppedRoof: true,
        hasAntenna: true,
      },
      {
        id: 'b-nw-2',
        name: 'Block NW-2 (Arterial Center)',
        pos: [-0.48, 1.55, -1.3],
        size: [0.75, 3.1, 0.75],
        department: 'PWD-ROADS',
        deptColor: '#ef4444',
        hasSteppedRoof: true,
      },

      // ── BACK-RIGHT QUADRANT (NE: Tall Landmark Towers) ─────────────
      {
        id: 'b-ne-1',
        name: 'Tower NE-1 (Grid Plaza)',
        pos: [1.25, 1.7, -1.25],
        size: [0.85, 3.4, 0.85],
        department: 'ELEC-POWER',
        deptColor: '#a855f7',
        hasSteppedRoof: true,
        hasAntenna: true,
      },
      {
        id: 'b-ne-2',
        name: 'Block NE-2 (Power Terminal)',
        pos: [1.25, 1.45, -0.45],
        size: [0.75, 2.9, 0.75],
        department: 'ELEC-POWER',
        deptColor: '#a855f7',
        hasSteppedRoof: true,
      },

      // ── FRONT-LEFT QUADRANT (SW: Stepped Mid-Rise 1.3-1.7) ─────────
      {
        id: 'b-sw-1',
        name: 'Building SW-1 (Water Works)',
        pos: [-1.2, 0.85, 1.2],
        size: [0.8, 1.7, 0.8],
        department: 'WATER-DRAIN',
        deptColor: '#06b6d4',
        hasSteppedRoof: false,
      },
      {
        id: 'b-sw-2',
        name: 'Pavilion SW-2 (Culvert Node)',
        pos: [-1.3, 0.65, 0.4],
        size: [0.7, 1.3, 0.7],
        department: 'WATER-DRAIN',
        deptColor: '#06b6d4',
        hasSteppedRoof: false,
      },

      // ── FRONT-RIGHT QUADRANT (SE: Stepped Mid-Rise 1.2-1.5) ────────
      {
        id: 'b-se-1',
        name: 'Building SE-1 (Municipal Hub)',
        pos: [1.2, 0.75, 1.2],
        size: [0.8, 1.5, 0.8],
        department: 'PWD-ROADS',
        deptColor: '#ef4444',
        hasSteppedRoof: false,
      },
      {
        id: 'b-se-2',
        name: 'Terrace SE-2 (Telemetry Wing)',
        pos: [0.45, 0.6, 1.35],
        size: [0.7, 1.2, 0.7],
        department: 'PWD-ROADS',
        deptColor: '#ef4444',
        hasSteppedRoof: false,
      },
    ],
    []
  );

  const handleSelectDepartment = (deptCode: string) => {
    const match = CITY_DEFECTS.find((d) => d.departmentCode === deptCode);
    if (match) onSelectDefect(match);
  };

  return (
    <group>
      {/* Lower Bevel Base Plate */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[3.8, 0.22, 3.8]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.55}
          metalness={0.3}
        />
        <Edges threshold={15} color="#334155" />
      </mesh>

      {/* Architectural Dark Slate Top Base Plate */}
      <mesh position={[0, -0.01, 0]}>
        <boxGeometry args={[3.74, 0.03, 3.74]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.45}
          metalness={0.25}
        />
        <Edges threshold={15} color="#475569" />
      </mesh>

      {/* Surface Ground Lot Tile */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.65, 3.65]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Arterial Road Grid (Dark Graphite Asphalt) */}
      {/* North-South Avenue */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.72, 3.65]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* East-West Boulevard */}
      <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.65, 0.72]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Road Center Dashed Yellow Lines */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.035, 3.5]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.035, 3.5]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.85} />
      </mesh>

      {/* Pedestrian Crosswalk Stripes at Central Intersection */}
      {[-0.42, 0.42].map((offset, idx) => (
        <group key={`crosswalk-${idx}`} position={[0, 0.027, offset]}>
          {[-0.24, -0.12, 0, 0.12, 0.24].map((xPos, sIdx) => (
            <mesh
              key={sIdx}
              position={[xPos, 0, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.06, 0.15]} />
              <meshBasicMaterial color="#e2e8f0" transparent opacity={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Expanding Department LiDAR Scan Wave on Switch */}
      <LidarScanWave
        accentColor={selectedDefect.color}
        triggerKey={scanTrigger}
      />

      {/* Live Autonomous Traffic Telemetry Streaks */}
      <AmbientTrafficTelemetry />

      {/* Terraced Skyscraper Buildings */}
      {buildings.map((b) => (
        <InteractiveBuilding
          key={b.id}
          building={b}
          diffuse={diffuse}
          emissive={emissive}
          isSelectedDepartment={b.department === selectedDefect.departmentCode}
          onSelectDepartment={handleSelectDepartment}
          tooltipTexture={buildingTooltips[b.id]}
        />
      ))}

      {/* Underground Municipal Pipeline (Glowing Cyan Drainage Conduit) */}
      <group position={[0, -0.05, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.42, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 3.5, 16]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#06b6d4"
            emissiveIntensity={0.85}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* Visible 3D Defect Beacons with Laser Tethers & Pulsing Rings */}
      {CITY_DEFECTS.map((defect) => (
        <DefectBeacon
          key={defect.id}
          defect={defect}
          isSelected={defect.id === selectedDefectId}
          onSelect={onSelectDefect}
          badgeTexture={defectBadges[defect.id]}
        />
      ))}
    </group>
  );
}

// Master Responsive & Scroll-Reactive 3D City Container
function ScrollReactiveCity({
  onSelectDefect,
  selectedDefectId,
  selectedDefect,
  scrollRef,
}: {
  onSelectDefect: (d: CityDefect) => void;
  selectedDefectId: string | null;
  selectedDefect: CityDefect;
  scrollRef: React.MutableRefObject<{ y: number; progress: number }>;
}) {
  const cityGroupRef = useRef<THREE.Group>(null);
  const { size } = useThree();

  // Responsive base coordinates: Scaled up to large commanding stage size
  const { baseX, baseY, targetScale } = useMemo(() => {
    if (size.width >= 1024) {
      return { baseX: 0, baseY: -0.55, targetScale: 1.55 };
    }
    if (size.width >= 768) {
      return { baseX: 0, baseY: -0.60, targetScale: 1.40 };
    }
    return { baseX: 0, baseY: -0.65, targetScale: 1.20 };
  }, [size.width]);

  useFrame((_, delta) => {
    if (!cityGroupRef.current) return;
    const smooth = Math.min(1, delta * 5);
    const p = scrollRef.current.progress;

    // Turntable Y-Rotation: Blends optimal viewing angle for active defect with page scroll
    const targetYRot = selectedDefect.targetRotY + p * Math.PI * 0.5;
    cityGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      cityGroupRef.current.rotation.y,
      targetYRot,
      smooth
    );

    // Subtle isometric pitch
    const targetXRot = p * 0.12;
    cityGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      cityGroupRef.current.rotation.x,
      targetXRot,
      smooth
    );

    // Subtle vertical parallax
    cityGroupRef.current.position.y = THREE.MathUtils.lerp(
      cityGroupRef.current.position.y,
      baseY + p * 0.15,
      smooth
    );

    // Responsive scale
    cityGroupRef.current.scale.x = THREE.MathUtils.lerp(
      cityGroupRef.current.scale.x,
      targetScale,
      smooth
    );
    cityGroupRef.current.scale.y = THREE.MathUtils.lerp(
      cityGroupRef.current.scale.y,
      targetScale,
      smooth
    );
    cityGroupRef.current.scale.z = THREE.MathUtils.lerp(
      cityGroupRef.current.scale.z,
      targetScale,
      smooth
    );
  });

  return (
    <group
      ref={cityGroupRef}
      position={[baseX, baseY, 0]}
      scale={[targetScale, targetScale, targetScale]}
    >
      <TerracedIsometricCity
        onSelectDefect={onSelectDefect}
        selectedDefectId={selectedDefectId}
        selectedDefect={selectedDefect}
      />
    </group>
  );
}

interface CityInfrastructure3DProps {
  onSelectDefect?: (defect: CityDefect) => void;
  activeDefectId?: string | null;
}

export default function CityInfrastructure3D({
  onSelectDefect,
  activeDefectId,
}: CityInfrastructure3DProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    CITY_DEFECTS[0].id
  );

  const selectedId = activeDefectId || internalSelectedId;
  const currentDefect =
    CITY_DEFECTS.find((d) => d.id === selectedId) || CITY_DEFECTS[0];

  const handleSelect = (d: CityDefect) => {
    setInternalSelectedId(d.id);
    if (onSelectDefect) onSelectDefect(d);
  };

  // Passive scroll state tracking with zero React re-renders
  const scrollRef = useRef({ y: 0, progress: 0 });

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current.y = window.scrollY;
      const maxScroll = Math.max(1, window.innerHeight);
      scrollRef.current.progress = Math.min(
        1,
        Math.max(0, window.scrollY / maxScroll)
      );
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none touch-pan-y bg-white">
      <Canvas
        camera={{ position: [6.5, 5.8, 6.5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        {/* 3-Point Architectural Lighting Setup for High-Contrast Tonal Separation */}
        <ambientLight intensity={1.1} color="#f8fafc" />
        <hemisphereLight args={['#ffffff', '#475569', 1.2]} />

        {/* Primary Key Light (Sun) */}
        <directionalLight
          position={[12, 18, 10]}
          intensity={2.2}
          color="#ffffff"
          castShadow
        />

        {/* Cool Rim / Fill Light from Opposite Angle */}
        <directionalLight
          position={[-10, 10, -10]}
          intensity={1.1}
          color="#38bdf8"
        />

        <ScrollReactiveCity
          onSelectDefect={handleSelect}
          selectedDefectId={selectedId}
          selectedDefect={currentDefect}
          scrollRef={scrollRef}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI * 0.44}
          minPolarAngle={Math.PI * 0.22}
        />
      </Canvas>
    </div>
  );
}
