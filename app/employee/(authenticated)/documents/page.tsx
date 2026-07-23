import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DocumentsClient from "./DocumentsClient";
import { differenceInCalendarDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const auth = await getAuthFromCookies("employee");
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { 
      id: true, 
      name: true,
      designation: true,
      status: true, 
      employmentType: true,
      startDate: true,
      endDate: true,
      documents: {
        orderBy: { createdAt: "desc" }
      },
      documentSignatures: {
        include: { document: true }
      }
    },
  });

  if (!employee) redirect("/employee/login");

  const now = new Date();
  const startsInDays = differenceInCalendarDays(employee.startDate, now);
  const isFutureStart = startsInDays > 0;
  
  let isCompleted = false;
  if (employee.endDate) {
    const daysRemaining = differenceInCalendarDays(employee.endDate, now);
    if (!isFutureStart && daysRemaining <= 0) {
      isCompleted = true;
    }
  } else {
    // No end date means permanent employee – exit docs still available on request
    isCompleted = employee.status === "Inactive" || employee.status === "Terminated";
  }

  const empType = employee.employmentType || "Employee";

  return (
    <DocumentsClient 
      employee={{ id: employee.id, name: employee.name, designation: employee.designation }} 
      dbDocs={employee.documents || []} 
      signatures={employee.documentSignatures || []}
      isCompleted={isCompleted} 
      empType={empType} 
    />
  );
}
