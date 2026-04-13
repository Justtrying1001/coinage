import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
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
  private readonly baseCylinder = this.trackGeometry(new CylinderGeometry(0.5, 0.5, 1, 16));
  private readonly baseSphere = this.trackGeometry(new SphereGeometry(0.34, 14, 10));

  createBuildingVisual(type: BuildingType, level: number, theme: CityTheme): Object3D {
    const group = new Group();
    const definition = BUILDING_DEFINITIONS[type];
    const baseColor = new Color(definition.baseColor).lerp(new Color(theme.metalColor), 0.28);

    const hull = this.makeMaterial(baseColor, theme, 0.58, 0.42, 0.05);
    const dark = this.makeMaterial(baseColor.clone().offsetHSL(0, -0.03, -0.14), theme, 0.66, 0.28, 0.02);
    const accent = this.makeMaterial(baseColor.clone().offsetHSL(0, 0.05, 0.22), theme, 0.34, 0.62, 0.22);

    group.add(this.scaledCylinder(1.75, 1.92, 0.32, dark, 0.22));
    group.add(this.scaledBox(2.2, 0.16, 2.2, accent, 0.42, 0, -0.08));

    if (type === 'hq') {
      group.add(this.scaledBox(3.8, 2.2, 3.6, hull, 1.2));
      group.add(this.scaledBox(2.2, 2.1, 2.1, dark, 3.05));
      group.add(this.scaledBox(1.1, 1.8, 1.1, accent, 4.8));
      group.add(this.scaledCylinder(0.2, 0.2, 2.6, accent, 5.4, -0.95, 0.95));
      group.add(this.scaledCylinder(0.2, 0.2, 2.6, accent, 5.4, 0.95, -0.95));
    }

    if (type === 'mine') {
      group.add(this.scaledBox(2.6, 1.5, 2.2, hull, 0.9));
      group.add(this.scaledCylinder(0.55, 0.62, 2.2, dark, 2.4, -0.82, 0));
      group.add(this.scaledCylinder(0.45, 0.45, 1.7, accent, 2.1, 0.88, 0.6));
      group.add(this.scaledBox(1.6, 0.5, 0.7, dark, 2.9, 0.1, -0.7));
    }

    if (type === 'quarry') {
      group.add(this.scaledBox(3.2, 1.2, 2.6, hull, 0.75));
      group.add(this.scaledBox(2.4, 0.95, 1.8, dark, 1.9));
      group.add(this.scaledBox(0.65, 1.6, 2.3, accent, 2.3, 1.1, 0));
      group.add(this.scaledCylinder(0.24, 0.24, 1.5, accent, 3.45, -1.2, -0.8));
    }

    if (type === 'refinery') {
      group.add(this.scaledCylinder(1.25, 1.45, 2.4, hull, 1.2));
      group.add(this.scaledCylinder(0.78, 0.9, 1.8, dark, 2.85, -1.05, 0.75));
      group.add(this.scaledCylinder(0.64, 0.64, 2.6, accent, 3.1, 1.08, -0.58));
      group.add(this.scaledBox(1.2, 0.55, 2.7, dark, 2.1));
    }

    if (type === 'warehouse') {
      group.add(this.scaledBox(4, 1.3, 2.9, hull, 0.8));
      group.add(this.scaledBox(3.5, 0.8, 2.4, dark, 1.95));
      group.add(this.scaledBox(0.95, 1.2, 0.95, accent, 2.55, 1.35, 0.95));
      group.add(this.scaledBox(0.95, 1.2, 0.95, accent, 2.55, -1.35, -0.95));
    }

    if (type === 'housing') {
      group.add(this.scaledCylinder(1.2, 1.3, 1.6, hull, 0.88));
      group.add(this.scaledSphere(0.94, dark, 1.9));
      group.add(this.scaledBox(0.8, 0.8, 0.8, accent, 2.52, -0.95, 0.72));
      group.add(this.scaledBox(0.8, 0.8, 0.8, accent, 2.52, 1.02, -0.7));
    }

    const visualState = getBuildingVisualState(level);
    group.scale.y = visualState.verticalScale;

    for (let i = 0; i < visualState.moduleCount; i += 1) {
      group.add(this.scaledCylinder(0.21, 0.21, 0.95, accent, 3.2 + i * 0.62, -1 + i * 0.7, 0.95 - i * 0.32));
    }

    group.add(this.scaledCylinder(0.11, 0.11, 1.4, accent, 2.2 + level * 0.18, 0.95, -0.95));

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

  private makeMaterial(color: Color, theme: CityTheme, roughness: number, metalness: number, emissiveIntensity: number): MeshStandardMaterial {
    const material = new MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive: theme.emissiveAccent,
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
