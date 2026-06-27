"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminGetTicketReports } from "@/http/ticket-reports/admin-get-ticket-reports";
import {
  TicketStatusBadge,
  STATUS_CONFIG,
  ticketReportAdminColumns,
} from "@/components/atoms/datacolumn/DataTicketReport";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import DashboardTitle from "@/components/atoms/typography/DashboardTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TicketReport } from "@/http/ticket-reports/get-ticket-reports";
import { ColumnDef } from "@tanstack/react-table";

const STATUS_TABS = ["Semua", "OPEN", "IN_PROGRESS", "SOLVED"] as const;

export default function AdminTicketReportPage() {
  const { data: session } = useSession();
  const token = session?.access_token || "";
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminGetTicketReports({
    token,
    page,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handleTabChange = (tab: string) => {
    setStatusFilter(tab === "Semua" ? "" : tab);
    setPage(1);
  };

  const activeTabLabel = statusFilter || "Semua";

  const columnsWithAction: ColumnDef<TicketReport>[] = [
    ...ticketReportAdminColumns,
    {
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: TicketReport } }) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-[#004AAB] hover:text-[#004AAB] hover:bg-[#EBF4FF]"
          onClick={() =>
            router.push(`/dashboard/admin/ticket-report/${row.original.id}`)
          }
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <main className="space-y-6 pb-8">
      <DashboardTitle title="Ticket Report" />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeTabLabel === tab
                ? "bg-[#004AAB] text-white border-[#004AAB]"
                : "bg-white text-slate-600 border-slate-200 hover:border-[#004AAB] hover:text-[#004AAB]"
            }`}
          >
            {tab === "Semua" ? "Semua" : (STATUS_CONFIG[tab]?.label ?? tab)}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Cari berdasarkan judul..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button variant="secondary" onClick={handleSearch}>
          Cari
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columnsWithAction}
        data={data?.data ?? []}
        isLoading={isLoading}
        disablePagination={true}
      />

      {/* Server-side pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>
            Menampilkan {(data.current_page - 1) * data.per_page + 1}–
            {Math.min(data.current_page * data.per_page, data.total)} dari{" "}
            {data.total} ticket
          </p>
          {data.last_page > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2">
                {data.current_page} / {data.last_page}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
                disabled={page === data.last_page}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
