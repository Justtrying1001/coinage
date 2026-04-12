import * as THREE from 'three';
import type { SettlementSlot } from '@/game/planet/runtime/SettlementSlots';

type SlotVisualState = 'empty' | 'occupied';

const BASE_INNER_COLOR = new THREE.Color(0xaedfff);
const BASE_OUTER_COLOR = new THREE.Color(0x4ca0c8);
const BASE_SELECTED_INNER_COLOR = new THREE.Color(0xf2fbff);
const BASE_SELECTED_OUTER_COLOR = new THREE.Color(0x86d7ff);

export class SettlementSlotLayer {
  readonly group = new THREE.Group();
  readonly pickables: THREE.Object3D[];

  private readonly baseDiscMesh: THREE.InstancedMesh;
  private readonly baseRingMesh: THREE.InstancedMesh;
  private readonly sprites: THREE.Sprite[] = [];
  private readonly spriteMaterials: THREE.SpriteMaterial[] = [];

  private selectedIndex: number | null = null;

  private readonly slotStates: SlotVisualState[];
  private readonly slotBySprite = new WeakMap<THREE.Object3D, number>();

  private readonly emptyBadgeTexture: THREE.Texture;
  private readonly emptySelectedBadgeTexture: THREE.Texture;

  private readonly tempMatrix = new THREE.Matrix4();
  private readonly tempQuat = new THREE.Quaternion();
  private readonly tempPos = new THREE.Vector3();
  private readonly tempScale = new THREE.Vector3();

  constructor(private readonly slots: SettlementSlot[]) {
    this.slotStates = Array.from({ length: slots.length }, () => 'empty');

    const baseDiscGeometry = new THREE.CircleGeometry(0.022, 24);
    const baseRingGeometry = new THREE.RingGeometry(0.024, 0.032, 24);

    const baseDiscMaterial = new THREE.MeshBasicMaterial({
      color: BASE_INNER_COLOR,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      vertexColors: true,
    });

    const baseRingMaterial = new THREE.MeshBasicMaterial({
      color: BASE_OUTER_COLOR,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      vertexColors: true,
    });

    this.baseDiscMesh = new THREE.InstancedMesh(baseDiscGeometry, baseDiscMaterial, slots.length);
    this.baseRingMesh = new THREE.InstancedMesh(baseRingGeometry, baseRingMaterial, slots.length);

    this.baseDiscMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.baseRingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.baseDiscMesh.renderOrder = 6;
    this.baseRingMesh.renderOrder = 7;

    this.emptyBadgeTexture = createBadgeTexture({
      glow: '#9ddeff',
      ring: '#d8f3ff',
      center: '#edf9ff',
      notch: '#6ec6f2',
      alpha: 0.95,
    });
    this.emptySelectedBadgeTexture = createBadgeTexture({
      glow: '#c5f0ff',
      ring: '#ffffff',
      center: '#ffffff',
      notch: '#8de0ff',
      alpha: 1,
    });

    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      this.applyBaseMatrix(i, slot, false);
      this.applyBaseColors(i, false, 'empty');

      const spriteMaterial = new THREE.SpriteMaterial({
        map: this.emptyBadgeTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.renderOrder = 9;
      sprite.position.copy(slot.position).addScaledVector(slot.normal, 0.034);
      sprite.scale.setScalar(0.06);
      sprite.userData['slotIndex'] = i;

      this.slotBySprite.set(sprite, i);
      this.sprites.push(sprite);
      this.spriteMaterials.push(spriteMaterial);
      this.group.add(sprite);
    }

    this.baseDiscMesh.instanceMatrix.needsUpdate = true;
    this.baseRingMesh.instanceMatrix.needsUpdate = true;
    if (this.baseDiscMesh.instanceColor) this.baseDiscMesh.instanceColor.needsUpdate = true;
    if (this.baseRingMesh.instanceColor) this.baseRingMesh.instanceColor.needsUpdate = true;

    this.group.add(this.baseDiscMesh);
    this.group.add(this.baseRingMesh);
    this.pickables = [...this.sprites];
  }

  getSelectedIndex() {
    return this.selectedIndex;
  }

  getSlotIndexFromObject(object: THREE.Object3D) {
    let current: THREE.Object3D | null = object;
    while (current) {
      const index = this.slotBySprite.get(current);
      if (index != null) return index;
      current = current.parent;
    }
    return null;
  }

  setSelectedIndex(nextIndex: number | null) {
    if (nextIndex === this.selectedIndex) return;

    if (this.selectedIndex != null) {
      this.applySlotVisual(this.selectedIndex, false);
    }
    this.selectedIndex = nextIndex;
    if (this.selectedIndex != null) {
      this.applySlotVisual(this.selectedIndex, true);
    }

    this.baseDiscMesh.instanceMatrix.needsUpdate = true;
    this.baseRingMesh.instanceMatrix.needsUpdate = true;
    if (this.baseDiscMesh.instanceColor) this.baseDiscMesh.instanceColor.needsUpdate = true;
    if (this.baseRingMesh.instanceColor) this.baseRingMesh.instanceColor.needsUpdate = true;
  }

  setSlotState(index: number, state: SlotVisualState) {
    if (!this.slots[index]) return;
    this.slotStates[index] = state;
    this.applySlotVisual(index, this.selectedIndex === index);
    if (this.baseDiscMesh.instanceColor) this.baseDiscMesh.instanceColor.needsUpdate = true;
    if (this.baseRingMesh.instanceColor) this.baseRingMesh.instanceColor.needsUpdate = true;
  }

  dispose() {
    this.baseDiscMesh.geometry.dispose();
    this.baseRingMesh.geometry.dispose();
    (this.baseDiscMesh.material as THREE.Material).dispose();
    (this.baseRingMesh.material as THREE.Material).dispose();

    for (const material of this.spriteMaterials) {
      material.dispose();
    }

    this.emptyBadgeTexture.dispose();
    this.emptySelectedBadgeTexture.dispose();

    this.group.clear();
  }

  private applySlotVisual(index: number, selected: boolean) {
    const slot = this.slots[index];
    if (!slot) return;

    const state = this.slotStates[index] ?? 'empty';

    this.applyBaseMatrix(index, slot, selected);
    this.applyBaseColors(index, selected, state);

    const sprite = this.sprites[index];
    const spriteMaterial = this.spriteMaterials[index];
    if (sprite && spriteMaterial) {
      sprite.position.copy(slot.position).addScaledVector(slot.normal, selected ? 0.037 : 0.034);
      sprite.scale.setScalar(selected ? 0.072 : 0.06);

      if (state === 'empty') {
        spriteMaterial.map = selected ? this.emptySelectedBadgeTexture : this.emptyBadgeTexture;
      }
      spriteMaterial.needsUpdate = true;
    }
  }

  private applyBaseMatrix(index: number, slot: SettlementSlot, selected: boolean) {
    this.tempPos.copy(slot.position).addScaledVector(slot.normal, selected ? -0.0015 : -0.0012);
    this.tempQuat.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, slot.normal);
    this.tempScale.setScalar(selected ? 1.1 : 1);
    this.tempMatrix.compose(this.tempPos, this.tempQuat, this.tempScale);

    this.baseDiscMesh.setMatrixAt(index, this.tempMatrix);
    this.baseRingMesh.setMatrixAt(index, this.tempMatrix);
  }

