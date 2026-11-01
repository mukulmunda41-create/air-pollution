'use client';
// An approved image or video on a full-screen quad inside the canvas, behind cloud and particulate.
// Video never plays: its time follows scroll. Loads within one chapter, disposes further away.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { chapters } from '@/content/copy';
import { story } from '@/story/state';
import { plateFragment, plateVertex } from './shaders/sky';
import type { Tier } from './tier';
import { useShader } from './useShader';

// How each approved picture sits in the film. Tuned to the picture itself, so revisit an entry if
// its asset is replaced. focus is the image point held at screen center (x, y from the bottom).
type Point = [number, number];
export const PLATE_LOOK: Record<string, { focus: Point; focusTall: Point; subject?: Point; pins?: Point[]; crush?: number; push?: Point }> = {
  // Keeps the sun on narrow screens: it sits about 73% across the image.
  atmosphere: { focus: [0.5, 0.5], focusTall: [0.68, 0.5] },
  // The lungs sit right of center, leaving the left clear for text. Phones center on the airway.
  // subject: the point in the image that matters for the turn. Here, the middle of the lungs...
  'human-lungs': { focus: [0.5, 0.5], focusTall: [0.62, 0.5], subject: [0.64, 0.5] },
  // ...and here, the child's chest, which those lungs shrink into.
  'child-city': { focus: [0.5, 0.5], focusTall: [0.51, 0.5], subject: [0.51, 0.4] },
  // The same frame as the child's last, with the air cleared, so it must sit exactly where that does.
  'future-city': { focus: [0.5, 0.5], focusTall: [0.51, 0.5] },
  // crush: drops the shadows, so the child's face stays a silhouette with no features in it.
  // push: the point the camera closes on, in the frame where the film stops the clip: under the nose.
  nose: { focus: [0.5, 0.5], focusTall: [0.52, 0.5], crush: 0.03, push: [0.52, 0.44] },
  // Phones center on the rings, which sit right of center to leave the left for text.
  windpipe: { focus: [0.5, 0.5], focusTall: [0.63, 0.5] },
  // Phones hold the stacks, the cooling tower and the sun. pins: where each source label's subject is in the
  // clip's second shot: the fires, the power plant, the cranes, the highway.
  'polluted-city': { focus: [0.5, 0.5], focusTall: [0.66, 0.5], pins: [[0.46, 0.31], [0.67, 0.34], [0.16, 0.28], [0.38, 0.14]] },
};

// Where a point in the image lands on screen, under the plate's object-fit: cover.
const toScreen = (point: Point, focus: Point, screen: number, image: number): Point => {
  const sx = screen > image ? 1 : screen / image;
  const sy = screen > image ? image / screen : 1;
  return [(point[0] - focus[0]) / sx + 0.5, (point[1] - focus[1]) / sy + 0.5];
};

// Scenes that play at the start of Chapter 4, ahead of the picture that chapter is named for.
const WAY_IN = ['nose', 'windpipe'];

export type PlateAsset = { image?: string; imagePhone?: string; video?: string; videoPhone?: string; poster?: string };

