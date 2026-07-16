/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findUnique({
    where: { id: 'cmrmepb7r000904jjxwb1mroz' },
  });
  console.log("Task comments:", task.comments);
  console.log("Task checklist:", task.checklist);
  console.log("Task deadline:", task.deadline);
}
main().catch(console.error).finally(() => prisma.$disconnect());
