const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const applicant = await prisma.applicant.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(applicant);
}

main().catch(console.error).finally(() => prisma.$disconnect());
