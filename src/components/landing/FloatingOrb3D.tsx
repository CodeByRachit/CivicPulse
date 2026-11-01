'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 3D Floating Municipal Ticket Document situated inside the glass sphere
function FloatingCivicTicket() {
  const docRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (docRef.current) {
      const t = state.clock.getElapsedTime();
      // Gentle levitation and breathing rotation
      docRef.current.position.y = Math.sin(t * 1.6) * 0.08;
      docRef.current.rotation.y = Math.sin(t * 0.8) * 0.12 - 0.1;
      docRef.current.rotation.x = Math.cos(t * 1.1) * 0.05 + 0.05;
    }
  });

  return (
    <group ref={docRef} position={[0, 0, 0]}>
      {/* Document Sheet Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.25, 1.65, 0.03]} />
        <meshStandardMaterial
          color="#FAF8F5"
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>

      {/* Top Header Seal / Official Stamp Emblem */}
      <mesh position={[0, 0.52, 0.02]}>
        <cylinderGeometry args={[0.13, 0.13, 0.015, 32]} />
        <meshStandardMaterial
          color="#374151"
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Inner Gold Seal Accent */}
      <mesh position={[0, 0.52, 0.03]}>
        <cylinderGeometry args={[0.07, 0.07, 0.012, 32]} />
        <meshStandardMaterial
          color="#F59E0B"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Simulated Document Text Lines */}
      {/* Title Bar */}
      <mesh position={[0, 0.28, 0.02]}>
        <boxGeometry args={[0.85, 0.045, 0.01]} />
        <meshStandardMaterial color="#1F2937" roughness={0.4} />
      </mesh>

      {/* Body Line 1 */}
      <mesh position={[-0.05, 0.15, 0.02]}>
        <boxGeometry args={[0.75, 0.025, 0.01]} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.5} />
      </mesh>

      {/* Body Line 2 */}
      <mesh position={[0.02, 0.06, 0.02]}>
        <boxGeometry args={[0.89, 0.025, 0.01]} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.5} />
      </mesh>

      {/* Body Line 3 */}
      <mesh position={[-0.08, -0.03, 0.02]}>
        <boxGeometry args={[0.69, 0.025, 0.01]} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.5} />
      </mesh>

      {/* Body Line 4 */}
      <mesh position={[0.05, -0.12, 0.02]}>
        <boxGeometry args={[0.85, 0.025, 0.01]} />
        <meshStandardMaterial color="#D1D5DB" roughness={0.5} />
      </mesh>

      {/* Body Line 5 */}
      <mesh position={[-0.1, -0.21, 0.02]}>
        <boxGeometry args={[0.65, 0.025, 0.01]} />
        <meshStandardMaterial color="#D1D5DB" roughness={0.5} />
      </mesh>

      {/* Bottom Status Pill on Document: Emerald "VERIFIED" Stamp */}
      <mesh position={[0.26, -0.42, 0.022]}>
        <boxGeometry args={[0.42, 0.11, 0.012]} />
        <meshStandardMaterial
          color="#10B981"
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Severity Metric Indicator Pill */}
      <mesh position={[-0.26, -0.42, 0.022]}>
        <boxGeometry args={[0.42, 0.11, 0.012]} />
        <meshStandardMaterial
          color="#F3F4F6"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

// Dynamic Orbital Ribbon Rings with smooth multi-axis spin
function OrbitalRings() {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const ring4Ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // Purple / Violet diagonal ring
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.45;
      ring1Ref.current.rotation.y += delta * 0.35;
    }
    // Emerald green ring
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.55;
      ring2Ref.current.rotation.z += delta * 0.4;
    }
    // Warm Amber / Gold ring
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x -= delta * 0.35;
      ring3Ref.current.rotation.z += delta * 0.5;
    }
    // Cyan / Teal slender accent ring
    if (ring4Ref.current) {
      ring4Ref.current.rotation.y -= delta * 0.4;
      ring4Ref.current.rotation.x += delta * 0.25;
    }
  });

  return (
    <>
      {/* 1. Purple / Violet Orbital Ribbon (Image 1 signature feature) */}
      <group ref={ring1Ref} rotation={[0.6, 0.4, 0.2]}>
        <mesh>
          <torusGeometry args={[1.72, 0.038, 20, 120]} />
          <meshStandardMaterial
            color="#8B5CF6"
            roughness={0.15}
            metalness={0.3}
            emissive="#7C3AED"
            emissiveIntensity={0.25}
          />
        </mesh>
      </group>

      {/* 2. Emerald Green Orbital Ribbon */}
      <group ref={ring2Ref} rotation={[-0.7, 0.5, 0.9]}>
        <mesh>
          <torusGeometry args={[1.82, 0.036, 20, 120]} />
          <meshStandardMaterial
            color="#10B981"
            roughness={0.15}
            metalness={0.3}
            emissive="#059669"
            emissiveIntensity={0.25}
          />
        </mesh>
      </group>

      {/* 3. Warm Orange / Amber Ribbon */}
      <group ref={ring3Ref} rotation={[0.9, -0.6, -0.4]}>
        <mesh>
          <torusGeometry args={[1.92, 0.034, 20, 120]} />
          <meshStandardMaterial
            color="#F59E0B"
            roughness={0.15}
            metalness={0.3}
            emissive="#D97706"
            emissiveIntensity={0.25}
          />
        </mesh>
      </group>

      {/* 4. Cyan / Teal Delicate Accent Ribbon */}
      <group ref={ring4Ref} rotation={[-0.3, -0.8, 0.5]}>
        <mesh>
          <torusGeometry args={[1.66, 0.026, 16, 100]} />
          <meshStandardMaterial
            color="#06B6D4"
            roughness={0.2}
            metalness={0.4}
            emissive="#0891B2"
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>
    </>
  );
}

