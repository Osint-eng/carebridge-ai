import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAccessibility } from '@/context/AccessibilityContext';

export const AudioOrb3D: React.FC<{
  isPlaying: boolean;
  scale?: number;
}> = ({ isPlaying, scale = 1.3 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { reducedMotion } = useAccessibility();

  useFrame((_, delta) => {
    if (reducedMotion) return;

    const time = Date.now() * 0.003;
    const pulseFactor = isPlaying ? 1 + Math.sin(time * 3) * 0.12 : 1;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (isPlaying ? 1.2 : 0.3);
      meshRef.current.rotation.x += delta * (isPlaying ? 0.8 : 0.1);
      meshRef.current.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }

    if (auraRef.current) {
      const auraPulse = isPlaying ? 1.2 + Math.cos(time * 2) * 0.2 : 1.1;
      auraRef.current.scale.set(auraPulse, auraPulse, auraPulse);
      auraRef.current.rotation.z -= delta * (isPlaying ? 1.5 : 0.2);
    }

    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 3;
      ringRef.current.rotation.z += delta * (isPlaying ? 2 : 0.4);
    }
  });

  return (
    <group scale={scale}>
      {/* Central multi-faceted gem sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 3]} />
        <meshPhysicalMaterial
          color={isPlaying ? '#0ea5e9' : '#0284c7'}
          roughness={0.15}
          metalness={0.2}
          clearcoat={1}
          transmission={0.4}
          thickness={0.8}
          emissive={isPlaying ? '#06b6d4' : '#0369a1'}
          emissiveIntensity={isPlaying ? 0.7 : 0.2}
          wireframe={false}
        />
      </mesh>

      {/* Outer audio energy aura */}
      <mesh ref={auraRef}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshBasicMaterial
          color={isPlaying ? '#38bdf8' : '#7dd3fc'}
          wireframe
          transparent
          opacity={isPlaying ? 0.45 : 0.15}
        />
      </mesh>

      {/* Orbiting audio frequency rings */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.5, 0.03, 16, 64]} />
        <meshStandardMaterial
          color={isPlaying ? '#14b8a6' : '#94a3b8'}
          emissive={isPlaying ? '#2dd4bf' : '#64748b'}
          emissiveIntensity={isPlaying ? 0.8 : 0.2}
        />
      </mesh>

      {/* Sound wave particles along perimeter */}
      {isPlaying && (
        <group>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const x = Math.cos(angle) * 1.8;
            const y = Math.sin(angle) * 1.8;
            return (
              <mesh key={i} position={[x, y, 0]} scale={0.06}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial color="#06b6d4" />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};
