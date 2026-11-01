import * as THREE from 'three';

// fbm baked once into a texture: far cheaper than running noise per fragment on layered sprites.
export function makeNoise(size = 256) {
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const noise = (x: number, y: number, period: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const at = (a: number, b: number) => hash(((a % period) + period) % period, ((b % period) + period) % period);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(at(xi, yi), at(xi + 1, yi), u),
      THREE.MathUtils.lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u),
      v,
    );
  };
  const data = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0, a = 0.5, f = 4;
      for (let o = 0; o < 5; o++) {
        v += a * noise((x / size) * f, (y / size) * f, f);
        a *= 0.5;
        f *= 2;
      }
      data[y * size + x] = Math.min(255, v * 270);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}
