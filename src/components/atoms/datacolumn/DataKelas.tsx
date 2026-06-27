"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import type { Kelas } from "@/types/kelas/kelas";

interface DataKelasProps {
  deleteHandler: (id: string) => void;
}

export const kelasColumns: (props: DataKelasProps) => ColumnDef<Kelas>[] = (
  props,
) => [
  {
    id: "name",
    header: "Nama",
    cell: ({ row }) => (
      <p className="max-w-50 truncate" suppressHydrationWarning>
        {row.original.name}
      </p>
    ),
  },
  {
    id: "price",
    header: "Harga",
    cell: ({ row }) => {
      const price = row.original.price;
      return (
        <p suppressHydrationWarning>
          {price === 0 ? "Gratis" : `Rp${price.toLocaleString("id-ID")}`}
        </p>
      );
    },
  },
  {
    id: "discount_price",
    header: "Diskon",
    cell: ({ row }) => {
      const discount = row.original.discount_price;
      return (
        <p suppressHydrationWarning>
          {discount != null ? `Rp${discount.toLocaleString("id-ID")}` : "-"}
        </p>
      );
    },
  },
  {
    id: "ticket_amount",
    header: "Tiket Bonus",
    cell: ({ row }) => {
      const ticket = row.original.ticket_amount;
      return <p suppressHydrationWarning>{ticket > 0 ? ticket : "-"}</p>;
    },
  },
  {
    id: "enrollments_count",
    header: "Peserta",
    cell: ({ row }) => (
      <p suppressHydrationWarning>{row.original.enrollments_count ?? 0}</p>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {isActive ? "Aktif" : "Nonaktif"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const data = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/dashboard/admin/kelas/${data.id}/edit`}
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            onClick={() => props.deleteHandler(data.id)}
            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    },
  },
];
