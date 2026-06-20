"use client";

import { useState } from "react";
import DashboardTitle from "@/components/atoms/typography/DashboardTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useInjectVipTickets } from "@/http/users/inject-vip-tickets";
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

export default function InjectTiketPage() {
  const { data: session } = useSession();
  const token = session?.access_token || "";

  const [filterType, setFilterType] = useState<"all_vip" | "date_range">("all_vip");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amount, setAmount] = useState(1);
  const [description, setDescription] = useState("Kompensasi Kendala Teknis");

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const injectMutation = useInjectVipTickets({
    token,
    options: {
      onSuccess: (res) => {
        toast.success(res.message);
        setIsConfirmOpen(false);
      },
      onError: (err: any) => {
        toast.error("Gagal melakukan injeksi tiket", {
          description: err.response?.data?.message || err.message,
        });
        setIsConfirmOpen(false);
      },
    },
  });

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filterType === "date_range" && (!startDate || !endDate)) {
      toast.error("Silakan pilih tanggal mulai dan tanggal akhir.");
      return;
    }
    if (amount < 1) {
      toast.error("Jumlah tiket minimal 1.");
      return;
    }
    if (!description.trim()) {
      toast.error("Pesan kompensasi tidak boleh kosong.");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleExecute = () => {
    injectMutation.mutate({
      amount,
      description,
      filter_type: filterType,
      start_date: filterType === "date_range" ? startDate : undefined,
      end_date: filterType === "date_range" ? endDate : undefined,
    });
  };

  return (
    <main className="max-w-3xl">
      <DashboardTitle title="Injeksi Tiket VIP" />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Formulir Pembagian Tiket Kompensasi</CardTitle>
          <CardDescription>
            Fitur ini digunakan untuk memberikan tiket gratis secara massal kepada pengguna VIP
            (pengguna yang pernah melakukan transaksi pembelian paket/kelas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Target Penerima Tiket</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="filter_type"
                    value="all_vip"
                    checked={filterType === "all_vip"}
                    onChange={(e) => setFilterType(e.target.value as "all_vip")}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Semua User VIP (Sepanjang Waktu)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="filter_type"
                    value="date_range"
                    checked={filterType === "date_range"}
                    onChange={(e) => setFilterType(e.target.value as "date_range")}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Berdasarkan Rentang Tanggal Transaksi</span>
                </label>
              </div>
            </div>

            {filterType === "date_range" && (
              <div className="flex gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <div className="flex-1 space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Jumlah Tiket yang Dibagikan (Per User)</Label>
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
                placeholder="Contoh: Kompensasi Kendala Teknis"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Pesan ini akan muncul di riwayat tiket (Ticket Log) masing-masing user.
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Injeksi Tiket Sekarang
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Injeksi Tiket</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Anda akan memberikan <strong>{amount} tiket</strong> gratis dengan pesan:{" "}
                <span className="italic">"{description}"</span>.
              </p>
              <p>
                Target penerima:{" "}
                <strong>
                  {filterType === "all_vip"
                    ? "Semua pengguna VIP"
                    : `Pengguna VIP yang bertransaksi antara ${startDate || "-"} s/d ${endDate || "-"}`}
                </strong>.
              </p>
              <p className="text-red-600 dark:text-red-400 font-semibold mt-2">
                Peringatan: Tindakan ini tidak dapat dibatalkan. Pastikan pengaturan Anda sudah benar.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={injectMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleExecute();
              }}
              disabled={injectMutation.isPending}
              className="bg-primary"
            >
              {injectMutation.isPending ? "Sedang Memproses..." : "Ya, Bagikan Tiket!"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
