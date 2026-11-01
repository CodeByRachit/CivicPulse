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
      // Gentle levitation and breathing rotation matching reference image
      docRef.current.position.y = Math.sin(t * 1.5) * 0.07;
      docRef.current.rotation.y = 0.22 + Math.sin(t * 0.7) * 0.08;
      docRef.current.rotation.z = -0.06 + Math.cos(t * 0.9) * 0.04;
      docRef.current.rotation.x = 0.05 + Math.sin(t * 1.1) * 0.03;
    }
  });

  return (
    <group ref={docRef} position={[0, 0, 0]}>
      {/* Document Sheet Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.35, 1.85, 0.035]} />
        <meshStandardMaterial
          color="#FAF8F5"
          roughness={0.2}
          metalness={0.05}
        />
      </mesh>

      {/* Top Header Official Circular Stamp Emblem (Dark Circle like Reference) */}
      <mesh position={[0, 0.58, 0.024]}>
        <cylinderGeometry args={[0.18, 0.18, 0.018, 32]} />
        <meshStandardMaterial
          color="#1E1B18"
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Inner Gold Seal Ring Accent */}
      <mesh position={[0, 0.58, 0.035]}>
        <cylinderGeometry args={[0.09, 0.09, 0.015, 32]} />
        <meshStandardMaterial
          color="#F59E0B"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Simulated Document Text Lines */}
      {/* Title Bar */}
      <mesh position={[0, 0.3, 0.022]}>
        <boxGeometry args={[0.95, 0.055, 0.01]} />
        <meshStandardMaterial color="#1C1A16" roughness={0.3} />
      </mesh>

      {/* Text Line 1 */}
      <mesh position={[-0.05, 0.16, 0.022]}>
        <boxGeometry args={[0.85, 0.03, 0.01]} />
        <meshStandardMaterial color="#6B7280" roughness={0.4} />
      </mesh>

      {/* Text Line 2 */}
      <mesh position={[0.03, 0.06, 0.022]}>
        <boxGeometry args={[0.99, 0.03, 0.01]} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.4} />
      </mesh>

      {/* Text Line 3 */}
      <mesh position={[-0.08, -0.04, 0.022]}>
        <boxGeometry args={[0.78, 0.03, 0.01]} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.4} />
      </mesh>

      {/* Text Line 4 */}
      <mesh position={[0.06, -0.14, 0.022]}>
        <boxGeometry args={[0.92, 0.03, 0.01]} />
        <meshStandardMaterial color="#D1D5DB" roughness={0.4} />
      </mesh>

      {/* Text Line 5 */}
      <mesh position={[-0.12, -0.24, 0.022]}>
        <boxGeometry args={[0.7, 0.03, 0.01]} />
        <meshStandardMaterial color="#D1D5DB" roughness={0.4} />
      </mesh>

      {/* Bottom Status Badge on Document: Emerald "VERIFIED" Stamp */}
      <mesh position={[0.28, -0.48, 0.024]}>
        <boxGeometry args={[0.48, 0.12, 0.014]} />
        <meshStandardMaterial
          color="#10B981"
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>

      {/* QR Code / Grievance Micro-Block on Document */}
      <mesh position={[-0.32, -0.48, 0.024]}>
        <boxGeometry args={[0.22, 0.12, 0.014]} />
        <meshStandardMaterial
          color="#E5E7EB"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

// Thick, Vibrant Orbital Ribbon Rings matching Reference Image 1
function OrbitalRings() {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const ring4Ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // Purple / Violet ring rotating along X and Y
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.35;
      ring1Ref.current.rotation.y += delta * 0.28;
    }
    // Emerald Green ring rotating along Y and Z
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.42;
      ring2Ref.current.rotation.z += delta * 0.32;
    }
    // Warm Amber / Orange ring rotating along X and Z
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x -= delta * 0.28;
      ring3Ref.current.rotation.z += delta * 0.38;
    }
    // Deep Teal / Cyan ring
    if (ring4Ref.current) {
      ring4Ref.current.rotation.y -= delta * 0.32;
      ring4Ref.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <>
      {/* 1. Purple / Violet Orbital Ribbon (Prominent in Reference Image) */}
      <group ref={ring1Ref} rotation={[0.65, 0.35, 0.2]}>
        <mesh>
          <torusGeometry args={[1.92, 0.082, 24, 140]} />
          <meshStandardMaterial
            color="#7C3AED"
            roughness={0.18}
            metalness={0.35}
            emissive="#6D28D9"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* 2. Emerald Green Orbital Ribbon (Wrapping in Front & Behind) */}
      <group ref={ring2Ref} rotation={[-0.75, 0.55, 0.85]}>
        <mesh>
          <torusGeometry args={[2.02, 0.085, 24, 140]} />
          <meshStandardMaterial
            color="#10B981"
            roughness={0.18}
            metalness={0.35}
            emissive="#059669"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* 3. Warm Orange / Amber Ribbon (Sweeping Orbit) */}
      <group ref={ring3Ref} rotation={[0.95, -0.55, -0.45]}>
        <mesh>
          <torusGeometry args={[2.12, 0.078, 24, 140]} />
          <meshStandardMaterial
            color="#F59E0B"
            roughness={0.18}
            metalness={0.35}
            emissive="#D97706"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* 4. Cyan / Electric Teal Accent Ribbon */}
      <group ref={ring4Ref} rotation={[-0.4, -0.75, 0.6]}>
        <mesh>
          <torusGeometry args={[1.82, 0.065, 20, 120]} />
          <meshStandardMaterial
            color="#06B6D4"
            roughness={0.2}
            metalness={0.4}
            emissive="#0891B2"
            emissiveIntensity={0.25}
          />
        </mesh>
      </group>
    </>
  );
}

