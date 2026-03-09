'use client';

import dynamic from 'next/dynamic';

const PineappleScene = dynamic(() => import('./PineappleScene'), { ssr: false });

interface PineappleHeroProps {
  className?: string;
}

/**
 * SSR-safe wrapper around PineappleScene.
 *
 * Uses next/dynamic with ssr:false so WebGL is never invoked during
 * server-side rendering.  Renders a subtle radial gradient background
 * behind the 3D canvas.
 */
export default function PineappleHero({ className }: PineappleHeroProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 300,
        background:
          'radial-gradient(ellipse at center, rgba(245, 166, 35, 0.08) 0%, transparent 70%)',
      }}
    >
      <PineappleScene />
    </div>
  );
}
