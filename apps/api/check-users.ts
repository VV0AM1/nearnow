import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- DEBUG: LISTING ALL USERS ---");
    const users = await prisma.user.findMany({
        include: { auth: true }
    });
    console.log(JSON.stringify(users, null, 2));
    console.log(`Total Users: ${users.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
