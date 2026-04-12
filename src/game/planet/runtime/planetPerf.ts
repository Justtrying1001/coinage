export function mark(name: string) {
  if (typeof performance === 'undefined') return;
  performance.mark(name);
}

export function measure(name: string, start: string, end?: string) {
  if (typeof performance === 'undefined') return;
  try {
    performance.measure(name, start, end);
  } catch {
    // ignored
  }
}

export function timed<T>(name: string, fn: () => T): T {
  const start = `${name}:start`;
  const end = `${name}:end`;
  mark(start);
  try {
    return fn();
  } finally {
    mark(end);
    measure(name, start, end);
  }
}
