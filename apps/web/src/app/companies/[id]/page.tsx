import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyScreen } from "@/components/company/CompanyScreen";
import { AppShell } from "@/components/ui/AppShell";
import { idFromPath } from "@/lib/company/constants";

export const metadata: Metadata = { title: "Company · Foothold" };

/** One company's page. Open to signed-out visitors since 2026-11-21: they read it through fh_public_company, with nothing personal. `?role=` chooses a role. */
export default async function CompanyPage({ params, searchParams }: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const { role } = await searchParams;
  const company = idFromPath(id);
  if (company === null) notFound();
  const asked = typeof role === "string" && idFromPath(role) !== null ? role : null;
  return (
    <AppShell>
      <CompanyScreen key={`c${company}`} by={{ company }} askedRole={asked} />
    </AppShell>
  );
}
