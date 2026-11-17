"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { filtersToQuery, parseFilters, type RoleFilters } from "@/lib/roles/filters";

/** All roles' filters, read from and written to the URL, so back and refresh keep them. Replacing the URL never
 *  scrolls the page. */
export function useRoleFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = params.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(key)), [key]);
  const setFilters = useCallback((next: RoleFilters) => {
    const query = filtersToQuery(next);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname]);
  return { filters, query: filtersToQuery(filters), setFilters };
}
