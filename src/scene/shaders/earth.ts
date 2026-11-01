// Earth's three shells: surface, clouds, atmosphere. All lit from world-space uSun.
// `air` (0 clean, 1 choked) greys every one of them from the same uniform.

const sharedVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const surfaceVertex = sharedVertex;

export const surfaceFragment = /* glsl */ `
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uBRC;   // R bump, G roughness, B clouds
uniform vec3 uSun;
uniform float uAir;
uniform float uCloudShift;
uniform float uBreath;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;

const vec3 RAYLEIGH = vec3(0.22, 0.5, 1.0);
const vec3 SMOG = vec3(0.46, 0.42, 0.36);
const vec3 DUSK = vec3(1.0, 0.42, 0.16);

void main() {
  vec3 geo = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 brc = texture2D(uBRC, vUv).rgb;

  // Bump from the height channel, derivative based so there is no tangent attribute to carry.
  vec3 dpx = dFdx(vW), dpy = dFdy(vW);
  float dhx = dFdx(brc.r), dhy = dFdy(brc.r);
  vec3 r1 = cross(dpy, geo), r2 = cross(geo, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  float ocean = 1.0 - smoothstep(0.03, 0.22, brc.g);
  vec3 N = normalize(abs(det) * geo - mix(0.0045, 0.0, ocean) * grad);

  float sunGeo = dot(geo, uSun);
  float day = smoothstep(-0.1, 0.24, sunGeo);
  float diffuse = max(dot(N, uSun), 0.0);
  float rough = brc.g;

  // Cloud shadow: the cloud map, slid away from the sun.
  vec2 shadowUv = vUv + vec2(uCloudShift - uSun.x * 0.0022, -uSun.y * 0.0018);
  float shadow = 1.0 - smoothstep(0.3, 0.95, texture2D(uBRC, shadowUv).b) * 0.55;

  vec3 albedo = texture2D(uDay, vUv).rgb;
  float luma = dot(albedo, vec3(0.3, 0.59, 0.11));
  albedo = mix(albedo, mix(vec3(luma), albedo, 0.72) * vec3(0.26, 0.42, 0.62), ocean); // the texture's ocean is flat cobalt
  vec3 col = albedo * (diffuse * 1.9 + 0.012) * shadow;

  // Ocean glint: sharp on water, nothing on land.
  vec3 H = normalize(uSun + V);
  // Rolled off, and fading out toward the coast, so narrow seas shine without clipping to a flat shape.
  float glint = pow(max(dot(N, H), 0.0), mix(420.0, 40.0, rough)) * ocean * ocean * day * 1.5;
  col += vec3(1.0, 0.86, 0.68) * glint / (1.0 + glint * 2.2);

  // Warm rim at the terminator: the surface catches dusk before it goes dark.
  float band = smoothstep(-0.12, 0.05, sunGeo) * (1.0 - smoothstep(0.05, 0.28, sunGeo));
  col += DUSK * band * albedo * 0.5;

  // City lights only where it is night, and dimmer under cloud.
  float clouds = smoothstep(0.25, 0.9, brc.b);
  vec3 lights = texture2D(uNight, vUv).rgb * vec3(1.15, 0.86, 0.6);
  col += lights * (1.0 - day) * (1.0 - clouds * 0.7) * mix(1.5, 0.9, uAir);

  // The air thickens over everything: scatter at the rim, then haze as air rises.
  float rim = pow(1.0 - max(dot(geo, V), 0.0), 3.2);
  vec3 airCol = mix(RAYLEIGH, SMOG, uAir);
  float lit = smoothstep(-0.25, 0.3, sunGeo);
  col += airCol * rim * lit * (0.85 + uBreath * 0.05);
  col = mix(col, SMOG * (0.05 + diffuse * 0.5), uAir * 0.55);

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const cloudsVertex = sharedVertex;

export const cloudsFragment = /* glsl */ `
uniform sampler2D uBRC;
uniform vec3 uSun;
uniform float uAir;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;

