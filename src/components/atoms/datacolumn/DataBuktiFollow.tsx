"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import ActionButton from "@/components/molecules/datatable/ActionButton";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { UserTryoutAccess } from "@/types/tryout/tryout";

interface DataBuktiFollowProps {
  viewDetailHandler: (data: UserTryoutAccess) => void;
}

export const buktiFollowColumns: (
  props: DataBuktiFollowProps,
) => ColumnDef<UserTryoutAccess>[] = (props) => [
  {
    id: "index",
    header: "No",
    cell: ({ row }) => <p suppressHydrationWarning>{row.index + 1}</p>,
  },
  {
    id: "name",
    header: "Nama",
    cell: ({ row }) => (
      <p suppressHydrationWarning className="font-medium">
        {row.original.user?.name ?? "-"}
      </p>
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
    id: "proof_count",
    header: "Jumlah Gambar",
    cell: ({ row }) => (
      <p suppressHydrationWarning>
        {row.original.proof_image_urls?.length ?? 0} Gambar
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
              <span className="ml-2">Lihat Detail</span>
            </div>
          </DropdownMenuItem>
        </ActionButton>
      );
    },
  },
];
