import type { ReactNode } from "react";
import { AUTH_INTRO } from "@/lib/auth/copy";
import { WORDMARK } from "@/lib/nav";

/** Sign in and sign up: one centred card with the name, one line saying what Foothold is (so a person opening the
 *  link knows before making an account), and Clerk's form. There is no navigation until you are in. */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col items-center bg-surface px-4 py-10 sm:justify-center">
      <main id="main" className="flex w-full max-w-md flex-col gap-5 rounded-lg border border-hairline bg-page p-5 sm:p-8">
        <div className="flex flex-col gap-1.5">
          <span className="text-xl font-semibold tracking-tight text-ink">{WORDMARK}</span>
          <p className="text-[15px] leading-6 text-muted">{AUTH_INTRO}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
