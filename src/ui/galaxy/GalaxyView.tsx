'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { generateGalaxyLayout } from '@/domain/world/generate-galaxy-layout';
import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';
import { deriveSeed } from '@/domain/world/seeded-rng';
import { mapProfileToRenderStyle } from '@/ui/galaxy/render/map-profile-to-render';

interface GalaxyViewProps {
  worldSeed: string;
}

interface PlanetRenderData {
  id: string;
  x: number;
  y: number;
  z: number;
  profile: PlanetVisualProfile;
}

const FIELD_RADIUS = 70;
const CAMERA_Z = 34;
const MOVE_SPEED = 24;
const BASE_GEOMETRY_DETAIL = 5;

function fract(value: number): number {
  return value - Math.floor(value);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

function hash3(x: number, y: number, z: number, seed: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 0.0031) * 43758.5453123);
}

function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);

  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);

  const c000 = hash3(xi, yi, zi, seed);
  const c100 = hash3(xi + 1, yi, zi, seed);
  const c010 = hash3(xi, yi + 1, zi, seed);
  const c110 = hash3(xi + 1, yi + 1, zi, seed);
  const c001 = hash3(xi, yi, zi + 1, seed);
  const c101 = hash3(xi + 1, yi, zi + 1, seed);
  const c011 = hash3(xi, yi + 1, zi + 1, seed);
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed);

  const x00 = c000 * (1 - u) + c100 * u;
  const x10 = c010 * (1 - u) + c110 * u;
  const x01 = c001 * (1 - u) + c101 * u;
  const x11 = c011 * (1 - u) + c111 * u;

  const y0 = x00 * (1 - v) + x10 * v;
  const y1 = x01 * (1 - v) + x11 * v;

  return y0 * (1 - w) + y1 * w;
}

function fbm(x: number, y: number, z: number, seed: number, octaves: number): number {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let i = 0; i < octaves; i += 1) {
    const n = valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 3893);
    sum += (n * 2 - 1) * amplitude;
    frequency *= 2.01;
    amplitude *= 0.5;
  }

  return sum;
}

function ridgedFbm(x: number, y: number, z: number, seed: number, octaves: number, sharpness: number): number {
  let sum = 0;
  let amplitude = 0.65;
  let frequency = 1;

  for (let i = 0; i < octaves; i += 1) {
    const n = valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 1459) * 2 - 1;
    const ridge = Math.pow(1 - Math.abs(n), 1 + sharpness);
    sum += ridge * amplitude;
    frequency *= 2.2;
    amplitude *= 0.52;
  }

  return sum;
}

function mixColors(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}

function createAtmosphereMaterial(color: THREE.Color, intensity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uIntensity: { value: intensity },
    },
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normalize(vWorldNormal)), 0.0), 2.5);
        float alpha = fresnel * (0.2 + uIntensity * 0.55);
        gl_FragColor = vec4(uColor * (0.25 + fresnel * 1.25), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
}

