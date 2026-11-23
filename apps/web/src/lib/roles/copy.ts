const count = (n: number) => n.toLocaleString("en-US");

/** What All roles' toolbar says (user, 2026-11-16). No full stops (copy.test.ts). */
export const ROLES_COPY = {
  searchLabel: "Search title or company",
  kind: "Kind of work",
  level: "Level",
  posted: "Posted",
  location: "Location",
  clear: "Clear",
  clearAll: "Clear all",
  remove: "Remove filter",
  sort: "Sort",
  fit: "Best fit",
  newest: "Newest",
  filtersTitle: "Filters",
  done: "Done",
  levelCaption: "Level is read from the job title",
  placeLabel: "Place in the posting",
  placeHint: "Matches the place as the posting writes it, like a city or Remote",
  quickPicks: "Quick picks",
  activeLabel: "Active filters",

  any: "Any",
  hideYears: "Hide roles needing years of experience",
  yearsDefault: "Default for your level",
  hidingYears: "Hiding roles needing years",
  showingYears: "Showing roles needing years",
  visa: "Visa",
  visaSponsors: "Sponsors visas",
  visaNoCitizens: "Hide citizens-only",
  hidingCitizens: "Hiding citizens-only roles",
  minSalary: "Minimum salary",
  salaryHint: "Only roles that state a salary; compared with the top of the range, in US dollars a year",
  equity: "Equity",
  k401: "401(k)",
  postingSays: "What the posting says",
  postingCaption: "Read from each posting's own words",
};

export const rolesCount = (n: number): string => (n === 1 ? "1 role" : `${count(n)} roles`);
export const showRoles = (n: number | null): string => (n === null ? "Show roles" : `Show ${rolesCount(n)}`);
export const filtersButton = (n: number): string => (n > 0 ? `Filters · ${n}` : "Filters");
export const removeLabel = (label: string): string => `${ROLES_COPY.remove}: ${label}`;
