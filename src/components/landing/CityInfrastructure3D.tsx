'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 3D Defect Incidents situated across the isometric city block
export interface CityDefect {
  id: string;
  department: string;
  departmentCode: string;
  title: string;
  severity: number;
  color: string;
  position: [number, number, number];
  diagnosis: string;
}

export const CITY_DEFECTS: CityDefect[] = [
  {
    id: 'defect-road',
    department: 'Roads & Works',
    departmentCode: 'PWD-ROADS',
    title: 'Arterial Asphalt Failure',
    severity: 8.9,
    color: '#ef4444',
    position: [0.8, 0.15, -0.6],
    diagnosis: 'Structural subbase collapse detected on East Arterial Lane.',
  },
  {
    id: 'defect-water',
    department: 'Water & Drainage',
    departmentCode: 'WATER-DRAIN',
    title: 'Stormwater Culvert Flooding',
    severity: 8.2,
    color: '#06b6d4',
    position: [-1.4, 0.15, 0.9],
    diagnosis: 'Debris blockage causing 35cm surface water backflow.',
  },
  {
    id: 'defect-power',
    department: 'Power & Electric',
    departmentCode: 'ELEC-POWER',
    title: 'High-Voltage Cable Exposure',
    severity: 9.4,
    color: '#a855f7',
    position: [1.3, 0.35, 1.2],
    diagnosis: 'Insulation abrasion on 440V aerial junction node.',
  },
];

// Interactive Defect Beacon in 3D Space
function DefectBeacon({
  defect,
  isSelected,
  onSelect,
}: {
  defect: CityDefect;
  isSelected: boolean;
  onSelect: (d: CityDefect) => void;
}) {
  const ringRef = useRef<THREE.Group>(null);
  const pinRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.scale.x += delta * 1.3;
      ringRef.current.scale.y += delta * 1.3;
      if (ringRef.current.scale.x > 3.0) {
        ringRef.current.scale.set(1, 1, 1);
      }
    }
    if (pinRef.current) {
      pinRef.current.position.y =
        defect.position[1] + Math.sin(state.clock.elapsedTime * 3.2) * 0.09;
      pinRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group position={defect.position}>
      {/* Ground Target Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.14, 0.19, 28]} />
        <meshBasicMaterial color={defect.color} transparent opacity={0.85} />
      </mesh>

      {/* Pulsing Radar Wave Ring */}
      <group ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <mesh>
          <ringGeometry args={[0.18, 0.25, 28]} />
          <meshBasicMaterial color={defect.color} transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Floating 3D Octahedron Beacon Head */}
      <mesh
        ref={pinRef}
        position={[0, 0.38, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(defect);
        }}
      >
        <octahedronGeometry args={[isSelected ? 0.22 : 0.16, 0]} />
        <meshStandardMaterial
          color={defect.color}
          emissive={defect.color}
          emissiveIntensity={isSelected ? 1.4 : 0.8}
          roughness={0.15}
          metalness={0.8}
        />
      </mesh>

      {/* Vertical Telemetry Projection Line */}
      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(self) => {
            self.setFromPoints([
              new THREE.Vector3(0, 0.02, 0),
              new THREE.Vector3(0, 0.38, 0),
            ]);
          }}
        />
        <lineBasicMaterial color={defect.color} transparent opacity={0.65} />
      </line>
    </group>
  );
}

// Autonomous Lidar Scanning Plane
function LidarScanner() {
  const planeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (planeRef.current) {
      planeRef.current.position.z =
        Math.sin(state.clock.elapsedTime * 0.95) * 2.5;
    }
  });

  return (
    <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
      <planeGeometry args={[5.2, 0.18]} />
      <meshBasicMaterial
        color="#10b981"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Animated Autonomous Maintenance Vehicle with Headlights
function PatrolVehicle() {
  const vehicleRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (vehicleRef.current) {
      const t = (state.clock.elapsedTime * 0.6) % 6;
      // Moving along North-South avenue
      vehicleRef.current.position.z = -2.5 + t * 0.85;
      vehicleRef.current.position.x = 0.25;
    }
  });

  return (
    <group ref={vehicleRef} position={[0.25, 0.06, -2.2]}>
      {/* Vehicle Chassis */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.38]} />
        <meshStandardMaterial color="#38BDF8" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Flashing Amber Roof Light */}
      <mesh position={[0, 0.13, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
      {/* Headlights */}
      <mesh position={[-0.06, 0.06, 0.2]}>
        <boxGeometry args={[0.04, 0.03, 0.02]} />
        <meshBasicMaterial color="#FEF08A" />
      </mesh>
      <mesh position={[0.06, 0.06, 0.2]}>
        <boxGeometry args={[0.04, 0.03, 0.02]} />
        <meshBasicMaterial color="#FEF08A" />
      </mesh>
    </group>
  );
}