function createPlanetMesh(profile: PlanetVisualProfile): { mesh: THREE.Mesh; atmosphere?: THREE.Mesh; materials: THREE.Material[] } {
  const style = mapProfileToRenderStyle(profile);
  const geometry = new THREE.IcosahedronGeometry(1, BASE_GEOMETRY_DETAIL);
  const positions = geometry.attributes.position;

  const oceanColor = new THREE.Color(style.oceanColor);
  const shoreColor = new THREE.Color(style.shoreColor);
  const lowlandColor = new THREE.Color(style.lowlandColor);
  const highlandColor = new THREE.Color(style.highlandColor);
  const ridgeColor = new THREE.Color(style.ridgeColor);
  const snowColor = new THREE.Color(style.snowColor);

  const colorBuffer = new Float32Array(positions.count * 3);
  const tempVertex = new THREE.Vector3();

  const seed = profile.derivedSubSeeds.shapeSeed;
  const reliefSeed = profile.derivedSubSeeds.reliefSeed;
  const surfaceSeed = profile.derivedSubSeeds.surfaceSeed;

  for (let i = 0; i < positions.count; i += 1) {
    tempVertex.set(positions.getX(i), positions.getY(i), positions.getZ(i)).normalize();

    const warp = fbm(
      tempVertex.x * style.warpFrequency,
      tempVertex.y * style.warpFrequency,
      tempVertex.z * style.warpFrequency,
      seed + 173,
      3,
    );

    const warpOffset = warp * (0.2 + profile.shape.ridgeWarp * 0.75);

    const macro = fbm(
      tempVertex.x * style.macroFrequency + warpOffset,
      tempVertex.y * style.macroFrequency - warpOffset,
      tempVertex.z * style.macroFrequency + warpOffset * 0.5,
      reliefSeed + 37,
      5,
    );

    const ridged = ridgedFbm(
      tempVertex.x * (style.macroFrequency * 0.95),
      tempVertex.y * (style.macroFrequency * 0.95),
      tempVertex.z * (style.macroFrequency * 0.95),
      reliefSeed + 431,
      4,
      profile.surface.ridgeSharpness,
    );

    const micro = fbm(
      tempVertex.x * style.microFrequency,
      tempVertex.y * style.microFrequency,
      tempVertex.z * style.microFrequency,
      reliefSeed + 997,
      4,
    );

    const craterField = valueNoise3(
      tempVertex.x * (3.8 + profile.relief.craterDensity * 5.2),
      tempVertex.y * (3.8 + profile.relief.craterDensity * 5.2),
      tempVertex.z * (3.8 + profile.relief.craterDensity * 5.2),
      surfaceSeed + 719,
    );

    const crater = smoothstep(0.68, 0.9, craterField) * profile.relief.craterDensity * 0.5;

    const heightSignal = (
      macro * profile.relief.macroStrength * 0.9 +
      ridged * profile.shape.ridgeWarp * 0.55 +
      micro * profile.relief.microStrength * 0.32 -
      crater
    );

    const displacement = 1 + heightSignal * style.displacementScale + profile.shape.wobbleAmplitude * macro * 0.25;
    tempVertex.multiplyScalar(displacement);
    positions.setXYZ(i, tempVertex.x, tempVertex.y, tempVertex.z);

    const elevation = smoothstep(-0.25, 0.45, heightSignal + 0.2);
    const oceanThreshold = profile.surface.oceanLevel;
    const moisture = fbm(
      tempVertex.x * (1.2 + profile.surface.biomeScale),
      tempVertex.y * (1.2 + profile.surface.biomeScale),
      tempVertex.z * (1.2 + profile.surface.biomeScale),
      surfaceSeed + 1597,
      4,
    ) * 0.5 + 0.5 + profile.surface.moistureBias;
    const latitude = 1 - Math.abs(tempVertex.y + profile.surface.heatBias * 0.4);
    const coldness = smoothstep(0.12, 0.78, 1 - latitude);

    let color: THREE.Color;

    if (elevation < oceanThreshold) {
      const depthMix = smoothstep(0, oceanThreshold, elevation);
      color = mixColors(oceanColor, shoreColor, depthMix * 0.65);
    } else {
      const landHeight = smoothstep(oceanThreshold, 1, elevation);
      const biomeMix = smoothstep(0.28, 0.8, moisture);
      const baseLand = mixColors(lowlandColor, highlandColor, landHeight * 0.7 + (1 - biomeMix) * 0.2);
      const ridgeMix = smoothstep(0.62, 0.95, landHeight + ridged * 0.12);
      color = mixColors(baseLand, ridgeColor, ridgeMix);

      const snowMix = smoothstep(0.55, 0.98, coldness + landHeight * 0.4);
      color = mixColors(color, snowColor, snowMix * (0.75 + landHeight * 0.25));
    }

    colorBuffer[i * 3] = color.r;
    colorBuffer[i * 3 + 1] = color.g;
    colorBuffer[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colorBuffer, 3));
  geometry.computeVertexNormals();
  positions.needsUpdate = true;

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: style.roughness,
    metalness: style.metalness,
    emissive: new THREE.Color(style.emissiveColor),
    emissiveIntensity: style.emissiveIntensity,
    envMapIntensity: 0.35,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(profile.shape.radius * 0.82);

  const materials: THREE.Material[] = [material];

  if (profile.atmosphere.enabled && profile.atmosphere.intensity > 0.18) {
    const atmoGeometry = new THREE.SphereGeometry(1, 36, 36);
    const atmoMaterial = createAtmosphereMaterial(new THREE.Color(style.atmosphereColor), profile.atmosphere.intensity);
    const atmo = new THREE.Mesh(atmoGeometry, atmoMaterial);
    atmo.scale.setScalar((profile.shape.radius * 0.82) * (1.08 + profile.atmosphere.thickness * 1.6));
    atmo.renderOrder = 2;
    materials.push(atmoMaterial);
    return { mesh, atmosphere: atmo, materials };
  }

  return { mesh, materials };
}

