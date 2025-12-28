import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    const user = await prisma.user.create({
        data: {
            email: 'seed@example.com',
            username: 'SeedUser',
            password: 'password123', // In real app this would be hashed
        },
    });

    const city = await prisma.city.create({
        data: {
            name: 'Seed City',
            country: 'Seedland',
            latitude: 0,
            longitude: 0,
        }
    });

    const neighborhood = await prisma.neighborhood.create({
        data: {
            name: 'Central Seed',
            cityId: city.id,
            latitude: 0,
            longitude: 0,
            totalCount: 5
        }
    })

    await prisma.post.createMany({
        data: [
            {
                title: 'Lost Dog: Golden Retriever',
                content: 'My dog ran away near the park. Please help!',
                category: 'MISSING',
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
                category: 'DANGER', // SOS category
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