  private applyBaseColors(index: number, selected: boolean, state: SlotVisualState) {
    if (state === 'occupied') {
      this.baseDiscMesh.setColorAt(index, new THREE.Color(0xe7d79d));
      this.baseRingMesh.setColorAt(index, new THREE.Color(0xf4c86b));
      return;
    }

    this.baseDiscMesh.setColorAt(index, selected ? BASE_SELECTED_INNER_COLOR : BASE_INNER_COLOR);
    this.baseRingMesh.setColorAt(index, selected ? BASE_SELECTED_OUTER_COLOR : BASE_OUTER_COLOR);
  }
}

interface BadgeTextureOptions {
  glow: string;
  ring: string;
  center: string;
  notch: string;
  alpha: number;
}

function createBadgeTexture(options: BadgeTextureOptions) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const data = new Uint8Array([255, 255, 255, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const center = size / 2;
  ctx.clearRect(0, 0, size, size);

  const glow = ctx.createRadialGradient(center, center, 8, center, center, 60);
  glow.addColorStop(0, withAlpha(options.glow, 0.56 * options.alpha));
  glow.addColorStop(1, withAlpha(options.glow, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(center, center, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = withAlpha(options.ring, 0.98 * options.alpha);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(center, center, 32, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = withAlpha(options.center, 0.95 * options.alpha);
  ctx.beginPath();
  ctx.arc(center, center, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = withAlpha(options.notch, 0.96 * options.alpha);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i += 1) {
    const angle = (Math.PI / 2) * i;
    const x0 = center + Math.cos(angle) * 38;
    const y0 = center + Math.sin(angle) * 38;
    const x1 = center + Math.cos(angle) * 48;
    const y1 = center + Math.sin(angle) * 48;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(alpha, 1)).toFixed(3)})`;
}
