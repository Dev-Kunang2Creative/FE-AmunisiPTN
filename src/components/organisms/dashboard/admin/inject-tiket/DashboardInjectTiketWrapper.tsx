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
import { Ticket, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect } from "react";
import { useGetVipUsers } from "@/http/users/get-vip-users";
import { useInjectVipTickets } from "@/http/users/inject-vip-tickets";
import {
  useGetUserTicketLogs,
} from "@/http/users/get-user-ticket-logs";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { User } from "@/types/user/user";
import {
  ticketLogColumns,
  vipUserColumns,
} from "@/components/atoms/datacolumn/DataInjectTiket";
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

export default function DashboardInjectTiketWrapper() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const token = session?.access_token || "";

  // Table State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

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
    search: debouncedSearch,
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

  const { data: historyData, isPending: isHistoryPending } =
    useGetUserTicketLogs({
      userId: selectedUser?.id || "",
      page: historyPage,
      perPage: historyPerPage,
      token,
      options: { enabled: !!selectedUser && isHistoryModalOpen },
    });



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
          <div className="flex flex-1 items-center gap-2 relative">
            <Input
              placeholder="Cari nama atau email..."
              className="max-w-xs pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

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
          columns={vipUserColumns({
            page,
            perPage,
            setSelectedUser,
            setHistoryPage,
            setIsHistoryModalOpen,
            setSingleMode,
            setIsSingleModalOpen,
          })}
          data={userRows}
          isLoading={isPending}
          serverSidePagination={true}
          serverPageCount={data?.last_page ?? 1}
          serverTotalData={data?.total ?? 0}
          serverPageIndex={page - 1}
          serverPageSize={perPage}
          onServerPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
          onServerPageSizeChange={(newSize) => {
            setPerPage(newSize);
            setPage(1);
          }}
        />
      </div>

      {/* Modal Bulk Input Form */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Formulir Eksekusi{" "}
              {bulkMode === "inject" ? "Injeksi" : "Penarikan"} Tiket Massal
            </DialogTitle>
            <DialogDescription>
              Anda akan {bulkMode === "inject" ? "memberikan" : "menarik"} tiket{" "}
              {bulkMode === "inject" ? "kepada" : "dari"} total{" "}
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
                Pesan log akan menggunakan nama pengirim &quot;Sistem AmunisiPTN&quot;.
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
            <AlertDialogTitle>
              Konfirmasi Akhir {bulkMode === "inject" ? "Injeksi" : "Penarikan"}{" "}
              Massal
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Anda akan {bulkMode === "inject" ? "memberikan" : "menarik"}{" "}
                <strong>{amount} tiket</strong>{" "}
                {bulkMode === "inject" ? "gratis " : ""}
                dengan pesan: <span className="italic">&quot;{description}&quot;</span>.
              </p>
              <p>
                Total Penerima: <strong>{data?.total || 0} pengguna</strong>.
              </p>
              <p className="text-red-600 dark:text-red-400 font-semibold mt-2">
                Peringatan: Tindakan ini tidak dapat dibatalkan.{" "}
                {bulkMode === "inject"
                  ? "Tiket yang masuk ke saldo pengguna tidak bisa ditarik massal secara otomatis."
                  : "Jika saldo pengguna kurang dari jumlah tarik, maka saldo akan dikosongkan (menjadi 0)."}
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
            <DialogTitle>
              {singleMode === "inject"
                ? "Beri Tiket Spesial"
                : "Tarik Tiket Pengguna"}
            </DialogTitle>
            <DialogDescription>
              {singleMode === "inject"
                ? "Berikan tiket tambahan khusus untuk"
                : "Tarik tiket dari saldo"}{" "}
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
                Pesan log akan menggunakan nama pengirim &quot;Sistem AmunisiPTN&quot;.
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
            <AlertDialogTitle>
              Konfirmasi {singleMode === "inject" ? "Pemberian" : "Penarikan"}{" "}
              Tiket
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {singleMode === "inject" ? "Berikan" : "Tarik"}{" "}
                <strong>{singleAmount} tiket</strong>{" "}
                {singleMode === "inject" ? "kepada" : "dari"}{" "}
                <strong>{selectedUser?.name}</strong> dengan pesan:{" "}
                <span className="italic">&quot;{singleDescription}&quot;</span>?
              </p>
              {singleMode === "pull" && (
                <p className="text-red-600 dark:text-red-400 font-semibold mt-2">
                  Jika saldo saat ini kurang dari {singleAmount}, maka saldo
                  akan ditarik seluruhnya hingga 0.
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
              className={
                singleMode === "pull"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary"
              }
            >
              {injectMutation.isPending
                ? "Mengeksekusi..."
                : singleMode === "pull"
                  ? "Tarik Tiket"
                  : "Berikan Tiket"}
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
              columns={ticketLogColumns({ historyPage, historyPerPage })}
              data={historyData?.data || []}
              isLoading={isHistoryPending}
              serverSidePagination={true}
              serverPageCount={historyData?.last_page ?? 1}
              serverTotalData={historyData?.total ?? 0}
              serverPageIndex={historyPage - 1}
              serverPageSize={historyPerPage}
              onServerPageChange={(newPageIndex) =>
                setHistoryPage(newPageIndex + 1)
              }
              onServerPageSizeChange={(newSize) => {
                setHistoryPerPage(newSize);
                setHistoryPage(1);
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsHistoryModalOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
