# Flows

Main task, as one sentence:

> I pick a goal → it tells me today's number and I do the first one now → if I haven't started, it nudges me again (and again) → I come back and see how close I am.

A tool you use every day has three flows: the first visit, the main task, and coming back. Each page below is a route in Next.js; every step, state and error was drawn first and built second, then walked at 390px and 1440px (see `docs/states.png` for every state).

## The whole loop

The three flows as one path, like the teacher's "I add an item → it's on my list → I come back on Sunday": every diamond is a check, every error loops back to where you fix it, the cylinder is the moment it is saved in the browser, and the red dashed ends are where people may give up, with what Nudge does about each.

```mermaid
flowchart TD
    A([First visit, nothing saved]) --> P[Titi asks: What have you been putting off?]
    P --> PK[Pick what, by when, how many<br>today's number shows as you tap]
    PK --> ST[Start my first one]
    ST --> V{Everything filled in?}
    V -->|No| E[The error sits beside the field<br>and says what to type] --> PK
    V -->|Yes| SV[(Goal saved in the browser)]
    SV --> S[Session: Send 5 connection requests today]
    S --> I[I sent one]
    I --> R{Today's number reached?}
    R -->|No| S
    R -->|Yes| D[Done for today!<br>streak and how far the goal has come]
    D --> N[Nudge you tomorrow?<br>calendar file or notifications]
    N --> CB([Come back tomorrow])
    CB --> W[Titi: Welcome back, 2 days in a row!]
    W --> T[Today: today's new number]
    T --> S
    P -.->|closes the tab| X1([Leaves: nothing was saved<br>the same first screen greets them next time])
    S -.->|leaves with none done| X2([Leaves: the session is kept<br>Today says Keep going, Titi nudges at their times])
    CB -.->|no reminder set| X3([May not come back<br>so Nudge asks Nudge you tomorrow? after the first log])
    classDef drop fill:#fdecea,stroke:#c0392b,stroke-dasharray:5 3,color:#6b1d14
    class X1,X2,X3 drop
```

## 1. First visit: useful right away

