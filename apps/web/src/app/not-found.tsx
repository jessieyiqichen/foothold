import type { Metadata } from "next";
import { CatArt } from "@/components/today/CatArt";
import { AppShell } from "@/components/ui/AppShell";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page not found · Nudge" };

/** An address that does not exist: Titi says so in plain words, with the way back to Today, instead of a bare 404
 *  that is a dead end (first-run check 2). */
export default function NotFound() {
  return (
    <AppShell>
      <section aria-labelledby="not-found-title" className="flex flex-col items-center gap-4 py-10 text-center lg:pt-0">
        <CatArt mood="idle" className="w-40 lg:w-56" />
        <h1 id="not-found-title" className="font-display text-3xl font-bold text-ink lg:text-4xl">
          Titi can&apos;t find this page
        </h1>
        <p className="font-bold text-muted">The link may have a typo, or the page moved</p>
        <ButtonLink href="/" size="lg" className="mt-2">
          Back to Today
        </ButtonLink>
      </section>
    </AppShell>
  );
}
