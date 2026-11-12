import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { HOME_PATH, isPublicPath } from "./routes";
import { MATCHES_PATH } from "../matches/constants";
import { PROFILE_PATH } from "../profile/constants";

describe("isPublicPath: which pages a signed-out visitor may open", () => {
  it("opens the sign-in and sign-up pages, with every step Clerk adds under them", () => {
    for (const path of ["/sign-in", "/sign-in/factor-one", "/sign-in/sso-callback", "/sign-up", "/sign-up/verify-email-address"]) {
      expect(isPublicPath(path), path).toBe(true);
    }
  });

  it("closes every page that shows a person's goals", () => {
    for (const path of ["/", "/goals", "/goals/new", "/session", "/reminders", "/progress/abc"]) {
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
  it("is the matches page, which a signed-out visitor cannot open", () => {
    expect(HOME_PATH).toBe(MATCHES_PATH);
    expect(isPublicPath(HOME_PATH)).toBe(false);
  });

  it("is where next.config.ts sends \"/\"", () => {
    const config = readFileSync(new URL("../../../next.config.ts", import.meta.url), "utf8");
    expect(config).toContain(`{ source: "/", destination: "${HOME_PATH}", permanent: false }`);
  });
});
