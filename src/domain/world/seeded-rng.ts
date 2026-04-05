const UINT32_MAX = 0x100000000;

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function deriveSeed(base: string, label: string): number {
  return fnv1a(`${base}::${label}`);
}

export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_MAX;
  };
}

export function pickWeighted<T>(
  rng: () => number,
  items: Array<{ value: T; weight: number }>,
): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const roll = rng() * totalWeight;
  let cursor = 0;

  for (const item of items) {
    cursor += item.weight;
    if (roll <= cursor) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
}

export function range(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng();
}

