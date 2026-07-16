import { prisma } from './lib/prisma';
async function main() {
  const task = await prisma.task.findUnique({ where: { id: "cmrmepb7r000904jjxwb1mroz" }});
  console.log("Task:", task);
}
main();
