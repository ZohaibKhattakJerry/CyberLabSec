import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "../AdminLayout";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}
