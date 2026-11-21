import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyScreen } from "@/components/company/CompanyScreen";
import { AppShell } from "@/components/ui/AppShell";
import { idFromPath } from "@/lib/company/constants";

export const metadata: Metadata = { title: "Company · Foothold" };

/** A role from All roles opens its company's page with that role chosen. Signed-in only (`src/proxy.ts`). */
export default async function RolePage({ params }: PageProps<"/roles/[id]">) {
  const { id } = await params;
  const role = idFromPath(id);
  if (role === null) notFound();
  return (
    <AppShell>
      <CompanyScreen key={`r${role}`} by={{ role }} askedRole={String(role)} />
    </AppShell>
  );
}
