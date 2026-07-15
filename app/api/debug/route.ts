import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays, format } from "date-fns";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: { submissions: true }
    });
    
    const results = tasks.map(task => {
      let deadlineStr = "";
      let diff = 0;
      let subDateStr = "";
      let formatA = "";
      let formatB = "";
      let error = null;

      try {
        const dl = new Date(task.deadline);
        deadlineStr = dl.toString();
        diff = differenceInDays(dl, new Date());
        formatA = format(dl, "MMM d, yyyy");
        
        if (task.submissions.length > 0) {
          const sd = new Date(task.submissions[0].submittedAt);
          subDateStr = sd.toString();
          formatB = format(sd, "MMM d, yyyy");
        }
      } catch (e: any) {
        error = e.message;
      }
      
      return { id: task.id, rawDeadline: task.deadline, deadlineStr, diff, subDateStr, formatA, formatB, error, rawSubDate: task.submissions[0]?.submittedAt };
    });

    return NextResponse.json({ success: true, count: tasks.length, results });
  } catch(e: any) {
    return NextResponse.json({ error: e.message });
  }
}
