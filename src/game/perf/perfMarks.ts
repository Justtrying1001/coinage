const PERF_PREFIX = 'coinage:';

function canUsePerf() {
  return typeof performance !== 'undefined' && typeof performance.mark === 'function';
}

export function perfMark(name: string) {
  if (!canUsePerf()) return;
  performance.mark(`${PERF_PREFIX}${name}`);
}

export function perfMeasure(name: string, start: string, end?: string) {
  if (!canUsePerf() || typeof performance.measure !== 'function') return;
  const startName = `${PERF_PREFIX}${start}`;
  const endName = end ? `${PERF_PREFIX}${end}` : undefined;
  try {
    performance.measure(`${PERF_PREFIX}${name}`, startName, endName);
  } catch {
    return;
  }
}

export function perfLog(label: string, data?: Record<string, unknown>) {
  if (typeof console === 'undefined') return;
  if (data) {
    console.info(`[perf] ${label}`, data);
    return;
  }
  console.info(`[perf] ${label}`);
}
