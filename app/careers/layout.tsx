import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers — CyberLab",
  description: "Join CyberLab — offensive security careers and internships. Work on real penetration tests, vulnerability research, and red team operations.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Careers at CyberLab",
    description: "Join our offensive security team. Real pentests. Real impact.",
    type: "website",
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
