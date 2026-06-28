"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Trash2, Ticket, TicketPlus, TicketMinus, Eye } from "lucide-react";
import ActionButton from "@/components/molecules/datatable/ActionButton";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/types/user/user";
import Link from "next/link";

interface DataUserProps {
  deleteUserHandler: (data: User) => void;
  setSelectedUser: (user: User) => void;
  setSingleMode: (mode: "inject" | "pull") => void;
  setIsSingleModalOpen: (open: boolean) => void;
}

export const userColumns: (props: DataUserProps) => ColumnDef<User>[] = (
  props,
) => [
  {
    id: "index",
    header: "No",
    cell: ({ row }) => <p suppressHydrationWarning>{row.index + 1}</p>,
  },
  {
    id: "name",
    header: "Nama",
    cell: ({ row }) => <p suppressHydrationWarning>{row.original.name}</p>,
  },
  {
    id: "email",
    header: "Email",
    cell: ({ row }) => <p suppressHydrationWarning>{row.original.email}</p>,
  },
  {
    id: "role",
    header: "Role",
    cell: ({ row }) => {
      const isAdmin = row.original.role === "admin";
      return (
        <Badge
          className={
            isAdmin
              ? "bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs uppercase"
              : "bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs uppercase"
          }
        >
          {isAdmin ? "Admin" : "Siswa"}
        </Badge>
      );
    },
  },
  {
    id: "ticket_balance",
    header: "Tiket",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Ticket className="w-4 h-4" />
        <span suppressHydrationWarning>{row.original.ticket_balance ?? 0}</span>
      </div>
    ),
  },
  {
    id: "phone_number",
    header: "No. HP",
    cell: ({ row }) => (
      <p suppressHydrationWarning>{row.original.phone_number || "-"}</p>
    ),
  },
  {
    id: "school_origin",
    header: "Asal Sekolah",
    cell: ({ row }) => (
      <p suppressHydrationWarning>{row.original.school_origin || "-"}</p>
    ),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const data = row.original;
      if (data.role === "admin") return null;
      return (
        <ActionButton>
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/admin/users/${data.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              <span>Lihat Detail</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              props.setSelectedUser(data);
              props.setSingleMode("inject");
              props.setIsSingleModalOpen(true);
            }}
          >
            <TicketPlus className="mr-2 h-4 w-4" />
            <span>Inject Tiket</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              props.setSelectedUser(data);
              props.setSingleMode("pull");
              props.setIsSingleModalOpen(true);
            }}
          >
            <TicketMinus className="mr-2 h-4 w-4" />
            <span>Tarik Tiket</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <div
              onClick={() => props.deleteUserHandler(data)}
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
