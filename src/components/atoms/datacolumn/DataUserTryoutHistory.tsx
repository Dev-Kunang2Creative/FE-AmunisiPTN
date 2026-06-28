"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { AdminUserTryoutHistory } from "@/http/tryout/get-admin-user-tryouts";

export const userTryoutStatusColors: Record<string, string> = {
  Selesai: "bg-green-100 text-green-800",
  "Sedang Dikerjakan": "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
  Ongoing: "bg-yellow-100 text-yellow-800",
  Abandoned: "bg-red-100 text-red-800",
};

export const userTryoutHistoryColumns: ColumnDef<AdminUserTryoutHistory>[] = [
  {
    accessorKey: "title",
    header: "Nama Tryout",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 max-w-[200px]">
        <span className="font-medium truncate" title={row.original.title}>
          {row.original.title}
        </span>
        {row.original.category && (
          <span className="text-xs text-muted-foreground truncate" title={row.original.category}>
            {row.original.category}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "score",
    header: "Skor",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.score ?? "-"}</span>
    ),
  },
  {
    accessorKey: "rank",
    header: "Peringkat",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.rank ? `#${row.original.rank}` : "-"}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || "Ongoing";
      return (
        <Badge
          className={
            userTryoutStatusColors[status] || "bg-gray-100 text-gray-800"
          }
          variant="outline"
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "submitted_at",
    header: "Disubmit Pada",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {row.original.submitted_at ? new Date(row.original.submitted_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) : "-"}
      </span>
    ),
  },
];