Nothing is saved. One screen (after the teacher's "the page is the onboarding"): Titi waves and asks (once you answer she takes a pose for the amount: a loaf, a walk, a jump, or a tap of the paw for your own number), one line says what Nudge does ("Pick one thing. Nudge breaks it into a few a day, and each one you do is a fish for Titi"), and three rows of one-tap answers come already picked (LinkedIn connections, in a month, steady), so today's number, its empty fish and "Start my first one" are on the first screen; on a phone they stay pinned to the foot of the screen (the fish are left out on short phones). Every tap updates the number. Job applications adds "Where do you apply?" (LinkedIn Jobs, Handshake, Indeed, no site). The same screen (`GoalWizard`) is "+ Add a goal" later, so a goal is always made the same way. On a desktop the questions are on the left and Titi, today's number and Start on the right.

```mermaid
flowchart TD
    A([Open Nudge for the first time]) --> CS{Can this browser save?}
    CS -->|No, private mode| XB[Note: your goals will be gone<br>when you close the tab] --> P
    CS -->|Yes| P[Hi, I'm Titi! What have you been putting off?<br>answers already picked]
    P --> Q1{What?}
    Q1 -->|LinkedIn connections<br>Coffee chats · Interview practice| Q2
    Q1 -->|Job applications| WH[Where do you apply?<br>LinkedIn Jobs · Handshake · Indeed · No site] --> Q2
    Q1 -->|Something else| W[Type what you'll do<br>How often: every day or a total by a date] --> Q2
    Q2{By when?} -->|In 2 weeks · In a month<br>Before Thanksgiving| Q3
    Q2 -->|Pick a date| PD[Date field] --> Q3
    Q3{How many?} -->|Easy start · Steady · Go big| NUM
    Q3 -->|My own| MO[Number field] --> NUM
    NUM[Today's number updates<br>Titi takes a pose for the amount] --> ST[Start my first one]
    ST --> V{Everything filled in and valid?}
    V -->|What is empty| E1[Enter what you'll do, like 'Send cold emails']
    V -->|Date is today or earlier| E2[Pick a date after today]
    V -->|Number is 0 or not whole| E3[Enter a whole number, like 150]
    E1 & E2 & E3 --> FX[The error sits beside its field<br>focus moves there, the rest stays as picked]
    FX -->|fix it| ST
    P -.->|closes the tab before Start| X1([Leaves: nothing was saved<br>the same first screen greets them next time])
    FX -.->|gives up after an error| X2([Leaves: nothing was saved<br>what they picked was never stored])
    classDef drop fill:#fdecea,stroke:#c0392b,stroke-dasharray:5 3,color:#6b1d14
    class X1,X2 drop
    V -->|Yes| SV[(Goal saved in the browser)]
    SV --> S([Session, flow 2])
```

## 2. The main task: Today, the session, and the results

Today is Titi's room. On a phone: the window by the hour (with the streak), Titi on her mat with what she says in her bubble beside her, the goal tabs (the goal shown now is a flat label; the others are buttons that switch to them), the task and its one button, "Nudge you tomorrow?" in one row once anything has been logged, the road or diary link, and the week's bowls fixed at the foot of the screen with "Titi's week, 3 of 7 days". On a desktop the same things are on a 12-column grid: the task on the left seven columns, the window and Titi on the right five.

```mermaid
flowchart TD
    T([Today: Titi's room]) --> G{More than one goal?}
    G -->|Yes| TAB[Goal tabs: choose which one] --> B
    G -->|No| B[Today's task in one sentence]
    B --> OP{Session already opened today?}
    OP -->|No| SB[Start]
    OP -->|Yes| KG[Keep going]
    SB & KG --> S[Session page<br>Send 5 connection requests today<br>a row of 5 fish, 0 of 5 done]
    S --> L{Goal has a site and it is not opened yet?}
    L -->|Yes| O[Green button: Open LinkedIn<br>opens in a new tab] --> I
    L -->|No| I[Green button: I sent one]
    I --> LOG[(One more saved in the browser)]
    S --> SV[Did several at once?<br>+2 · +3 · All N · or type a number]
    SV --> VN{Whole number above 0?}
    VN -->|No| SE[Enter a whole number, like 5<br>what you typed stays] --> SV
    VN -->|Yes| LOG
    LOG --> F[The next fish fills, Titi hops<br>Added 1 connection request · Undo]
    F -->|Undo| S
    F --> R{Today's number reached?}
    R -->|No| S
    S -->|← Today| T
    R -->|Yes| D[Done for today!<br>Streak · So far 56 of 150]
    D --> FS{First goal finished today?}
    FS -->|No| NG{Another goal not done yet?}
    NG -->|Yes| NX[Next: that goal's session] --> S
    NG -->|No| BT
    FS -->|Yes| K[See my streak: 4-day streak!<br>this week's bowls]
    K --> NP{Reminders set up?}
    NP -->|No| ASK[Nudge you tomorrow?<br>Get calendar file · Turn on notifications · Not now] --> BT
    NP -->|Yes| BT[Back to Today]
    BT --> TD([Today, done: Titi is so full! See you tomorrow])
    S -.->|leaves before logging any| XA([Leaves: the session is kept<br>Today says Keep going, Titi nudges at their times])
    ASK -.->|Not now| XB([No reminder yet: asked again tomorrow]) --> BT
    classDef drop fill:#fdecea,stroke:#c0392b,stroke-dasharray:5 3,color:#6b1d14
    class XA,XB drop
```

The session is its own page: Start never opens a website; "Open LinkedIn ↗" in the session does, only when tapped. Leaving keeps the session, so Today says "Keep going". On Today, everything Titi says is in her bubble: a greeting on the day's first open, otherwise the day's nudge (gentle, then firmer, then one last call), and she naps and talks in her sleep until you start ("Zzz… one fish would wake me up").

## 3. Coming back: it remembers

```mermaid
flowchart TD
    DAY([A day later]) --> RS{Reminders set up?}
    RS -->|Yes| RING[Calendar alert or notification at their times] -->|tap it| C
    RS -->|No| XC([May not come back: nothing calls them<br>Today keeps asking Nudge you tomorrow? after a log]) -.->|they remember| C
    C([Open Nudge again]) --> RD{Saved goals readable?}
    RD -->|No| CR[Your saved goals couldn't be read<br>Download a copy · Start fresh]
    RD -->|Yes| K{What happened since the last visit?}
    K -->|tapped a reminder| N1[Titi: You came back! That's the hardest part]
    K -->|first open of the week| N0[Titi: Last week, 12 fish over 4 days!]
    K -->|yesterday counted| N2[Titi: Welcome back, 3 days in a row!]
    K -->|missed one day| N3[Yesterday was a rest day<br>one a week is forgiven]
    K -->|missed 3 days or more| N4[It's been 6 days, and that's okay<br>the rest is spread over 20 days]
    K -->|again the same day| N5[Titi naps and talks in her sleep<br>or nudges if you've started]
    N1 & N0 & N2 & N3 & N4 & N5 --> T[Today: today's number, flow 2]
    T --> CK{Anything to tell you?}
    CK -->|goal on a break| BR[Paused until Oct 20, Titi is napping too]
    CK -->|deadline passed| DP[10 of 100, nice work!<br>pick a new date and keep going]
    CK -->|calendar file running out| CAL[Your calendar nudges end Oct 20<br>grab a new file]
    CK -->|nothing| S([Start, flow 2])
    classDef drop fill:#fdecea,stroke:#c0392b,stroke-dasharray:5 3,color:#6b1d14
    class XC drop
```

One streak for the whole app, like Duolingo's: a day counts when any goal got at least one, with one forgiven rest day a week. A reminder visit always opens with "You came back!", even on a Monday; last week's summary then waits for the next normal visit, and is said once a week.

## 4. Managing goals

```mermaid
flowchart TD
    GL([Goals]) --> HG{Any goals?}
    HG -->|No| EM[No goals yet, Titi is waiting<br>Add a goal] --> WZ
    HG -->|Yes| C[A card per goal<br>+ Add a goal · Reminder times · Backup]
    C -->|+ Add a goal| WZ([First-visit screen, flow 1])
    C -->|tap a goal| PR[Progress: where it stands<br>Titi's road or Titi's diary]
    PR -->|Edit goal| E[Edit form] --> EV{Every field valid?}
    EV -->|No| EE[Error beside the field<br>focus moves there] --> E
    EV -->|Yes| PS[Progress · Saved changes]
    PR -->|Take a break| BR[3 days · 1 week · 2 weeks · Never mind] --> PR
    PR -->|Remove goal| U[Goals · Removed X · Undo]
    U --> UD{Undo within 8 seconds?}
    UD -->|Yes| GL
    UD -->|No| GONE[(Goal deleted from the browser)]
    C -->|Reminder times| RM[Reminders: when Titi nudges you<br>calendar file · notifications]
    RM --> TV{Each time valid?}
    TV -->|No| TE[Enter a time, like 20:00] --> RM
    TV -->|Yes| RS[(Times saved)]
    C -->|Backup| BK[Download a copy · Restore from a file]
    BK -->|Restore| FV{Is the file a Nudge backup?}
    FV -->|No| FE[This file isn't a Nudge backup] --> BK
    FV -->|Yes| CF{This replaces everything here<br>Replace with backup?}
    CF -->|Keep what I have| BK
    CF -->|Replace| RP[(Backup restored)]
```

On a desktop, Goals is list and detail on one page: the list on the left four columns, the chosen goal on the right eight. Editing a goal's number keeps the past: earlier days stay judged by the number they had. Removing one goal uses Undo; replacing everything from a backup uses a real confirm.

## Pages and navigation

| Route | Page | Shared pieces |
|---|---|---|
| `/` | First visit (nothing saved), then Today: Titi's room | `AppShell`, `Nav` (Today · Goals; hidden until the first goal exists), `GoalWizard`, `Pills`, `TodayHome`, `Room`, `CatArt`, `Coins`, `NudgePrompt`, `StreakChip`, `Toast` |
| `/session` | Working through today's number, then the results and the streak moment; Back returns to Today and keeps the session | `Session`, `Coins`, `Button`, `Field`, `DoneToday`, `NudgePrompt`, `Toast` |
| `/goals` | Your goals; on a desktop with the chosen goal beside the list | `GoalsScreen`, `GoalCard`, `ProgressScreen`, `BackupSection`, `Toast` |
| `/goals/new` | Add a goal: the same one screen as the first visit | `GoalWizard`, `Pills`, `Field` |
| `/goals/[id]` | A goal's progress (on a desktop, inside Goals) | `GoalView`, `ProgressScreen`, `Road` (by-date goal), `Diary` (daily goal), `GoalActions`, `Toast` |
| `/goals/[id]/edit` | Edit goal | `GoalSetup`, `Field`, `RadioGroup`, `RemoveGoalButton` |
| `/reminders` | Reminder times, calendar file, notifications | `TimesForm`, `CalendarCard`, `NotificationsCard` |
| any other address | Not found, with the way back to Today | `AppShell`, `CatArt`, `ButtonLink` |

Navigation holds only the core needs (Today, Goals); Reminders is reached from Goals, and Today and the streak moment ask "Nudge you tomorrow?" after the first log. Every page has a skip link, one `h1`, and the same header in the same place.
