import * as THREE from 'three';

export function updatePlanetLighting(object: THREE.Object3D, lightDirection: THREE.Vector3): void {
  const dir = lightDirection.clone().normalize();
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const material = node.material;
    if (material instanceof THREE.ShaderMaterial && material.uniforms.uLightDirection) {
      material.uniforms.uLightDirection.value.copy(dir);
    }
  });
}

export function updatePlanetLayerAnimation(object: THREE.Object3D, deltaSeconds: number, freezeRotation = false): void {
  if (freezeRotation) return;

  object.traverse((node) => {
    const speed = typeof node.userData.rotationSpeed === 'number' ? node.userData.rotationSpeed : 0;
    if (speed !== 0 && node instanceof THREE.Mesh) {
      node.rotation.y += speed * deltaSeconds;
    }
    if (node instanceof THREE.Mesh && node.material instanceof THREE.ShaderMaterial) {
      const timeUniform = node.material.uniforms.uTime;
      if (timeUniform) timeUniform.value += deltaSeconds;
    }
  });
}
