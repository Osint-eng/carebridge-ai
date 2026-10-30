import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAccessibility } from '@/context/AccessibilityContext';

export const MedicineCapsule: React.FC<{ position?: [number, number, number]; color?: string; scale?: number }> = ({
  position = [0, 0, 0],
  color = '#0ea5e9',
  scale = 1,
}) => {
  const ref = useRef<THREE.Group>(null);
  const { reducedMotion } = useAccessibility();

  useFrame((_, delta) => {
    if (reducedMotion || !ref.current) return;
    ref.current.rotation.y += delta * 0.5;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
    </group>
  );
};

export const MedicalCross: React.FC<{ position?: [number, number, number]; scale?: number }> = ({
  position = [0, 0, 0],
  scale = 1,
}) => {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <boxGeometry args={[0.15, 0.6, 0.08]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.45, 0.15, 0.08]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};

export const MedicalShield: React.FC<{ position?: [number, number, number]; scale?: number }> = ({
  position = [0, 0, 0],
  scale = 1,
}) => {
  const ref = useRef<THREE.Mesh>(null);
  const { reducedMotion } = useAccessibility();

  useFrame((_, delta) => {
    if (reducedMotion || !ref.current) return;
    ref.current.rotation.y += delta * 0.3;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshPhysicalMaterial
        color="#10b981"
        emissive="#10b981"
        emissiveIntensity={0.4}
        roughness={0.15}
        metalness={0.2}
        clearcoat={1}
      />
    </mesh>
  );
};

export const ECGLine: React.FC<{ position?: [number, number, number] }> = ({ position = [0, 0, 0] }) => {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 40; i++) {
      const x = (i / 40) * 4 - 2;
      let y = 0;
      if (i === 10) y = 0.1;
      if (i === 11) y = -0.3;
      if (i === 12) y = 0.8;
      if (i === 13) y = -0.2;
      if (i === 14) y = 0.1;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return geo;
  }, []);

  return (
    <group position={position}>
      {/* R3F line primitive (not SVG <line>) */}
      {/* @ts-expect-error R3F <line> vs SVG line */}
      <line geometry={geometry}>
        <lineBasicMaterial color="#0ea5e9" linewidth={2} />
      </line>
    </group>
  );
};

export const MedicalObjects: React.FC = () => {
  return (
    <group>
      <MedicineCapsule position={[-2.5, 1.2, -1]} color="#0284c7" scale={0.8} />
      <MedicineCapsule position={[2.2, -0.8, -1.5]} color="#14b8a6" scale={0.7} />
      <MedicalCross position={[1.8, 1.5, -2]} scale={0.9} />
      <MedicalShield position={[-1.5, -1.2, -1.5]} scale={0.7} />
      <ECGLine position={[0, -1.8, -1]} />
    </group>
  );
};
