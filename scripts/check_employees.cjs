const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emps = await prisma.employee.findMany({
    where: {
      employeeCode: { in: ['CyberLabSec', 'ZohaibKhattak'] }
    }
  });
  console.log("Found employees:", emps);
}
main().catch(console.error).finally(() => prisma.$disconnect());
