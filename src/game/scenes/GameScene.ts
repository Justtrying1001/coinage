import * as PIXI from 'pixi.js';

export interface GameScene {
  readonly root: PIXI.Container;
  update(deltaMs: number): void;
  onResize(width: number, height: number): void;
  destroy(): void;
}
