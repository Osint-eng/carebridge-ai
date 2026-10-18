import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { useAccessibility } from '@/context/AccessibilityContext';

// Ultra-subtle clinical ambient particles
const SubtleParticles: React.FC<{ count?: number }> = ({ count = 30 }) => {
  const points = useMemo(() => {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 18;
      coords[i * 3 + 1] = (Math.random() - 0.5) * 14;
      coords[i * 3 + 2] = (Math.random() - 0.5) * 6 - 3;
    }
    return coords;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#0ea5e9"
        transparent
        opacity={0.2}
        sizeAttenuation
      />
    </points>
  );
};

export const GlobalBackground3D: React.FC<{
  showFullScene?: boolean;
}> = () => {
  const { reducedMotion } = useAccessibility();

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-slate-50/60 dark:bg-slate-950/80">
      {/* Crisp, clean ambient radial light gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-transparent to-transparent dark:from-sky-950/20" />
      
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.6} />
        <CameraRig intensity={reducedMotion ? 0 : 0.2} fixedZ={7} />
        <SubtleParticles count={reducedMotion ? 10 : 35} />
      </Canvas>
    </div>
  );
};
