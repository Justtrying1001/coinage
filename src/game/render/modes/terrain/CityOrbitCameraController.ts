import * as THREE from 'three';
import type { CityCameraPreset } from '@/game/render/modes/terrain/CityCameraRig';

export class CityOrbitCameraController {
  private target = new THREE.Vector3();
  private pointerId: number | null = null;
  private rotateVelocity = new THREE.Vector2();
  private panVelocity = new THREE.Vector2();
  private zoomVelocity = 0;

  private azimuth = 0;
  private polar = 1;
  private distance = 360;

  private currentAzimuth = 0;
  private currentPolar = 1;
  private currentDistance = 360;
  private currentTarget = new THREE.Vector3();

  private readonly onPointerDown = (event: PointerEvent) => {
    if (!this.enabled || event.button > 1) return;
    this.pointerId = event.pointerId;
    this.surface?.setPointerCapture(event.pointerId);
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.enabled || this.pointerId !== event.pointerId) return;
    if (event.buttons === 0) return;

    if (event.shiftKey || event.button === 1) {
      this.panVelocity.x += -event.movementX * 0.1;
      this.panVelocity.y += event.movementY * 0.1;
      return;
    }

    this.rotateVelocity.x += -event.movementX * 0.0032;
    this.rotateVelocity.y += -event.movementY * 0.0028;
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId) return;
    this.surface?.releasePointerCapture(event.pointerId);
    this.pointerId = null;
  };

  private readonly onWheel = (event: WheelEvent) => {
    if (!this.enabled) return;
    event.preventDefault();
    this.zoomVelocity += event.deltaY * 0.11;
  };

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly surface: HTMLElement,
    private readonly bounds: {
      minDistance: number;
      maxDistance: number;
      minPolar: number;
      maxPolar: number;
      maxPan: number;
    },
  ) {
    this.surface.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    this.surface.addEventListener('wheel', this.onWheel, { passive: false });
  }

  enabled = false;

  setFromPreset(preset: CityCameraPreset) {
    this.target.copy(preset.target);
    const offset = preset.position.clone().sub(preset.target);
    const radius = Math.max(offset.length(), 1);
    const polar = Math.acos(THREE.MathUtils.clamp(offset.y / radius, -1, 1));
    const azimuth = Math.atan2(offset.x, offset.z);

    this.distance = radius;
    this.azimuth = azimuth;
    this.polar = polar;

    this.currentDistance = radius;
    this.currentAzimuth = azimuth;
    this.currentPolar = polar;
    this.currentTarget.copy(this.target);
  }

  update() {
    if (!this.enabled) return;

    this.azimuth += this.rotateVelocity.x;
    this.polar = THREE.MathUtils.clamp(this.polar + this.rotateVelocity.y, this.bounds.minPolar, this.bounds.maxPolar);
    this.distance = THREE.MathUtils.clamp(this.distance + this.zoomVelocity, this.bounds.minDistance, this.bounds.maxDistance);

    this.rotateVelocity.multiplyScalar(0.82);
    this.zoomVelocity *= 0.72;

    const panScale = this.distance * 0.0022;
    this.target.x = THREE.MathUtils.clamp(this.target.x + this.panVelocity.x * panScale, -this.bounds.maxPan, this.bounds.maxPan);
    this.target.z = THREE.MathUtils.clamp(this.target.z + this.panVelocity.y * panScale, -this.bounds.maxPan, this.bounds.maxPan);
    this.panVelocity.multiplyScalar(0.76);

    this.currentAzimuth = THREE.MathUtils.lerp(this.currentAzimuth, this.azimuth, 0.14);
    this.currentPolar = THREE.MathUtils.lerp(this.currentPolar, this.polar, 0.14);
    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, this.distance, 0.16);
    this.currentTarget.lerp(this.target, 0.16);

    const sinPolar = Math.sin(this.currentPolar);
    const offset = new THREE.Vector3(
      sinPolar * Math.sin(this.currentAzimuth),
      Math.cos(this.currentPolar),
      sinPolar * Math.cos(this.currentAzimuth),
    ).multiplyScalar(this.currentDistance);

    this.camera.position.copy(this.currentTarget).add(offset);
    this.camera.lookAt(this.currentTarget);
  }

  dispose() {
    this.surface.removeEventListener('pointerdown', this.onPointerDown);
    this.surface.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }
}
