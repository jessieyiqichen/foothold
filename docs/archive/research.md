# Onboarding research: Beeminder, Duolingo, Finch

Three subagents studied, in parallel, how each tool welcomes someone new (2026-10-17). No accounts were created; findings come from official pages and third-party teardowns, with sources listed per tool.

## Side by side

| | Beeminder | Duolingo | Finch |
|---|---|---|---|
| Why it is similar | Turns a total + deadline into a daily rate, and keeps nagging when you fall behind | The best-known proactive nudger: daily goals, streaks, repeated reminders | Gentle encouragement: a pet that cheers you on, never scolds |
| First screen | "Reminders with a sting", Sign up / Learn more. No way to try it first | Mascot and "Get started" | Mascot and "Hatch a new pet" |
| Asks before value | Account, timezone, credit card, then a ~9-step goal wizard (~12 inputs) | Language, reason, level, daily goal, streak target (~5 taps); sign-up only after the first lesson | Egg colour, optional phone, pet name and traits, your name, a quiz, then a soft paywall (18 to 36 screens) |
| Time to first value | Only after account, card and wizard. Showing the line during setup was planned but not built | First lesson within seconds, before any account | Hatching in under a minute; first goal check-off around 3 minutes (estimate) |
| Daily target | Pick any two of date, total, rate; it computes the third. Falling behind steepens the line | Streak needs just one lesson a day; separating the streak from the goal raised day-14 retention 3.3% | Many tiny suggested goals ("stand up for 10 seconds") |
| Missing a day | "Derail": you are charged, pledge climbs $5 → $810 | Streak Freeze (hold up to 2), Earn Back; "losing a streak doesn't erase what you learned" | Pet stays happy to see you; App Pause freezes the streak |
| Nudges | Silent on safe days; on a red day, first at 9:30am, then each halfway to midnight | Rotated templates (repeats lose effect); about 2 a day max; "Last chance!"; stops after long silence | A reminder time per goal; the pet greets you daily |
| Tone | "Refuses to give up", money at stake | Effective, but criticised for guilt and FOMO | Warm; reviewers say accountability is weak |

## What we learned

1. **Show the number before asking for anything.** Beeminder's biggest gap is that you only see your daily rate after signing up and paying. Duolingo shows value within seconds. Our first screen should turn "500 by Dec 1" into "12 today" immediately.
2. **Make the daily bar tiny, and count progress separately.** Duolingo found a required goal was a barrier; one lesson keeps the streak. A day "counts" after one action; the quota is shown as progress, not pass/fail.
3. **Escalate only when needed, and rotate the words.** Beeminder is silent on safe days and speeds up as the deadline nears; Duolingo rotates templates and caps at about two a day.
4. **Missing a day should not feel like failing.** Finch and Duolingo both soften it (freezes, pauses, a warm welcome back). Beeminder's penalties suit people who opt in to stakes, not our user.
5. **Avoid:** a long setup before value (Beeminder, Finch), and guilt-tripping copy (Duolingo's critics).

## Sources

**Beeminder**: beeminder.com; beeminder.com/users/sign_up; help.beeminder.com/article/32-what-do-i-do-first; help.beeminder.com/article/101-reminders; blog.beeminder.com/zeno; blog.beeminder.com/glossary; doc.beeminder.com/roadstart; forum.beeminder.com threads 10848, 11826, 11033, 5475.

**Duolingo**: blog.duolingo.com/improving-the-streak; blog.duolingo.com/how-duolingo-streak-builds-habit; research.duolingo.com/papers/yancey.kdd20.pdf; lennysnewsletter.com/p/how-duolingo-reignited-user-growth; duolingo.deconstructoroffun.com/mechanics/notifications; goodux.appcues.com/blog/duolingo-user-onboarding.

**Finch**: finchcare.com; apps.apple.com/us/app/finch-self-care-pet/id1528595748; lazyweb.com/canvas/flows/finch/onboarding; screensdesign.com/articles/finch-app-onboarding-design; ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app.

## What we chose (user decision, 2026-10-17)

1. **Number first.** The first screen turns a goal into today's number with one tap; other settings come later.
2. **One action keeps the day.** Starting today (even one) counts; the quota is shown as progress, not pass/fail.
3. **Escalate when behind.** On track: one reminder. Not started: more frequent toward evening, rotated and encouraging.
4. **Missing a day is not failure.** One automatic rest day a week; a warm welcome back; the shortfall is spread over the days left.
