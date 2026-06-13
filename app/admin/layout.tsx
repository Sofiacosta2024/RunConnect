import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-auth";
import AdminHeader from "./AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession(await headers());
  if (!session) redirect("/login");

  return (
    <div className="rc-root" style={{ display: "flex" }}>
      <AdminHeader />
      <div className="rc-admin-content">
        {children}
      </div>
    </div>
  );
}
