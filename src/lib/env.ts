import 'server-only';

import { z } from 'zod';

const serverEnvSchema = z.object({
  POSTGRES_PRISMA_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url(),
});

export const serverEnv = serverEnvSchema.parse({
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_WORLD_SEED: z.string().min(1),
  NEXT_PUBLIC_WORLD_PLANET_COUNT: z.coerce.number().int().positive(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_WORLD_SEED: process.env.NEXT_PUBLIC_WORLD_SEED,
  NEXT_PUBLIC_WORLD_PLANET_COUNT: process.env.NEXT_PUBLIC_WORLD_PLANET_COUNT,
});
