import { describe, expect, it } from "vitest";
import { HOME_PATH } from "./auth/routes";
import { SAVED_PATH, TODAY_PATH } from "./cards/constants";
import { MATCHES_PATH } from "./matches/constants";
import { isCurrentLink, NAV_LINKS, PUBLIC_NAV_LINKS, WORDMARK } from "./nav";
import { COMPANIES_PATH } from "./company/constants";
import { PROFILE_PATH } from "./profile/constants";

describe("the signed-in shell", () => {
  it("is named Foothold, never Nudge", () => {
    expect(WORDMARK).toBe("Foothold");
    expect(JSON.stringify(NAV_LINKS)).not.toMatch(/nudge/i);
  });

  it("links to Today, Jobs, Companies, Saved and Profile, Today first because it is the front door", () => {
    expect(NAV_LINKS).toEqual([
      { href: TODAY_PATH, label: "Today" }, { href: MATCHES_PATH, label: "Jobs" }, { href: COMPANIES_PATH, label: "Companies" },
      { href: SAVED_PATH, label: "Saved" }, { href: PROFILE_PATH, label: "Profile" },
    ]);
    expect(NAV_LINKS[0].href).toBe(HOME_PATH);
  });

  it("shows a signed-out visitor Jobs and Companies only", () => {
    expect(PUBLIC_NAV_LINKS).toEqual([{ href: MATCHES_PATH, label: "Jobs" }, { href: COMPANIES_PATH, label: "Companies" }]);
  });
});

describe("isCurrentLink: which link is marked as the page you are on", () => {
  const [today, roles, , saved, profile] = NAV_LINKS;

  it("marks the link of the page and of anything under it", () => {
    expect(isCurrentLink(today, "/today")).toBe(true);
    expect(isCurrentLink(saved, "/saved")).toBe(true);
    expect(isCurrentLink(roles, "/matches")).toBe(true);
    expect(isCurrentLink(profile, "/profile")).toBe(true);
    expect(isCurrentLink(profile, "/profile/anything")).toBe(true);
  });

  it("marks nothing on another page, on one that only starts with the same letters, or before the path is known", () => {
    expect(isCurrentLink(today, "/profile")).toBe(false);
    expect(isCurrentLink(today, "/matches")).toBe(false);
    expect(isCurrentLink(saved, "/savedsearch")).toBe(false);
    expect(isCurrentLink(today, null)).toBe(false);
  });

  it("marks Jobs on its three landing pages, but not on Nudge's old /jobs or anything else under it", () => {
    for (const path of ["/jobs/internships", "/jobs/new-grad", "/jobs/remote"]) {
      expect(isCurrentLink(roles, path), path).toBe(true);
      expect(isCurrentLink(today, path), path).toBe(false);
    }
    expect(isCurrentLink(roles, "/jobs")).toBe(false);
    expect(isCurrentLink(roles, "/jobs/other")).toBe(false);
  });
});
