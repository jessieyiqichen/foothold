import { describe, expect, it } from "vitest";
import { HOME_PATH } from "./auth/routes";
import { MATCHES_PATH } from "./matches/constants";
import { isCurrentLink, NAV_LINKS, WORDMARK } from "./nav";
import { PROFILE_PATH } from "./profile/constants";

describe("the signed-in shell", () => {
  it("is named Foothold, never Nudge", () => {
    expect(WORDMARK).toBe("Foothold");
    expect(JSON.stringify(NAV_LINKS)).not.toMatch(/nudge/i);
  });

  it("links only to Matches and Profile, Matches first because it is the front door", () => {
    expect(NAV_LINKS).toEqual([{ href: MATCHES_PATH, label: "Matches" }, { href: PROFILE_PATH, label: "Profile" }]);
    expect(NAV_LINKS[0].href).toBe(HOME_PATH);
  });
});

describe("isCurrentLink: which link is marked as the page you are on", () => {
  const [matches, profile] = NAV_LINKS;

  it("marks the link of the page and of anything under it", () => {
    expect(isCurrentLink(matches, "/matches")).toBe(true);
    expect(isCurrentLink(profile, "/profile")).toBe(true);
    expect(isCurrentLink(profile, "/profile/anything")).toBe(true);
  });

  it("marks nothing on another page, on one that only starts with the same letters, or before the path is known", () => {
    expect(isCurrentLink(matches, "/profile")).toBe(false);
    expect(isCurrentLink(matches, "/goals")).toBe(false);
    expect(isCurrentLink(matches, "/matchesque")).toBe(false);
    expect(isCurrentLink(matches, null)).toBe(false);
  });
});
