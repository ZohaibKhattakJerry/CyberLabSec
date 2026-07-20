import { prisma } from "../lib/prisma";

async function main() {
  const adminEmail = "mrzohaibkhattak@gmail.com";
  console.log("Checking User:", adminEmail);
  
  const user = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  console.log("User:", user);
  
  if (user) {
    const employee = await prisma.employee.findUnique({
      where: { id: user.id }
    });
    console.log("Employee by user ID:", !!employee);

    const employeeByEmail = await prisma.employee.findFirst({
      where: { email: adminEmail }
    });
    console.log("Employee by email:", !!employeeByEmail);

    const leaderboards = await prisma.leaderboard.findMany({
      where: { employeeId: user.id }
    });
    console.log("Leaderboards:", leaderboards.length);
  }
}

main().catch(console.error).finally(() => process.exit(0));
