import type { ReactNode } from "react";
import { Shape } from "@/components/ui/art/Shape";
import { Tape } from "@/components/ui/art/Tape";
import { AUTH_INTRO } from "@/lib/auth/copy";
import { WORDMARK } from "@/lib/nav";

/** Sign in and sign up, Tape & Tile's front door (after Builder's Board's): a cobalt wall with one sheet taped to it,
 *  slightly tilted, holding the name, one line saying what Foothold is (so a person opening the link knows before
 *  making an account), a row of shapes, and Clerk's form. There is no navigation until you are in. */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col items-center bg-tile-cobalt px-4 py-10 sm:justify-center sm:py-14">
      <main id="main" className="relative w-full max-w-md -rotate-[0.6deg] bg-surface p-6 text-ink shadow-[-18px_30px_34px_-14px_rgb(10_10_40/0.6)] sm:p-8">
        <Tape className="-top-3 -left-5 -rotate-[38deg]" />
        <Tape className="-top-3 -right-5 rotate-[38deg]" />
        <h1 className="text-5xl leading-[0.9] font-black tracking-[-0.04em]">{WORDMARK}</h1>
        <p className="mt-3 max-w-xs font-mono text-xs leading-5 text-muted">{AUTH_INTRO}</p>
        <div aria-hidden className="mt-4 flex">
          <Shape shape="quarter" color="red" tile="mustard" size={28} />
          <Shape shape="square" color="cobalt" tile="off" size={28} />
          <Shape shape="circle" color="off" tile="green" size={28} />
          <Shape shape="triangle" color="off" tile="cobalt" size={28} />
        </div>
        <div className="mt-6 border-t-2 border-ink pt-4">{children}</div>
      </main>
    </div>
  );
}
