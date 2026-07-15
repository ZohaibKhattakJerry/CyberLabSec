import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Careers — CyberLabSec",
  description: "Join CyberLabSec — offensive security careers and internships. Work on real penetration tests, vulnerability research, and red team operations.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Careers at CyberLabSec",
    description: "Join our offensive security team. Real pentests. Real impact.",
    type: "website",
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster position="top-center" toastOptions={{
        className: 'toast-error',
        style: {
          background: "var(--bg-card)",
          border: "1px solid var(--border-accent)",
          color: "var(--text-primary)",
        }
      }} />
    </>
  );
}
