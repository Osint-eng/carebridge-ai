import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAccessibility } from '@/context/AccessibilityContext';

interface ScannerProps {
  status: 'VERIFIED' | 'VALIDATION_FAILED' | 'SCANNING';
  activeCategory?: string;
  failedCategory?: string;
}

const CATEGORIES = [
  'Medication',
  'Dose',
  'Frequency',
  'Duration',
  'Route',
  'Follow-up',
  'Warnings',
  'Diet',
  'Activity',
  'Dates',
];

export const VerificationScanner3D: React.FC<ScannerProps> = ({
  status,
  activeCategory,
  failedCategory,
}) => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const laserRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { reducedMotion } = useAccessibility();

  const isFailed = status === 'VALIDATION_FAILED';
  const isVerified = status === 'VERIFIED';
  const primaryColor = isFailed ? '#ef4444' : isVerified ? '#10b981' : '#0ea5e9';

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (outerRingRef.current) outerRingRef.current.rotation.z += delta * 0.4;
    if (laserRingRef.current) laserRingRef.current.rotation.z -= delta * 0.8;
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.6;
  });

  return (
    <group ref={groupRef} scale={1.2}>
      <mesh ref={outerRingRef}>
        <ringGeometry args={[2.2, 2.35, 64]} />
        <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={0.6} side={THREE.DoubleSide} />
      </mesh>

      <mesh ref={laserRingRef} position={[0, 0, 0.05]}>
        <ringGeometry args={[1.9, 1.98, 48, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial color={isFailed ? '#f87171' : '#38bdf8'} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      <mesh position={[0, 0, -0.05]}>
        <circleGeometry args={[2.2, 64]} />
        <meshBasicMaterial color={isFailed ? '#fef2f2' : '#f0f9ff'} transparent opacity={0.25} />
      </mesh>

      <mesh ref={coreRef} position={[0, 0, 0.1]}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshPhysicalMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.3}
          clearcoat={1}
        />
      </mesh>

      {CATEGORIES.map((cat, i) => {
        const angle = (i / CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * 1.7;
        const y = Math.sin(angle) * 1.7;
        const isCatFailed = failedCategory === cat;
        const isCatActive = activeCategory === cat;
        const nodeColor = isCatFailed ? '#ef4444' : isVerified ? '#10b981' : isCatActive ? '#0ea5e9' : '#94a3b8';

        return (
          <group key={cat} position={[x, y, 0.05]}>
            <mesh scale={isCatFailed || isCatActive ? 0.16 : 0.1}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color={nodeColor} emissive={nodeColor} emissiveIntensity={isCatFailed || isCatActive ? 0.9 : 0.3} />
            </mesh>
            <Html position={[0, y > 0 ? 0.3 : -0.3, 0]} center>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs pointer-events-none select-none ${
                isCatFailed ? 'bg-red-600 text-white' : isVerified ? 'bg-emerald-600 text-white' : isCatActive ? 'bg-sky-600 text-white' : 'bg-white/90 text-slate-600 border border-slate-200'
              }`}>
                {cat}
              </div>
            </Html>
          </group>
        );
      })}

      <Html position={[0, -0.9, 0.2]} center>
        <div className="text-center pointer-events-none select-none">
          <div className={`text-xs font-extrabold tracking-wider uppercase px-3 py-1 rounded-full shadow-md ${
            isFailed ? 'bg-red-100 text-red-700 border border-red-300' : isVerified ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-sky-100 text-sky-800 border border-sky-300'
          }`}>
            {isFailed ? 'VALIDATION FAILED' : isVerified ? '100% VERIFIED' : 'FAITHFULNESS CHECK'}
          </div>
        </div>
      </Html>
    </group>
  );
};
