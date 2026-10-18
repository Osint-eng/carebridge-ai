import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAccessibility } from '@/context/AccessibilityContext';

export const CameraRig: React.FC<{
  intensity?: number;
  fixedZ?: number;
}> = ({ intensity = 0.5, fixedZ = 6 }) => {
  const { reducedMotion } = useAccessibility();
  const vec = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (reducedMotion) {
      state.camera.position.set(0, 0, fixedZ);
      state.camera.lookAt(0, 0, 0);
      return;
    }

    // Pointer is normalized [-1, 1]
    const targetX = (state.pointer.x * intensity * 1.2);
    const targetY = (state.pointer.y * intensity * 0.8);

    // Smooth damp camera position
    state.camera.position.lerp(
      vec.current.set(targetX, targetY, fixedZ),
      0.05
    );

    // Slight look-at tracking
    state.camera.lookAt(targetX * 0.2, targetY * 0.2, 0);
  });

  return null;
};
