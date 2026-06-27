"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useAdminGetTicketReports } from "@/http/ticket-reports/admin-get-ticket-reports";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  STATUS_CONFIG,
  ticketReportAdminColumns,
} from "@/components/atoms/datacolumn/DataTicketReport";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import DashboardTitle from "@/components/atoms/typography/DashboardTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  return (
    <main className="space-y-6 pb-8">
      <DashboardTitle title="Laporan Masalah" />
      <Tabs
        value={activeTabLabel}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="h-10">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="px-4">
              {tab === "Semua" ? "Semua" : (STATUS_CONFIG[tab]?.label ?? tab)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
        columns={ticketReportAdminColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        serverSidePagination={true}
        serverPageCount={data?.last_page ?? 1}
        serverTotalData={data?.total ?? 0}
        serverPageIndex={page - 1}
        serverPageSize={data?.per_page ?? 15}
        onServerPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
      />
    </main>
  );
}
