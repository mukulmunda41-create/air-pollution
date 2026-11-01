// The sky act: dome, soft cloud sprites and particulate. All positions come from uniforms, so
// scrolling back plays the same flight in reverse.

export const domeVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(mat3(modelMatrix) * position);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;

export const domeFragment = /* glsl */ `
uniform vec3 uUp;
uniform vec3 uSun;
uniform float uAir;
uniform float uOpacity;
uniform float uDay;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float y = dot(d, uUp);
  // Dusky even when clean: ink text has to stay readable over this.
  vec3 zenithClean = vec3(0.012, 0.05, 0.16);
  vec3 horizonClean = vec3(0.13, 0.25, 0.42);
  vec3 zenithDirty = vec3(0.075, 0.07, 0.066);
  vec3 horizonDirty = vec3(0.2, 0.17, 0.13);
  vec3 zenith = mix(zenithClean, zenithDirty, uAir);
  vec3 horizon = mix(horizonClean, horizonDirty, uAir);
  vec3 col = mix(horizon, zenith, smoothstep(-0.05, 0.62, y));
  col = mix(col, horizon * 0.52, 1.0 - smoothstep(-0.45, 0.0, y));
  // Clear daylight, seen from the street. It darkens on the way up to space.
  col = mix(col, mix(vec3(0.25, 0.45, 0.85), vec3(0.05, 0.16, 0.6), smoothstep(-0.05, 0.62, y)), uDay);
  float s = max(dot(d, uSun), 0.0);
  vec3 sunCol = mix(vec3(1.0, 0.72, 0.44), vec3(0.92, 0.5, 0.2), uAir);
  col += sunCol * (pow(s, 6.0) * 0.1 + pow(s, 48.0) * 0.26 + pow(s, 900.0) * mix(2.0, 0.35, uAir));
  gl_FragColor = vec4(col, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const cloudVertex = /* glsl */ `
attribute vec3 aOffset;
attribute vec3 aMeta;  // scale, rotation, seed
uniform float uTravel;
uniform float uLength;
uniform float uTime;
varying vec2 vUv;
varying float vFade;
varying float vSeed;
void main() {
  vec3 c = aOffset;
  c.z = mod(aOffset.z + uTravel, uLength) - uLength;
  c.x += sin(uTime * 0.05 + aMeta.z * 12.0) * 0.5;
  // Born far out of the fog, gone just before it would touch the lens.
  vFade = smoothstep(-uLength, -uLength * 0.62, c.z) * (1.0 - smoothstep(-7.0, -0.8, c.z));
  vSeed = aMeta.z;
  float cr = cos(aMeta.y), sr = sin(aMeta.y);
  vec2 q = mat2(cr, -sr, sr, cr) * position.xy * aMeta.x;
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(c, 1.0);
  mv.xy += q;
  gl_Position = projectionMatrix * mv;
}`;

export const cloudFragment = /* glsl */ `
uniform sampler2D uNoise;
uniform float uOpacity;
uniform float uAir;
uniform float uDay;
varying vec2 vUv;
varying float vFade;
varying float vSeed;
void main() {
  vec2 p = vUv - 0.5;
  float mask = 1.0 - smoothstep(0.1, 0.5, length(p));
  vec2 nUv = vUv * 0.55 + vec2(vSeed, fract(vSeed * 7.13));
  float n = texture2D(uNoise, nUv).r;
  // In daylight the same noise breaks into separate clouds, not a white veil over the whole sky.
  float a = mask * smoothstep(mix(0.32, 0.52, uDay), mix(0.72, 0.8, uDay), n) * vFade * uOpacity;
  if (a < 0.003) discard;
  vec3 shade = mix(vec3(0.1, 0.17, 0.28), vec3(0.09, 0.08, 0.065), uAir);
  vec3 light = mix(vec3(0.62, 0.68, 0.76), vec3(0.3, 0.27, 0.22), uAir);
  float lit = smoothstep(0.34, 0.86, n + (0.5 - vUv.y) * -0.3);
  vec3 col = mix(mix(shade, light, lit), mix(vec3(0.62, 0.7, 0.82), vec3(1.0, 0.98, 0.95), lit), uDay);
  gl_FragColor = vec4(col, a * 0.74);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const particleVertex = /* glsl */ `
attribute vec3 aOffset;
attribute float aSeed;
uniform float uTravel;
uniform float uTime;
uniform float uDpr;
uniform float uDensity;
uniform float uBreath;
varying float vAlpha;
varying float vEmber;
void main() {
  vec3 p = aOffset;
  p.z = mod(aOffset.z + uTravel * (0.6 + aSeed * 0.5), 26.0) - 26.0;
  // Brownian wander, plus a gentle pull and release with the breath.
  p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.14 + uBreath * 0.02 * (aSeed - 0.5);
  p.y += cos(uTime * 0.23 + aSeed * 90.0) * 0.14;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = -mv.z;
  gl_PointSize = uDpr * (1.2 + aSeed * 2.6) * 7.0 / max(dist, 0.5);
  float shown = step(aSeed, uDensity);
  vAlpha = shown * (1.0 - smoothstep(14.0, 26.0, dist)) * smoothstep(0.3, 1.8, dist);
  vEmber = step(0.985, aSeed);
}`;

export const particleFragment = /* glsl */ `
uniform float uOpacity;
varying float vAlpha;
varying float vEmber;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.08, 0.5, r)) * vAlpha * uOpacity;
  if (a < 0.004) discard;
  vec3 col = mix(vec3(0.74, 0.7, 0.62), vec3(0.95, 0.5, 0.18), vEmber);
  gl_FragColor = vec4(col, a * mix(0.62, 0.95, vEmber));
  #include <colorspace_fragment>
}`;

export const heroVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
  gl_Position = projectionMatrix * mv;
}`;

export const heroFragment = /* glsl */ `
uniform float uOpacity;
uniform float uBreath;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  // Orange all the way through. A white-hot center is what makes a glow read as a sun.
  float core = 1.0 - smoothstep(0.1, 0.34, r);
  float halo = pow(max(1.0 - r, 0.0), 3.0) * (0.5 + uBreath * 0.08);
  vec3 col = vec3(0.91, 0.47, 0.17) * (core * 1.1 + halo * 0.8);
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <colorspace_fragment>
}`;

export const plateVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.999, 1.0);
}`;

