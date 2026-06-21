"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  GetAuditLogsForExportHandler,
  useGetAuditLogs,
} from "@/http/audit/get-audit-logs";
import {
  exportAdminRowsToExcel,
  exportAdminRowsToPdf,
  type AdminExportColumn,
} from "@/components/molecules/datatable/AdminDataControls";
import type { AuditLogEntry } from "@/http/audit/get-audit-logs";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { auditLogColumns } from "@/components/atoms/datacolumn/DataAuditLog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, X, Download } from "lucide-react";
import DashboardTitle from "@/components/atoms/typography/DashboardTitle";

const MODULES = ["Auth", "Tryout", "Subtest", "Question", "Order", "Package"];
const ACTIONS = [
  "login",
  "logout",
  "register",
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "cancel",
  "bulk_import",
];
const auditExportColumns: AdminExportColumn<AuditLogEntry>[] = [
  {
    header: "Waktu",
    accessor: (row) => new Date(row.created_at).toLocaleString("id-ID"),
  },
  { header: "Pengguna", accessor: (row) => row.user_name ?? "System" },
  { header: "Modul", accessor: (row) => row.module },
  { header: "Aksi", accessor: (row) => row.action },
  { header: "Deskripsi", accessor: (row) => row.description },
  { header: "IP Address", accessor: (row) => row.ip_address ?? "-" },
];

export default function AuditLogPage() {
  const { data: session } = useSession();
  const token = session?.access_token || "";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlPage = Number(searchParams.get("page") || 1);
  const [page, setPage] = useState(urlPage);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [date, setDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Sync state when browser back/forward buttons are used
  useEffect(() => {
    if (urlPage !== page) {
      setPage(urlPage);
    }
  }, [urlPage]);

  const updatePage = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data, isLoading } = useGetAuditLogs({
    token,
    page,
    search,
    module,
    action,
    date,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    updatePage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setModule("");
    setAction("");
    setDate("");
    updatePage(1);
  };

  const hasFilter = search || module || action || date;
  const exportRows = async () => {
    setIsExporting(true);
    try {
      return await GetAuditLogsForExportHandler({
        token,
        search,
        module,
        action,
        date,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="space-y-8 pb-8">
      <DashboardTitle title="Log Audit" />

      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <Input
            placeholder="Cari deskripsi atau pengguna..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 max-w-md"
          />
          <Button onClick={handleSearch} size="icon" variant="secondary">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Module */}
          <Select
            value={module || "all"}
            onValueChange={(v) => {
              setModule(v === "all" ? "" : v);
              updatePage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Modul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Modul</SelectItem>
              {MODULES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action */}
          <Select
            value={action || "all"}
            onValueChange={(v) => {
              setAction(v === "all" ? "" : v);
              updatePage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date */}
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              updatePage(1);
            }}
            className="w-40"
          />

          {hasFilter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              title="Hapus filter"
              className="text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={async () =>
              exportAdminRowsToExcel({
                rows: await exportRows(),
                columns: auditExportColumns,
                title: "laporan-audit-log",
              })
            }
          >
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={async () =>
              exportAdminRowsToPdf({
                rows: await exportRows(),
                columns: auditExportColumns,
                title: "laporan-audit-log",
                filterSummary: `Search: ${search || "-"}; Modul: ${module || "Semua"}; Aksi: ${action || "Semua"}; Tanggal: ${date || "Semua"}`,
              })
            }
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <DataTable
        columns={auditLogColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        disablePagination={true}
      />

      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(data.current_page - 1) * data.per_page + 1} –{" "}
            {Math.min(data.current_page * data.per_page, data.total)} dari{" "}
            {data.total} data
          </p>
          {data.last_page > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => updatePage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-2 text-sm text-muted-foreground">
                Page {data.current_page} of {data.last_page}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => updatePage(Math.min(data.last_page, page + 1))}
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
