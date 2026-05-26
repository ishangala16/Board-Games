import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔌 Attempting to connect to MongoDB...");
    const startTime = Date.now();
    await prisma.$connect();
    console.log(`✅ Connection established successfully in ${Date.now() - startTime}ms!`);

    console.log("🔍 Fetching table counts...");
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.gameSession.count();
    console.log(`📊 Users in DB: ${userCount} | Active Game Sessions: ${sessionCount}`);
}

main()
    .catch((err) => {
        console.error("❌ Database connection test failed!");
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