export function Plate({ scene, asset, tier }: { scene: string; asset: PlateAsset; tier: Tier }) {
  const index = chapters.findIndex((c) => c.scene === (WAY_IN.includes(scene) ? 'human-lungs' : scene));
  const mesh = useRef<THREE.Mesh>(null);
  const size = useThree((s) => s.size);
  const media = useRef<{ tex: THREE.Texture; video?: HTMLVideoElement } | null>(null);
  const loading = useRef(false);
  const placed = useRef('');

  const material = useShader(() => ({
    vertexShader: plateVertex,
    fragmentShader: plateFragment,
    uniforms: {
      uMap: { value: null as THREE.Texture | null },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uImage: { value: new THREE.Vector2(16, 9) },
      uOpacity: { value: 0 },
      uDrift: { value: 0 },
      uGrade: { value: 0 },
      uFocus: { value: new THREE.Vector2(0.5, 0.5) },
      uVideo: { value: 0 },
      uShrink: { value: 0 },
      uLift: { value: 0 },
      uCrush: { value: 0 },
      uPush: { value: 0 },
      uPushAt: { value: new THREE.Vector2(0.5, 0.5) },
      uFrom: { value: new THREE.Vector2(0.5, 0.5) },
      uTo: { value: new THREE.Vector2(0.5, 0.5) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    // The lungs sit on black, so adding them lets the street show through as they shrink into the chest.
    blending: scene === 'human-lungs' ? THREE.AdditiveBlending : THREE.NormalBlending,
  }));
  const uniforms = material.uniforms;

  const unload = () => {
    const m = media.current;
    if (!m) return;
    m.tex.dispose();
    if (m.video) {
      m.video.removeAttribute('src');
      m.video.load();
    }
    media.current = null;
    loading.current = false;
    uniforms.uMap.value = null;
  };

  const load = () => {
    if (loading.current || media.current) return;
    loading.current = true;
    const videoSrc = tier.high ? asset.video : asset.videoPhone;
    if (videoSrc) {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.crossOrigin = 'anonymous';
      video.src = videoSrc;
      video.pause();
      video.addEventListener('loadeddata', () => {
        const tex = new THREE.VideoTexture(video);
        tex.colorSpace = THREE.SRGBColorSpace;
        // A paused video reports no new frames until a seek, so a clip holding on frame 0 would stay black.
        tex.needsUpdate = true;
        media.current = { tex, video };
        uniforms.uMap.value = tex;
        uniforms.uImage.value.set(video.videoWidth || 16, video.videoHeight || 9);
      }, { once: true });
      video.addEventListener('error', () => { loading.current = false; }, { once: true });
      return;
    }
    const src = tier.high ? asset.image ?? asset.poster : asset.imagePhone ?? asset.image ?? asset.poster;
    if (!src) return;
    new THREE.TextureLoader().load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const im = tex.image as HTMLImageElement;
      media.current = { tex };
      uniforms.uMap.value = tex;
      uniforms.uImage.value.set(im.naturalWidth || 16, im.naturalHeight || 9);
    }, undefined, () => { loading.current = false; });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => unload, []);

  useFrame(() => {
    const near = Math.abs(story.chapter - index) <= 1;
    if (near) load(); else unload();
    const state = story.plates[scene];
    const visible = !!state && state.o > 0.001 && !!uniforms.uMap.value;
    if (mesh.current) mesh.current.visible = visible;
    if (!visible || !state) return;
    uniforms.uOpacity.value = state.o;
    // A still drifts slowly. A video has its own camera, and must end on the frame it was made with.
    uniforms.uDrift.value = media.current?.video ? 0 : state.p;
    // Only the atmosphere still stands in for a change of air. A video carries that change itself.
    uniforms.uGrade.value = scene === 'atmosphere' && !media.current?.video ? story.air : 0;
    uniforms.uViewport.value.set(size.width, size.height);
    const look = PLATE_LOOK[scene];
    const tall = size.width / size.height < 0.9;
    if (look) uniforms.uFocus.value.set(...(tall ? look.focusTall : look.focus));
    // Source labels sit beside what they name, held clear of the title above and the instruments below.
    const key = `${size.width}x${size.height}`;
    if (look?.pins && placed.current !== key && document.documentElement.classList.contains('pins')) {
      placed.current = key;
      document.querySelectorAll<HTMLElement>('#ch-3 [data-anchor]').forEach((el) => {
        const [x, y] = toScreen(look.pins![Number(el.dataset.anchor)], look.focus, size.width / size.height, uniforms.uImage.value.x / uniforms.uImage.value.y);
        el.style.translate = `${THREE.MathUtils.clamp(x * size.width + 18, 24, size.width - el.offsetWidth - 24)}px ${THREE.MathUtils.clamp((1 - y) * size.height, size.height * 0.47, size.height - el.offsetHeight - 88)}px`;
      });
    }
    uniforms.uShrink.value = state.s;
    uniforms.uLift.value = state.l;
    uniforms.uCrush.value = look?.crush ?? 0;
    uniforms.uPush.value = state.z;
    if (state.z > 0 && look?.push) uniforms.uPushAt.value.set(...toScreen(look.push, tall ? look.focusTall : look.focus, size.width / size.height, uniforms.uImage.value.x / uniforms.uImage.value.y));
    if (state.s > 0 && look?.subject) {
      const child = PLATE_LOOK['child-city'];
      const va = size.width / size.height;
      const ia = uniforms.uImage.value.x / uniforms.uImage.value.y;
      uniforms.uFrom.value.set(...toScreen(look.subject, tall ? look.focusTall : look.focus, va, ia));
      uniforms.uTo.value.set(...toScreen(child.subject!, tall ? child.focusTall : child.focus, va, ia));
    }
    const video = media.current?.video;
    uniforms.uVideo.value = video ? 1 : 0;
    if (video && video.duration && !video.seeking) {
      const target = state.p * (video.duration - 0.05);
      if (Math.abs(video.currentTime - target) > 0.02) video.currentTime = target;
    }
  });

  return (
    <mesh ref={mesh} renderOrder={scene === 'human-lungs' ? 11.5 : 11} frustumCulled={false} visible={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
