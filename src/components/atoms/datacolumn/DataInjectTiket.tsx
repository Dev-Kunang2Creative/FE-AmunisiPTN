"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/types/user/user";
import { TicketLog } from "@/http/users/get-user-ticket-logs";
import { Button } from "@/components/ui/button";
import { History, MoreHorizontal, Ticket } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TicketLogColumnsProps {
  historyPage: number;
  historyPerPage: number;
}

export const ticketLogColumns = ({
  historyPage,
  historyPerPage,
}: TicketLogColumnsProps): ColumnDef<TicketLog>[] => [
  {
    id: "no",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "created_at",
    header: "Tanggal",
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleString("id-ID"),
  },
  {
    accessorKey: "type",
    header: "Tipe",
    cell: ({ row }) => {
      const isCredit = row.original.type === "credit";
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isCredit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {isCredit ? "Masuk" : "Keluar"}
        </span>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Jumlah",
    cell: ({ row }) => (
      <span
        className={
          row.original.type === "credit" ? "text-green-600" : "text-red-600"
        }
      >
        {row.original.type === "credit" ? "+" : "-"}
        {row.original.amount}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Keterangan",
  },
];

interface VipUserColumnsProps {
  page: number;
  perPage: number;
  setSelectedUser: (user: User) => void;
  setHistoryPage: (page: number) => void;
  setIsHistoryModalOpen: (open: boolean) => void;
  setSingleMode: (mode: "inject" | "pull") => void;
  setIsSingleModalOpen: (open: boolean) => void;
}

export const vipUserColumns = ({
  page,
  perPage,
  setSelectedUser,
  setHistoryPage,
  setIsHistoryModalOpen,
  setSingleMode,
  setIsSingleModalOpen,
}: VipUserColumnsProps): ColumnDef<User>[] => [
  {
    id: "no",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Nama",
    cell: ({ row }) => <span>{row.original.name}</span>,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "ticket_balance",
    header: "Saldo Tiket",
  },
  {
    accessorKey: "total_tickets_in",
    header: "Masuk",
    cell: ({ row }) => (
      <span className="text-green-600">
        +{row.original.total_tickets_in || 0}
      </span>
    ),
  },
  {
    accessorKey: "total_tickets_out",
    header: "Keluar",
    cell: ({ row }) => (
      <span className="text-red-600">
        -{row.original.total_tickets_out || 0}
      </span>
    ),
  },
  {
    accessorKey: "last_transaction_date",
    header: "Transaksi Terakhir",
    cell: ({ row }) =>
      row.original.last_transaction_date
        ? new Date(row.original.last_transaction_date).toLocaleDateString(
            "id-ID",
          )
        : "-",
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-5 w-5 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(row.original);
              setHistoryPage(1);
              setIsHistoryModalOpen(true);
            }}
          >
            <History className="mr-2 h-4 w-4" />
            <span>Riwayat Tiket</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(row.original);
              setSingleMode("inject");
              setIsSingleModalOpen(true);
            }}
          >
            <Ticket className="mr-2 h-4 w-4 text-green-600" />
            <span>Inject Tiket</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(row.original);
              setSingleMode("pull");
              setIsSingleModalOpen(true);
            }}
          >
            <Ticket className="mr-2 h-4 w-4 text-red-600" />
            <span className="text-red-600">Tarik Tiket</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
