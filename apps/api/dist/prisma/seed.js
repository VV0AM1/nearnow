"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Start seeding ...');
    const user = await prisma.user.upsert({
        where: { email: 'seed@example.com' },
        update: {},
        create: {
            email: 'seed@example.com',
            name: 'SeedUser',
        },
    });
    const city = await prisma.city.upsert({
        where: { name: 'Seed City' },
        update: {},
        create: {
            name: 'Seed City',
            country: 'Seedland',
            latitude: 0,
            longitude: 0,
        }
    });
    const neighborhood = await prisma.neighborhood.create({
        data: {
            name: 'Central Seed ' + Date.now(),
            cityId: city.id,
            latitude: 0,
            longitude: 0,
            totalCount: 5
        }
    });
    await prisma.post.createMany({
        data: [
            {
                title: 'Lost Dog: Golden Retriever',
                content: 'My dog ran away near the park. Please help!',
                category: 'LOST_FOUND',
                latitude: 0.001,
                longitude: 0.001,
                authorId: user.id,
                neighborhoodId: neighborhood.id,
                imageUrl: 'https://placehold.co/600x400/png'
            },
            {
                title: 'Suspicious Activity',
                content: 'Saw someone looking into cars at night.',
                category: 'CRIME',
                latitude: -0.001,
                longitude: -0.001,
                authorId: user.id,
                neighborhoodId: neighborhood.id,
                imageUrl: 'https://placehold.co/600x400/png'
            },
            {
                title: 'Flood Warning',
                content: 'Heavy rains causing flooding on Main St.',
                category: 'DANGER',
                latitude: 0.002,
                longitude: 0.002,
                authorId: user.id,
                neighborhoodId: neighborhood.id,
                imageUrl: 'https://placehold.co/600x400/png'
            },
            {
                title: 'Community Clean Up',
                content: 'Join us this weekend for a park cleanup.',
                category: 'EVENT',
                latitude: 0,
                longitude: 0,
                authorId: user.id,
                neighborhoodId: neighborhood.id,
                imageUrl: 'https://placehold.co/600x400/png'
            }
        ],
    });
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map