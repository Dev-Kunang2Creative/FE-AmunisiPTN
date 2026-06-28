"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import ActionButton from "@/components/molecules/datatable/ActionButton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TicketReport } from "@/http/ticket-reports/get-ticket-reports";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export const ticketReportStatusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  SOLVED: "bg-green-100 text-green-800",
};

export const ticketReportStatusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  SOLVED: "Solved",
};

export const userTicketReportColumns: ColumnDef<TicketReport>[] = [
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 max-w-[200px]">
        <span className="font-medium truncate" title={row.original.title}>
          {row.original.title}
        </span>
        <span className="text-xs text-muted-foreground truncate" title={row.original.id}>
          ID: {row.original.id}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || "OPEN";
      return (
        <Badge
          className={
            ticketReportStatusColors[status] || "bg-gray-100 text-gray-800"
          }
          variant="outline"
        >
          {ticketReportStatusLabels[status] || status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Dibuat Pada",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {new Date(row.original.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    ),
  },
  {
    accessorKey: "updated_at",
    header: "Terakhir Update",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {new Date(row.original.updated_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <ActionButton>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/admin/ticket-reports/${row.original.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Lihat Detail Tiket</span>
            </Link>
          </DropdownMenuItem>
        </ActionButton>
      );
    },
  },
];
