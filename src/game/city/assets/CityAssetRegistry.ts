import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three';
import type { BuildingType } from '@/game/city/data/cityBuildings';
import { BUILDING_DEFINITIONS } from '@/game/city/data/cityBuildings';
import { getBuildingVisualState } from '@/game/city/runtime/buildingVisualState';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';

export class CityAssetRegistry {
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];

  private readonly baseBox = this.trackGeometry(new BoxGeometry(1, 1, 1));
  private readonly baseCylinder = this.trackGeometry(new CylinderGeometry(0.5, 0.5, 1, 20));
  private readonly baseSphere = this.trackGeometry(new SphereGeometry(0.34, 18, 12));
  private readonly baseCone = this.trackGeometry(new ConeGeometry(0.5, 1, 14));
  private readonly baseCrystal = this.trackGeometry(new OctahedronGeometry(0.5, 0));

  createBuildingVisual(type: BuildingType, level: number, theme: CityTheme): Object3D {
    const group = new Group();
    const definition = BUILDING_DEFINITIONS[type];
    const baseColor = new Color(definition.baseColor).lerp(new Color(theme.structureBaseColor), 0.4);

    const hull = this.makeMaterial(baseColor, theme, 0.56, 0.36, 0.03);
    const dark = this.makeMaterial(baseColor.clone().offsetHSL(0, -0.05, -0.18), theme, 0.68, 0.24, 0.01);
    const accent = this.makeMaterial(new Color(theme.structureTrimColor), theme, 0.32, 0.68, 0.2);

    group.add(this.scaledCylinder(1.55, 1.85, 0.5, dark, 0.28));

    if (type === 'hq') {
      group.add(this.scaledCylinder(1.35, 1.45, 2.5, hull, 1.7));
      group.add(this.scaledCone(0.95, 1.6, accent, 3.55));
      group.add(this.scaledBox(0.55, 1.5, 3.2, dark, 1.8, 1.7, 0));
      group.add(this.scaledBox(0.55, 1.5, 3.2, dark, 1.8, -1.7, 0));
    }

    if (type === 'mine') {
      group.add(this.scaledBox(2.8, 1.2, 2.1, hull, 0.95));
      group.add(this.scaledCylinder(0.42, 0.62, 2.4, dark, 2.25, -0.95, 0));
      group.add(this.scaledBox(2.2, 0.35, 0.55, accent, 2.7, 0.55, 0));
      group.add(this.scaledCone(0.5, 1.25, accent, 3.4, 1.2, 0.2));
    }

    if (type === 'quarry') {
      group.add(this.scaledBox(3.0, 0.9, 2.5, hull, 0.72));
      group.add(this.scaledBox(2.0, 1.1, 1.6, dark, 1.7));
      group.add(this.scaledBox(0.45, 1.9, 2.0, accent, 2.0, 1.4, -0.2));
      group.add(this.scaledCylinder(0.16, 0.16, 1.5, accent, 2.85, -1.2, 0.8));
    }

    if (type === 'refinery') {
      group.add(this.scaledCylinder(1.15, 1.35, 2.1, hull, 1.1));
      group.add(this.scaledCylinder(0.52, 0.66, 2.7, dark, 2.35, -1.0, 0.58));
      group.add(this.scaledCylinder(0.44, 0.44, 3.2, accent, 2.8, 1.08, -0.35));
      group.add(this.scaledCrystal(0.62, accent, 4.35, 0.4, 0));
    }

    if (type === 'warehouse') {
      group.add(this.scaledBox(4.2, 1.2, 2.7, hull, 0.8));
      group.add(this.scaledBox(3.4, 0.6, 2.1, dark, 1.75));
      group.add(this.scaledBox(0.85, 1.7, 0.85, accent, 2.35, 1.5, 1.0));
      group.add(this.scaledBox(0.85, 1.7, 0.85, accent, 2.35, -1.5, -1.0));
    }

    if (type === 'housing') {
      group.add(this.scaledCylinder(1.15, 1.25, 1.4, hull, 0.8));
      group.add(this.scaledSphere(0.95, dark, 1.85));
      group.add(this.scaledCylinder(0.24, 0.24, 1.65, accent, 2.8, -0.92, 0.74));
      group.add(this.scaledCylinder(0.24, 0.24, 1.65, accent, 2.8, 0.92, -0.74));
    }

    const visualState = getBuildingVisualState(level);
    group.scale.y = visualState.verticalScale;

    for (let i = 0; i < visualState.moduleCount; i += 1) {
      group.add(this.scaledBox(0.24, 0.5, 0.24, accent, 3.35 + i * 0.55, -0.9 + i * 0.6, 0.78 - i * 0.26));
    }

    return group;
  }

  dispose() {
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.geometries.length = 0;
    this.materials.length = 0;
  }

  private scaledBox(width: number, height: number, depth: number, material: MeshStandardMaterial, y: number, x = 0, z = 0): Mesh {
    const mesh = new Mesh(this.baseBox, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    return mesh;
  }

  private scaledCylinder(radiusTop: number, radiusBottom: number, height: number, material: MeshStandardMaterial, y: number, x = 0, z = 0): Mesh {
    const mesh = new Mesh(this.baseCylinder, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(radiusTop * 2, height, radiusBottom * 2);
    return mesh;
  }

  private scaledSphere(scale: number, material: MeshStandardMaterial, y: number): Mesh {
    const mesh = new Mesh(this.baseSphere, material);
    mesh.position.set(0, y, 0);
    mesh.scale.setScalar(scale);
    return mesh;
  }

  private scaledCone(radius: number, height: number, material: MeshStandardMaterial, y: number, x = 0, z = 0): Mesh {
    const mesh = new Mesh(this.baseCone, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(radius * 2, height, radius * 2);
    return mesh;
  }

  private scaledCrystal(scale: number, material: MeshStandardMaterial, y: number, x = 0, z = 0): Mesh {
    const mesh = new Mesh(this.baseCrystal, material);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    return mesh;
  }

  private makeMaterial(color: Color, theme: CityTheme, roughness: number, metalness: number, emissiveIntensity: number): MeshStandardMaterial {
    const material = new MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive: theme.structureEmissive,
      emissiveIntensity,
    });
    this.materials.push(material);
    return material;
  }

  private trackGeometry<T extends BufferGeometry>(geometry: T): T {
    this.geometries.push(geometry);
    return geometry;
  }
}
