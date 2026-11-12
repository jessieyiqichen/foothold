"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

/** Titi (art generated with GPT). Each pose means one thing (Fish Treat design system, TitiPoses):
 *  sleep: today hasn't started · wave: hello, the first screen · stretch: back again, a fresh start
 *  idle: with you while you work · paw-tap: a gentle poke to carry on · walk: on the way to a by-date goal
 *  loaf: full, resting, paused · celebrate: done. */
export type CatMood = "sleep" | "wave" | "stretch" | "idle" | "paw-tap" | "walk" | "loaf" | "celebrate";
/** Small extras made in code on top of the drawn animation: z's while asleep, a hop with hearts after a log, more hearts when done. */
export type CatEffect = "zzz" | "hop" | "party";

/** Poses that stay with you are drawn loops, each with a still frame for people who ask for less motion; poses for rest
 *  or a passing moment are one picture with a small motion made in code (`motion`). Sizes are the files' own. */
const ART: Record<CatMood, { moving: string; still: string; width: number; height: number; motion?: string }> = {
  sleep: { moving: "/cat/sleep.png", still: "/cat/sleep.png", width: 300, height: 300, motion: "cat-breathe" },
  wave: { moving: "/cat/wave.webp", still: "/cat/wave.png", width: 444, height: 444 },
  stretch: { moving: "/cat/stretch.webp", still: "/cat/stretch.webp", width: 600, height: 600, motion: "cat-stretch" },
  idle: { moving: "/cat/idle.webp", still: "/cat/idle.png", width: 300, height: 300 },
  "paw-tap": { moving: "/cat/paw-tap.webp", still: "/cat/paw-tap.png", width: 444, height: 444 },
  walk: { moving: "/cat/walk.webp", still: "/cat/walk.png", width: 444, height: 444 },
  loaf: { moving: "/cat/loaf.webp", still: "/cat/loaf.webp", width: 600, height: 600, motion: "cat-breathe" },
  celebrate: { moving: "/cat/celebrate.webp", still: "/cat/celebrate.png", width: 300, height: 388 },
};

function Heart({ style }: { style: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="float-up absolute size-6" style={style}>
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.2 0 3.6 1.3 5.3 3.2 1.7-1.9 3.1-3.2 5.3-3.2 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z" fill="var(--color-heart)" />
    </svg>
  );
}

function Particles({ effect }: { effect: CatEffect }) {
  if (effect === "zzz") {
    return (
      <>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className="float-up absolute font-display font-bold text-muted"
            style={{ right: `${14 + i * 8}%`, top: "40%", fontSize: `${14 + i * 4}px`, ["--delay" as string]: `${i * 0.8}s`, ["--times" as string]: "infinite", ["--drift" as string]: "14px" }}
          >
            z
          </span>
        ))}
      </>
    );
  }
  // A hop sends up three hearts; done for today sends up a fuller, softer burst of nine in three sizes.
  const many = effect === "party";
  const count = many ? 9 : 3;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Heart
          key={i}
          style={{
            left: `${many ? 14 + i * 9 : 26 + i * 16}%`,
            top: many ? `${16 + (i % 3) * 8}%` : "22%",
            width: many ? `${16 + (i % 3) * 5}px` : undefined,
            ["--delay" as string]: `${0.15 + i * (many ? 0.18 : 0.25)}s`,
            ["--drift" as string]: `${(i % 2 ? 1 : -1) * (8 + (i % 4) * 5)}px`,
            ["--times" as string]: many ? "3" : "1",
          }}
        />
      ))}
    </>
  );
}

/** Titi on a soft butter sun. Purely decorative: the words on the screen carry the meaning. */
interface CatProps {
  mood: CatMood;
  effect?: CatEffect;
  className?: string;
  /** The butter sun behind Titi; off inside the painted room. */
  sun?: boolean;
}

export function CatArt({ mood, effect, className = "", sun = true }: CatProps) {
  const art = ART[mood];
  return (
    <div className={`relative ${className}`}>
      {sun && <span aria-hidden="true" className="absolute inset-x-[6%] bottom-0 aspect-square rounded-full bg-sun" />}
      <picture className={`relative block ${effect === "hop" ? "cat-hop" : (art.motion ?? "")}`}>
        <source media="(prefers-reduced-motion: reduce)" srcSet={art.still} />
        <Image src={art.moving} alt="" width={art.width} height={art.height} unoptimized priority className="h-auto w-full" />
      </picture>
      {effect && <Particles effect={effect} />}
    </div>
  );
}
