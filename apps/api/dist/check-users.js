"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
//# sourceMappingURL=check-users.js.map