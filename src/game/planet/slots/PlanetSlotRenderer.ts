import * as THREE from 'three';
import type { PlanetSettlementSlot } from '@/game/planet/slots/types';

interface SlotVisual {
  group: THREE.Group;
  ring: THREE.Mesh;
  beacon: THREE.Mesh;
}

export class PlanetSlotRenderer {
  readonly root = new THREE.Group();

  private readonly visuals: SlotVisual[] = [];
  private readonly pickMeshes: THREE.Mesh[] = [];
  private readonly raycaster = new THREE.Raycaster();

  private readonly padMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b3d53,
    roughness: 0.9,
    metalness: 0.18,
    emissive: 0x05111a,
    emissiveIntensity: 0.22,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -2,
  });

  private readonly ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x5f7e97,
    roughness: 0.52,
    metalness: 0.34,
    emissive: 0x102a3d,
    emissiveIntensity: 0.42,
    transparent: true,
    opacity: 0.92,
  });

  private readonly beaconMaterial = new THREE.MeshStandardMaterial({
    color: 0x9fb8c9,
    roughness: 0.42,
    metalness: 0.48,
    emissive: 0x356f92,
    emissiveIntensity: 0.45,
  });

  build(slots: PlanetSettlementSlot[], surfaceMesh: THREE.Mesh) {
    this.clear();

    surfaceMesh.updateWorldMatrix(true, false);

    for (const slot of slots) {
      const visual = this.createSlotVisual(slot, surfaceMesh);
      this.visuals.push(visual);
      this.root.add(visual.group);
      this.pickMeshes.push(visual.group.children.find((child) => child.name === 'slot-pick') as THREE.Mesh);
    }
  }

  pick(normalizedPointer: THREE.Vector2, camera: THREE.Camera) {
    this.raycaster.setFromCamera(normalizedPointer, camera);
    const hits = this.raycaster.intersectObjects(this.pickMeshes, false);
    const hit = hits[0];
    if (!hit?.object) return null;
    const index = (hit.object as THREE.Mesh).userData.slotIndex;
    return typeof index === 'number' ? index : null;
  }

  setSelected(selectedIndex: number | null) {
    for (let i = 0; i < this.visuals.length; i += 1) {
      const selected = i === selectedIndex;
      const visual = this.visuals[i];
      const ringMat = visual.ring.material as THREE.MeshStandardMaterial;
      const beaconMat = visual.beacon.material as THREE.MeshStandardMaterial;
      ringMat.emissiveIntensity = selected ? 0.92 : 0.42;
      ringMat.opacity = selected ? 0.98 : 0.92;
      beaconMat.emissiveIntensity = selected ? 1.04 : 0.45;
      visual.group.scale.setScalar(selected ? 1.02 : 1);
    }
  }

  clear() {
    this.visuals.forEach((visual) => {
      visual.group.traverse((node) => {
        if (!(node as THREE.Mesh).isMesh) return;
        const mesh = node as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose());
        } else {
          material?.dispose();
        }
      });
      this.root.remove(visual.group);
    });

    this.visuals.length = 0;
    this.pickMeshes.length = 0;
  }

  dispose() {
    this.clear();
    this.padMaterial.dispose();
    this.ringMaterial.dispose();
    this.beaconMaterial.dispose();
  }

  private createSlotVisual(slot: PlanetSettlementSlot, surfaceMesh: THREE.Mesh): SlotVisual {
    const center = new THREE.Vector3(...slot.position);
    const normal = new THREE.Vector3(...slot.normal).normalize();

    const tangentA = Math.abs(normal.y) < 0.98
      ? new THREE.Vector3(0, 1, 0).cross(normal).normalize()
      : new THREE.Vector3(1, 0, 0).cross(normal).normalize();
    const tangentB = normal.clone().cross(tangentA).normalize();

    const group = new THREE.Group();

    const padGeometry = this.createTerrainFootprintGeometry({
      center,
      normal,
      tangentA,
      tangentB,
      surfaceMesh,
      outerRadius: 0.06,
      innerRadius: 0,
      rings: 4,
      segments: 24,
      embedDepth: 0.006,
      relief: 0.001,
    });

    const ringGeometry = this.createTerrainFootprintGeometry({
      center,
      normal,
      tangentA,
      tangentB,
      surfaceMesh,
      outerRadius: 0.075,
      innerRadius: 0.055,
      rings: 1,
      segments: 28,
      embedDepth: 0.002,
      relief: 0.0016,
    });

    const pad = new THREE.Mesh(padGeometry, this.padMaterial.clone());
    const ring = new THREE.Mesh(ringGeometry, this.ringMaterial.clone());

    const beaconGeometry = new THREE.CylinderGeometry(0.0032, 0.0038, 0.014, 10);
    beaconGeometry.rotateX(Math.PI / 2);
    const beacon = new THREE.Mesh(beaconGeometry, this.beaconMaterial.clone());
    beacon.position.copy(center.clone().add(normal.clone().multiplyScalar(0.0085)));
    beacon.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    const pickGeometry = new THREE.CircleGeometry(0.09, 18);
    const pick = new THREE.Mesh(pickGeometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    pick.name = 'slot-pick';
    pick.position.copy(center.clone().add(normal.clone().multiplyScalar(0.01)));
    pick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    pick.userData.slotIndex = slot.index;

    group.add(pad, ring, beacon, pick);
    return { group, ring, beacon };
  }

  private createTerrainFootprintGeometry(input: {
    center: THREE.Vector3;
    normal: THREE.Vector3;
    tangentA: THREE.Vector3;
    tangentB: THREE.Vector3;
    surfaceMesh: THREE.Mesh;
    outerRadius: number;
    innerRadius: number;
    rings: number;
    segments: number;
    embedDepth: number;
    relief: number;
  }) {
    const ringCount = Math.max(1, input.rings);
    const segmentCount = Math.max(8, input.segments);
    const positions: number[] = [];
    const indices: number[] = [];
    const ray = new THREE.Raycaster();

    for (let ring = 0; ring <= ringCount; ring += 1) {
      const t = ring / ringCount;
      const radius = THREE.MathUtils.lerp(input.innerRadius, input.outerRadius, t);

      for (let segment = 0; segment <= segmentCount; segment += 1) {
        const angle = (segment / segmentCount) * Math.PI * 2;
        const planarOffset = input.tangentA.clone().multiplyScalar(Math.cos(angle) * radius)
          .add(input.tangentB.clone().multiplyScalar(Math.sin(angle) * radius));

        const seedPoint = input.center.clone().add(planarOffset);
        const castOrigin = seedPoint.clone().add(input.normal.clone().multiplyScalar(0.2));
        ray.set(castOrigin, input.normal.clone().multiplyScalar(-1).normalize());

        const hit = ray.intersectObject(input.surfaceMesh, false)[0];
        let projected = hit?.point ?? seedPoint;
        const hitNormal = hit?.face?.normal?.clone()?.transformDirection(input.surfaceMesh.matrixWorld).normalize() ?? input.normal;

        projected = projected.add(hitNormal.clone().multiplyScalar(input.relief - input.embedDepth));
        positions.push(projected.x, projected.y, projected.z);
      }
    }

    const row = segmentCount + 1;
    for (let ring = 0; ring < ringCount; ring += 1) {
      for (let segment = 0; segment < segmentCount; segment += 1) {
        const a = ring * row + segment;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
}