// 3D Isometric City Architecture with Buildings, Roads & Infrastructure
function IsometricCityBlock({
  onSelectDefect,
  selectedDefectId,
}: {
  onSelectDefect: (d: CityDefect) => void;
  selectedDefectId: string | null;
}) {
  // Buildings configuration with translucent frosted glass look
  const buildings = useMemo(
    () => [
      { pos: [-1.8, 0.65, -1.8], size: [0.95, 1.3, 0.95], color: '#1E293B' },
      { pos: [-0.7, 1.05, -1.8], size: [0.95, 2.1, 0.95], color: '#0F172A' },
      { pos: [-1.8, 0.5, -0.7], size: [0.95, 1.0, 0.95], color: '#334155' },
      { pos: [1.8, 0.85, -1.8], size: [1.05, 1.7, 0.95], color: '#1E293B' },
      { pos: [1.8, 1.25, -0.6], size: [0.95, 2.5, 1.05], color: '#0F172A' },
      { pos: [-1.8, 0.9, 1.7], size: [1.05, 1.8, 0.95], color: '#1E293B' },
      { pos: [1.7, 0.6, 1.7], size: [0.95, 1.2, 0.95], color: '#334155' },
      { pos: [0.5, 0.75, 1.8], size: [0.85, 1.5, 0.85], color: '#1E293B' },
    ],
    []
  );

  return (
    <group>
      {/* City Base Plate */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[5.4, 0.3, 5.4]} />
        <meshStandardMaterial
          color="#0B132B"
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>

      {/* Surface Ground Tile */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 5.2]} />
        <meshStandardMaterial color="#111C35" roughness={0.8} />
      </mesh>

      {/* Arterial Road Grid (Cross-intersection in dark graphite) */}
      {/* North-South Avenue */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, 5.2]} />
        <meshStandardMaterial color="#1E293B" roughness={0.9} />
      </mesh>

      {/* East-West Boulevard */}
      <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 1.3]} />
        <meshStandardMaterial color="#1E293B" roughness={0.9} />
      </mesh>

      {/* Road Center Dashed Line */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.045, 5.0]} />
        <meshBasicMaterial color="#FACC15" transparent opacity={0.7} />
      </mesh>

      {/* East-West Center Dashed Line */}
      <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.045, 5.0]} />
        <meshBasicMaterial color="#FACC15" transparent opacity={0.7} />
      </mesh>

      {/* Pedestrian Crosswalk Stripes at Intersection */}
      {[-0.6, 0.6].map((offset, idx) => (
        <group key={`crosswalk-${idx}`} position={[0, 0.027, offset]}>
          {[-0.4, -0.2, 0, 0.2, 0.4].map((xPos, sIdx) => (
            <mesh
              key={sIdx}
              position={[xPos, 0, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.08, 0.22]} />
              <meshBasicMaterial color="#E2E8F0" transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Moving Autonomous Municipal Patrol Truck */}
      <PatrolVehicle />

      {/* Buildings Mesh */}
      {buildings.map((b, i) => (
        <group key={i} position={[b.pos[0], b.pos[1], b.pos[2]]}>
          {/* Main Building Volume */}
          <mesh>
            <boxGeometry args={[b.size[0], b.size[1], b.size[2]]} />
            <meshStandardMaterial
              color={b.color}
              roughness={0.25}
              metalness={0.7}
              transparent
              opacity={0.92}
            />
          </mesh>

          {/* Roof Edge Glow Line */}
          <lineSegments>
            <edgesGeometry
              args={[new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2])]}
            />
            <lineBasicMaterial color="#38BDF8" transparent opacity={0.35} />
          </lineSegments>

          {/* Rooftop Solar / HVAC Details */}
          <mesh position={[0, b.size[1] / 2 + 0.05, 0]}>
            <boxGeometry args={[b.size[0] * 0.6, 0.09, b.size[2] * 0.6]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>

          {/* Rooftop Communication Antenna on Tallest Tower */}
          {b.size[1] > 2.0 && (
            <mesh position={[0, b.size[1] / 2 + 0.25, 0]}>
              <cylinderGeometry args={[0.015, 0.02, 0.4, 8]} />
              <meshBasicMaterial color="#EF4444" />
            </mesh>
          )}
        </group>
      ))}

      {/* Underground Municipal Pipeline (Translucent Glowing Water & Drainage Conduit) */}
      <group position={[0, -0.06, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.7, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 4.8, 16]} />
          <meshStandardMaterial
            color="#0284C7"
            emissive="#06B6D4"
            emissiveIntensity={0.7}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* Scanning Laser Beam */}
      <LidarScanner />

      {/* Clickable 3D Defect Beacons */}
      {CITY_DEFECTS.map((defect) => (
        <DefectBeacon
          key={defect.id}
          defect={defect}
          isSelected={defect.id === selectedDefectId}
          onSelect={onSelectDefect}
        />
      ))}
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

  const handleSelect = (d: CityDefect) => {
    setInternalSelectedId(d.id);
    if (onSelectDefect) onSelectDefect(d);
  };

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
      <Canvas
        camera={{ position: [5.2, 5.8, 5.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.95} />
        <directionalLight position={[6, 10, 4]} intensity={1.7} color="#ffffff" />
        <pointLight position={[-4, 5, -4]} intensity={0.8} color="#38bdf8" />
        <pointLight position={[3, 2, 4]} intensity={0.7} color="#10b981" />

        <IsometricCityBlock
          onSelectDefect={handleSelect}
          selectedDefectId={selectedId}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI * 0.45}
          minPolarAngle={Math.PI * 0.22}
        />
      </Canvas>
    </div>
  );
}
