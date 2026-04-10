import {
  AmbientLight,
  BufferGeometry,
  CircleGeometry,
  Color,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
} from 'three';
import type { Faction, WorldData } from '@/game/core/types';

interface FactionRenderLayer {
  faction: Faction;
  body: Mesh;
  top: Mesh;
  rim: Line;
}

const TEMP_OBJECT = new Object3D();

export class MapViewScene {
  readonly scene = new Scene();

  readonly root = new Group();

  readonly camera: OrthographicCamera;

  private readonly raycaster = new Raycaster();

  private readonly pointer = new Vector2();

  private readonly factionLayers = new Map<string, FactionRenderLayer>();

  private readonly pickableFactions: Mesh[] = [];

  private readonly oceanMaterial: ShaderMaterial;

  private readonly slotPads: InstancedMesh;

  private selectedFactionId: string | null = null;

  private hoveredFactionId: string | null = null;

  constructor(private readonly world: WorldData, viewport: { width: number; height: number }) {
    const frustumHeight = 1650;
    const aspect = viewport.width / Math.max(1, viewport.height);
    this.camera = new OrthographicCamera(
      (-frustumHeight * aspect) / 2,
      (frustumHeight * aspect) / 2,
      frustumHeight / 2,
      -frustumHeight / 2,
      0.1,
      4000,
    );
    this.camera.position.set(world.width * 0.5, world.height * 0.58, 1200);
    this.camera.lookAt(new Vector3(world.width * 0.5, world.height * 0.58, 0));

    this.scene.background = new Color('#040911');
    this.scene.add(new AmbientLight(0x9dc8de, 0.92));
    this.scene.add(this.root);

    this.oceanMaterial = this.buildOcean();
    this.slotPads = this.buildFactionIslandsAndSlots();
    this.root.add(this.slotPads);
  }

  update(deltaMs: number) {
    this.oceanMaterial.uniforms.uTime.value += deltaMs * 0.001;

    if (!this.selectedFactionId) return;
    const selected = this.factionLayers.get(this.selectedFactionId);
    if (!selected) return;

    const pulse = 0.68 + Math.sin(performance.now() * 0.0044) * 0.12;
    (selected.rim.material as LineBasicMaterial).opacity = pulse;
  }

