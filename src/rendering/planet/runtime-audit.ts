export const PLANET_PIPELINE_VERSION = 'planet-canonical-runtime-v3';

interface TracePayload {
  stage: string;
  [key: string]: unknown;
}

function isTraceEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const fromGlobal = Boolean((window as { __COINAGE_PIPELINE_TRACE?: boolean }).__COINAGE_PIPELINE_TRACE);
  const fromQuery = new URLSearchParams(window.location.search).get('pipelineTrace') === '1';
  return fromGlobal || fromQuery;
}

export function tracePlanetPipeline(payload: TracePayload): void {
  if (process.env.NODE_ENV === 'production') return;
  if (!isTraceEnabled()) return;
  console.info('[PlanetPipelineTrace]', { version: PLANET_PIPELINE_VERSION, ...payload });
}
