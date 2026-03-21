import { PrismaClient, Plan } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      subscription: {
        create: {
          stripeCustomerId: "cus_test_seed",
          plan: Plan.FREE,
          generationsLimit: 2,
          generationsUsed: 0,
        },
      },
    },
  });

  console.log(`Created user: ${user.email}`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
