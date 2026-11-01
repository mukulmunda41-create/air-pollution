// The camera path, in Earth's coordinates (Earth radius 1 at the origin). Splines rather than
// keyframe tweens, so the camera never stops at a waypoint: a breath has no corners.
import * as THREE from 'three';

export const SUN = new THREE.Vector3(-0.86, 0.36, 0.1).normalize();

// The dive: straight up at the point we fall toward, and forward along the ground toward a low sun.
const UP = new THREE.Vector3(0.1, 0.6, 0.8).normalize();
const FORWARD = SUN.clone().addScaledVector(UP, -SUN.dot(UP)).normalize();

type Vec = [number, number, number];
type Key = { pos: Vec; look: Vec; fov: number; roll: number };

// A point `r` from Earth's center and `along` the ground from the dive point.
const at = (r: number, along: number): Vec =>
  UP.clone().multiplyScalar(r).addScaledVector(FORWARD, along).toArray() as Vec;

const dive = (extraFov: number): Key[] => [
  { pos: at(2.15, -0.4), look: at(0.95, 0.3), fov: 33 + extraFov, roll: 0.05 },
  { pos: at(1.48, -0.3), look: at(1.0, 0.82), fov: 39 + extraFov, roll: 0.07 },
  { pos: at(1.12, -0.14), look: at(1.04, 0.92), fov: 45 + extraFov, roll: 0.05 },
  { pos: at(1.03, -0.02), look: at(1.022, 1.0), fov: 50 + extraFov, roll: 0.03 },
  { pos: at(1.015, 0.05), look: at(1.012, 1.05), fov: 54 + extraFov, roll: 0.02 },
];

// Wide frames hold Earth to the right, beside the title card.
const wide: Key[] = [
  { pos: [0, 0.14, 4.3], look: [-1.3, 0.02, 0], fov: 30, roll: 0 },
  { pos: [0.08, 0.2, 3.7], look: [-1.02, 0.08, 0], fov: 30, roll: 0.01 },
  { pos: [0.2, 0.34, 3.0], look: [-0.5, 0.16, 0], fov: 31, roll: 0.03 },
  ...dive(0),
];

// Tall frames hold Earth high, over the title.
const tall: Key[] = [
  { pos: [0, 0.14, 6.2], look: [0, -0.78, 0], fov: 32, roll: 0 },
  { pos: [0.06, 0.2, 5.2], look: [0, -0.6, 0], fov: 32, roll: 0.01 },
  { pos: [0.16, 0.34, 3.9], look: [-0.04, -0.2, 0], fov: 33, roll: 0.03 },
  ...dive(12),
];

function build(keys: Key[]) {
  return {
    pos: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal'),
    look: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, 'centripetal'),
    keys,
  };
}

let wideCurves: ReturnType<typeof build> | null = null;
let tallCurves: ReturnType<typeof build> | null = null;
const curves = (aspect: number) =>
  aspect < 0.9 ? (tallCurves ??= build(tall)) : (wideCurves ??= build(wide));

const scalar = (keys: Key[], t: number, read: (k: Key) => number) => {
  const f = THREE.MathUtils.clamp(t, 0, 1) * (keys.length - 1);
  const i = Math.min(Math.floor(f), keys.length - 2);
  return THREE.MathUtils.lerp(read(keys[i]), read(keys[i + 1]), THREE.MathUtils.smootherstep(f - i, 0, 1));
};

export type Pose = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number };

export function samplePose(t: number, aspect: number, out: Pose) {
  const c = curves(aspect);
  c.pos.getPoint(t, out.pos);
  c.look.getPoint(t, out.look);
  out.fov = scalar(c.keys, t, (k) => k.fov);
  out.roll = scalar(c.keys, t, (k) => k.roll);
  return out;
}

export const endPose = (aspect: number): Pose =>
  samplePose(1, aspect, { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0, roll: 0 });

// The sky's frame: the camera's position and aim at the very end of the dive.
const skyPos = new THREE.Vector3(...at(1.015, 0.05));
export const skyQuat = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().lookAt(skyPos, new THREE.Vector3(...at(1.012, 1.05)), skyPos.clone().normalize()),
);
