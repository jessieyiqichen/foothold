import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = { title: "Sign in · Foothold" };

export default function SignInPage() {
  return (
    <AuthScreen>
      <SignIn />
    </AuthScreen>
  );
}
