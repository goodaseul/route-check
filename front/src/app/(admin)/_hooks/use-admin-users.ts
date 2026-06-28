"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminPageSize } from "@/app/(admin)/_components/admin-pagination";
import {
  fetchAdminApiJson,
  type PaginatedResponse,
} from "@/app/(admin)/_lib/admin-api";
import { adminListQueryOptions } from "@/app/(admin)/_lib/admin-query-config";

export type PublicUserItem = {
  id: number;
  email: string | null;
  name: string | null;
  nickname: string | null;
  profile_image: string | null;
  auth_provider: string;
  provider_user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: (filters: {
    page: number;
    pageSize: AdminPageSize;
    authProvider?: string;
    isActive?: boolean | null;
    search?: string;
  }) => [...adminUserKeys.all, "list", filters] as const,
};

function buildUsersPath(filters: {
  page: number;
  pageSize: AdminPageSize;
  authProvider?: string;
  isActive?: boolean | null;
  search?: string;
}) {
  const params = new URLSearchParams({
    page: String(filters.page),
    page_size: String(filters.pageSize),
  });

  if (filters.authProvider) {
    params.append("auth_provider", filters.authProvider);
  }
  if (filters.isActive !== undefined && filters.isActive !== null) {
    params.append("is_active", String(filters.isActive));
  }
  if (filters.search) {
    params.append("search", filters.search);
  }

  return `/api/admin/users?${params.toString()}`;
}

function fetchUserList(
  filters: {
    page: number;
    pageSize: AdminPageSize;
    authProvider?: string;
    isActive?: boolean | null;
    search?: string;
  },
  signal?: AbortSignal,
) {
  return fetchAdminApiJson<PaginatedResponse<PublicUserItem>>(
    buildUsersPath(filters),
    { cache: "no-store", signal },
  );
}

export function useAdminUsers(filters: {
  page: number;
  pageSize: AdminPageSize;
  authProvider?: string;
  isActive?: boolean | null;
  search?: string;
}) {
  return useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn: ({ signal }) => fetchUserList(filters, signal),
    ...adminListQueryOptions,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      fetchAdminApiJson<PublicUserItem>(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchAdminApiJson<PublicUserItem>(`/api/admin/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
  });
}
