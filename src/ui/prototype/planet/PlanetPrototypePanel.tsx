'use client';

import { useMemo, useState } from 'react';

import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import SinglePlanetRenderer from '@/ui/prototype/planet/SinglePlanetRenderer';

const WORLD_SEED = 'coinage-mvp-seed';

const PLANET_PRESETS = [
  'prototype-alpha',
  'prototype-basalt',
  'prototype-cobalt',
  'prototype-violet',
];

export default function PlanetPrototypePanel() {
  const [planetSeed, setPlanetSeed] = useState<string>(PLANET_PRESETS[0]);

  const profile = useMemo(
    () => generatePlanetVisualProfile({ worldSeed: WORLD_SEED, planetSeed }),
    [planetSeed],
  );

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-lg font-semibold">Single Planet Renderer Prototype</h2>
        <p className="mt-2 text-sm text-slate-300">
          Planet output is generated from <code>PlanetVisualProfile</code> using deterministic seeds.
        </p>

        <label className="mt-4 block text-sm text-slate-300" htmlFor="planet-seed-select">
          Prototype seed
        </label>
        <select
          id="planet-seed-select"
          className="mt-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={planetSeed}
          onChange={(event) => setPlanetSeed(event.target.value)}
        >
          {PLANET_PRESETS.map((seed) => (
            <option key={seed} value={seed}>
              {seed}
            </option>
          ))}
        </select>
      </div>

      <SinglePlanetRenderer profile={profile} />

      <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-medium text-slate-100">Seed</p>
          <p>{profile.seeds.planetSeed}</p>
        </div>
        <div>
          <p className="font-medium text-slate-100">Size / Radius</p>
          <p>
            {profile.sizeCategory} / {profile.shape.radius.toFixed(3)}
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-100">Palette / Material</p>
          <p>
            {profile.paletteFamily} / {profile.materialFamily}
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-100">Relief</p>
          <p>
            macro {profile.relief.macroStrength.toFixed(3)} · micro {profile.relief.microStrength.toFixed(3)}
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-100">Color</p>
          <p>
            hue {profile.color.hueShift.toFixed(1)} · sat {profile.color.saturation.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-100">Atmosphere</p>
          <p>{profile.atmosphere.enabled ? 'enabled' : 'disabled'}</p>
        </div>
      </div>
    </section>
  );
}
