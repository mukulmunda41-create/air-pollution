'use client';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { story } from '@/story/state';
import { samplePose, type Pose } from './path';

export function CameraRig() {
  const pose = useRef<Pose>({ pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30, roll: 0 });
  const lastFov = useRef(0);
  const ground = useRef(new THREE.Vector3());
  useFrame(({ camera, size }) => {
    const aspect = size.width / size.height;
    const p = samplePose(story.camT, aspect, pose.current);
    // The exhale ends further out than the film began: the whole planet, not just our part of it.
    if (story.pull > 0) {
      p.pos.z += story.pull * (aspect < 0.9 ? 2.2 : 1.5);
      if (aspect >= 0.9) p.look.x -= story.pull * 0.35;
    }
    // The one breath: a slow dolly in and out, plus a little pointer so it answers before you scroll.
    const reach = 1 + story.breath * 0.0035 * story.earth;
    camera.position.copy(p.pos).multiplyScalar(reach);
    camera.position.x += story.pointer.x * 0.03 * story.earth;
    camera.position.y -= story.pointer.y * 0.02 * story.earth;
    // Ease "up" from the world's to the ground's, so the horizon levels out as we fall toward it.
    const level = THREE.MathUtils.smoothstep(story.camT, 0.38, 0.72);
    camera.up.set(0, 1, 0).lerp(ground.current.copy(p.pos).normalize(), level).normalize();
    camera.lookAt(p.look);
    camera.rotateZ(p.roll + story.pointer.x * -0.008);
    const persp = camera as THREE.PerspectiveCamera;
    if (Math.abs(lastFov.current - p.fov) > 0.01) {
      persp.fov = p.fov;
      persp.updateProjectionMatrix();
      lastFov.current = p.fov;
    }
  });
  return null;
}
