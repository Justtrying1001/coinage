import * as THREE from 'three';
import { atmosphereFragmentShader } from '@/game/planet/shaders/atmosphere/atmosphereFragment';
import { atmosphereVertexShader } from '@/game/planet/shaders/atmosphere/atmosphereVertex';
import type { Vector3Tuple } from '@/game/planet/utils/vector';

export function createAtmosphereMaterial(color: Vector3Tuple, intensity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Vector3(...color) },
      uIntensity: { value: intensity },
    },
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });
}
