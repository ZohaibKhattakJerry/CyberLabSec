/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { format, differenceInDays } = require('date-fns');

async function run() {
  try {
    const tasks = await prisma.task.findMany({
      include: { submissions: true }
    });
    console.log("Tasks length:", tasks.length);
    for (const task of tasks) {
      console.log("Task", task.id, "deadline", task.deadline, typeof task.deadline);
      const dl = new Date(task.deadline);
      console.log("dl", dl, dl.toString());
      differenceInDays(dl, new Date());
      
      if (task.submissions.length > 0) {
        const sub = task.submissions[0];
        console.log("Submission", sub.id, "submittedAt", sub.submittedAt, typeof sub.submittedAt);
        const sd = new Date(sub.submittedAt);
        console.log("sd", sd, sd.toString());
        format(sd, "MMM d, yyyy");
      }
      format(dl, "MMM d, yyyy");
    }
    console.log("Success");
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
