import type { ReactNode } from "react";
import { AUTH_INTRO } from "@/lib/auth/copy";

/** Sign in and sign up: the name and one line saying what Foothold is, so a person opening the link knows before
 *  making an account. Clerk's form is the one button; there is no navigation until you are in. The look is the
 *  earlier app's and is a placeholder until Foothold's own design is decided with the user. */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col px-4 pb-12 lg:max-w-6xl lg:px-8">
      <header className="flex min-h-11 items-center py-4 lg:pb-2 lg:pt-6">
        <span className="font-display text-2xl font-bold text-ink lg:text-4xl">Foothold</span>
      </header>
      <main id="main" className="grid flex-1 content-start gap-6 lg:grid-cols-2 lg:content-center lg:items-center lg:gap-16">
        <p className="font-display text-2xl font-bold leading-snug text-ink lg:text-4xl lg:[text-wrap:balance]">{AUTH_INTRO}</p>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
