import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const documents = [
      {
        title: "Employment Contract",
        subtitle: "Official Legal Agreement",
        bodyText: "This Employment Contract outlines the terms and conditions of your employment with CyberLab Security. By signing this document, you agree to adhere to company policies, perform your duties to the best of your ability, and maintain the highest standards of professional conduct. Compensation, benefits, and termination clauses are detailed in the full agreement attached to your initial offer. This digital signature serves as a legally binding acceptance of all terms.",
        appliesToRoles: JSON.stringify(["Employee", "Contract"])
      },
      {
        title: "Internship Agreement",
        subtitle: "Official Internship Terms",
        bodyText: "This Internship Agreement outlines the structure, duration, and learning objectives of your internship at CyberLab Security. By signing, you acknowledge that this is a temporary, educational role. You agree to follow instructions from your mentor and abide by all company policies. This digital signature confirms your acceptance of the internship terms.",
        appliesToRoles: JSON.stringify(["Intern"])
      },
      {
        title: "NDA",
        subtitle: "Non-Disclosure Agreement",
        bodyText: "This Non-Disclosure Agreement (NDA) is critical to protecting the intellectual property and confidential information of CyberLab Security and our clients. By signing, you legally bind yourself to absolute secrecy regarding any proprietary systems, vulnerabilities, client data, source code, and internal strategies you may encounter. Unauthorized disclosure will result in immediate termination and potential legal action.",
        appliesToRoles: JSON.stringify(["Employee", "Intern", "Contract"])
      },
      {
        title: "Code of Conduct",
        subtitle: "Company Code of Conduct",
        bodyText: "Our Code of Conduct defines the ethical standards expected of all team members at CyberLab Security. We have zero tolerance for harassment, discrimination, or unethical hacking practices. By signing, you pledge to foster an inclusive environment, report security incidents immediately, and uphold the integrity of the company at all times.",
        appliesToRoles: JSON.stringify(["Employee", "Intern", "Contract"])
      }
    ];

    let createdCount = 0;
    for (const doc of documents) {
      const existing = await prisma.onboardingDocument.findFirst({
        where: { title: doc.title }
      });
      if (!existing) {
        await prisma.onboardingDocument.create({ data: doc });
        createdCount++;
      }
    }

    return NextResponse.json({ success: true, createdCount });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
