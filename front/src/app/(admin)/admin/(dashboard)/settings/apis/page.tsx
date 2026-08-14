"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableRow,
  type AdminTableColumn,
} from "@/app/(admin)/_components/admin-data-table";
import { AdminApiError } from "@/app/(admin)/_lib/admin-api";
import { useAdminSettingsApis } from "@/app/(admin)/_hooks/use-admin-settings";
import { cn } from "@/lib/utils/cn";

const columns: AdminTableColumn[] = [
  { key: "name", header: "API 명칭", className: "w-72" },
  { key: "category", header: "카테고리", className: "w-36" },
  { key: "env_key", header: "연동 환경 변수", className: "w-56" },
  { key: "status", header: "상태", className: "w-32" },
  { key: "description", header: "API 역할 및 용도" },
];

export default function UsedApisPage() {
  const router = useRouter();
  const { data: apis = [], isLoading, error, refetch } = useAdminSettingsApis();
  const pageError = error?.message ?? "";

  useEffect(() => {
    if (error instanceof AdminApiError && error.status === 401) {
      router.replace("/admin/login");
    }
  }, [error, router]);

  return (
    <>
      <AdminPageHeader
        description="Route Check 시스템에서 사용하는 외부 서비스 및 내부 모듈 연동 API 목록과 활성화 상태를 모니터링합니다."
        title="사용 API 관리"
      />

      <AdminDataTable
        columns={columns}
        emptyMessage="사용 중인 API 정보가 없습니다."
        errorMessage={pageError}
        isEmpty={apis.length === 0}
        isLoading={isLoading}
        onRetry={refetch}
      >
        {apis.map((api) => (
          <AdminTableRow key={api.env_key}>
            {/* API 명칭 */}
            <AdminTableCell className="font-semibold text-[#1A1714] text-sm">
              {api.name}
            </AdminTableCell>

            {/* 카테고리 배지 */}
            <AdminTableCell>
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border",
                  api.category.includes("공공데이터") && "bg-blue-50 text-blue-700 border-blue-200",
                  api.category.includes("인공지능") && "bg-purple-50 text-purple-700 border-purple-200",
                  api.category.includes("지도") && "bg-amber-50 text-amber-700 border-amber-200",
                  api.category.includes("소셜") && "bg-teal-50 text-teal-700 border-teal-200",
                  api.category.includes("데이터베이스") && "bg-slate-50 text-slate-700 border-slate-200",
                )}
              >
                {api.category}
              </span>
            </AdminTableCell>

            {/* 연동 환경 변수 */}
            <AdminTableCell>
              <code className="rounded bg-[#F4F1EA] px-2 py-0.5 text-[0.8rem] text-[#3A3530] font-mono border border-[#E8E4DC] tracking-tight">
                {api.env_key}
              </code>
            </AdminTableCell>

            {/* 상태 배지 */}
            <AdminTableCell>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border leading-5",
                  api.is_configured
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200",
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 size-1.5 rounded-full",
                    api.is_configured ? "bg-emerald-500" : "bg-red-500",
                  )}
                />
                {api.is_configured ? "연동 완료" : "설정 필요"}
              </span>
            </AdminTableCell>

            {/* 설명 */}
            <AdminTableCell className="text-xs text-[#6B6560] leading-relaxed max-w-sm whitespace-pre-wrap">
              {api.description}
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminDataTable>
    </>
  );
}
