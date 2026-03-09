'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/** Predetermined leaf angle and tilt data (avoids Math.random in render). */
const LEAF_DATA = [
  { angle: 0, tilt: 0.35 },
  { angle: Math.PI / 3, tilt: 0.45 },
  { angle: (2 * Math.PI) / 3, tilt: 0.3 },
  { angle: Math.PI, tilt: 0.5 },
  { angle: (4 * Math.PI) / 3, tilt: 0.4 },
  { angle: (5 * Math.PI) / 3, tilt: 0.35 },
];

/**
 * Piecewise-linear interpolation of the pineapple body radius at a given
 * height y (matching the LatheGeometry profile points).
 */
const PROFILE: [number, number][] = [
  [-1.2, 0],
  [-1.05, 0.25],
  [-0.7, 0.45],
  [-0.3, 0.55],
  [0, 0.6],
  [0.3, 0.55],
  [0.6, 0.45],
  [0.85, 0.35],
  [1.05, 0.2],
  [1.2, 0],
];

function radiusAtHeight(y: number): number {
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [y0, r0] = PROFILE[i];
    const [y1, r1] = PROFILE[i + 1];
    if (y >= y0 && y <= y1) {
      const t = (y - y0) / (y1 - y0);
      return r0 + t * (r1 - r0);
    }
  }
  return 0;
}

/**
 * A procedurally-generated 3D pineapple.
 *
 * - LatheGeometry body in golden-yellow.
 * - InstancedMesh diamond/cross-hatch bumps on the surface.
 * - Six elongated cone leaves fanned out at the top.
 * - Slow Y-axis rotation + subtle pointer parallax tilt via useFrame.
 * - Wrapped in drei <Float> for gentle bobbing.
 */
export default function Pineapple() {
  const groupRef = useRef<THREE.Group>(null);
  const bumpRef = useRef<THREE.InstancedMesh>(null);

  // ── Body ──────────────────────────────────────────────────────────────
  const bodyGeometry = useMemo(() => {
    const points: THREE.Vector2[] = PROFILE.map(
      ([y, r]) => new THREE.Vector2(r, y),
    );
    return new THREE.LatheGeometry(points, 32);
  }, []);

  // ── Bump geometry & material (shared by all instances) ────────────────
  const bumpGeometry = useMemo(() => new THREE.BoxGeometry(0.08, 0.08, 0.06), []);
  const bumpMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#D4941F', roughness: 0.5 }),
    [],
  );

  // ── Calculate bump positions in an offset-row diamond pattern ─────────
  const bumpPositions = useMemo(() => {
    const positions: Array<{ pos: THREE.Vector3; normal: THREE.Vector3 }> = [];
    const rows = 14;
    const colsPerRow = 16;

    for (let row = 1; row < rows - 1; row++) {
      const t = row / (rows - 1);
      const y = -1.2 + t * 2.4;
      const r = radiusAtHeight(y);
      if (r < 0.12) continue;

      // Offset every other row for diamond pattern
      const offset = row % 2 === 0 ? 0 : Math.PI / colsPerRow;

      for (let col = 0; col < colsPerRow; col++) {
        const theta = (col / colsPerRow) * Math.PI * 2 + offset;
        const nx = Math.cos(theta);
        const nz = Math.sin(theta);
        positions.push({
          pos: new THREE.Vector3(nx * r, y, nz * r),
          normal: new THREE.Vector3(nx, 0, nz).normalize(),
        });
      }
    }

    return positions;
  }, []);

  // ── Apply instance transforms to the InstancedMesh ────────────────────
  useEffect(() => {
    const mesh = bumpRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    bumpPositions.forEach((bp, i) => {
      dummy.position.copy(bp.pos).addScaledVector(bp.normal, 0.03);
      dummy.lookAt(dummy.position.clone().add(bp.normal));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [bumpPositions]);

  // ── Per-frame animation: slow rotation + pointer parallax ─────────────
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y += 0.003;

    // Subtle tilt towards pointer
    const targetX = state.pointer.y * 0.1;
    const targetZ = -state.pointer.x * 0.1;
    group.rotation.x += (targetX - group.rotation.x) * 0.05;
    group.rotation.z += (targetZ - group.rotation.z) * 0.05;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Pineapple body */}
        <mesh geometry={bodyGeometry}>
          <meshStandardMaterial color="#F5A623" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Diamond-pattern surface bumps */}
        <instancedMesh
          ref={bumpRef}
          args={[bumpGeometry, bumpMaterial, bumpPositions.length]}
        />

        {/* Leaves at the crown */}
        {LEAF_DATA.map((leaf, i) => (
          <mesh
            key={i}
            position={[
              Math.sin(leaf.angle) * 0.08,
              1.3,
              Math.cos(leaf.angle) * 0.08,
            ]}
            rotation={[
              leaf.tilt * Math.cos(leaf.angle),
              leaf.angle,
              leaf.tilt * Math.sin(leaf.angle),
            ]}
          >
            <coneGeometry args={[0.06, 0.8, 4]} />
            <meshStandardMaterial color="#2D5A27" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}
