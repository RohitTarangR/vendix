import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      role: true
    }
  });
  console.log('USERS IN SYSTEM:');
  console.log(JSON.stringify(users, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
