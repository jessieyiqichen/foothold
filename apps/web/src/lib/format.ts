import { countOf } from "./phrases";

/** "11 connections", "1 connection". Units are stored in the plural. */
export function formatCount(n: number, unit: string): string {
  return countOf(n, unit);
}
