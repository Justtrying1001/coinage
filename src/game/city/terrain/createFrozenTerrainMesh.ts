import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  type Mesh as MeshType,
} from 'three';
import { SeededRng } from '@/game/world/rng';

function ridgeNoise(x: number, z: number): number {
  const major = Math.sin(x * 0.12 + 1.3) * Math.cos(z * 0.09 - 0.5);
  const medium = Math.sin((x + z) * 0.23) * 0.6 + Math.cos((x - z) * 0.19) * 0.4;
  const micro = Math.sin(x * 0.85) * Math.cos(z * 0.78) * 0.18;
  return major * 0.8 + medium * 0.35 + micro;
}

export function createFrozenTerrainMesh(seed: number): MeshType {
  const geometry = new PlaneGeometry(96, 96, 220, 220);
  const rng = new SeededRng(seed ^ 0x7f4a1e3c);
  const position = geometry.getAttribute('position');

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getY(i);

    const radius01 = Math.min(1, Math.hypot(x, z) / 48);
    const ridge = ridgeNoise(x, z);
    const shelf = Math.sin(x * 0.05 + 0.8) * 0.9 + Math.cos(z * 0.04 - 1.1) * 0.7;
    const glacialBowl = -Math.exp(-((x + 9.5) ** 2 + (z - 6.8) ** 2) / 210) * 4.3;
    const pressureRidge = Math.exp(-((x - 12.2) ** 2 + (z + 10.7) ** 2) / 120) * 3.4;
    const undulation = Math.sin((x * 0.32) + (z * 0.18)) * 0.55;
    const macroNoise = rng.range(-0.18, 0.18);
    const edgeDrop = -Math.pow(radius01, 2.5) * 9.5;

    const height = ridge * 3.4 + shelf * 1.6 + glacialBowl + pressureRidge + undulation + macroNoise + edgeDrop;
    position.setZ(i, height);
  }

  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);

  const material = new ShaderMaterial({
    uniforms: {
      uLightDir: { value: new Vector2(0.74, 0.42) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vHeight;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vHeight = position.y;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vHeight;

      uniform vec2 uLightDir;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec3 normal = normalize(vWorldNormal);
        float slope = 1.0 - clamp(normal.y, 0.0, 1.0);

        float heightMask = smoothstep(-7.0, 5.0, vHeight);
        float macro = noise(vWorldPos.xz * 0.03);
        float breakup = noise(vWorldPos.xz * 0.12 + vec2(17.0, -11.0));

        vec3 snow = vec3(0.91, 0.95, 0.98);
        vec3 ice = vec3(0.67, 0.78, 0.87);
        vec3 rock = vec3(0.45, 0.48, 0.53);

        float snowWeight = smoothstep(0.18, 0.75, heightMask + macro * 0.25) * (1.0 - smoothstep(0.20, 0.58, slope));
        float rockWeight = smoothstep(0.24, 0.72, slope + breakup * 0.3);
        float iceWeight = 1.0 - clamp(snowWeight + rockWeight, 0.0, 1.0);

        vec3 baseColor = snow * snowWeight + rock * rockWeight + ice * iceWeight;

        vec3 lightDir = normalize(vec3(uLightDir.x, 0.92, uLightDir.y));
        float ndl = max(dot(normal, lightDir), 0.0);
        float ambient = 0.55;

        float coldCavity = smoothstep(0.0, 0.6, 1.0 - normal.y) * 0.08;
        vec3 lit = baseColor * (ambient + ndl * 0.65 - coldCavity);

        float frostSparkle = pow(max(dot(normalize(lightDir + vec3(0.0, 1.0, 0.0)), normal), 0.0), 22.0) * snowWeight * 0.18;
        lit += vec3(0.08, 0.1, 0.12) * frostSparkle;

        gl_FragColor = vec4(lit, 1.0);
      }
    `,
  });

  return new Mesh(geometry, material);
}
