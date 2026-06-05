"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { GetAuditLogsForExportHandler, useGetAuditLogs } from "@/http/audit/get-audit-logs";
import {
  exportAdminRowsToExcel,
  exportAdminRowsToPdf,
  type AdminExportColumn,
} from "@/components/molecules/datatable/AdminDataControls";
import type { AuditLogEntry } from "@/http/audit/get-audit-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ChevronLeft, ChevronRight, Search, X, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const MODULE_COLORS: Record<string, string> = {
  Auth:     "bg-blue-100 text-blue-700",
  Tryout:   "bg-green-100 text-green-700",
  Subtest:  "bg-indigo-100 text-indigo-700",
  Question: "bg-orange-100 text-orange-700",
  Order:    "bg-yellow-100 text-yellow-700",
  Package:  "bg-pink-100 text-pink-700",
};

const ACTION_COLORS: Record<string, string> = {
  create:       "bg-emerald-100 text-emerald-700",
  update:       "bg-sky-100 text-sky-700",
  delete:       "bg-red-100 text-red-700",
  login:        "bg-violet-100 text-violet-700",
  logout:       "bg-gray-100 text-gray-600",
  register:     "bg-teal-100 text-teal-700",
  approve:      "bg-green-100 text-green-700",
  reject:       "bg-red-100 text-red-700",
  cancel:       "bg-orange-100 text-orange-700",
  bulk_import:  "bg-amber-100 text-amber-700",
};

const MODULES = ["Auth", "Tryout", "Subtest", "Question", "Order", "Package"];
const ACTIONS = ["login", "logout", "register", "create", "update", "delete", "approve", "reject", "cancel", "bulk_import"];
const auditExportColumns: AdminExportColumn<AuditLogEntry>[] = [
  { header: "Waktu", accessor: (row) => new Date(row.created_at).toLocaleString("id-ID") },
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

  const [page, setPage]       = useState(() => Number(searchParams.get("page") || 1));
  const [search, setSearch]   = useState("");
  const [module, setModule]   = useState("");
  const [action, setAction]   = useState("");
  const [date, setDate]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, pathname, router, searchParams]);

  const { data, isLoading } = useGetAuditLogs({
    token, page, search, module, action, date,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setSearchInput(""); setModule(""); setAction(""); setDate(""); setPage(1);
  };

  const hasFilter = search || module || action || date;
  const exportRows = async () => {
    setIsExporting(true);

    try {
      return await GetAuditLogsForExportHandler({ token, search, module, action, date });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Audit</h1>
          <p className="text-sm text-gray-500">Rekam jejak semua aktivitas sistem</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="flex gap-2 flex-1 min-w-50">
              <Input
                placeholder="Cari deskripsi atau pengguna..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Module */}
            <Select value={module || "all"} onValueChange={(v) => { setModule(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Modul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Modul</SelectItem>
                {MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Action */}
            <Select value={action || "all"} onValueChange={(v) => { setAction(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Date */}
            <Input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className="w-40"
            />

            {hasFilter && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Hapus filter">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap justify-end gap-2 border-b p-4">
            <Button
              type="button"
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
              disabled={isExporting}
              onClick={async () => exportAdminRowsToExcel({ rows: await exportRows(), columns: auditExportColumns, title: "laporan-audit-log" })}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              disabled={isExporting}
              onClick={async () => exportAdminRowsToPdf({ rows: await exportRows(), columns: auditExportColumns, title: "laporan-audit-log", filterSummary: `Search: ${search || "-"}; Modul: ${module || "Semua"}; Aksi: ${action || "Semua"}; Tanggal: ${date || "Semua"}` })}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">Memuat log...</div>
          ) : !data?.data.length ? (
            <div className="p-10 text-center text-gray-400">Tidak ada log ditemukan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-40">Waktu</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Pengguna</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Modul</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Aksi</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Deskripsi</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss", { locale: idLocale })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-700 text-xs truncate max-w-30 block" title={log.user_name ?? "-"}>
                          {log.user_name ?? <span className="text-gray-400 italic">System</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs font-medium ${MODULE_COLORS[log.module] ?? "bg-gray-100 text-gray-600"}`} variant="outline">
                          {log.module}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`} variant="outline">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{log.description}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ip_address ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Menampilkan {(data.current_page - 1) * data.per_page + 1}–{Math.min(data.current_page * data.per_page, data.total)} dari {data.total} data
              </p>
              {data.last_page > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    {data.current_page} / {data.last_page}
                  </span>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                    disabled={page === data.last_page}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
