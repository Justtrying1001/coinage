import { generateGalaxyLayout } from '@/domain/world/generate-galaxy-layout';

interface Metrics {
  count: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  edgeOccupancyRatio: number;
  centerCount: number;
  peripheralCount: number;
  quadrants: number[];
  radialBins: number[];
  zoneDensity: number[][];
}

function computeMetrics(worldSeed: string, fieldRadius: number, planetCount: number, minSpacing: number): Metrics {
  const layout = generateGalaxyLayout(worldSeed, {
    fieldRadius,
    planetCount,
    minSpacing,
  });

  const xs = layout.map((planet) => planet.x);
  const ys = layout.map((planet) => planet.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const edgeBand = fieldRadius * 0.1;
  const edgeCount = layout.filter(
    (planet) =>
      Math.abs(planet.x) >= fieldRadius - edgeBand || Math.abs(planet.y) >= fieldRadius - edgeBand,
  ).length;
  const centerCount = layout.filter((planet) => Math.hypot(planet.x, planet.y) <= fieldRadius * 0.25).length;
  const peripheralCount = layout.filter((planet) => Math.hypot(planet.x, planet.y) >= fieldRadius * 0.75).length;

  const quadrants = [0, 0, 0, 0];
  for (const planet of layout) {
    const quadrant = (planet.x >= 0 ? 1 : 0) + (planet.y >= 0 ? 2 : 0);
    quadrants[quadrant] += 1;
  }

  const radialBins = new Array<number>(6).fill(0);
  for (const planet of layout) {
    const radialNorm = Math.hypot(planet.x, planet.y) / fieldRadius;
    const bin = Math.min(radialBins.length - 1, Math.floor(radialNorm * radialBins.length));
    radialBins[bin] += 1;
  }

  const gridBins = 5;
  const zoneDensity = Array.from({ length: gridBins }, () => new Array<number>(gridBins).fill(0));
  for (const planet of layout) {
    const gx = Math.min(
      gridBins - 1,
      Math.max(0, Math.floor(((planet.x + fieldRadius) / (fieldRadius * 2)) * gridBins)),
    );
    const gy = Math.min(
      gridBins - 1,
      Math.max(0, Math.floor(((planet.y + fieldRadius) / (fieldRadius * 2)) * gridBins)),
    );
    zoneDensity[gy]![gx]! += 1;
  }

  return {
    count: layout.length,
    minX,
    maxX,
    minY,
    maxY,
    edgeOccupancyRatio: edgeCount / Math.max(1, layout.length),
    centerCount,
    peripheralCount,
    quadrants,
    radialBins,
    zoneDensity,
  };
}

const metrics = computeMetrics('coinage-mvp-seed', 360, 500, 9.1);
console.log(JSON.stringify(metrics, null, 2));
