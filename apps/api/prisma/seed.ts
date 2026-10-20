import 'dotenv/config';
import { Category, PrismaClient } from '@prisma/client';
import { seedPilotGeography } from '../seed-cities';
import { hashPassword } from '../src/auth/credentials';

/**
 * Development seed.
 *  - Always: pilot cities/neighbourhoods (no posts).
 *  - With --demo: a demo account and a few posts, every one titled "[DEMO]" so they can
 *    never be mistaken for real local information.
 * Refuses to run against production.
 */
const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database.');
  }
  await seedPilotGeography(prisma);
  if (!process.argv.includes('--demo')) return;

  const email = 'demo@nearnow.test';
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Demo account', auth: { create: { passwordHash: await hashPassword('demo-password-123') } } },
  });

  const now = Date.now();
  const demo = [
    { title: '[DEMO] Weekend market on the square', category: Category.EVENT, latitude: 41.3874, longitude: 2.1686 },
    { title: '[DEMO] Lost: blue backpack', category: Category.LOST_FOUND, latitude: 41.3901, longitude: 2.1655 },
    { title: '[DEMO] Recommendation: quiet library study room', category: Category.RECOMMENDATION, latitude: 41.385, longitude: 2.172 },
  ];
  for (const p of demo) {
    const exists = await prisma.post.findFirst({ where: { title: p.title, authorId: user.id } });
    if (exists) continue;
    await prisma.post.create({
      data: {
        ...p,
        content: 'Demo fixture for local development. Not a real report.',
        authorId: user.id,
        expiresAt: new Date(now + 7 * 24 * 3600_000),
        ...(p.category === Category.LOST_FOUND
          ? { lostFound: { create: { direction: 'LOST', itemType: 'WALLET_BAG', occurredFrom: new Date(now - 86_400_000), occurredTo: new Date(now) } } }
          : {}),
      },
    });
  }
  console.log(`Demo fixtures ready. Sign in as ${email} (password: demo-password-123; the code is printed in the API log).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
