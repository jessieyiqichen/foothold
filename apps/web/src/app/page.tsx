import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HOME_PATH, PUBLIC_HOME_PATH } from "@/lib/auth/routes";

/** "/": a signed-in person goes to Today, a signed-out visitor to Jobs (user, 2026-11-21). */
export default async function Home() {
  const { userId } = await auth();
  redirect(userId ? HOME_PATH : PUBLIC_HOME_PATH);
}
