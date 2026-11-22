import { INVESTOR_NAMES } from "../cards/constants";

/** The Companies page (user, 2026-11-21): every company, open to signed-out visitors, through fh_companies_list. */
export const COMPANIES_RPC = "fh_companies_list";
export const COMPANIES_PAGE_SIZE = 50;

/** Stages in groups a person thinks in; each group is the codes the VC boards and YC use (fh_companies.stage). YC's
 *  own "Early" and "Growth" sit with the nearest group. */
export const STAGE_GROUPS = [
  { id: "early", label: "Pre-seed and seed", codes: ["pre_seed", "seed", "Early"] },
  { id: "ab", label: "Series A and B", codes: ["series_a", "series_b"] },
  { id: "later", label: "Series C and later", codes: ["series_c", "series_c_plus", "series_d", "series_e", "series_f", "series_g", "series_h", "series_j", "Growth", "private_equity"] },
  { id: "public", label: "Public or acquired", codes: ["ipo", "acquisition"] },
] as const;
export type StageGroup = (typeof STAGE_GROUPS)[number]["id"];

/** Who backs them: YC (any batch) and the VC boards Foothold reads. */
export const BACKERS: readonly { id: string; label: string }[] = [
  { id: "yc", label: "Y Combinator" },
  ...Object.entries(INVESTOR_NAMES).map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label)),
];

export const COMPANY_SORTS = ["recent", "roles", "fit"] as const;
export type CompanySort = (typeof COMPANY_SORTS)[number];
