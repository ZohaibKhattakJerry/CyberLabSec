require("dotenv").config({ path: ".env" });
const { prisma } = require("../lib/prisma");

async function main() {
  const adminEmail = "mrzohaibkhattak@gmail.com";
  console.log("Locating admin employee:", adminEmail);
  
  const admin = await prisma.employee.findUnique({
    where: { email: adminEmail }
  });

  if (!admin) {
    console.log("Admin employee not found. Already deleted?");
    return;
  }

  console.log("Found admin employee. ID:", admin.id);

  // Update ActivityLogs
  const logsCount = await prisma.activityLog.updateMany({
    where: { actorId: admin.id },
    data: { actorId: null }
  });
  console.log("Updated ActivityLogs:", logsCount.count);

  // Update Announcements
  const annCount = await prisma.announcement.updateMany({
    where: { sentById: admin.id },
    data: { sentById: null }
  });
  console.log("Updated Announcements:", annCount.count);

  // Finally delete employee
  await prisma.employee.delete({
    where: { id: admin.id }
  });

  console.log("Successfully deleted admin employee mapping.");
}

main().catch(console.error).finally(() => process.exit(0));