export const plateFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uViewport;
uniform vec2 uImage;
uniform float uOpacity;
uniform float uDrift;
uniform float uGrade;
uniform vec2 uFocus;
uniform float uVideo;
uniform float uShrink;
uniform float uLift;
uniform float uCrush;
uniform float uPush;
uniform vec2 uPushAt;
uniform vec2 uFrom;
uniform vec2 uTo;
varying vec2 vUv;
void main() {
  // The turn: the whole picture shrinks from where it sits to a point elsewhere on screen.
  vec2 q = vUv;
  float inside = 1.0;
  if (uShrink > 0.001) {
    q = uFrom + (vUv - mix(uFrom, uTo, uShrink)) * mix(1.0, 5.5, uShrink);
  }
  q = uPushAt + (q - uPushAt) / (1.0 + uPush * 9.0);
  // The camera rises off the street: the ground falls away faster than the distance.
  q.y += uLift * (0.62 + 0.4 * (1.0 - vUv.y));
  // object-fit: cover around a chosen point, with a slow push-in so a still plate does not look pasted on.
  float va = uViewport.x / uViewport.y;
  float ia = uImage.x / uImage.y;
  vec2 s = va > ia ? vec2(1.0, ia / va) : vec2(va / ia, 1.0);
  vec2 uv = (q - 0.5) * s * (1.0 - uDrift * 0.04) + uFocus;
  vec3 c = texture2D(uMap, uv).rgb;
  if (uShrink > 0.001) {
    // Bounded by the image, not the screen, so a phone sees the whole picture once it has shrunk.
    vec2 e = smoothstep(vec2(0.0), vec2(0.01), uv) * (1.0 - smoothstep(vec2(0.99), vec2(1.0), uv));
    inside = e.x * e.y * (1.0 - smoothstep(0.84, 1.0, uv.y)); // the windpipe runs off the top of the picture, so it fades, not cuts
  }
  // Only the street falls. Its sky goes first, so the sun seems to stay where it is.
  if (uLift > 0.001) inside *= 1.0 - smoothstep(0.4, 0.72, uv.y) * smoothstep(0.0, 0.3, uLift);
  // three.js leaves video frames in sRGB for custom shaders. Undecoded, they encode twice and wash out.
  if (uVideo > 0.5) c = mix(pow((c + 0.055) / 1.055, vec3(2.4)), c / 12.92, step(c, vec3(0.04045)));
  c = max(c - uCrush, 0.0) / (1.0 - uCrush);
  // A still cannot change by itself, so the air driver grays it as the story turns.
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(c, vec3(l) * vec3(1.03, 0.97, 0.87), uGrade * 0.62) * (1.0 - uGrade * 0.2);
  // The black around the lungs is not quite black. Dropping it removes the box they would otherwise sit in.
  if (uShrink > 0.001) inside *= smoothstep(0.012, 0.06, max(c.r, max(c.g, c.b)));
  gl_FragColor = vec4(c, uOpacity * inside);
  #include <colorspace_fragment>
}`;
