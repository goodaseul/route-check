"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import {
  AdminPagination,
  type AdminPageSize,
} from "@/app/(admin)/_components/admin-pagination";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableRow,
  type AdminTableColumn,
} from "@/app/(admin)/_components/admin-data-table";
import { AdminStatusBadge } from "@/app/(admin)/_components/admin-badge";
import { AdminApiError } from "@/app/(admin)/_lib/admin-api";
import {
  useAdminUsers,
  useUpdateUserStatus,
  useDeleteUser,
  type PublicUserItem,
} from "@/app/(admin)/_hooks/use-admin-users";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const columns: AdminTableColumn[] = [
  { key: "id", header: "ID", className: "w-16" },
  { key: "name", header: "이름", className: "w-32" },
  { key: "nickname", header: "닉네임", className: "w-36" },
  { key: "email", header: "이메일", className: "w-48" },
  { key: "auth_provider", header: "가입 플랫폼", className: "w-28" },
  { key: "is_active", header: "상태", className: "w-24" },
  { key: "created_at", header: "가입일", className: "w-32" },
];

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
});

function formatDate(value: string, includeTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return (includeTime ? dateTimeFormatter : dateFormatter).format(date);
}

export default function PublicUsersPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedUser, setSelectedUser] = useState<PublicUserItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [searchVal, setSearchVal] = useState(""); // Debounced/Triggered on submit
  const [authProvider, setAuthProvider] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(20);
  const [panelError, setPanelError] = useState("");

  const usersQuery = useAdminUsers({
    page,
    pageSize,
    authProvider: authProvider || undefined,
    isActive: isActiveFilter,
    search: searchVal || undefined,
  });

  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = usersQuery.data?.total_pages ?? 0;
  const isLoading = usersQuery.isPending;
  const isRefreshing = usersQuery.isFetching && !usersQuery.isPending;
  const isSaving = updateStatus.isPending;
  const isDeleting = deleteUser.isPending;
  const pageError = usersQuery.error?.message ?? "";

  useEffect(() => {
    if (usersQuery.error instanceof AdminApiError && usersQuery.error.status === 401) {
      router.replace("/admin/login");
    }
  }, [usersQuery.error, router]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearchVal(search);
  }

  function handleFilterProvider(val: string) {
    setPage(1);
    setAuthProvider(val);
  }

  function handleFilterActive(val: string) {
    setPage(1);
    if (val === "true") setIsActiveFilter(true);
    else if (val === "false") setIsActiveFilter(false);
    else setIsActiveFilter(null);
  }

  function openEditPanel(user: PublicUserItem) {
    setSelectedUser(user);
    setPanelError("");
    setPanelOpen(true);
  }

  function closePanel() {
    if (isSaving || isDeleting) return;
    setPanelOpen(false);
    setSelectedUser(null);
    setPanelError("");
  }

  function reloadUsers() {
    void usersQuery.refetch();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(event.currentTarget);
    const is_active = formData.get("is_active") === "on";

    setPanelError("");
    try {
      await updateStatus.mutateAsync({ id: selectedUser.id, is_active });
      closePanel();
    } catch (error) {
      setPanelError(errorMessage(error, "상태 수정에 실패했습니다."));
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;

    setPanelError("");
    try {
      await deleteUser.mutateAsync(selectedUser.id);
      if (users.length === 1 && page > 1) setPage((current) => current - 1);
      closePanel();
    } catch (error) {
      setPanelError(errorMessage(error, "사용자 삭제에 실패했습니다."));
    }
  }

  return (
    <>
      <AdminPageHeader
        description="구글 및 네이버 소셜 로그인으로 가입한 사용자 계정을 관리합니다."
        title="사용자 관리"
      />

      {/* 필터 영역 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative flex w-full max-w-md items-center" onSubmit={handleSearchSubmit}>
          <input
            className="h-10 w-full rounded-lg border border-[#E8E4DC] bg-white pl-10 pr-4 text-sm text-[#1A1714] placeholder-[#8A847C] outline-none transition-all focus:border-[#374151]"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 닉네임, 이메일로 검색"
            type="text"
            value={search}
          />
          <Search className="absolute left-3.5 size-4 text-[#8A847C]" />
          <button className="hidden" type="submit" />
        </form>

        <div className="flex items-center gap-3">
          {/* 가입 수단 필터 */}
          <select
            className="h-10 rounded-lg border border-[#E8E4DC] bg-white px-3 text-sm text-[#1A1714] outline-none transition-all focus:border-[#374151]"
            onChange={(e) => handleFilterProvider(e.target.value)}
            value={authProvider}
          >
            <option value="">모든 가입 수단</option>
            <option value="google">Google</option>
            <option value="naver">Naver</option>
          </select>

          {/* 활성화 상태 필터 */}
          <select
            className="h-10 rounded-lg border border-[#E8E4DC] bg-white px-3 text-sm text-[#1A1714] outline-none transition-all focus:border-[#374151]"
            onChange={(e) => handleFilterActive(e.target.value)}
            value={isActiveFilter === null ? "" : String(isActiveFilter)}
          >
            <option value="">모든 상태</option>
            <option value="true">활성</option>
            <option value="false">정지</option>
          </select>
        </div>
      </div>

      <AdminPagination
        disabled={isLoading}
        isRefreshing={isRefreshing}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPage(1);
          setPageSize(value);
        }}
        onRefresh={reloadUsers}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />

      {/* 사용자 데이터 테이블 */}
      <AdminDataTable
        columns={columns}
        emptyMessage="가입된 사용자가 없습니다."
        errorMessage={pageError}
        isEmpty={users.length === 0}
        isLoading={isLoading}
        loadingMessage="사용자 목록을 불러오고 있습니다."
        onRetry={reloadUsers}
      >
        {users.map((user) => (
          <AdminTableRow key={user.id} onClick={() => openEditPanel(user)}>
            <AdminTableCell className="text-[#8A847C]">{user.id}</AdminTableCell>
            <AdminTableCell className="max-w-32 truncate font-medium text-[#1A1714]">
              {user.name || "—"}
            </AdminTableCell>
            <AdminTableCell className="max-w-36 truncate text-[#1A1714]">
              {user.nickname || "—"}
            </AdminTableCell>
            <AdminTableCell className="max-w-48 truncate text-[#8A847C]">
              {user.email || "—"}
            </AdminTableCell>
            <AdminTableCell>
              {user.auth_provider === "google" ? (
                <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  Google
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Naver
                </span>
              )}
            </AdminTableCell>
            <AdminTableCell>
              <AdminStatusBadge isActive={user.is_active} />
            </AdminTableCell>
            <AdminTableCell className="text-[#8A847C]">
              {formatDate(user.created_at)}
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminDataTable>

      {/* 정보 수정 & 정지 패널 */}
      <AdminSlidePanel
        description="사용자 계정 상태를 정지하거나 삭제할 수 있습니다."
        footer={
          panelOpen ? (
            <AdminPanelFooter
              deleteConfirmMessage="이 사용자 계정을 정말 삭제(소프트 삭제)하시겠습니까?"
              isDeleting={isDeleting}
              isSaving={isSaving}
              mode="edit"
              onCancel={closePanel}
              onDelete={handleDelete}
              onSave={() => formRef.current?.requestSubmit()}
            />
          ) : null
        }
        onClose={closePanel}
        open={panelOpen}
        title="사용자 정보 상세"
      >
        {selectedUser ? (
          <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* 프로필 이미지 */}
              {selectedUser.profile_image && (
                <div className="flex items-center justify-center py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Profile"
                    className="size-20 rounded-full border border-[#E8E4DC] object-cover"
                    src={selectedUser.profile_image}
                  />
                </div>
              )}

              {/* 기본 정보 목록 */}
              <div className="rounded-lg border border-[#E8E4DC] bg-[#F9FAFB] p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#8A847C]">고유 ID</span>
                  <span className="font-semibold text-[#1A1714]">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#8A847C]">이름</span>
                  <span className="font-semibold text-[#1A1714]">{selectedUser.name || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#8A847C]">닉네임</span>
                  <span className="font-semibold text-[#1A1714]">{selectedUser.nickname || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#8A847C]">이메일</span>
                  <span className="font-semibold text-[#1A1714]">{selectedUser.email || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#8A847C]">소셜 가입 수단</span>
                  <span className="font-semibold capitalize text-[#1A1714]">
                    {selectedUser.auth_provider}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#8A847C]">소셜 가입 고유 ID</span>
                  <span className="font-mono text-xs text-[#8A847C] truncate max-w-[200px]">
                    {selectedUser.provider_user_id}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#8A847C]">최초 가입일</span>
                  <span className="text-[#1A1714]">
                    {formatDate(selectedUser.created_at, true)}
                  </span>
                </div>
              </div>

              {/* 활성/정지 토글 스위치 */}
              <div className="flex items-center justify-between rounded-lg border border-[#E8E4DC] bg-white p-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#1A1714]">계정 활성화 상태</h4>
                  <p className="text-xs text-[#8A847C] mt-1">
                    정지 처리 시 사용자는 앱에 로그인할 수 없게 됩니다.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    defaultChecked={selectedUser.is_active}
                    name="is_active"
                    type="checkbox"
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-[#E8E4DC] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-[#E8E4DC] after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#374151] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>
            </div>

            {panelError ? (
              <p
                aria-live="polite"
                className="rounded-lg border border-[#E6C9C5] bg-[#FDF6F5] px-4 py-3 text-sm text-[#9A3F38]"
                role="alert"
              >
                {panelError}
              </p>
            ) : null}
          </form>
        ) : null}
      </AdminSlidePanel>
    </>
  );
}
