// Quality tier, decided once on the client. A runtime FPS watchdog in Stage lowers DPR further.
import { isMobile } from '@/engine/env';

export type Tier = {
  high: boolean;
  dpr: number;
  segments: number;
  textures: { day: string; night: string; brc: string };
  stars: number;
  particles: number;
  clouds: number;
};

export function pickTier(): Tier {
  const n = navigator as Navigator & { deviceMemory?: number };
  const weak = isMobile() || (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 4;
  const base = '/textures/earth';
  return weak
    ? {
        high: false,
        dpr: Math.min(devicePixelRatio, 1.5),
        segments: 64,
        textures: {
          day: `${base}/phone/earth_day_2048.jpg`,
          night: `${base}/phone/earth_night_2048.jpg`,
          brc: `${base}/phone/earth_bump_roughness_clouds_2048.jpg`,
        },
        stars: 1600,
        particles: 1800,
        clouds: 26,
      }
    : {
        high: true,
        dpr: Math.min(devicePixelRatio, 2),
        segments: 128,
        textures: {
          day: `${base}/earth_day_4096.jpg`,
          night: `${base}/earth_night_4096.jpg`,
          brc: `${base}/earth_bump_roughness_clouds_4096.jpg`,
        },
        stars: 4200,
        particles: 7000,
        clouds: 64,
      };
}
