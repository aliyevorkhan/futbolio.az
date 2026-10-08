"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

/**
 * Single shared source of truth for "who is the logged-in admin". A 401
 * here means no valid session — callers (the protected layout) redirect
 * to `/admin/login` rather than rendering chrome around nothing.
 */
export function useSession() {
  return useQuery({
    queryKey: ["admin-me"],
    queryFn: getMe,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
    staleTime: 60 * 1000,
  });
}
