'use client';
import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { story } from '@/story/state';
import { SUN } from './path';
import {
  atmosphereFragment, atmosphereVertex, cloudsFragment, cloudsVertex, glareFragment, glareVertex,
  starsFragment, starsVertex, surfaceFragment, surfaceVertex,
} from './shaders/earth';
import type { Tier } from './tier';
import { useShader } from './useShader';

const TOP = 1.2; // atmosphere shell radius

function Stars({ count }: { count: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const data = useMemo(() => {
    const position = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(90);
      position.set([v.x, v.y, v.z], i * 3);
      // Mostly faint, a few bright: a real night sky is not evenly speckled.
      size[i] = 0.7 + Math.pow(Math.random(), 7) * 3.4;
      seed[i] = Math.random();
    }
    return { position, size, seed };
  }, [count]);
  const material = useShader(() => ({
    vertexShader: starsVertex,
    fragmentShader: starsFragment,
    uniforms: { uDpr: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  useFrame(() => {
    const u = material.uniforms;
    u.uDpr.value = dpr;
    u.uTime.value = story.t;
    u.uOpacity.value = story.stars;
  });
  return (
    <points frustumCulled={false} renderOrder={-10} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.position, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.size, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
      </bufferGeometry>
    </points>
  );
}

// The sun, placed along SUN and faded out as Earth covers it, so the limb gets a real sunrise.
function Glare() {
  const mesh = useRef<THREE.Mesh>(null);
  const size = useThree((s) => s.size);
  const material = useShader(() => ({
    vertexShader: glareVertex,
    fragmentShader: glareFragment,
    uniforms: { uSize: { value: 0.8 }, uStrength: { value: 0 }, uViewport: { value: new THREE.Vector2(1, 1) } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  const near = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const u = material.uniforms;
    u.uViewport.value.set(size.width, size.height);
    u.uSize.value = 0.8 * Math.min(1, size.width / size.height);
    const along = Math.max(-camera.position.dot(SUN), 0);
    near.copy(camera.position).addScaledVector(SUN, along);
    const clear = THREE.MathUtils.smoothstep(near.length(), 1.0, 1.05);
    u.uStrength.value = clear * (1 - story.sky) * story.earth * (1 + story.breath * 0.04);
    if (mesh.current) mesh.current.visible = u.uStrength.value > 0.002;
  });
  return (
    <mesh ref={mesh} position={SUN.clone().multiplyScalar(80)} frustumCulled={false} renderOrder={5} material={material}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export function Earth({ tier }: { tier: Tier }) {
  const urls = [tier.textures.day, tier.textures.night, tier.textures.brc];
  const [day, night, brc] = useTexture(urls);
  const gl = useThree((s) => s.gl);
  const group = useRef<THREE.Group>(null);
  const surface = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);

  useMemo(() => {
    const max = gl.capabilities.getMaxAnisotropy();
    for (const t of [day, night]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(max, 8);
    }
    brc.anisotropy = Math.min(max, 8);
  }, [day, night, brc, gl]);

  // Free GPU memory when the film unmounts, and drop drei's cache so a return visit reloads cleanly.
  useEffect(() => () => {
    day.dispose();
    night.dispose();
    brc.dispose();
    useTexture.clear(urls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, night, brc]);

  const surfaceM = useShader(() => ({
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
    uniforms: {
      uDay: { value: day },
      uNight: { value: night },
      uBRC: { value: brc },
      uSun: { value: SUN },
      uAir: { value: 0 },
      uCloudShift: { value: 0 },
      uBreath: { value: 0 },
    },
  }));
  const cloudM = useShader(() => ({
    vertexShader: cloudsVertex,
    fragmentShader: cloudsFragment,
    uniforms: { uBRC: { value: brc }, uSun: { value: SUN }, uAir: { value: 0 }, uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
  }));
  const airM = useShader(() => ({
    vertexShader: atmosphereVertex,
    fragmentShader: atmosphereFragment,
    uniforms: { uSun: { value: SUN }, uAir: { value: 0 }, uTop: { value: TOP }, uGain: { value: 1 } },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));

  useFrame(() => {
    if (group.current) group.current.visible = story.earth > 0.001;
    const spin = 2.2 + story.spin + story.t * 0.0085;
    const drift = story.t * 0.0012;
    if (surface.current) surface.current.rotation.y = spin;
    if (clouds.current) clouds.current.rotation.y = spin + drift;
    surfaceM.uniforms.uAir.value = story.air;
    surfaceM.uniforms.uBreath.value = story.breath;
    surfaceM.uniforms.uCloudShift.value = -drift / (Math.PI * 2);
    cloudM.uniforms.uAir.value = story.air;
    airM.uniforms.uAir.value = story.air;
    airM.uniforms.uGain.value = (1.15 + story.breath * 0.07) * (1 - story.sky);
  });

  return (
    <>
      <Stars count={tier.stars} />
      <group ref={group}>
        <mesh ref={surface} rotation={[0.1, 0, 0]} renderOrder={0} material={surfaceM}>
          <sphereGeometry args={[1, tier.segments, tier.segments]} />
        </mesh>
        <mesh ref={clouds} rotation={[0.1, 0, 0]} renderOrder={1} material={cloudM}>
          <sphereGeometry args={[1.006, tier.segments, tier.segments]} />
        </mesh>
        <mesh renderOrder={2} material={airM}>
          <sphereGeometry args={[TOP, 96, 96]} />
        </mesh>
      </group>
      <Glare />
    </>
  );
}
