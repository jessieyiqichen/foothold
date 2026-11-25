import { describe, expect, it } from "vitest";
import type { CardRole } from "../cards/types";
import { parseFilters } from "../roles/filters";
import type { Salary } from "../signals/types";
import { roleChips, salaryHeadline, similarRolesHref } from "./roleHeader";

const year = (min: number | null, max: number | null, extra: Partial<Salary> = {}): Salary =>
  ({ min, max, currency: "USD", period: "year", ote: false, quote: "q", ...extra });

describe("salaryHeadline: the pay line under the title", () => {
  it("gives a yearly range, and an hourly one", () => {
    expect(salaryHeadline({ salary: year(150000, 180000) })).toBe("$150k – $180k");
    expect(salaryHeadline({ salary: year(35, 40, { period: "hour" }) })).toBe("$35 – $40/hr");
  });

  it("adds equity when the posting offers it", () => {
    expect(salaryHeadline({ salary: year(150000, 180000), equity: { quote: "equity" } })).toBe("$150k – $180k + equity");
  });

  it("says one end, a single amount, OTE and another currency", () => {
    expect(salaryHeadline({ salary: year(120000, null) })).toBe("From $120k");
    expect(salaryHeadline({ salary: year(null, 90000) })).toBe("Up to $90k");
    expect(salaryHeadline({ salary: year(100000, 100000) })).toBe("$100k");
    expect(salaryHeadline({ salary: year(150000, 200000, { ote: true }) })).toBe("$150k – $200k OTE");
    expect(salaryHeadline({ salary: year(50000, 60000, { currency: "CAD" }) })).toBe("CAD 50k – CAD 60k");
  });

  it("is null with no salary, even with equity", () => {
    expect(salaryHeadline({ equity: { quote: "equity" } })).toBeNull();
    expect(salaryHeadline(undefined)).toBeNull();
  });
});

describe("roleChips: up to three quiet chips", () => {
  it("gives the first place with how many more, Remote, and the kind", () => {
    expect(roleChips("New York, NY; Remote - US; Austin, TX", "entry")).toEqual(["New York, NY +2", "Remote", "Full-time"]);
  });

  it("does not say Remote twice", () => {
    expect(roleChips("Remote", "intern")).toEqual(["Remote", "Internship"]);
  });

  it("leaves out what is unknown", () => {
    expect(roleChips(null, "unspecified")).toEqual([]);
    expect(roleChips("  ", "senior")).toEqual(["Full-time"]);
    expect(roleChips("San Francisco | London", "unspecified")).toEqual(["San Francisco +1"]);
  });
});

describe("similarRolesHref: Jobs with the role's kind of work and level picked", () => {
  const role: Pick<CardRole, "family" | "level"> = { family: "product", level: "entry" };

  it("preselects both, read back the same by the Jobs filters", () => {
    const href = similarRolesHref(role);
    expect(href).toBe("/matches?kind=product&level=entry");
    const filters = parseFilters(new URLSearchParams(href.split("?")[1]));
    expect(filters.families).toEqual(["product"]);
    expect(filters.levels).toEqual(["entry"]);
  });

  it("leaves the kind of work to the profile when the role has none", () => {
    expect(similarRolesHref({ family: null, level: "intern" })).toBe("/matches?level=intern");
  });
});
