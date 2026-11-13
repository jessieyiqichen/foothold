import { buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";

/** A small action inside the form ("Forgot password?", "Resend", "Back"): the app's ghost button, a link-coloured
 *  word with a full-size tap area */
const LINK = buttonClass({ variant: "ghost", className: "min-h-9 px-1 normal-case" });
/** Same as the error under our own fields (Field.tsx) */
const ERROR_TEXT = "text-sm font-medium text-danger";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** Clerk's sign-in and sign-up forms in Foothold's minimal look (user, 2026-11-12). Clerk works out its shades from
 *  real colours, so these repeat the tokens in globals.css; change both together. Its styles sit in the `clerk` CSS
 *  layer, under Tailwind's utilities, so the classes below win. */
export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#4f46e5", // --color-primary
    colorPrimaryForeground: "#ffffff", // --color-on-primary, 6.3:1 on the accent
    colorForeground: "#111827", // --color-ink
    colorMutedForeground: "#6b7280", // --color-muted
    colorBackground: "#ffffff", // --color-page: the form sits in AuthScreen's card, with no card of its own
    colorInput: "#ffffff", // --color-page
    colorInputForeground: "#111827",
    colorBorder: "#868e9c", // --color-field, 3.3:1 for the edge of a field
    colorDanger: "#b91c1c", // --color-danger
    colorRing: "#4f46e5", // --color-focus
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-inter), system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  // AuthScreen draws the one card, so Clerk's own card, its shadow and its grey footer band are taken away. Clerk's
  // box hides what sticks out, and the fields reach its edges, so it would cut the sides off the focus ring
  // (user, 2026-10-26)
  elements: {
    rootBox: "w-full",
    cardBox: "w-full overflow-visible border-0 bg-transparent shadow-none",
    card: "border-0 bg-transparent p-0 shadow-none",
    footer: "bg-none bg-transparent",
    headerTitle: "text-lg font-semibold text-ink",
    headerSubtitle: "text-sm text-muted",
    socialButtonsBlockButton: buttonClass({ variant: "secondary", size: "lg", className: "w-full" }),
    formButtonPrimary: buttonClass({ variant: "primary", size: "lg", className: "w-full normal-case" }),
    formFieldLabel: "text-sm font-medium text-ink",
    formFieldInput: inputClass,
    // The taller tap area of the link would sit below the line of text beside it
    footerAction: "items-center",
    footerActionText: "text-sm text-muted",
    footerActionLink: LINK,
    dividerText: "text-sm text-muted",
    formFieldHintText: "text-sm text-muted",
    // The screens few people see (user, 2026-10-26: the email-code option was too small to find): a wrong password,
    // "Forgot password?", picking another way to sign in, the code boxes and "Resend". Clerk draws them as small plain
    // links and thin boxes; here they take the app's own controls, so every way in is as easy to tap as the first
    formFieldAction: LINK,
    // Every Clerk button, including ones it gives no name of their own ("Email support" on Get help, 32px tall)
    button: "min-h-9",
    formResendCodeLink: `${LINK} disabled:cursor-default disabled:text-muted disabled:no-underline`,
    backLink: LINK,
    headerBackLink: LINK,
    formButtonReset: LINK,
    alternativeMethodsBlockButton: buttonClass({ variant: "secondary", size: "lg", className: "w-full normal-case" }),
    identityPreviewText: "font-medium text-ink",
    identityPreviewEditButton: `min-h-9 min-w-9 justify-center rounded-lg text-ink hover:bg-wash ${FOCUS}`,
    identityPreviewEditButtonIcon: "size-4",
    formFieldInputShowPasswordButton: `min-h-9 min-w-9 text-muted hover:text-ink ${FOCUS}`,
    otpCodeFieldInput:
      // Clerk caps the boxes at 36px (max-height) and outlines them with a thin shadow; ours match the app's inputs
      "h-11 max-h-none w-10 rounded-lg border border-field bg-page shadow-none " +
      "text-lg font-semibold text-ink aria-invalid:border-danger " +
      "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus",
    otpCodeFieldErrorText: ERROR_TEXT,
    alertText: ERROR_TEXT,
  },
} as const;
