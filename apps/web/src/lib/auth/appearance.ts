/** Clerk's sign-in and sign-up forms in Tape & Tile (Builder's Board's Clerk styling, taken on for Foothold
 *  2026-11-13). Clerk works out its shades from real colours, so these repeat the tokens in globals.css; change both
 *  together. Square corners, ink edges, a mustard key for the one button, the three faces in their roles. Its styles
 *  sit in the `clerk` CSS layer, under Tailwind's utilities, so the classes below win. */
const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus";
const KEYCAP = `keycap min-h-12 w-full border-2 border-line font-sans font-bold normal-case text-ink ${FOCUS}`;
/** A small action inside the form ("Forgot password?", "Resend", "Back"): a cobalt link word with a full-size tap area */
const LINK = `min-h-10 px-1 font-medium normal-case text-link underline underline-offset-4 hover:text-ink ${FOCUS}`;
const INPUT =
  "min-h-11 border-2 border-field bg-surface px-3 font-sans text-[15px] text-ink placeholder:text-muted " +
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-invalid:border-danger";
const ERROR_TEXT = "text-sm font-bold text-danger";

export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#e2b04a", // --color-primary (mustard)
    colorPrimaryForeground: "#1b1a2c", // --color-on-primary, 8.6:1 on mustard
    colorForeground: "#1b1a2c", // --color-ink
    colorMutedForeground: "#5d5a52", // --color-muted, 6.1:1 on the sheet
    colorBackground: "#f4f1ea", // --color-surface: the form sits on the taped sheet
    colorInput: "#f4f1ea",
    colorInputForeground: "#1b1a2c",
    colorBorder: "#1b1a2c",
    colorDanger: "#a3301f", // --color-danger, 6.2:1 on the sheet
    colorRing: "#1b1a2c", // --color-focus
    fontFamily: "var(--font-schibsted), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-schibsted), system-ui, sans-serif",
    borderRadius: "0",
  },
  // AuthScreen draws the one sheet, so Clerk's own card, its shadow and its grey footer band are taken away. Clerk's
  // box hides what sticks out, and the fields reach its edges, so it would cut the sides off the focus ring and the
  // keys' edges (user, 2026-10-26)
  elements: {
    rootBox: "w-full",
    cardBox: "w-full overflow-visible border-0 bg-transparent shadow-none",
    card: "border-0 bg-transparent px-0 py-2 shadow-none",
    footer: "bg-none bg-transparent",
    headerTitle: "font-condensed text-3xl leading-none font-bold uppercase text-ink",
    headerSubtitle: "font-mono text-xs text-muted",
    socialButtonsBlockButton: `${KEYCAP} bg-surface hover:bg-wash`,
    formButtonPrimary: `${KEYCAP} bg-primary hover:bg-primary-hover`,
    formFieldLabel: "font-mono text-xs text-ink",
    formFieldInput: INPUT,
    // The taller tap area of the link would sit below the line of text beside it
    footerAction: "items-center",
    footerActionText: "font-mono text-xs text-muted",
    footerActionLink: LINK,
    dividerLine: "bg-ink/30",
    dividerText: "font-mono text-xs text-muted",
    formFieldHintText: "font-mono text-xs text-muted",
    formFieldErrorText: ERROR_TEXT,
    // The screens few people see (user, 2026-10-26: the email-code option was too small to find): a wrong password,
    // "Forgot password?", picking another way to sign in, the code boxes and "Resend". Clerk draws them as small plain
    // links and thin boxes; here they take the app's own controls, so every way in is as easy to tap as the first
    formFieldAction: LINK,
    // Every Clerk button, including ones it gives no name of their own ("Email support" on Get help, 32px tall)
    button: "min-h-10",
    formResendCodeLink: `${LINK} disabled:cursor-default disabled:text-muted disabled:no-underline`,
    backLink: LINK,
    headerBackLink: LINK,
    formButtonReset: LINK,
    alternativeMethodsBlockButton: `${KEYCAP} bg-surface hover:bg-wash`,
    identityPreviewText: "font-bold text-ink",
    identityPreviewEditButton: `min-h-10 min-w-10 justify-center text-ink hover:bg-wash ${FOCUS}`,
    identityPreviewEditButtonIcon: "size-5",
    formFieldInputShowPasswordButton: `min-h-10 min-w-10 text-muted hover:text-ink ${FOCUS}`,
    otpCodeFieldInput:
      // Clerk caps the boxes at 36px (max-height) and outlines them with a thin shadow; ours match the app's fields
      "h-13 max-h-none w-11 border-2 border-field bg-surface shadow-none font-sans text-2xl font-black text-ink " +
      "aria-invalid:border-danger focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-focus",
    otpCodeFieldErrorText: ERROR_TEXT,
    alertText: ERROR_TEXT,
  },
} as const;
