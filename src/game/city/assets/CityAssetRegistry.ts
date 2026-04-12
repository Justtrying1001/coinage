import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  SphereGeometry,
  type Material,
  type BufferGeometry,
} from 'three';
import type { BuildingType } from '@/game/city/data/cityBuildings';
import { BUILDING_DEFINITIONS } from '@/game/city/data/cityBuildings';
import { getBuildingVisualState } from '@/game/city/runtime/buildingVisualState';

export class CityAssetRegistry {
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];

  private readonly baseBox = this.trackGeometry(new BoxGeometry(1, 1, 1));
  private readonly baseCylinder = this.trackGeometry(new CylinderGeometry(0.5, 0.5, 1, 20));
  private readonly baseSphere = this.trackGeometry(new SphereGeometry(0.34, 16, 12));

  createBuildingVisual(type: BuildingType, level: number): Object3D {
    const group = new Group();
    const definition = BUILDING_DEFINITIONS[type];
    const color = new Color(definition.baseColor);
    const coreMaterial = this.makeMaterial(color);
    const detailMaterial = this.makeMaterial(color.clone().offsetHSL(0, -0.05, -0.1));
    const accentMaterial = this.makeMaterial(color.clone().offsetHSL(0, 0.03, 0.18));

    if (type === 'hq') {
      group.add(this.createScaledBox(3.4, 2.6, 3.4, coreMaterial, 1.3));
      group.add(this.createScaledBox(1.5, 2.5, 1.5, detailMaterial, 3.6));
      group.add(this.createScaledCylinder(0.35, 0.35, 2.6, accentMaterial, 5));
    }

    if (type === 'mine') {
      group.add(this.createScaledCylinder(1.7, 1.9, 2.2, coreMaterial, 1.1));
      group.add(this.createScaledBox(1.2, 0.8, 2.4, detailMaterial, 2.1));
      group.add(this.createScaledCylinder(0.35, 0.35, 1.8, accentMaterial, 3.1, -0.65, 0.2));
    }

    if (type === 'quarry') {
      group.add(this.createScaledBox(2.9, 1.8, 2.3, coreMaterial, 0.9));
      group.add(this.createScaledBox(2, 1, 1.6, detailMaterial, 2.15));
      group.add(this.createScaledBox(0.5, 1.5, 2.1, accentMaterial, 2.2, 1.05, 0));
    }

    if (type === 'refinery') {
      group.add(this.createScaledCylinder(1.2, 1.4, 2.4, coreMaterial, 1.2));
      group.add(this.createScaledCylinder(0.62, 0.62, 2.8, detailMaterial, 3.1, -0.8, 0.5));
      group.add(this.createScaledCylinder(0.44, 0.44, 2.2, accentMaterial, 2.7, 0.85, -0.45));
    }

    if (type === 'warehouse') {
      group.add(this.createScaledBox(3.4, 1.6, 2.8, coreMaterial, 0.8));
      group.add(this.createScaledBox(3, 0.9, 2.4, detailMaterial, 1.9));
      group.add(this.createScaledBox(0.9, 1.1, 0.9, accentMaterial, 2.5, 1.1, 0.85));
    }

    if (type === 'housing') {
      group.add(this.createScaledCylinder(1.1, 1.2, 1.9, coreMaterial, 0.95));
      group.add(this.createScaledSphere(0.75, detailMaterial, 2.05));
      group.add(this.createScaledBox(0.65, 0.7, 0.65, accentMaterial, 2.7, -0.9, 0.65));
      group.add(this.createScaledBox(0.65, 0.7, 0.65, accentMaterial, 2.7, 0.95, -0.62));
    }

    const visualState = getBuildingVisualState(level);
    group.scale.y = visualState.verticalScale;

    for (let moduleIndex = 0; moduleIndex < visualState.moduleCount; moduleIndex += 1) {
      const addon = this.createScaledCylinder(0.25, 0.25, 0.8, accentMaterial, 3.1 + moduleIndex * 0.6, -0.95 + moduleIndex * 0.65, 0.9 - moduleIndex * 0.35);
      group.add(addon);
    }

    return group;
  }

  dispose() {
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.geometries.length = 0;
    this.materials.length = 0;
  }

  private createScaledBox(width: number, height: number, depth: number, material: MeshStandardMaterial, y: number, x = 0, z = 0): Mesh {
    const mesh = new Mesh(this.baseBox, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    return mesh;
  }

  private createScaledCylinder(radiusTop: number, radiusBottom: number, height: number, material: MeshStandardMaterial, y: number, x = 0, z = 0): Mesh {
    const mesh = new Mesh(this.baseCylinder, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(radiusTop * 2, height, radiusBottom * 2);
    return mesh;
  }

  private createScaledSphere(scale: number, material: MeshStandardMaterial, y: number): Mesh {
    const mesh = new Mesh(this.baseSphere, material);
    mesh.position.set(0, y, 0);
    mesh.scale.setScalar(scale);
    return mesh;
  }

  private makeMaterial(color: Color): MeshStandardMaterial {
    const material = new MeshStandardMaterial({ color, roughness: 0.66, metalness: 0.14 });
    this.materials.push(material);
    return material;
  }

  private trackGeometry<T extends BufferGeometry>(geometry: T): T {
    this.geometries.push(geometry);
    return geometry;
  }
}
