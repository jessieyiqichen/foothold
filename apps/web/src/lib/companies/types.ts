import type { CompanySort, StageGroup } from "./constants";

export interface CompanyRow {
  companyId: number;
  name: string;
  oneLiner: string | null;
  stage: string | null;
  batch: string | null;
  investors: string[];
  openRoles: number;
  lastPostedAt: string | null;
}

export interface CompaniesPage { rows: CompanyRow[]; total: number }

export interface CompanyFilters {
  query: string;
  stage: StageGroup | "";
  backer: string;
  hiring: boolean;
  sort: CompanySort;
}
