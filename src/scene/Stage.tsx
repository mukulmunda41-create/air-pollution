'use client';
// The one canvas. frameloop="never": gsap.ticker calls advance(), so Lenis, ScrollTrigger and the
// renderer all share a single clock. GSAP's time is in seconds, which is what advance() expects.
import { PerformanceMonitor } from '@react-three/drei';
import { advance, Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { chapters } from '@/content/copy';
import { story } from '@/story/state';
import { starts } from '@/story/timeline';
import { CameraRig } from './CameraRig';
import { Earth } from './Earth';
import { Plate, type PlateAsset } from './Plate';
import { Sky } from './Sky';
import { pickTier } from './tier';

// Added once textures are in, so the DOM poster stays up until the first real frame exists.
function Ready() {
  useEffect(() => {
    document.documentElement.classList.add('gl-on');
    return () => { document.documentElement.classList.remove('gl-on'); };
  }, []);
  return null;
}

export default function Stage({ plates }: { plates: Record<string, PlateAsset> }) {
  const tier = useMemo(() => pickTier(), []);
  const [dpr, setDpr] = useState(tier.dpr);

  useEffect(() => {
    const tick = (time: number) => {
      if (document.hidden) return;
      // Nothing behind opaque DOM art needs drawing: chapters not built yet, with no approved plate.
      const chapter = chapters[story.chapter];
      if (!chapter?.built && !plates[chapter?.scene] && story.time > starts[story.chapter]) return;
      advance(time);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [plates]);

  return (
    <Canvas
      frameloop="never"
      dpr={dpr}
      gl={{ antialias: tier.high, alpha: false, stencil: false, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 0.005, far: 200, position: [0, 0.14, 4.3] }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#030507'));
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          document.documentElement.classList.remove('gl-on', 'gl');
        });
      }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />
      <CameraRig />
      <Suspense fallback={null}>
        <Earth tier={tier} />
        <Sky tier={tier} />
        {Object.entries(plates)
          .filter(([scene]) => scene !== 'earth-opening' && scene !== 'earth-ending')
          .map(([scene, asset]) => <Plate key={scene} scene={scene} asset={asset} tier={tier} />)}
        <Ready />
      </Suspense>
    </Canvas>
  );
}
