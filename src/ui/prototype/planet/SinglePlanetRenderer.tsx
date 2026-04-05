'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { mapProfileToRenderStyle } from '@/ui/prototype/planet/map-profile-to-render';
import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

interface SinglePlanetRendererProps {
  profile: PlanetVisualProfile;
}

function buildPlanetGeometry(profile: PlanetVisualProfile, style: ReturnType<typeof mapProfileToRenderStyle>) {
  const geometry = new THREE.IcosahedronGeometry(profile.shape.radius, 6);
  const positions = geometry.attributes.position;

  const macroPhase = profile.derivedSubSeeds.shapeSeed % 1000;
  const microPhase = profile.derivedSubSeeds.reliefSeed % 1000;

  for (let i = 0; i < positions.count; i += 1) {
    const vertex = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
    const normal = vertex.clone().normalize();

    const macroNoise = Math.sin(
      normal.x * style.macroFrequency +
        normal.y * (style.macroFrequency * 0.83) +
        normal.z * (style.macroFrequency * 0.61) +
        macroPhase,
    );

    const microNoise = Math.sin(
      normal.x * style.microFrequency * 2.1 +
        normal.y * style.microFrequency * 1.7 +
        normal.z * style.microFrequency * 1.9 +
        microPhase,
    );

    const ridgeNoise = Math.sin(
      normal.x * (profile.shape.wobbleFrequency + 0.7) +
        normal.z * (profile.shape.wobbleFrequency + 1.1) +
        macroPhase * 0.01,
    );

    const craterTerm = Math.cos((normal.x * 4.3 + normal.y * 5.7 + normal.z * 3.9 + microPhase) * 1.4);

    const reliefDisplacement =
      macroNoise * profile.relief.macroStrength * 0.09 +
      microNoise * profile.relief.microStrength * 0.04 +
      ridgeNoise * profile.shape.ridgeWarp * 0.018 -
      Math.max(0, craterTerm) * profile.relief.craterDensity * 0.015;

    const scale = 1 + reliefDisplacement + style.displacementScale * 0.1;
    vertex.multiplyScalar(scale);

    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  positions.needsUpdate = true;

  return geometry;
}

export default function SinglePlanetRenderer({ profile }: SinglePlanetRendererProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const style = mapProfileToRenderStyle(profile);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 4.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight('#93c5fd', 0.45);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.3);
    keyLight.position.set(3, 2, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#67e8f9', 0.4);
    rimLight.position.set(-2.5, -1.8, -2.7);
    scene.add(rimLight);

    const planetGeometry = buildPlanetGeometry(profile, style);
    const planetMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(style.baseColor),
      roughness: style.roughness,
      metalness: style.metalness,
      emissive: new THREE.Color(style.emissiveColor),
      emissiveIntensity: style.emissiveIntensity,
      flatShading: false,
    });

    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planetMesh);

    let atmosphereMesh: THREE.Mesh | null = null;
    if (profile.atmosphere.enabled) {
      const atmosphereGeometry = new THREE.SphereGeometry(profile.shape.radius * 1.07, 48, 48);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(style.atmosphereColor),
        transparent: true,
        opacity: Math.min(0.28, profile.atmosphere.intensity * 0.32),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphereMesh);
    }

    const render = () => {
      renderer.render(scene, camera);
    };

    render();

    const handleResize = () => {
      if (!mountRef.current) {
        return;
      }

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      render();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      if (atmosphereMesh) {
        atmosphereMesh.geometry.dispose();
        const material = atmosphereMesh.material as THREE.Material;
        material.dispose();
      }

      planetGeometry.dispose();
      planetMaterial.dispose();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [profile]);

  return <div ref={mountRef} className="h-[460px] w-full rounded-xl border border-slate-800" />;
}
