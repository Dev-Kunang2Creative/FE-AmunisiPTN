"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import ActionButton from "@/components/molecules/datatable/ActionButton";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { TryoutProofItem } from "@/http/tryout/get-tryout-proof-images";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface DataProofsProps {
  viewDetailHandler: (data: TryoutProofItem) => void;
}

export const proofsColumns: (
  props: DataProofsProps,
) => ColumnDef<TryoutProofItem>[] = (props) => {
  return [
    {
      id: "index",
      header: "No",
      cell: ({ row }) => <p suppressHydrationWarning>{row.index + 1}</p>,
    },
    {
      id: "name",
      header: "Nama",
      cell: ({ row }) => (
        <p suppressHydrationWarning>{row.original.user?.name ?? "-"}</p>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: ({ row }) => (
        <p suppressHydrationWarning>{row.original.user?.email ?? "-"}</p>
      ),
    },
    {
      id: "tryout",
      header: "Tryout",
      cell: ({ row }) => (
        <p suppressHydrationWarning>{row.original.tryout?.title ?? "Tryout"}</p>
      ),
    },
    {
      id: "tryout",
      header: "Tanggal Daftar",
      cell: ({ row }) => (
        <p suppressHydrationWarning>
          {format(
            new Date(row.original.granted_at!),
            "EEEE, dd MMMM yyyy HH:mm:ss",
            {
              locale: id,
            },
          )}
        </p>
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
                onClick={() => props.viewDetailHandler(data)}
                className="flex cursor-pointer items-center"
              >
                <Eye className="h-4 w-4" />
                <span className="ml-2">Lihat Bukti</span>
              </div>
            </DropdownMenuItem>
          </ActionButton>
        );
      },
    },
  ];
};
