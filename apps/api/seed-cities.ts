import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Seeds the pilot geography only (cities and neighbourhood centres used to label
 * posts). It creates NO posts: the previous version fabricated ~240 "suspicious
 * activity" reports, which must never exist in a real database.
 *
 * Run: npx ts-node seed-cities.ts
 */
const prisma = new PrismaClient();

const PILOT = [
  {
    name: 'Barcelona',
    country: 'Spain',
    latitude: 41.3851,
    longitude: 2.1734,
    neighborhoods: [
      { name: 'El Raval', latitude: 41.38, longitude: 2.17, radiusKm: 0.8 },
      { name: 'Barri Gòtic', latitude: 41.3833, longitude: 2.177, radiusKm: 0.6 },
      { name: 'Eixample', latitude: 41.388, longitude: 2.16, radiusKm: 1.5 },
      { name: 'Gràcia', latitude: 41.403, longitude: 2.156, radiusKm: 1.0 },
      { name: 'Poblenou', latitude: 41.4036, longitude: 2.2023, radiusKm: 1.2 },
      { name: 'Sarrià', latitude: 41.401, longitude: 2.122, radiusKm: 1.0 },
    ],
  },
  {
    name: "L'Hospitalet de Llobregat",
    country: 'Spain',
    latitude: 41.3596,
    longitude: 2.1002,
    neighborhoods: [
      { name: 'Bellvitge', latitude: 41.353, longitude: 2.113, radiusKm: 0.8 },
      { name: 'Santa Eulàlia', latitude: 41.365, longitude: 2.125, radiusKm: 0.7 },
      { name: 'Torrassa', latitude: 41.37, longitude: 2.118, radiusKm: 0.5 },
    ],
  },
  {
    name: 'Badalona',
    country: 'Spain',
    latitude: 41.45,
    longitude: 2.2474,
    neighborhoods: [
      { name: 'Centre', latitude: 41.4505, longitude: 2.2474, radiusKm: 0.7 },
      { name: 'Llefià', latitude: 41.441, longitude: 2.215, radiusKm: 0.9 },
      { name: 'Gorg', latitude: 41.442, longitude: 2.238, radiusKm: 0.8 },
    ],
  },
];

export async function seedPilotGeography(client: PrismaClient = prisma) {
  for (const c of PILOT) {
    const city = await client.city.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, country: c.country, latitude: c.latitude, longitude: c.longitude },
    });
    for (const n of c.neighborhoods) {
      await client.neighborhood.upsert({
        where: { name_cityId: { name: n.name, cityId: city.id } },
        update: {},
        create: { ...n, cityId: city.id },
      });
    }
  }
  console.log(`Seeded ${PILOT.length} cities and their neighbourhoods (no posts).`);
}

if (require.main === module) {
  seedPilotGeography()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
