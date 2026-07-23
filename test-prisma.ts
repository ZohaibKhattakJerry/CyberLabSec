import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const applicant = await prisma.applicant.findUnique({
    where: { referenceId: 'APP-CF941373' },
    select: { id: true, jobPostingId: true, jobPosting: true }
  })
  console.log(applicant)
}
main().catch(console.error)
