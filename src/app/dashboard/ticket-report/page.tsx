"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  Plus,
  Ticket,
  ChevronRight,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";
import { useGetTicketReports } from "@/http/ticket-reports/get-ticket-reports";
import { useCreateTicketReport } from "@/http/ticket-reports/create-ticket-report";
import { TicketStatusBadge } from "@/components/atoms/datacolumn/DataTicketReport";
import RichTextEditor from "@/components/atoms/rich-text/RichTextEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const MAX_IMAGES = 5;
const MAX_SIZE_MB = 3;
const ALLOWED_TYPES = ["image/jpg", "image/jpeg", "image/png", "image/webp"];

export default function TicketReportPage() {
  const { data: session } = useSession();
  const token = session?.access_token || "";
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(1);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useGetTicketReports({ token, page });
  const { mutate: createTicket, isPending } = useCreateTicketReport();

  const tickets = data?.data ?? [];

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_IMAGES} gambar`);
      return;
    }

    const valid: File[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Format tidak didukung: ${file.name}`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} melebihi batas ${MAX_SIZE_MB}MB`);
        continue;
      }
      valid.push(file);
    }

    const newPreviews = valid.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...valid]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
    setImagePreviews([]);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Judul tidak boleh kosong");
      return;
    }
    if (!description.trim() || description === "<br>") {
      toast.error("Deskripsi tidak boleh kosong");
      return;
    }

    createTicket(
      { token, title: title.trim(), description, images },
      {
        onSuccess: () => {
          toast.success("Laporan berhasil dikirim!");
          setOpen(false);
          resetForm();
          queryClient.invalidateQueries({ queryKey: ["get-ticket-reports"] });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? "Gagal mengirim laporan.";
          toast.error(msg);
        },
      },
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Laporan Masalah
          </h1>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-[#004AAB] hover:bg-[#003888] text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Buat Laporan
        </Button>
      </div>

      {/* Tickets list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Ticket className="w-12 h-12 text-slate-300" />
            <div className="text-center">
              <p className="font-medium text-slate-600">Belum ada laporan</p>
              <p className="text-sm mt-1">
                Klik{" "}
                <span className="text-[#004AAB] font-medium">Buat Laporan</span>{" "}
                untuk melaporkan masalah.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/ticket-report/${ticket.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <TicketStatusBadge status={ticket.status} />
                    <span className="text-xs text-muted-foreground uppercase">
                      #{ticket.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="font-semibold truncate group-hover:text-[#004AAB] transition-colors">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dibuat:{" "}
                    <span suppressHydrationWarning>
                      {format(
                        new Date(ticket.created_at),
                        "dd MMM yyyy, HH:mm",
                        {
                          locale: idLocale,
                        },
                      )}
                    </span>
                    {" · "}Diperbarui:{" "}
                    <span suppressHydrationWarning>
                      {format(
                        new Date(ticket.updated_at),
                        "dd MMM yyyy, HH:mm",
                        {
                          locale: idLocale,
                        },
                      )}
                    </span>
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-3 group-hover:text-[#004AAB] transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>
            Menampilkan {(data.current_page - 1) * data.per_page + 1}–
            {Math.min(data.current_page * data.per_page, data.total)} dari{" "}
            {data.total} laporan
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

      {/* Create Ticket Dialog */}
      <Dialog
        open={open}
        onOpenChange={(val) => {
          if (!val) resetForm();
          setOpen(val);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Buat Laporan Masalah
            </DialogTitle>
            <DialogDescription>
              Jelaskan masalah yang kamu temukan agar tim kami dapat membantu.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-title">
                Judul <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ticket-title"
                placeholder="Contoh: Timer ujian berhenti saat pindah soal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label>
                Deskripsi <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Jelaskan masalah secara detail — langkah yang dilakukan, halaman yang bermasalah, dll."
                minHeightClassName="min-h-40"
              />
            </div>

            {/* Image Upload */}
            <div className="flex flex-col gap-1.5">
              <Label>
                Lampiran Gambar{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (opsional, maks. {MAX_IMAGES} gambar · {MAX_SIZE_MB}MB/gambar)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((src, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group"
                  >
                    <img
                      src={src}
                      alt={`preview-${i}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#004AAB] flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-[#004AAB] transition-colors"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Tambah</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                onChange={handleImageAdd}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-[#004AAB] hover:bg-[#003888] text-white min-w-28"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Laporan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
