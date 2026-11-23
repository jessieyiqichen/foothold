// House style: no full stops in the interface.
import { describe, expect, it } from "vitest";
import { filtersButton, ROLES_COPY, rolesCount, showRoles } from "./copy";

const FULL_STOP = /\.(\s|$)/;

describe("All roles' filter lines", () => {
  it("have no full stop", () => {
    for (const line of [...Object.values(ROLES_COPY), rolesCount(807), showRoles(1), showRoles(1234), filtersButton(0), filtersButton(3)]) {
      expect(line, line).not.toMatch(FULL_STOP);
    }
  });

  it("count roles in words a person would say", () => {
    expect(rolesCount(807)).toBe("807 roles");
    expect(rolesCount(1)).toBe("1 role");
    expect(rolesCount(1234)).toBe("1,234 roles");
    expect(showRoles(12)).toBe("Show 12 roles");
    expect(showRoles(null)).toBe("Show roles");
  });

  it("names the phone's one filter button with how many filters are on", () => {
    expect(filtersButton(0)).toBe("Filters");
    expect(filtersButton(4)).toBe("Filters · 4");
  });

  it("says plainly where the level and the place come from", () => {
    expect(ROLES_COPY.levelCaption).toBe("Level is read from the job title");
    expect(ROLES_COPY.placeLabel).toBe("Place in the posting");
  });

  it("says a minimum salary leaves out roles that state none", () => {
    expect(ROLES_COPY.salaryHint).toBe("Only roles that state a salary; compared with the top of the range, in US dollars a year");
  });
});
