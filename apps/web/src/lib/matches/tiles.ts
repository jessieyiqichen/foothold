import type { Family } from "../profile/roles";

/** The tile colours a family label may sit on. Red is left out: it carries large text only (3.6:1), and a family
 *  label is small. */
export type FamilyTile = "cobalt" | "green" | "mustard" | "off";

/** One fixed colour per kind of work, in three groups so neighbours look alike and the list stays calm: cobalt for
 *  building and finding out (engineering, data, research), mustard for making and selling (product, design,
 *  marketing, sales), green for running the company (customer, operations, finance, people, legal), the plain sheet
 *  for other. The label's words always say the family too, so colour is never the only sign. */
export const FAMILY_TILE: Record<Family, FamilyTile> = {
  engineering: "cobalt",
  data: "cobalt",
  research: "cobalt",
  product: "mustard",
  design: "mustard",
  marketing: "mustard",
  sales: "mustard",
  customer: "green",
  operations: "green",
  finance: "green",
  people: "green",
  legal: "green",
  other: "off",
};

/** The text colour that passes on each tile: the sheet's colour on cobalt (6.6:1) and green (10.4:1), ink on mustard
 *  (8.6:1) and on the sheet (15.1:1). */
export const TILE_TEXT: Record<FamilyTile, string> = { cobalt: "text-tile-off", green: "text-tile-off", mustard: "text-ink", off: "text-ink" };
const TILE_BG: Record<FamilyTile, string> = { cobalt: "bg-tile-cobalt", green: "bg-tile-green", mustard: "bg-tile-mustard", off: "bg-surface border border-ink" };

/** A small flat tile: square, no shadow, a mono label. */
const TILE = "inline-flex items-center px-1.5 py-0.5 font-mono text-[11px] leading-4";

export const familyTileClass = (family: Family): string => `${TILE} ${TILE_BG[FAMILY_TILE[family]]} ${TILE_TEXT[FAMILY_TILE[family]]}`;
/** The level: the plain sheet with an ink edge, the same for every level. */
export const LEVEL_TILE_CLASS = `${TILE} border border-ink bg-surface text-ink`;
