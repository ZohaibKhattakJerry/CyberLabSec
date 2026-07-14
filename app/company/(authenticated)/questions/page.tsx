import { prisma } from "@/lib/prisma";
import QuestionsClient from "./QuestionsClient";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const questions = await prisma.questionBank.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = questions.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  }));

  return <QuestionsClient questions={serialized} />;
}
