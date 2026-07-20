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
      status: true, 
      employmentType: true,
      startDate: true,
      endDate: true,
      documents: {
        orderBy: { createdAt: "desc" }
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
    isCompleted = true;
  }

  const empType = employee.employmentType || "Employee";

  return (
    <DocumentsClient 
      employee={employee} 
      dbDocs={employee.documents || []} 
      isCompleted={isCompleted} 
      empType={empType} 
    />
  );
}
