"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Ticket, Gift, MoreHorizontal, History } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetVipUsers } from "@/http/users/get-vip-users";
import { useInjectVipTickets } from "@/http/users/inject-vip-tickets";
import { useGetUserTicketLogs, TicketLog } from "@/http/users/get-user-ticket-logs";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/types/user/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PAGE_SIZE_OPTIONS = [10, 20, 40, 100];

export default function DashboardInjectTiketWrapper() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const token = session?.access_token || "";

  // Table State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filter State
  const [filterType, setFilterType] = useState<"all_vip" | "date_range">(
    "all_vip",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Bulk Form State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<"inject" | "pull">("inject");
  const [amount, setAmount] = useState(1);
  const [description, setDescription] = useState("Kompensasi Kendala Teknis");
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  // Single Form State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [singleMode, setSingleMode] = useState<"inject" | "pull">("inject");
  const [singleAmount, setSingleAmount] = useState(1);
  const [singleDescription, setSingleDescription] =
    useState("Kompensasi Khusus");
  const [isSingleConfirmOpen, setIsSingleConfirmOpen] = useState(false);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);

  // Fetch VIP Users
  const { data, isPending } = useGetVipUsers({
    token,
    page,
    perPage,
    search,
    filter_type: filterType,
    start_date: startDate,
    end_date: endDate,
    options: { enabled: status === "authenticated" },
  });
  const userRows = data?.data ?? [];

  // Inject Mutation
  const injectMutation = useInjectVipTickets({
    token,
    options: {
      onSuccess: (res) => {
        toast.success(res.message);
        setIsBulkConfirmOpen(false);
        setIsBulkModalOpen(false);
        setIsSingleConfirmOpen(false);
        setIsSingleModalOpen(false);
        setSelectedUser(null);
        queryClient.invalidateQueries({ queryKey: ["get-vip-users"] });
      },
      onError: (err: any) => {
        toast.error("Gagal melakukan injeksi tiket", {
          description: err.response?.data?.message || err.message,
        });
        setIsBulkConfirmOpen(false);
        setIsSingleConfirmOpen(false);
      },
    },
  });

  const { data: historyData, isPending: isHistoryPending } = useGetUserTicketLogs({
    userId: selectedUser?.id || "",
    page: historyPage,
    perPage: historyPerPage,
    token,
    options: { enabled: !!selectedUser && isHistoryModalOpen },
  });

  const ticketLogColumns: ColumnDef<TicketLog>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => (historyPage - 1) * historyPerPage + row.index + 1,
    },
    {
      accessorKey: "created_at",
      header: "Tanggal",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString("id-ID"),
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => {
        const isCredit = row.original.type === "credit";
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isCredit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {isCredit ? "Masuk" : "Keluar"}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Jumlah",
      cell: ({ row }) => (
        <span className={row.original.type === "credit" ? "text-green-600" : "text-red-600"}>
          {row.original.type === "credit" ? "+" : "-"}{row.original.amount}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Keterangan",
    },
  ];

  const vipUserColumns: ColumnDef<User>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => (page - 1) * perPage + row.index + 1,
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
      cell: ({ row }) => <span className="text-green-600">+{row.original.total_tickets_in || 0}</span>,
    },
    {
      accessorKey: "total_tickets_out",
      header: "Keluar",
      cell: ({ row }) => <span className="text-red-600">-{row.original.total_tickets_out || 0}</span>,
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
            <Button variant="ghost" className="h-8 w-8 p-0">
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  const handleBulkActionClick = (mode: "inject" | "pull") => {
    if (filterType === "date_range" && (!startDate || !endDate)) {
      toast.error(
        "Silakan lengkapi filter tanggal terlebih dahulu untuk preview tabel.",
      );
      return;
    }
    setBulkMode(mode);
    setIsBulkModalOpen(true);
  };

  const handleBulkExecute = () => {
    injectMutation.mutate({
      amount,
      description,
      filter_type: filterType,
      start_date: filterType === "date_range" ? startDate : undefined,
      end_date: filterType === "date_range" ? endDate : undefined,
      action: bulkMode,
    });
  };

  const handleSingleExecute = () => {
    if (!selectedUser) return;
    injectMutation.mutate({
      amount: singleAmount,
      description: singleDescription,
      filter_type: "single_user",
      user_id: selectedUser.id,
      action: singleMode,
    });
  };

  return (
    <section>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-2"
          >
            <Input
              placeholder="Cari nama atau email..."
              className="max-w-xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="outline">
              Cari
            </Button>
          </form>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <Select
                value={filterType}
                onValueChange={(val: "all_vip" | "date_range") => {
                  setFilterType(val);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_vip">Semua VIP</SelectItem>
                  <SelectItem value="date_range">Tanggal Transaksi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "date_range" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="w-[140px]"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleFilterChange();
                  }}
                />
                <span>-</span>
                <Input
                  type="date"
                  className="w-[140px]"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    handleFilterChange();
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => handleBulkActionClick("inject")}
              className="gap-2 bg-primary"
            >
              <Ticket className="w-4 h-4" />
              Inject Tiket Massal
            </Button>
            <Button
              onClick={() => handleBulkActionClick("pull")}
              variant="destructive"
              className="gap-2"
            >
              <Ticket className="w-4 h-4" />
              Tarik Tiket Massal
            </Button>
          </div>
        </div>

        <DataTable
          columns={vipUserColumns}
          data={userRows}
          isLoading={isPending}
          disablePagination={true}
        />

        {data && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>
                {data.total > 0
                  ? `Menampilkan ${(page - 1) * perPage + 1}–${Math.min(page * perPage, data.total)} dari ${data.total} VIP`
                  : "Tidak ada data preview"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">Tampilkan</span>
                <Select
                  value={String(perPage)}
                  onValueChange={(v) => {
                    setPerPage(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs">per baris</span>
              </div>
            </div>
            {data.last_page > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-20 text-center">
                  {data.current_page} / {data.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(data.last_page, p + 1))
                  }
                  disabled={page === data.last_page}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Bulk Input Form */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formulir Eksekusi {bulkMode === "inject" ? "Injeksi" : "Penarikan"} Tiket Massal</DialogTitle>
            <DialogDescription>
              Anda akan {bulkMode === "inject" ? "memberikan" : "menarik"} tiket {bulkMode === "inject" ? "kepada" : "dari"} total{" "}
              <strong>{data?.total || 0} pengguna VIP</strong> yang tampil di
              tabel (sesuai filter).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Jumlah Tiket (Per User)</Label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Pesan Log Kompensasi</Label>
              <Input
                type="text"
                placeholder="Contoh: Bonus Akhir Tahun"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Pesan log akan menggunakan nama pengirim "Sistem AmunisiPTN".
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setIsBulkModalOpen(false);
                setIsBulkConfirmOpen(true);
              }}
            >
              Lanjut Eksekusi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Bulk Confirmation */}
      <AlertDialog open={isBulkConfirmOpen} onOpenChange={setIsBulkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Akhir {bulkMode === "inject" ? "Injeksi" : "Penarikan"} Massal</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Anda akan {bulkMode === "inject" ? "memberikan" : "menarik"} <strong>{amount} tiket</strong> {bulkMode === "inject" ? "gratis" : ""} 
                dengan pesan: <span className="italic">"{description}"</span>.
              </p>
              <p>
                Total Penerima: <strong>{data?.total || 0} pengguna</strong>.
              </p>
              <p className="text-red-600 dark:text-red-400 font-semibold mt-2">
                Peringatan: Tindakan ini tidak dapat dibatalkan. {bulkMode === "inject" ? "Tiket yang masuk ke saldo pengguna tidak bisa ditarik massal secara otomatis." : "Jika saldo pengguna kurang dari jumlah tarik, maka saldo akan dikosongkan (menjadi 0)."}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={injectMutation.isPending}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkExecute();
              }}
              disabled={injectMutation.isPending}
              className="bg-primary"
            >
              {injectMutation.isPending
                ? "Sedang Mengeksekusi..."
                : "Ya, Injeksi Massal!"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Single Input Form */}
      <Dialog open={isSingleModalOpen} onOpenChange={setIsSingleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{singleMode === "inject" ? "Beri Tiket Spesial" : "Tarik Tiket Pengguna"}</DialogTitle>
            <DialogDescription>
              {singleMode === "inject" ? "Berikan tiket tambahan khusus untuk" : "Tarik tiket dari saldo"}{" "}
              <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Jumlah Tiket</Label>
              <Input
                type="number"
                min={1}
                value={singleAmount}
                onChange={(e) => setSingleAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Pesan Log Khusus</Label>
              <Input
                type="text"
                placeholder="Contoh: Kompensasi Khusus"
                value={singleDescription}
                onChange={(e) => setSingleDescription(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Pesan log akan menggunakan nama pengirim "Sistem AmunisiPTN".
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSingleModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                setIsSingleModalOpen(false);
                setIsSingleConfirmOpen(true);
              }}
            >
              Lanjut Eksekusi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Single Confirmation */}
      <AlertDialog
        open={isSingleConfirmOpen}
        onOpenChange={setIsSingleConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi {singleMode === "inject" ? "Pemberian" : "Penarikan"} Tiket</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {singleMode === "inject" ? "Berikan" : "Tarik"} <strong>{singleAmount} tiket</strong> {singleMode === "inject" ? "kepada" : "dari"}{" "}
                <strong>{selectedUser?.name}</strong> dengan pesan:{" "}
                <span className="italic">"{singleDescription}"</span>?
              </p>
              {singleMode === "pull" && (
                <p className="text-red-600 dark:text-red-400 font-semibold mt-2">
                  Jika saldo saat ini kurang dari {singleAmount}, maka saldo akan ditarik seluruhnya hingga 0.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={injectMutation.isPending}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSingleExecute();
              }}
              disabled={injectMutation.isPending}
              className={singleMode === "pull" ? "bg-red-600 hover:bg-red-700" : "bg-primary"}
            >
              {injectMutation.isPending ? "Mengeksekusi..." : singleMode === "pull" ? "Tarik Tiket" : "Berikan Tiket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Riwayat Tiket */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Riwayat Tiket</DialogTitle>
            <DialogDescription>
              Log aktivitas tiket untuk <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto py-4">
            <DataTable
              columns={ticketLogColumns}
              data={historyData?.data || []}
              isLoading={isHistoryPending}
              disablePagination={true}
            />
            {historyData && (
              <div className="flex items-center justify-between gap-4 flex-wrap mt-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>
                    {historyData.total > 0
                      ? `Menampilkan ${(historyPage - 1) * historyPerPage + 1}–${Math.min(historyPage * historyPerPage, historyData.total)} dari ${historyData.total} log`
                      : "Tidak ada data riwayat"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">Tampilkan</span>
                    <Select
                      value={String(historyPerPage)}
                      onValueChange={(v) => {
                        setHistoryPerPage(Number(v));
                        setHistoryPage(1);
                      }}
                    >
                      <SelectTrigger className="h-7 w-16 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={String(s)} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs">per baris</span>
                  </div>
                </div>
                {historyData.last_page > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 min-w-20 text-center">
                      {historyData.current_page} / {historyData.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setHistoryPage((p) => Math.min(historyData.last_page, p + 1))
                      }
                      disabled={historyPage === historyData.last_page}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
