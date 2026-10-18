import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAccessibility } from '@/context/AccessibilityContext';

interface NodeData {
  formedPos: THREE.Vector3;
  scatteredPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  type: 'particle' | 'doc' | 'pill' | 'node';
  size: number;
  color: string;
}

export const HeroCLogo: React.FC<{ scale?: number }> = ({ scale = 1.6 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { reducedMotion } = useAccessibility();
  const nodeCount = 50;

  const nodes = useMemo<NodeData[]>(() => {
    const list: NodeData[] = [];
    const radius = 1.4;
    for (let i = 0; i < nodeCount; i++) {
      const t = i / (nodeCount - 1);
      const theta = 0.75 + t * 4.8;
      const x = -Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius;
      const z = Math.sin(i * 0.4) * 0.15;
      const formed = new THREE.Vector3(x, y, z);
      const scattered = new THREE.Vector3(
        x * 2.2 + (Math.random() - 0.5) * 2,
        y * 2.2 + (Math.random() - 0.5) * 2,
        z + (Math.random() - 0.5) * 2
      );
      const typeChoice = i % 8 === 0 ? 'doc' : i % 6 === 0 ? 'pill' : i % 4 === 0 ? 'node' : 'particle';
      const color = i % 3 === 0 ? '#06b6d4' : i % 2 === 0 ? '#0284c7' : '#38bdf8';
      list.push({
        formedPos: formed,
        scatteredPos: scattered,
        currentPos: scattered.clone(),
        type: typeChoice,
        size: typeChoice === 'doc' ? 0.18 : typeChoice === 'pill' ? 0.15 : typeChoice === 'node' ? 0.1 : 0.06,
        color,
      });
    }
    return list;
  }, [nodeCount]);

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.15;
    nodes.forEach((node) => {
      node.currentPos.lerp(node.formedPos, 0.04);
    });
  });

  return (
    <group ref={groupRef} scale={scale}>
      <mesh position={[0, 0, -0.2]}>
        <ringGeometry args={[1.0, 1.8, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {nodes.map((node, i) => {
        if (node.type === 'pill') {
          return (
            <group key={i} position={[node.formedPos.x, node.formedPos.y, node.formedPos.z]}>
              <mesh scale={0.15}>
                <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
                <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.1} />
              </mesh>
            </group>
          );
        }
        if (node.type === 'doc') {
          return (
            <group key={i} position={[node.formedPos.x, node.formedPos.y, node.formedPos.z]}>
              <mesh scale={0.14} rotation={[0, 0, 0.3]}>
                <planeGeometry args={[0.9, 1.2]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        }
        return (
          <group key={i} position={[node.formedPos.x, node.formedPos.y, node.formedPos.z]}>
            <mesh scale={node.size}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.6} roughness={0.1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
