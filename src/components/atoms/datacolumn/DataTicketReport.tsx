"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { TicketReport } from "@/http/ticket-reports/get-ticket-reports";
import ActionButton from "@/components/molecules/datatable/ActionButton";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Eye } from "lucide-react";

export const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  OPEN: {
    label: "Terbuka",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  IN_PROGRESS: {
    label: "Diproses",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  SOLVED: {
    label: "Selesai",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
};

export function TicketStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };

  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 border ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}

export const ticketReportAdminColumns: ColumnDef<TicketReport>[] = [
  {
    id: "id",
    header: "Kode",
    cell: ({ row }) => (
      <span className="uppercase">#{row.original.id.slice(0, 8)}</span>
    ),
  },
  {
    id: "user",
    header: "Pengguna",
    cell: ({ row }) => (
      <p className="truncate max-w-[150px]">{row.original.user?.name ?? "-"}</p>
    ),
  },
  {
    id: "title",
    header: "Judul",
    cell: ({ row }) => (
      <span className="truncate max-w-[200px] block" title={row.original.title}>
        {row.original.title}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
  },
  {
    id: "created_at",
    header: "Dibuat",
    cell: ({ row }) => (
      <span suppressHydrationWarning className="whitespace-nowrap">
        {format(new Date(row.original.created_at), "dd MMM yyyy HH:mm", {
          locale: idLocale,
        })}
      </span>
    ),
  },
  {
    id: "updated_at",
    header: "Diperbarui",
    cell: ({ row }) => (
      <span suppressHydrationWarning className="whitespace-nowrap">
        {format(new Date(row.original.updated_at), "dd MMM yyyy HH:mm", {
          locale: idLocale,
        })}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const data = row.original;

      return (
        <ActionButton>
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/admin/ticket-report/${data.id}`}
              className="flex items-center text-gray-700 hover:underline"
            >
              <Eye className="h-4 w-4 text-gray-700" />
              <span className="ml-2">Detail</span>
            </Link>
          </DropdownMenuItem>
        </ActionButton>
      );
    },
  },
];