  onResize(width: number, height: number) {
    const frustumHeight = 1650;
    const aspect = width / Math.max(1, height);
    this.camera.left = (-frustumHeight * aspect) / 2;
    this.camera.right = (frustumHeight * aspect) / 2;
    this.camera.top = frustumHeight / 2;
    this.camera.bottom = -frustumHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  setPointerNdc(pointer: Vector2) {
    this.pointer.copy(pointer);
  }

  pointerMove() {
    const hitFaction = this.pickFactionAtPointer();
    this.hoveredFactionId = hitFaction?.faction.id ?? null;
    this.refreshFactionState();
  }

  pointerTap() {
    const hitFaction = this.pickFactionAtPointer();
    this.selectedFactionId = hitFaction?.faction.id ?? this.selectedFactionId;
    this.refreshFactionState();
  }

  destroy() {
    this.scene.clear();
    this.factionLayers.clear();
  }

  private buildOcean() {
    const oceanGeometry = new PlaneGeometry(this.world.width, this.world.height, 1, 1);
    const oceanMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;

        float lineField(float value, float width, float feather) {
          float line = abs(fract(value) - 0.5);
          return smoothstep(width + feather, width, line);
        }

        void main() {
          vec2 uv = vUv;
          vec2 flowUv = uv;
          flowUv.x += sin((uv.y * 18.0) + uTime * 0.13) * 0.008;
          flowUv.y += cos((uv.x * 14.0) + uTime * 0.11) * 0.008;

          vec3 deep = vec3(0.01, 0.03, 0.06);
          vec3 mid = vec3(0.03, 0.08, 0.14);
          vec3 top = vec3(0.06, 0.13, 0.19);

          float vignette = smoothstep(0.86, 0.2, distance(uv, vec2(0.5)));
          vec3 base = mix(deep, mid, uv.y * 0.75 + 0.1);
          base = mix(base, top, vignette * 0.24);

          float currents = lineField(flowUv.x * 22.0 + flowUv.y * 12.0 + uTime * 0.03, 0.045, 0.02) * 0.05;
          float grid = lineField(uv.x * 150.0, 0.02, 0.015) * 0.015 + lineField(uv.y * 102.0, 0.02, 0.015) * 0.015;

          gl_FragColor = vec4(base + vec3(currents + grid), 1.0);
        }
      `,
      depthWrite: false,
    });

    const ocean = new Mesh(oceanGeometry, oceanMaterial);
    ocean.position.set(this.world.width * 0.5, this.world.height * 0.5, -40);
    this.root.add(ocean);

    return oceanMaterial;
  }

  private buildFactionIslandsAndSlots() {
    const slotGeo = new CircleGeometry(6, 18);
    const slotMat = new MeshBasicMaterial({ color: 0x7ec7dc, transparent: true, opacity: 0.42 });

    const totalSlots = this.world.factions.reduce((sum, faction) => sum + faction.slots.length, 0);
    const slots = new InstancedMesh(slotGeo, slotMat, totalSlots);

    let slotIndex = 0;
    for (const faction of this.world.factions) {
      const { bodyDepth, bodyColor, topColor, rimColor } = factionPalette(faction.sizeCategory);
      const shape = silhouetteToShape(faction);
      const bodyGeometry = new ExtrudeGeometry(shape, { depth: bodyDepth, bevelEnabled: false, steps: 1 });
      bodyGeometry.translate(faction.position.x, faction.position.y, -bodyDepth);
      const body = new Mesh(
        bodyGeometry,
        new MeshLambertMaterial({ color: bodyColor, emissive: 0x0b1018, emissiveIntensity: 0.34 }),
      );
      this.root.add(body);

      const topGeometry = new ShapeGeometry(shape);
      topGeometry.translate(faction.position.x, faction.position.y, 1.1);
      const top = new Mesh(
        topGeometry,
        new MeshLambertMaterial({ color: topColor, emissive: 0x0f1d2b, emissiveIntensity: 0.12 }),
      );
      this.root.add(top);

      const contourPoints = shape.getPoints(40).map((p) => new Vector3(p.x + faction.position.x, p.y + faction.position.y, 2.2));
      contourPoints.push(contourPoints[0].clone());
      const rimGeometry = new BufferGeometry().setFromPoints(contourPoints);
      const rim = new Line(rimGeometry, new LineBasicMaterial({ color: rimColor, transparent: true, opacity: 0.35 }));
      this.root.add(rim);

      body.userData.factionId = faction.id;
      this.pickableFactions.push(body);
      this.factionLayers.set(faction.id, { faction, body, top, rim });

      for (const slot of faction.slots) {
        TEMP_OBJECT.position.set(faction.position.x + slot.x, faction.position.y + slot.y, 4.6);
        TEMP_OBJECT.rotation.z = (slotIndex % 7) * 0.36;
        const size = slot.occupied ? 1.1 : 0.92;
        TEMP_OBJECT.scale.set(size, size, size);
        TEMP_OBJECT.updateMatrix();
        slots.setMatrixAt(slotIndex, TEMP_OBJECT.matrix);
        slotIndex += 1;
      }
    }

    slots.instanceMatrix.needsUpdate = true;
    return slots;
  }

  private pickFactionAtPointer() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(this.pickableFactions, false);
    if (!intersections.length) return null;

    const factionId = intersections[0].object.userData.factionId as string | undefined;
    if (!factionId) return null;
    return this.factionLayers.get(factionId) ?? null;
  }

  private refreshFactionState() {
    for (const [factionId, layer] of this.factionLayers.entries()) {
      const isSelected = factionId === this.selectedFactionId;
      const isHovered = factionId === this.hoveredFactionId;
      const topMat = layer.top.material as MeshLambertMaterial;
      const bodyMat = layer.body.material as MeshLambertMaterial;
      const rimMat = layer.rim.material as LineBasicMaterial;

      topMat.emissiveIntensity = isSelected ? 0.34 : isHovered ? 0.22 : 0.12;
      bodyMat.emissiveIntensity = isSelected ? 0.44 : isHovered ? 0.38 : 0.34;
      rimMat.opacity = isSelected ? 0.76 : isHovered ? 0.54 : 0.35;

      layer.top.scale.setScalar(isSelected ? 1.03 : isHovered ? 1.015 : 1);
    }
  }
}

function silhouetteToShape(faction: Faction) {
  const shape = new Shape();
  faction.silhouette.forEach((point, idx) => {
    const radius = faction.radius * point.radiusFactor;
    const x = Math.cos(point.angle) * radius;
    const y = Math.sin(point.angle) * radius;
    if (idx === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  });
  shape.closePath();
  return shape;
}

function factionPalette(size: Faction['sizeCategory']) {
  if (size === 'large') {
    return { bodyDepth: 24, bodyColor: 0x1b2835, topColor: 0x2f4961, rimColor: 0x9edbff };
  }

  if (size === 'medium') {
    return { bodyDepth: 18, bodyColor: 0x17222d, topColor: 0x294257, rimColor: 0x88c7e8 };
  }

  return { bodyDepth: 14, bodyColor: 0x131d27, topColor: 0x22384b, rimColor: 0x6eaecf };
}
