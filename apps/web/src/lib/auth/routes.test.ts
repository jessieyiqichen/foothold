import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { HOME_PATH, isPublicPath, PUBLIC_HOME_PATH } from "./routes";
import { MATCHES_PATH } from "../matches/constants";
import { TODAY_PATH } from "../cards/constants";
import { PROFILE_PATH } from "../profile/constants";

describe("isPublicPath: which pages a signed-out visitor may open", () => {
  it("opens the sign-in and sign-up pages, with every step Clerk adds under them", () => {
    for (const path of ["/sign-in", "/sign-in/factor-one", "/sign-in/sso-callback", "/sign-up", "/sign-up/verify-email-address"]) {
      expect(isPublicPath(path), path).toBe(true);
    }
  });

  // Jobs and Companies open to signed-out visitors (user, 2026-11-21); "/" is a page that sends each visitor on
  it("opens Jobs, Companies, every company page and every role page", () => {
    for (const path of ["/matches", "/companies", "/companies/4677", "/roles/68783"]) {
      expect(isPublicPath(path), path).toBe(true);
    }
  });

  it("opens \"/\" itself, which sends each visitor on, and nothing that only starts with a slash", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("//today")).toBe(false);
  });

  it("keeps closed what depends on the person: Today, Saved, Profile, the first visit", () => {
    for (const path of ["/today", "/saved", "/profile", "/start", "/companies-mine", "/roles-mine"]) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });

  it("closes every page that shows a person's goals", () => {
    for (const path of ["/goals", "/goals/new", "/session", "/reminders", "/progress/abc"]) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });

  it("closes the profile page, which shows a person's resume: the proxy sends a signed-out visitor to sign in", () => {
    expect(isPublicPath(PROFILE_PATH)).toBe(false);
  });

  it("does not open a page that only starts with the same letters", () => {
    for (const path of ["/sign-inside", "/sign-up-later", "/goals/sign-in"]) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });
});

describe("HOME_PATH: the front door", () => {
  it("is today's five, which a signed-out visitor cannot open", () => {
    expect(HOME_PATH).toBe(TODAY_PATH);
    expect(isPublicPath(HOME_PATH)).toBe(false);
  });

  it("is where \"/\" sends a signed-in visitor, and Jobs where it sends a signed-out one", () => {
    const page = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
    expect(page).toContain("redirect(userId ? HOME_PATH : PUBLIC_HOME_PATH)");
    expect(PUBLIC_HOME_PATH).toBe(MATCHES_PATH);
    expect(isPublicPath(PUBLIC_HOME_PATH)).toBe(true);
  });
});
