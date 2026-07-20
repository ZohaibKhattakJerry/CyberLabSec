import AdminLayout from "../AdminLayout";

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