function createStarField(seed: string): THREE.Points {
  const count = 2400;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  let state = deriveSeed(seed, 'starfield');
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };

  for (let i = 0; i < count; i += 1) {
    const radius = Math.pow(random(), 0.65) * 240 + 15;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi) - 85;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const brightness = 0.6 + random() * 0.4;
    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness;
    colors[i * 3 + 2] = Math.min(1, brightness + 0.08);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.7,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
  });

  return new THREE.Points(geometry, material);
}

export default function GalaxyView({ worldSeed }: GalaxyViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const planetData = useMemo<PlanetRenderData[]>(() => {
    return generateGalaxyLayout(worldSeed, {
      planetCount: 110,
      fieldRadius: FIELD_RADIUS,
      minSpacing: 7.4,
      depthRange: 10,
    }).map((planet) => ({
      ...planet,
      profile: generatePlanetVisualProfile({ worldSeed, planetSeed: planet.planetSeed }),
    }));
  }, [worldSeed]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');
    scene.fog = new THREE.FogExp2('#030712', 0.016);

    const camera = new THREE.PerspectiveCamera(54, mount.clientWidth / mount.clientHeight, 0.1, 600);
    camera.position.set(0, 0, CAMERA_Z);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const stars = createStarField(worldSeed);
    scene.add(stars);

    scene.add(new THREE.AmbientLight('#93c5fd', 0.42));

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.3);
    keyLight.position.set(24, 28, 40);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#67e8f9', 0.4);
    fillLight.position.set(-20, -18, 20);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight('#c4b5fd', 0.22);
    backLight.position.set(-40, 5, -10);
    scene.add(backLight);

    const planetGroup = new THREE.Group();
    const disposables: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [];

    for (const planet of planetData) {
      const { mesh, atmosphere, materials } = createPlanetMesh(planet.profile);
      mesh.position.set(planet.x, planet.y, planet.z);
      geometries.push(mesh.geometry);
      for (const material of materials) {
        disposables.push(material);
      }
      planetGroup.add(mesh);

      if (atmosphere) {
        atmosphere.position.copy(mesh.position);
        geometries.push(atmosphere.geometry);
        planetGroup.add(atmosphere);
      }
    }

    scene.add(planetGroup);

    const keyState: Record<string, boolean> = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false,
    };

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key in keyState) {
        keyState[event.key] = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key in keyState) {
        keyState[event.key] = false;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }

      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      camera.position.x -= dx * 0.04;
      camera.position.y += dy * 0.04;
    };

    const onPointerUp = () => {
      dragging = false;
    };

    const onResize = () => {
      if (!mountRef.current) {
        return;
      }

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
    renderer.domElement.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });

    let previousTime = performance.now();
    let frame = 0;
    let animationHandle = 0;

    const animate = (time: number) => {
      const delta = Math.min(0.05, (time - previousTime) / 1000);
      previousTime = time;

      let moveX = 0;
      let moveY = 0;

      if (keyState.ArrowLeft || keyState.a) moveX -= 1;
      if (keyState.ArrowRight || keyState.d) moveX += 1;
      if (keyState.ArrowUp || keyState.w) moveY += 1;
      if (keyState.ArrowDown || keyState.s) moveY -= 1;

      const length = Math.hypot(moveX, moveY) || 1;
      if (moveX !== 0 || moveY !== 0) {
        camera.position.x += (moveX / length) * MOVE_SPEED * delta;
        camera.position.y += (moveY / length) * MOVE_SPEED * delta;
      }

      camera.position.x = Math.max(-FIELD_RADIUS, Math.min(FIELD_RADIUS, camera.position.x));
      camera.position.y = Math.max(-FIELD_RADIUS, Math.min(FIELD_RADIUS, camera.position.y));

      if (frame % 2 === 0) {
        stars.rotation.z += 0.00008;
      }
      frame += 1;

      renderer.render(scene, camera);
      animationHandle = requestAnimationFrame(animate);
    };

    animationHandle = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationHandle);

      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);

      for (const geometry of geometries) {
        geometry.dispose();
      }

      for (const material of disposables) {
        material.dispose();
      }

      const starsGeometry = stars.geometry;
      const starsMaterial = stars.material;
      starsGeometry.dispose();
      (starsMaterial as THREE.Material).dispose();

      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [planetData, worldSeed]);

  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300">
        <p>
          Controls: <span className="font-semibold text-slate-100">WASD / Arrow Keys</span> to move, drag to pan.
          Zoom is intentionally disabled for MVP map framing.
        </p>
      </div>
      <div ref={mountRef} className="h-[72vh] w-full rounded-xl border border-slate-800" />
    </section>
  );
}
