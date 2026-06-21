"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { AuditLogEntry } from "@/http/audit/get-audit-logs";

const MODULE_COLORS: Record<string, string> = {
  Auth: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Tryout: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Subtest: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  Question: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Order: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Package: "bg-pink-500/10 text-pink-600 border-pink-500/20",
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  update: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  delete: "bg-red-500/10 text-red-600 border-red-500/20",
  login: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  logout: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  register: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  approve: "bg-green-500/10 text-green-600 border-green-500/20",
  reject: "bg-red-500/10 text-red-600 border-red-500/20",
  cancel: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  bulk_import: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export const auditLogColumns: ColumnDef<AuditLogEntry>[] = [
  {
    id: "created_at",
    header: "Waktu",
    cell: ({ row }) => (
      <span suppressHydrationWarning className="whitespace-nowrap">
        {format(new Date(row.original.created_at), "dd MMM yyyy HH:mm:ss", {
          locale: idLocale,
        })}
      </span>
    ),
  },
  {
    id: "user_name",
    header: "Pengguna",
    cell: ({ row }) => (
      <span
        className="truncate max-w-32 block"
        title={row.original.user_name ?? "-"}
      >
        {row.original.user_name ?? (
          <span className="text-muted-foreground/60 italic font-medium">
            System
          </span>
        )}
      </span>
    ),
  },
  {
    id: "module",
    header: "Modul",
    cell: ({ row }) => (
      <Badge
        className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 border ${
          MODULE_COLORS[row.original.module] ??
          "bg-slate-500/10 text-slate-600 border-slate-500/20"
        }`}
        variant="outline"
      >
        {row.original.module}
      </Badge>
    ),
  },
  {
    id: "action",
    header: "Aksi",
    cell: ({ row }) => (
      <Badge
        className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 border ${
          ACTION_COLORS[row.original.action] ??
          "bg-slate-500/10 text-slate-600 border-slate-500/20"
        }`}
        variant="outline"
      >
        {row.original.action}
      </Badge>
    ),
  },
  {
    id: "description",
    header: "Deskripsi",
    cell: ({ row }) => (
      <span suppressHydrationWarning className="leading-relaxed">
        {row.original.description}
      </span>
    ),
  },
  {
    id: "ip_address",
    header: "IP Address",
    cell: ({ row }) => (
      <span suppressHydrationWarning className="font-mono text-right block">
        {row.original.ip_address ?? "-"}
      </span>
    ),
  },
];
