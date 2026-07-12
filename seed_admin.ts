import { prisma } from './lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const ADMIN_CODE = "CyberLabSec"
  const password = "ZohaibSadiq"
  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.employee.upsert({
    where: { employeeCode: ADMIN_CODE },
    update: { passwordHash: passwordHash },
    create: {
      employeeCode: ADMIN_CODE,
      name: "Zohaib Sadiq (CEO)",
      email: "ceo@cyberlabsec.tech",
      designation: "CEO",
      employmentType: "Full-time",
      status: "Active",
      passwordHash: passwordHash,
      mustResetPassword: false,
      startDate: new Date(),
    }
  })

  console.log("Admin configured:", admin.employeeCode)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
