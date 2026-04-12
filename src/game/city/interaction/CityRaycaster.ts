import { Raycaster, Vector2, type Camera, type Object3D, type Scene } from 'three';
import type { CityInteractionTarget } from '@/game/city/runtime/cityViewModel';
import type { CitySlotId } from '@/game/city/data/citySlots';

interface HitPayload {
  targetType: 'slot' | 'building';
  slotId: CitySlotId;
}

export class CityRaycaster {
  private readonly raycaster = new Raycaster();
  private readonly pointerNdc = new Vector2();

  pick(clientX: number, clientY: number, canvas: HTMLCanvasElement, camera: Camera, scene: Scene): CityInteractionTarget {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { type: 'none' };

    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNdc, camera);
    const intersections = this.raycaster.intersectObjects(scene.children, true);

    for (const hit of intersections) {
      const payload = this.resolvePayload(hit.object);
      if (!payload) continue;
      return payload.targetType === 'slot'
        ? { type: 'slot', slotId: payload.slotId }
        : { type: 'building', slotId: payload.slotId };
    }

    return { type: 'none' };
  }

  private resolvePayload(object: Object3D): HitPayload | null {
    let cursor: Object3D | null = object;
    while (cursor) {
      const targetType = cursor.userData.cityTargetType as HitPayload['targetType'] | undefined;
      const slotId = cursor.userData.citySlotId as CitySlotId | undefined;
      if (targetType && slotId) {
        return { targetType, slotId };
      }
      cursor = cursor.parent;
    }
    return null;
  }
}
