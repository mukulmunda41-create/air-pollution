'use client';
// The sky act. A group locked to the camera position and aimed along the end of the camera path:
// its own frame, so nothing needs to fly at planet scale. It fades in over Earth during the dive.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { story } from '@/story/state';
import { makeNoise } from './noise';
import { endPose, skyQuat, SUN } from './path';
import {
  cloudFragment, cloudVertex, domeFragment, domeVertex, heroFragment, heroVertex, particleFragment, particleVertex,
} from './shaders/sky';
import type { Tier } from './tier';
import { useShader } from './useShader';

const LENGTH = 70;

export function Sky({ tier }: { tier: Tier }) {
  const group = useRef<THREE.Group>(null);
  const hero = useRef<THREE.Mesh>(null);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const noise = useMemo(() => makeNoise(), []);
  useEffect(() => () => noise.dispose(), [noise]);

  const end = useMemo(() => endPose(size.width / size.height), [size.width, size.height]);
  const frame = skyQuat;
  const inverse = useMemo(() => frame.clone().invert(), [frame]);

  const clouds = useMemo(() => {
    const n = tier.clouds;
    const offset = new Float32Array(n * 3);
    const meta = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // Stacked around a flight corridor, with the heavier deck below: the camera stays in the gap.
      const below = i % 3 !== 0;
      const x = (Math.random() - 0.5) * 34;
      const y = below ? -3 - Math.random() * 6 : 2.4 + Math.random() * 5;
      offset.set([Math.abs(x) < 2 ? x + Math.sign(x || 1) * 2 : x, y, Math.random() * LENGTH], i * 3);
      meta.set([9 + Math.random() * 14, Math.random() * Math.PI * 2, Math.random()], i * 3);
    }
    const g = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('uv', base.getAttribute('uv'));
    g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offset, 3));
    g.setAttribute('aMeta', new THREE.InstancedBufferAttribute(meta, 3));
    g.instanceCount = n;
    return g;
  }, [tier.clouds]);
  useEffect(() => () => clouds.dispose(), [clouds]);

  const dust = useMemo(() => {
    const n = tier.particles;
    const offset = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      offset.set([(Math.random() - 0.5) * 24, (Math.random() - 0.5) * 13, Math.random() * 26], i * 3);
      seed[i] = Math.random();
    }
    return { offset, seed };
  }, [tier.particles]);

  const domeM = useShader(() => ({
    vertexShader: domeVertex,
    fragmentShader: domeFragment,
    uniforms: { uUp: { value: end.pos.clone().normalize() }, uSun: { value: SUN }, uAir: { value: 0 }, uOpacity: { value: 0 }, uDay: { value: 0 } },
    side: THREE.BackSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  const cloudM = useShader(() => ({
    vertexShader: cloudVertex,
    fragmentShader: cloudFragment,
    uniforms: { uNoise: { value: noise }, uTravel: { value: 0 }, uLength: { value: LENGTH }, uTime: { value: 0 }, uOpacity: { value: 0 }, uAir: { value: 0 }, uDay: { value: 0 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  const dustM = useShader(() => ({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    uniforms: { uTravel: { value: 0 }, uTime: { value: 0 }, uDpr: { value: 1 }, uDensity: { value: 0 }, uBreath: { value: 0 }, uOpacity: { value: 0 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  const heroM = useShader(() => ({
    vertexShader: heroVertex,
    fragmentShader: heroFragment,
    uniforms: { uOpacity: { value: 0 }, uBreath: { value: 0 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));

  useFrame(({ camera }) => {
    const g = group.current;
    if (!g) return;
    const on = story.sky > 0.001 || story.clouds > 0.001;
    g.visible = on;
    if (!on) return;
    g.position.copy(camera.position);
    g.quaternion.copy(frame);
    domeM.uniforms.uUp.value.copy(end.pos).normalize();
    domeM.uniforms.uAir.value = cloudM.uniforms.uAir.value = story.air;
    domeM.uniforms.uOpacity.value = story.sky;
    domeM.uniforms.uDay.value = cloudM.uniforms.uDay.value = story.day;
    cloudM.uniforms.uTravel.value = dustM.uniforms.uTravel.value = story.skyZ;
    cloudM.uniforms.uTime.value = dustM.uniforms.uTime.value = story.t;
    // Over an approved plate, 3D cloud thins to a foreground wisp rather than burying the picture.
    const clear = Object.values(story.plates).reduce((m, p) => Math.max(m, p.o * p.c), 0);
    cloudM.uniforms.uOpacity.value = story.clouds * (1 - clear * 0.74);
    dustM.uniforms.uDpr.value = dpr;
    dustM.uniforms.uDensity.value = story.particles;
    dustM.uniforms.uOpacity.value = Math.min(story.particles * 1.6, 1);
    dustM.uniforms.uBreath.value = heroM.uniforms.uBreath.value = story.breath;
    heroM.uniforms.uOpacity.value = story.hero;
    if (hero.current) {
      // The particle the rest of the film follows: a small ember, low in the frame, so it can never pass for a sun.
      hero.current.visible = story.hero > 0.001;
      hero.current.position
        .set(0.25 + Math.sin(story.t * 0.21) * 0.03, -0.42 + Math.cos(story.t * 0.17) * 0.025, -4)
        .applyQuaternion(camera.quaternion)
        .applyQuaternion(inverse);
      const s = 0.09 + story.breath * 0.004;
      hero.current.scale.set(s, s, 1);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh renderOrder={10} frustumCulled={false} material={domeM}>
        <sphereGeometry args={[60, 32, 24]} />
      </mesh>
      <mesh geometry={clouds} renderOrder={12} frustumCulled={false} material={cloudM} />
      <points renderOrder={18} frustumCulled={false} material={dustM}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.offset, 3]} />
          <bufferAttribute attach="attributes-aOffset" args={[dust.offset, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[dust.seed, 1]} />
        </bufferGeometry>
      </points>
      <mesh ref={hero} renderOrder={19} frustumCulled={false} material={heroM}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}
