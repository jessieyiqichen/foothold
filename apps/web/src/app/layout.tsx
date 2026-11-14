import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { DataSync } from "@/components/auth/DataSync";
import { Notifier } from "@/components/Notifier";
import { clerkAppearance } from "@/lib/auth/appearance";
import { clerkLocalization } from "@/lib/auth/copy";
import { HOME_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth/routes";
import { fontClass } from "./fonts";
import "./globals.css";


export const metadata: Metadata = {
  title: "Foothold",
  description: "Find the startups, the roles and the people that fit you, from your own resume",
};

// The week's shelf is fixed at the foot of a phone screen, so the page reaches into the home-indicator area and pads for it
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontClass} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider
          appearance={clerkAppearance}
          localization={clerkLocalization}
          signInUrl={SIGN_IN_PATH}
          signUpUrl={SIGN_UP_PATH}
          signInFallbackRedirectUrl={HOME_PATH}
          signUpFallbackRedirectUrl={HOME_PATH}
        >
          <DataSync />
          {children}
          <Notifier />
        </ClerkProvider>
      </body>
    </html>
  );
}
