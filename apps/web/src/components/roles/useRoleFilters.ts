"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { filtersToQuery, parseFilters, type RoleFilters } from "@/lib/roles/filters";
import { lockedFilters, lockedQuery, type Preset } from "@/lib/roles/landing";

/** All roles' filters, read from and written to the URL, so back and refresh keep them. Replacing the URL never
 *  scrolls the page. A landing page's `preset` sits on top of the URL and is never written to it. */
export function useRoleFilters(preset?: Preset) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = params.toString();
  const filters = useMemo(() => lockedFilters(parseFilters(new URLSearchParams(key)), preset), [key, preset]);
  const setFilters = useCallback((next: RoleFilters) => {
    const query = lockedQuery(next, preset);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname, preset]);
  return { filters, query: filtersToQuery(filters), setFilters };
}
