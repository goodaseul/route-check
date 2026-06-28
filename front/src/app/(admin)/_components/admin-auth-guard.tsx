"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fetchAdminApi } from "@/app/(admin)/_lib/admin-api";

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
