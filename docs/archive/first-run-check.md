# First-run checks

Two rounds, each by a fresh agent that saw only the live URL (no code, no docs), with a cleared browser. A summary is in the [README](../README.md#first-run-check).

### Round 1

On 2026-10-18, after the deploy, a fresh agent (no access to the code or these docs, a cleared browser at 375px wide) was given the live URL and the goal "set up a goal to send 150 LinkedIn connection requests by a date, do your first two today, and see how you are doing", then told to pretend to come back the next day. Its report, condensed, and what changed:

| What the tester found | Severity | What changed |
|---|---|---|
| "Nothing on the first screen says what Nudge does; I inferred it from the question and the job-search presets." | Medium | One line now sits under Titi's first question: "Pick one thing. Nudge breaks it into a few a day, and each one you do is a fish for Titi", and the bar at the foot draws today's empty fish under the number |
| "The caption talks about a pace flag, but the only flag on the road is the deadline. I could not tell what 'a little ahead' referred to." (The pace marker is a dashed ring, and it is hidden when it would sit under Titi.) | Medium | The caption now names the dashed ring, and says "Titi is right on pace!" when the ring is hidden |
| "Reminder times is only a small text link on Goals." | Medium | Kept in Goals on purpose (the navigation holds only Today and Goals), but it is now a full row like Backup, and since then Today asks "Nudge you tomorrow?" right after the first log |
| "The amount buttons read as unnamed buttons." | Medium | Checked: each button's accessible name is its label and detail ("Steady, 150 connection requests"); axe reports no `button-name` issue, and Playwright finds them by name. No change |
| "Titi was an empty yellow circle for about a second on first load." | Low | Her sitting loop is now preloaded from the layout |
| "The window said 'morning' at 15:00." | Low | The daytime painting is now read out as "daytime" (it covers 5:00 to 15:59) |
| "Edit goal says Back to Today, but I came from Progress." | Low | Back now returns to the goal's progress page |
| Worked well: inline errors with an example and focus moved to the field; the Undo toast; fish landing in the bowl and "2 done, 1 to go!"; the welcome-back line that recomputes today's number; dates shown beside "In 2 weeks". | | Kept |

One thing the tester saw twice and could not make happen again: the progress page jumping to Today on its own, once right after Save changes and once a few seconds after a direct load. There is no redirect in that route's code (the only navigations are Save → progress and Remove → Goals), and three further attempts stayed put. It is noted here rather than claimed fixed.

### Round 2

On 2026-10-19, after the redesign (one-screen first visit, task-first desktop, Titi's bubble, the retention loop), a second fresh agent was given the live URL and the goal "I'm a student in recruiting season. Set up a goal to send job applications, do two today, see how I'm doing, then come back the next day and keep going", on a phone (390x844) and a desktop (1440x900), with one deliberate form mistake, a simulated next day and a five-day gap, a tapped reminder (`/?from=nudge`) and keyboard only. It reported 21 findings (6 Medium, the rest Low); the 12 below were fixed, the rest are kept on purpose.

| What the tester found | Severity | What changed |
|---|---|---|
| Raising the daily number from 2 to 3 in Edit goal turned finished days into "some done". | Medium | An edit that changes the number, type or date keeps the old values as applying up to yesterday; the diary and the week's bowls judge each day by the number it had then |
| "Oct 18 was a rest day", though no rest day was set. | Medium | "Oct 18 was your free rest day, one a week" |
| The streak counted a partial day, but the diary said a heaped bowl means all done. | Medium | The legend adds "and any fish keeps the streak" |
| "Take a break" seemed to do nothing on a phone (the choices opened below the screen). | Medium | The choices scroll into view and focus moves to the first |
| "Add to calendar" downloaded a file without warning, and the file covers about two weeks. | Medium | "Get calendar file", and Reminders says "It covers the next 14 days" |
| During a break, Today still asked "Nudge you tomorrow?". | Low-Medium | Not asked while a goal is on a break |
| Two "Add a goal" buttons on an empty Goals page. | Low | One |
| "How many did you do?" with no choices under it (one left); chips "+3 +4 All 5". | Low | Fixed steps +2, +3, +5, then "All N"; with none to offer, the field asks the question itself |
| 0 got "Enter a whole number". | Low | "Enter a number above 0, like 3" |
| "Titi's diary, 2 so far": 2 of what? | Low | "Titi's diary, 2 applications so far" |
| An unknown address was a bare 404. | Low | Titi says she can't find the page, with "Back to Today" |
| No confirmation after Save changes. | Low | A "Saved changes" toast on the progress page |

Kept on purpose: reminders live under Goals (the navigation is Today and Goals only, and Today asks after the first log); the reminder card shows at the start of a day until reminders are set up; Remove goal acts at once with Undo, no "are you sure"; very large numbers are allowed (up to 100,000); on a phone the bar with today's number and Start stays pinned over the lower choices; reminder times are sorted on save; the streak and this week's bowls can differ on a Monday (yesterday was last week).

Worked well, in the tester's words: the first screen's purpose was "mostly clear" and adapted to "Job applications" ("Where do you apply?"); errors sit next to the field and focus jumps to the first; logging is "fast and satisfying"; coming back after five days "stayed gentle"; keyboard-only setup and logging worked; no sideways scroll at 390px.
