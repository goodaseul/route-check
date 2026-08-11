"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminApiJson } from "@/app/(admin)/_lib/admin-api";

export type UsedApiItem = {
  name: string;
  category: string;
  env_key: string;
  is_configured: boolean;
  status: "active" | "inactive";
  description: string;
};

export type UsedEnvItem = {
  key: string;
  value: string;
  is_configured: boolean;
  description: string;
};

export const adminSettingsKeys = {
  all: ["admin", "settings"] as const,
  apis: () => [...adminSettingsKeys.all, "apis"] as const,
  envs: () => [...adminSettingsKeys.all, "envs"] as const,
};

export function useAdminSettingsApis() {
  return useQuery<UsedApiItem[]>({
    queryKey: adminSettingsKeys.apis(),
    queryFn: () => fetchAdminApiJson<UsedApiItem[]>("/api/admin/settings/apis"),
    staleTime: 5 * 60 * 1000, // 5분 캐시 유지 (불필요한 중복 호출 방지)
    gcTime: 10 * 60 * 1000,
  });
}

export function useAdminSettingsEnvs() {
  return useQuery<UsedEnvItem[]>({
    queryKey: adminSettingsKeys.envs(),
    queryFn: () => fetchAdminApiJson<UsedEnvItem[]>("/api/admin/settings/envs"),
    staleTime: 5 * 60 * 1000, // 5분 캐시 유지
    gcTime: 10 * 60 * 1000,
  });
}
