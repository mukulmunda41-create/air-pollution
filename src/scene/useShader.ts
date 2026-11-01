'use client';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// R3F 9.8 copies a <shaderMaterial uniforms> prop into its own objects, so per-frame writes to the
// original never reach the shader. Owning the material keeps uniforms by reference: write to
// material.uniforms in useFrame, and React never re-renders for it.
export function useShader(make: () => THREE.ShaderMaterialParameters) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const material = useMemo(() => new THREE.ShaderMaterial(make()), []);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}
