import type { Metadata } from "next";
import { CompaniesScreen } from "@/components/companies/CompaniesScreen";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Companies · Foothold" };

/** Every company, open to signed-out visitors (user, 2026-11-21); fh_companies_list answers for anyone. */
export default function CompaniesPage() {
  return (
    <AppShell>
      <CompaniesScreen />
    </AppShell>
  );
}
