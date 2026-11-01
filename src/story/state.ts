// The one driver. The master timeline writes here, the breath ticker writes here, every visual
// reads here. A plain object on purpose: scrolling must never cause a React render.
export const story = {
  time: 0, // master timeline position, in screens of scroll
  chapter: 0, // index of the chapter on screen
  camT: 0, // 0 to 1 along the camera spline
  air: 0, // 0 clean, 1 choked: atmosphere, clouds, particles, sky grade
  reading: 2, // HUD PM2.5, illustrative
  spin: 0, // extra Earth rotation from scroll
  earth: 1, // Earth act opacity gate
  stars: 1,
  day: 0, // 1 is clear daylight in the sky act, for the rise off the street
  pull: 0, // how far past the opening pose the finale has drawn back
  sky: 0, // sky dome opacity
  clouds: 0, // cloud sprite opacity
  particles: 0, // PM particle density
  hero: 0, // hero particle opacity
  skyZ: 0, // distance flown through the sky act
  plates: {} as Record<string, { o: number; p: number; c: number; s: number; l: number; z: number }>, // per scene: opacity, video progress, how far 3D cloud has cleared off it, how far it has shrunk into the next scene, how far the camera has risen off it, how far it has closed in on it
  // idle input, written by breath.ts
  t: 0, // seconds, stops when paused
  breath: 0, // -1 exhaled, 1 inhaled
  breaths: 0,
  paused: false,
  pointer: { x: 0, y: 0 }, // lagged, -0.5 to 0.5
};
