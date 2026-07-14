import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OfferLetterClient from "./OfferLetterClient";

export const dynamic = "force-dynamic";

export default async function OfferLetterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const offer = await prisma.offerLetter.findUnique({
    where: { token },
    include: {
      applicant: { select: { fullName: true, email: true } },
      jobPosting: { select: { title: true, type: true, department: true } },
    },
  });

  if (!offer) return notFound();

  // Mark as viewed if sent
  if (offer.status === "Sent") {
    await prisma.offerLetter.update({
      where: { token },
      data: { status: "Viewed" },
    });
  }

  const isExpired = offer.expiresAt < new Date();
  const isDecided = offer.status === "Accepted" || offer.status === "Declined";

  return (
    <OfferLetterClient
      offerId={offer.id}
      token={token}
      content={offer.content}
      status={isExpired ? "Expired" : offer.status}
      expiresAt={offer.expiresAt.toISOString()}
      candidateName={offer.applicant.fullName}
      jobTitle={offer.jobPosting?.title || "Position"}
      isExpired={isExpired}
      isDecided={isDecided}
      acceptedName={offer.acceptedName}
      declineReason={offer.declineReason}
    />
  );
}
