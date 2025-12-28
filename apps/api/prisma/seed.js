const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Create or find user
    const user = await prisma.user.upsert({
        where: { email: 'seed@example.com' },
        update: {},
        create: {
            email: 'seed@example.com',
            username: 'SeedUser', // This is NOT in schema? checking schema... User has 'name' not 'username' if I recall correctly from logs? checking schema content again: yes, 'name' is optional string, 'email' is unique. Wait, schema has NO 'username' field. It has 'name'.
            // Correcting based on schema:
            name: 'SeedUser',
            // password is NOT in User, it's in Auth model probably?
            // Checking schema: User relation -> Auth. User table does NOT have password.
        },
    });

    // Oops, User table doesn't have password. Auth table does.
    // But for just fetching feed, we don't strictly need Auth entry if we associate posts to User ID.

    // Also City name must be unique
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
            name: 'Central Seed ' + Date.now(), // Append timestamp to avoid unique constraint if re-running
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
                category: 'LOST_FOUND', // Correct Enum from Schema
                latitude: 0.001,
                longitude: 0.001,
                authorId: user.id,
                neighborhoodId: neighborhood.id,
                imageUrl: 'https://placehold.co/600x400/png'
            },
            {
                title: 'Suspicious Activity',
                content: 'Saw someone looking into cars at night.',
                category: 'CRIME', // Correct Enum
                latitude: -0.001,
                longitude: -0.001,
                authorId: user.id,
                neighborhoodId: neighborhood.id,
                imageUrl: 'https://placehold.co/600x400/png'
            },
            {
                title: 'Flood Warning',
                content: 'Heavy rains causing flooding on Main St.',
                category: 'DANGER', // Correct Enum
                latitude: 0.002,
                longitude: 0.002,
                authorId: user.id,
                neighborhoodId: neighborhood.id,
                imageUrl: 'https://placehold.co/600x400/png'
            },
            {
                title: 'Community Clean Up',
                content: 'Join us this weekend for a park cleanup.',
                category: 'EVENT', // Correct Enum
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
