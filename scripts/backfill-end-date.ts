require("dotenv").config({ path: ".env" });
const { prisma } = require("../lib/prisma");

async function main() {
  const employees = await prisma.employee.findMany({
    where: { endDate: null, applicantId: { not: null } },
    include: { applicant: { include: { jobPosting: true } } }
  });

  console.log(`Found ${employees.length} employees missing endDate with an applicant record.`);

  let updated = 0;
  for (const emp of employees) {
    const durationMonths = emp.applicant?.jobPosting?.durationMonths;
    if (durationMonths) {
      const start = new Date(emp.startDate);
      start.setMonth(start.getMonth() + durationMonths);
      
      await prisma.employee.update({
        where: { id: emp.id },
        data: { endDate: start }
      });
      updated++;
      console.log(`Updated employee ${emp.name} with endDate ${start.toISOString()}`);
    } else {
      // Default fallback: 3 months
      const start = new Date(emp.startDate);
      start.setMonth(start.getMonth() + 3);
      
      await prisma.employee.update({
        where: { id: emp.id },
        data: { endDate: start }
      });
      updated++;
      console.log(`Updated employee ${emp.name} with default 3-month endDate ${start.toISOString()}`);
    }
  }

  console.log(`Successfully backfilled endDate for ${updated} employees.`);
}

main().catch(console.error).finally(() => process.exit(0));
