import {
  Database,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "AI 생성 파이프라인",
    items: [
      { title: "RAG 자료 관리", href: "/admin/rag", icon: Database },
    ],
  },
  {
    label: "사용자 및 어드민",
    items: [
      { title: "사용자 관리", href: "/admin/users", icon: Users },
      { title: "어드민 관리", href: "/admin/admins", icon: UserCog },
    ],
  },
];

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

