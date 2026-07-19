import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findUnique({
    where: { employeeCode: 'CL-2026-9F94' }
  });
  console.log(emp);
}
main().catch(console.error).finally(() => prisma.$disconnect());
