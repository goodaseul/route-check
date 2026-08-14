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
import { useAdminSettingsEnvs } from "@/app/(admin)/_hooks/use-admin-settings";
import { cn } from "@/lib/utils/cn";

const columns: AdminTableColumn[] = [
  { key: "key", header: "환경 변수 Key (Env)", className: "w-72" },
  { key: "description", header: "설명", className: "w-96" },
  { key: "value", header: "로드된 설정 값 (마스킹)", className: "w-80" },
  { key: "status", header: "상태", className: "w-32" },
];

export default function UsedEnvsPage() {
  const router = useRouter();
  const { data: envs = [], isLoading, error, refetch } = useAdminSettingsEnvs();
  const pageError = error?.message ?? "";

  useEffect(() => {
    if (error instanceof AdminApiError && error.status === 401) {
      router.replace("/admin/login");
    }
  }, [error, router]);

  return (
    <>
      <AdminPageHeader
        description="시스템 설정 파일(.env)에 정의된 백엔드/프론트엔드/API 비밀 키의 로드 여부 및 마스킹 처리된 값을 조회합니다. 보안을 위해 상세 값은 마스킹됩니다."
        title="환경 변수 관리"
      />

      <AdminDataTable
        columns={columns}
        emptyMessage="로드된 환경 변수 키 정보가 없습니다."
        errorMessage={pageError}
        isEmpty={envs.length === 0}
        isLoading={isLoading}
        onRetry={refetch}
      >
        {envs.map((env) => (
          <AdminTableRow key={env.key}>
            {/* Key 명칭 */}
            <AdminTableCell className="font-bold text-[#1A1714] text-sm">
              <code className="text-sm font-semibold font-mono tracking-tight">
                {env.key}
              </code>
            </AdminTableCell>

            {/* 설명 */}
            <AdminTableCell className="text-xs text-[#6B6560] leading-relaxed">
              {env.description}
            </AdminTableCell>

            {/* 마스킹된 설정 값 */}
            <AdminTableCell>
              {env.is_configured ? (
                <code className="rounded bg-[#FDFCFA] border border-[#E8E4DC] px-2 py-0.5 text-xs text-[#3A3530] font-mono break-all font-medium select-all">
                  {env.value}
                </code>
              ) : (
                <span className="text-xs text-red-400 font-medium italic">
                  {env.value}
                </span>
              )}
            </AdminTableCell>

            {/* 상태 배지 */}
            <AdminTableCell>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border leading-5",
                  env.is_configured
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200",
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 size-1.5 rounded-full",
                    env.is_configured ? "bg-emerald-500" : "bg-red-500",
                  )}
                />
                {env.is_configured ? "로드 성공" : "로드 누락"}
              </span>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminDataTable>
    </>
  );
}