// Floating 3D Geometric Gem / Cube Particles
function OrbitingParticles() {
  const particlesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={particlesRef}>
      {/* Obsidian Dark Cube (Top Right) */}
      <mesh position={[1.65, 0.95, 0.4]} rotation={[0.4, 0.6, 0.2]}>
        <boxGeometry args={[0.13, 0.13, 0.13]} />
        <meshStandardMaterial color="#1E1B4B" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Emerald Diamond / Octahedron (Bottom Left) */}
      <mesh position={[-1.6, -0.75, 0.7]} rotation={[0.8, 0.3, 0.5]}>
        <octahedronGeometry args={[0.11]} />
        <meshStandardMaterial color="#10B981" roughness={0.15} metalness={0.5} />
      </mesh>

      {/* Amber Gold Cube (Top Left) */}
      <mesh position={[-1.25, 1.15, -0.6]} rotation={[0.2, 0.9, 0.4]}>
        <boxGeometry args={[0.11, 0.11, 0.11]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Sky Blue Octahedron (Bottom Right) */}
      <mesh position={[1.45, -0.9, -0.5]} rotation={[0.5, 0.2, 0.7]}>
        <octahedronGeometry args={[0.09]} />
        <meshStandardMaterial color="#38BDF8" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Dark Slate Micro Cube */}
      <mesh position={[0.2, 1.7, -0.8]} rotation={[0.6, 0.1, 0.3]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

// The Translucent Glass / Acrylic Holographic Sphere
function GlassSphere() {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      // Subtle ambient bob
      const t = state.clock.getElapsedTime();
      sphereRef.current.position.y = Math.sin(t * 1.6) * 0.05;
    }
  });

  return (
    <mesh ref={sphereRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshPhysicalMaterial
        color="#FFFFFF"
        transparent={true}
        opacity={0.38}
        roughness={0.08}
        metalness={0.05}
        transmission={0.85}
        ior={1.38}
        thickness={0.6}
        depthWrite={false}
      />
    </mesh>
  );
}

// Master 3D Scene Group with dynamic mouse tracking parallax
function SceneContainer() {
  const masterGroupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (masterGroupRef.current) {
      // Smooth lerp mouse parallax
      const { pointer } = state;
      targetRotation.current.x = -pointer.y * 0.25;
      targetRotation.current.y = pointer.x * 0.35;

      masterGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        masterGroupRef.current.rotation.x,
        targetRotation.current.x,
        delta * 3.5
      );
      masterGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        masterGroupRef.current.rotation.y,
        targetRotation.current.y,
        delta * 3.5
      );

      // Continuous subtle natural float
      const t = state.clock.getElapsedTime();
      masterGroupRef.current.position.y = Math.sin(t * 1.4) * 0.06;
    }
  });

  return (
    <group ref={masterGroupRef} position={[0, 0.2, 0]}>
      {/* Centered Civic Grievance Ticket Document */}
      <FloatingCivicTicket />

      {/* Encapsulating Glass Hologram Sphere */}
      <GlassSphere />

      {/* Multi-Colored Orbiting Dynamic Ribbons */}
      <OrbitalRings />

      {/* Orbiting Geometric Cubes and Diamonds */}
      <OrbitingParticles />
    </group>
  );
}

// Soft radial ground contact shadow grounded into #F4F2EA background
function GroundContactShadow() {
  const shadowRef = useRef<THREE.Mesh>(null);

  const shadowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(40, 35, 25, 0.28)');
      gradient.addColorStop(0.4, 'rgba(40, 35, 25, 0.12)');
      gradient.addColorStop(0.8, 'rgba(40, 35, 25, 0.02)');
      gradient.addColorStop(1, 'rgba(40, 35, 25, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  useFrame((state) => {
    if (shadowRef.current) {
      const t = state.clock.getElapsedTime();
      // Shadow breathes inversely with the sphere's elevation
      const scale = 1 + Math.sin(t * 1.4) * 0.08;
      shadowRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <mesh
      ref={shadowRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2.1, 0]}
    >
      <planeGeometry args={[3.2, 3.2]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent={true}
        opacity={0.65}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function FloatingOrb3D() {
  return (
    <div className="w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[520px] lg:min-h-[580px] relative select-none">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Balanced Ambient & Directional Lighting */}
        <ambientLight intensity={1.3} />
        <directionalLight position={[6, 8, 6]} intensity={1.6} />
        <directionalLight position={[-6, -4, -4]} intensity={0.6} color="#E0E7FF" />
        
        {/* Soft Colored Accent Lights */}
        <pointLight position={[3, 2, 3]} intensity={1.0} color="#10B981" distance={8} />
        <pointLight position={[-3, 1, 2]} intensity={1.0} color="#8B5CF6" distance={8} />
        <pointLight position={[0, -3, 2]} intensity={0.7} color="#F59E0B" distance={8} />

        {/* Master Scene Content */}
        <SceneContainer />

        {/* Interactive Drag to Orbit */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.7}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 2.8}
        />

        {/* Ground Contact Shadow */}
        <GroundContactShadow />
      </Canvas>
    </div>
  );
}
