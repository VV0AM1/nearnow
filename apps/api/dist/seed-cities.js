"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding Cities and Neighborhoods...');
    const seederUser = await prisma.user.upsert({
        where: { email: 'seeder@nearnow.app' },
        update: {},
        create: {
            email: 'seeder@nearnow.app',
            name: 'System Seeder',
            role: 'ADMIN'
        }
    });
    console.log(`👤 Using Seeder User: ${seederUser.id}`);
    await prisma.city.upsert({
        where: { name: 'Barcelona' },
        update: {},
        create: {
            name: 'Barcelona',
            country: 'Spain',
            latitude: 41.3851,
            longitude: 2.1734,
            neighborhoods: {
                create: [
                    { name: 'El Raval', latitude: 41.3800, longitude: 2.1700, radiusKm: 0.8 },
                    { name: 'Barri Gòtic', latitude: 41.3833, longitude: 2.1770, radiusKm: 0.6 },
                    { name: 'Eixample', latitude: 41.3880, longitude: 2.1600, radiusKm: 1.5 },
                    { name: 'Gràcia', latitude: 41.4030, longitude: 2.1560, radiusKm: 1.0 },
                    { name: 'Poblenou', latitude: 41.4036, longitude: 2.2023, radiusKm: 1.2 },
                    { name: 'Sarrià', latitude: 41.4010, longitude: 2.1220, radiusKm: 1.0 },
                ]
            }
        }
    });
    await prisma.city.upsert({
        where: { name: 'L\'Hospitalet de Llobregat' },
        update: {},
        create: {
            name: 'L\'Hospitalet de Llobregat',
            country: 'Spain',
            latitude: 41.3596,
            longitude: 2.1002,
            neighborhoods: {
                create: [
                    { name: 'Bellvitge', latitude: 41.3530, longitude: 2.1130, radiusKm: 0.8 },
                    { name: 'Santa Eulàlia', latitude: 41.3650, longitude: 2.1250, radiusKm: 0.7 },
                    { name: 'Torrassa', latitude: 41.3700, longitude: 2.1180, radiusKm: 0.5 },
                ]
            }
        }
    });
    await prisma.city.upsert({
        where: { name: 'Badalona' },
        update: {},
        create: {
            name: 'Badalona',
            country: 'Spain',
            latitude: 41.4500,
            longitude: 2.2474,
            neighborhoods: {
                create: [
                    { name: 'Centre', latitude: 41.4505, longitude: 2.2474, radiusKm: 0.7 },
                    { name: 'Llefià', latitude: 41.4410, longitude: 2.2150, radiusKm: 0.9 },
                    { name: 'Gorg', latitude: 41.4420, longitude: 2.2380, radiusKm: 0.8 },
                ]
            }
        }
    });
    const bcnHoods = await prisma.neighborhood.findMany({ where: { city: { name: 'Barcelona' } } });
    const hospiHoods = await prisma.neighborhood.findMany({ where: { city: { name: 'L\'Hospitalet de Llobregat' } } });
    const badalonaHoods = await prisma.neighborhood.findMany({ where: { city: { name: 'Badalona' } } });
    await createRandomAlerts(bcnHoods, 150, seederUser.id);
    await createRandomAlerts(hospiHoods, 50, seederUser.id);
    await createRandomAlerts(badalonaHoods, 40, seederUser.id);
    console.log('✅ Seeding completed: 3 Cities, ~12 Neighborhoods, ~240 Alerts.');
}
async function createRandomAlerts(neighborhoods, count, userId) {
    if (!neighborhoods || neighborhoods.length === 0)
        return;
    const categories = [client_1.Category.CRIME, client_1.Category.SAFETY, client_1.Category.GENERAL, client_1.Category.LOST_FOUND];
    for (let i = 0; i < count; i++) {
        const hood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
        const offsetLat = (Math.random() - 0.5) * 0.01;
        const offsetLng = (Math.random() - 0.5) * 0.01;
        await prisma.post.create({
            data: {
                title: `Alert in ${hood.name}`,
                content: `Reported suspicious activity in ${hood.name}`,
                latitude: hood.latitude + offsetLat,
                longitude: hood.longitude + offsetLng,
                category: categories[Math.floor(Math.random() * categories.length)],
                authorId: userId
            }
        }).catch(e => {
            console.error(`Skipping post for ${hood.name}:`, e);
        });
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-cities.js.map