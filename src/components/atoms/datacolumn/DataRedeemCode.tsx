"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import ActionButton from "@/components/molecules/datatable/ActionButton";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { TicketRedeemCode } from "@/http/ticket-redeem-codes/ticket-redeem-codes";

interface DataRedeemCodeProps {
  editHandler: (data: TicketRedeemCode) => void;
  deleteHandler: (id: string) => void;
}

export const redeemCodeColumns: (
  props: DataRedeemCodeProps,
) => ColumnDef<TicketRedeemCode>[] = (props) => [
  {
    id: "code",
    header: "Kode",
    cell: ({ row }) => (
      <span suppressHydrationWarning>{row.original.code}</span>
    ),
  },
  {
    id: "ticket_amount",
    header: "Tiket",
    cell: ({ row }) => (
      <span suppressHydrationWarning>{row.original.ticket_amount}</span>
    ),
  },
  {
    id: "quota",
    header: "Kuota",
    cell: ({ row }) => (
      <span suppressHydrationWarning>{row.original.quota}</span>
    ),
  },
  {
    id: "used_count",
    header: "Terpakai",
    cell: ({ row }) => (
      <span suppressHydrationWarning>{row.original.used_count}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
          row.original.is_active
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {row.original.is_active ? "Aktif" : "Nonaktif"}
      </span>
    ),
  },
  {
    id: "expired_at",
    header: "Expired",
    cell: ({ row }) => (
      <span className="text-gray-600" suppressHydrationWarning>
        {row.original.expired_at
          ? new Date(row.original.expired_at).toLocaleDateString("id-ID")
          : "-"}
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
            <div
              onClick={() => props.editHandler(data)}
              className="flex cursor-pointer items-center hover:underline"
            >
              <Edit className="h-4 w-4 text-blue-700 hover:text-blue-900" />
              <span className="ml-2 text-blue-700 hover:text-blue-900">
                Edit
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <div
              onClick={() => props.deleteHandler(data.id)}
              className="flex cursor-pointer items-center text-red-700 hover:underline hover:text-red-900"
            >
              <Trash2 className="h-4 w-4 text-red-700 hover:text-red-900" />
              <span className="ml-2">Hapus</span>
            </div>
          </DropdownMenuItem>
        </ActionButton>
      );
    },
  },
];
