const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const applicants = await prisma.applicant.findMany({
    where: { fullName: { contains: "Romaisa Mumtaz" } },
    select: { fullName: true, cvFileUrl: true }
  });
  console.log("Romaisa:", applicants);
  
  const applicants2 = await prisma.applicant.findMany({
    where: { fullName: { contains: "Ali amin" } },
    select: { fullName: true, cvFileUrl: true }
  });
  console.log("Ali:", applicants2);
}

check().catch(console.error).finally(() => prisma.$disconnect());
