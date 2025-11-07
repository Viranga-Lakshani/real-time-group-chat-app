/**
 * Simple seed script for local dev.
 * Creates demo users, a channel, and a few messages.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.message.deleteMany();

  const alice = await prisma.user.create({ data: { name: "Alice" } });
  const bob = await prisma.user.create({ data: { name: "Bob" } });

  const general = await prisma.channel.create({ data: { name: "general" } });

  await prisma.message.create({
    data: {
      channelId: general.id,
      senderId: alice.id,
      body: "Welcome to the general channel!",
    },
  });

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});