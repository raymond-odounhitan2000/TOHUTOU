'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import Pineapple from './Pineapple';

/**
 * Sets up the R3F Canvas, lighting, and environment for the 3D pineapple.
 *
 * - Camera at [0, 0, 5] with 45-degree FOV.
 * - Ambient + directional lighting.
 * - drei Environment with "sunset" preset for warm reflections.
 * - Suspense boundary so the canvas renders while the pineapple loads.
 */
export default function PineappleScene() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Pineapple />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}
