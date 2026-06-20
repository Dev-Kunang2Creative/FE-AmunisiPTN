"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Ticket, Gift } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetVipUsers } from "@/http/users/get-vip-users";
import { useInjectVipTickets } from "@/http/users/inject-vip-tickets";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/types/user/user";
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
  const [filterType, setFilterType] = useState<"all_vip" | "date_range">("all_vip");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Bulk Inject Form State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [description, setDescription] = useState("Kompensasi Kendala Teknis");
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  // Single Inject Form State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [singleAmount, setSingleAmount] = useState(1);
  const [singleDescription, setSingleDescription] = useState("Kompensasi Khusus");
  const [isSingleConfirmOpen, setIsSingleConfirmOpen] = useState(false);

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

  const vipUserColumns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Nama",
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
      accessorKey: "created_at",
      header: "Tanggal Daftar",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("id-ID"),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Button
          size="sm"
          onClick={() => {
            setSelectedUser(row.original);
            setIsSingleModalOpen(true);
          }}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
        >
          Inject
        </Button>
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

  const handleBulkInjectClick = () => {
    if (filterType === "date_range" && (!startDate || !endDate)) {
      toast.error("Silakan lengkapi filter tanggal terlebih dahulu untuk preview tabel.");
      return;
    }
    setIsBulkModalOpen(true);
  };

  const handleBulkExecute = () => {
    injectMutation.mutate({
      amount,
      description,
      filter_type: filterType,
      start_date: filterType === "date_range" ? startDate : undefined,
      end_date: filterType === "date_range" ? endDate : undefined,
    });
  };

  const handleSingleExecute = () => {
    if (!selectedUser) return;
    injectMutation.mutate({
      amount: singleAmount,
      description: singleDescription,
      filter_type: "single_user",
      user_id: selectedUser.id,
    });
  };

  return (
    <section>
      <Card>
        <CardContent>
          <div className="space-y-6 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
                <Input
                  placeholder="Cari nama atau email..."
                  className="max-w-xs"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <Button type="submit" variant="outline">Cari</Button>
              </form>

              <div className="flex flex-col md:flex-row items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border">
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

              <Button onClick={handleBulkInjectClick} className="gap-2 shrink-0 bg-primary">
                <Ticket className="w-4 h-4" />
                Inject Tiket Massal
              </Button>
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
                      onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}
                    >
                      <SelectTrigger className="h-7 w-16 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs">per baris</span>
                  </div>
                </div>
                {data.last_page > 1 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 min-w-20 text-center">
                      {data.current_page} / {data.last_page}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.last_page, p + 1))} disabled={page === data.last_page}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Bulk Input Form */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formulir Eksekusi Injeksi Tiket Massal</DialogTitle>
            <DialogDescription>
              Anda akan memberikan tiket kepada total <strong>{data?.total || 0} pengguna VIP</strong> yang tampil di tabel (sesuai filter).
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
              <p className="text-xs text-gray-500">Pesan log akan menggunakan nama pengirim "Sistem AmunisiPTN".</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>Batal</Button>
            <Button onClick={() => { setIsBulkModalOpen(false); setIsBulkConfirmOpen(true); }}>
              Lanjut Eksekusi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Bulk Confirmation */}
      <AlertDialog open={isBulkConfirmOpen} onOpenChange={setIsBulkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Akhir Injeksi Massal</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Anda akan memberikan <strong>{amount} tiket</strong> gratis dengan pesan:{" "}
                <span className="italic">"{description}"</span>.
              </p>
              <p>
                Total Penerima: <strong>{data?.total || 0} pengguna</strong>.
              </p>
              <p className="text-red-600 dark:text-red-400 font-semibold mt-2">
                Peringatan: Tindakan ini tidak dapat dibatalkan. Tiket yang masuk ke saldo pengguna tidak bisa ditarik massal secara otomatis.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={injectMutation.isPending}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkExecute();
              }}
              disabled={injectMutation.isPending}
              className="bg-primary"
            >
              {injectMutation.isPending ? "Sedang Mengeksekusi..." : "Ya, Injeksi Massal!"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Single Input Form */}
      <Dialog open={isSingleModalOpen} onOpenChange={setIsSingleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beri Tiket Spesial</DialogTitle>
            <DialogDescription>
              Berikan tiket tambahan khusus untuk <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
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
              <p className="text-xs text-gray-500">Pesan log akan menggunakan nama pengirim "Sistem AmunisiPTN".</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSingleModalOpen(false)}>Batal</Button>
            <Button onClick={() => { setIsSingleModalOpen(false); setIsSingleConfirmOpen(true); }}>
              Lanjut Eksekusi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Single Confirmation */}
      <AlertDialog open={isSingleConfirmOpen} onOpenChange={setIsSingleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pemberian Tiket</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Berikan <strong>{singleAmount} tiket</strong> kepada <strong>{selectedUser?.name}</strong> dengan pesan:{" "}
                <span className="italic">"{singleDescription}"</span>?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={injectMutation.isPending}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSingleExecute();
              }}
              disabled={injectMutation.isPending}
              className="bg-primary"
            >
              {injectMutation.isPending ? "Mengeksekusi..." : "Berikan Tiket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