void main() {
  vec3 geo = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float a = smoothstep(0.22, 0.95, texture2D(uBRC, vUv).b);
  float sunGeo = dot(geo, uSun);
  float light = smoothstep(-0.14, 0.34, sunGeo);
  // Layers stack up at grazing angles, so cloud reads thicker toward the limb.
  a = clamp(a * (1.0 + pow(1.0 - max(dot(geo, V), 0.0), 2.0) * 0.8), 0.0, 1.0);

  vec3 dusk = vec3(1.0, 0.56, 0.3);
  vec3 white = mix(vec3(0.98, 1.0, 1.0), vec3(0.54, 0.5, 0.44), uAir);
  vec3 col = mix(dusk, white, smoothstep(0.02, 0.36, sunGeo)) * (light * 1.25 + 0.015);

  gl_FragColor = vec4(col, a * uOpacity * mix(0.35, 1.0, light));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const atmosphereVertex = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// One analytic scatter: how far above the ground does this view ray pass, and is that point lit?
// Rays that skim low get dense blue air, or dusk orange where the sun is on the horizon.
export const atmosphereFragment = /* glsl */ `
uniform vec3 uSun;
uniform float uAir;
uniform float uTop;
uniform float uGain;
varying vec3 vW;

void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vW - ro);
  float along = max(dot(-ro, rd), 0.0);
  vec3 near = ro + rd * along;
  float d = length(near);
  float h = clamp((d - 1.0) / (uTop - 1.0), 0.0, 1.0);
  float dens = exp(-h * 5.0) * (1.0 - smoothstep(0.72, 1.0, h));

  float sd = dot(normalize(near), uSun);
  float lit = smoothstep(-0.32, 0.22, sd);
  vec3 blue = mix(vec3(0.16, 0.44, 1.0), vec3(0.42, 0.39, 0.33), uAir);
  vec3 dusk = mix(vec3(1.0, 0.4, 0.13), vec3(0.62, 0.4, 0.24), uAir);
  vec3 col = mix(dusk, blue, smoothstep(-0.12, 0.42, sd));
  col += vec3(1.0, 0.74, 0.5) * pow(max(dot(rd, uSun), 0.0), 18.0) * 0.5;

  gl_FragColor = vec4(col * dens * lit * uGain, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const glareVertex = /* glsl */ `
varying vec2 vUv;
uniform float uSize;
uniform vec2 uViewport;
void main() {
  vUv = uv;
  vec4 clip = projectionMatrix * viewMatrix * modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vec2 aspect = vec2(uViewport.y / uViewport.x, 1.0);
  clip.xy += position.xy * uSize * aspect * clip.w;
  gl_Position = clip;
}`;

export const glareFragment = /* glsl */ `
varying vec2 vUv;
uniform float uStrength;
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p);
  float core = pow(max(1.0 - r * 2.0, 0.0), 26.0) * 5.0;
  float halo = pow(max(1.0 - r * 2.0, 0.0), 3.4) * 0.22;
  float streak = exp(-abs(p.y) * 220.0) * pow(max(1.0 - abs(p.x) * 2.0, 0.0), 3.0) * 0.55;
  vec3 col = vec3(1.0, 0.93, 0.82) * core + vec3(1.0, 0.68, 0.4) * halo + vec3(1.0, 0.72, 0.46) * streak;
  gl_FragColor = vec4(col * uStrength, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const starsVertex = /* glsl */ `
attribute float aSize;
attribute float aSeed;
uniform float uDpr;
uniform float uTime;
varying float vTwinkle;
varying float vSeed;
void main() {
  vSeed = aSeed;
  vTwinkle = 0.78 + 0.22 * sin(uTime * (0.4 + aSeed * 1.4) + aSeed * 40.0);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uDpr;
}`;

export const starsFragment = /* glsl */ `
uniform float uOpacity;
varying float vTwinkle;
varying float vSeed;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = 1.0 - smoothstep(0.0, 0.5, r);
  vec3 tint = mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.9, 0.78), vSeed);
  gl_FragColor = vec4(tint * vTwinkle * a * a * uOpacity, 1.0);
  #include <colorspace_fragment>
}`;