// Chunky Floating 3D Geometric Gems / Cubes matching Reference Image
function OrbitingParticles() {
  const particlesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={particlesRef}>
      {/* Obsidian Dark Cube (Top Right - prominent in reference) */}
      <mesh position={[1.9, 1.15, 0.5]} rotation={[0.45, 0.65, 0.2]}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial color="#1E1B4B" roughness={0.15} metalness={0.8} />
      </mesh>

      {/* Emerald Octahedron Diamond (Bottom Left) */}
      <mesh position={[-1.9, -0.85, 0.8]} rotation={[0.8, 0.35, 0.5]}>
        <octahedronGeometry args={[0.18]} />
        <meshStandardMaterial color="#10B981" roughness={0.15} metalness={0.6} />
      </mesh>

      {/* Warm Amber Gold Cube (Top Left) */}
      <mesh position={[-1.5, 1.4, -0.7]} rotation={[0.25, 0.85, 0.45]}>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Sky Blue Diamond (Bottom Right) */}
      <mesh position={[1.7, -1.1, -0.6]} rotation={[0.5, 0.25, 0.75]}>
        <octahedronGeometry args={[0.15]} />
        <meshStandardMaterial color="#38BDF8" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Dark Slate Cube */}
      <mesh position={[0.3, 2.05, -0.8]} rotation={[0.6, 0.15, 0.35]}>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color="#334155" roughness={0.25} metalness={0.6} />
      </mesh>
    </group>
  );
}

// Translucent Glass / Acrylic Holographic Sphere with Specular Sheen
function GlassSphere() {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      const t = state.clock.getElapsedTime();
      sphereRef.current.position.y = Math.sin(t * 1.5) * 0.05;
    }
  });

  return (
    <group>
      {/* Outer Specular Glass Shell */}
      <mesh ref={sphereRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.72, 64, 64]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent={true}
          opacity={0.32}
          roughness={0.06}
          metalness={0.08}
          transmission={0.88}
          ior={1.42}
          thickness={0.8}
          specularIntensity={1.2}
          specularColor="#FFFFFF"
          depthWrite={false}
        />
      </mesh>

      {/* Subtle Inner Refractive Fresnel Glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.68, 48, 48]} />
        <meshBasicMaterial
          color="#F3F4F6"
          transparent={true}
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
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
      targetRotation.current.x = -pointer.y * 0.22;
      targetRotation.current.y = pointer.x * 0.3;

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

      // Natural vertical floating bob
      const t = state.clock.getElapsedTime();
      masterGroupRef.current.position.y = Math.sin(t * 1.3) * 0.08;
    }
  });

  return (
    <group ref={masterGroupRef} position={[0, 0, 0]}>
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
      gradient.addColorStop(0, 'rgba(40, 35, 25, 0.32)');
      gradient.addColorStop(0.35, 'rgba(40, 35, 25, 0.16)');
      gradient.addColorStop(0.7, 'rgba(40, 35, 25, 0.03)');
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
      const scale = 1 + Math.sin(t * 1.3) * 0.08;
      shadowRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <mesh
      ref={shadowRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2.4, 0]}
    >
      <planeGeometry args={[4.2, 4.2]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent={true}
        opacity={0.75}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function FloatingOrb3D() {
  return (
    <div className="w-full h-full min-h-[480px] sm:min-h-[560px] lg:min-h-[640px] flex items-center justify-center relative select-none">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 48 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        {/* Balanced Ambient & Directional Lighting */}
        <ambientLight intensity={1.4} />
        <directionalLight position={[6, 8, 6]} intensity={1.8} />
        <directionalLight position={[-6, -4, -4]} intensity={0.7} color="#E0E7FF" />
        
        {/* Soft Colored Accent Lights */}
        <pointLight position={[3, 2, 3]} intensity={1.4} color="#10B981" distance={9} />
        <pointLight position={[-3, 1, 2]} intensity={1.4} color="#8B5CF6" distance={9} />
        <pointLight position={[0, -3, 2]} intensity={0.9} color="#F59E0B" distance={9} />

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
