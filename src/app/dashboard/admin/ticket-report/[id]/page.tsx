"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  Calendar,
  RefreshCw,
  User,
  ImageIcon,
  ArrowRight,
  Loader2,
  Hash,
  MessageCircle,
  Send,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminGetTicketReportDetailHandler } from "@/http/ticket-reports/admin-get-ticket-reports";
import { useAdminUpdateTicketStatus } from "@/http/ticket-reports/admin-update-ticket-status";
import { usePostAdminTicketReply } from "@/http/ticket-reports/post-admin-ticket-reply";
import {
  TicketStatusBadge,
  STATUS_CONFIG,
} from "@/components/atoms/datacolumn/DataTicketReport";
import RichTextRenderer from "@/components/atoms/rich-text/RichTextRenderer";
import RichTextEditor from "@/components/atoms/rich-text/RichTextEditor";
import DashboardTitle from "@/components/atoms/typography/DashboardTitle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "";

const NEXT_STATUS: Record<string, "IN_PROGRESS" | "SOLVED" | null> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "SOLVED",
  SOLVED: null,
};

export default function AdminTicketReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.access_token || "";
  const queryClient = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-ticket-report-detail", id],
    queryFn: () => AdminGetTicketReportDetailHandler(token, id),
    enabled: !!token && !!id,
  });

  const ticket = data?.data;

  const { mutate: updateStatus, isPending: isUpdating } =
    useAdminUpdateTicketStatus();

  const nextStatus = ticket ? NEXT_STATUS[ticket.status] : null;

  const handleUpdateStatus = () => {
    if (!ticket || !nextStatus) return;
    updateStatus(
      { token, id: ticket.id, status: nextStatus },
      {
        onSuccess: () => {
          toast.success(
            `Status diubah ke ${STATUS_CONFIG[nextStatus]?.label ?? nextStatus}`,
          );
          setConfirmOpen(false);
          queryClient.invalidateQueries({
            queryKey: ["admin-ticket-report-detail", id],
          });
          queryClient.invalidateQueries({
            queryKey: ["admin-get-ticket-reports"],
          });
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ?? "Gagal memperbarui status.";
          toast.error(msg);
          setConfirmOpen(false);
        },
      },
    );
  };

  const { mutate: postReply, isPending: isReplying } =
    usePostAdminTicketReply();

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    postReply(
      { token, id: ticket!.id, message: replyText },
      {
        onSuccess: () => {
          setReplyText("");
          toast.success("Balasan berhasil dikirim");
          queryClient.invalidateQueries({
            queryKey: ["admin-ticket-report-detail", id],
          });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? "Gagal mengirim balasan.";
          toast.error(msg);
        },
      },
    );
  };

  const imageUrls: string[] = Array.isArray(ticket?.images)
    ? (ticket!.images as string[]).map((p) =>
        p.startsWith("http") ? p : `${API_BASE}/storage/${p}`,
      )
    : [];

  /* ── Loading ── */
  if (isLoading) {
    return (
      <main className="space-y-6 pb-8">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-7 w-52" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  /* ── Error / not found ── */
  if (isError || !ticket) {
    return (
      <main className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-lg font-medium text-slate-600">
          Ticket tidak ditemukan
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <DashboardTitle title="Detail Ticket Report" />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5">
              Judul
            </p>
            <h2 className="text-xl font-bold leading-snug">{ticket.title}</h2>
            <p className="text-xs uppercase mt-2 flex items-center text-muted-foreground">
              <Hash className="w-3 h-3" />
              {ticket.id}
            </p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3">
              Deskripsi
            </p>
            <RichTextRenderer
              html={ticket.description}
              className="text-sm leading-relaxed"
            />
          </div>

          {/* Images */}
          {imageUrls.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Lampiran Gambar ({imageUrls.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imageUrls.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={src}
                      alt={`lampiran-${i + 1}`}
                      className="w-full aspect-square object-cover rounded-xl border border-slate-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Replies Thread */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mt-5">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-slate-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wide">
                Balasan ({ticket.replies?.length ?? 0})
              </h3>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {ticket.replies?.map((reply) => {
                const isMe = reply.user_id === session?.user?.id;
                const isAdmin =
                  reply.user.role === "admin" ||
                  reply.user.role === "superadmin";

                return (
                  <div
                    key={reply.id}
                    className={`flex gap-3 max-w-[85%] ${
                      isMe ? "self-end flex-row-reverse" : "self-start"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                        isAdmin
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div
                      className={`flex flex-col gap-1 ${
                        isMe ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {isMe ? "Anda" : reply.user.name}
                        </span>
                        {isAdmin && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                            Admin
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(reply.created_at), "dd MMM HH:mm")}
                        </span>
                      </div>
                      <div
                        className={`text-sm px-4 py-2.5 rounded-2xl ${
                          isMe
                            ? "bg-[#004AAB] text-white rounded-tr-sm"
                            : "bg-slate-100 text-slate-800 rounded-tl-sm"
                        }`}
                      >
                        <RichTextRenderer
                          html={reply.message}
                          className="text-sm leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!ticket.replies || ticket.replies.length === 0) && (
                <p className="text-center text-sm text-slate-500 py-4">
                  Belum ada balasan.
                </p>
              )}
            </div>

            {/* Reply Form */}
            {ticket.status !== "SOLVED" && (
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <form onSubmit={handleReply} className="flex flex-col gap-3">
                  <RichTextEditor
                    placeholder="Tulis balasan..."
                    value={replyText}
                    onChange={setReplyText}
                    minHeightClassName="min-h-24"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={
                        isReplying ||
                        !replyText.trim() ||
                        replyText === "<p></p>" ||
                        replyText === "<p><br></p>"
                      }
                      className="bg-[#004AAB] hover:bg-[#003888] h-auto px-6"
                    >
                      {isReplying ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Kirim Balasan
                    </Button>
                  </div>
                </form>
              </div>
            )}
            {ticket.status === "SOLVED" && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Ticket ini telah diselesaikan. Buka kembali (update status)
                  untuk membalas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Info & Aksi ── */}
        <div className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3">
              Status
            </p>
            <TicketStatusBadge status={ticket.status} />
          </div>

          {/* User info */}
          {ticket.user && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3">
                Dilaporkan Oleh
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EBF4FF] flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-[#004AAB]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">
                    {ticket.user.name}
                  </p>
                  <p className="text-xs truncate">{ticket.user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide">
              Waktu
            </p>
            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs">Dibuat</p>
                  <p suppressHydrationWarning className="font-medium">
                    {format(new Date(ticket.created_at), "dd MMM yyyy, HH:mm", {
                      locale: idLocale,
                    })}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs">Diperbarui</p>
                  <p suppressHydrationWarning className="font-medium">
                    {format(new Date(ticket.updated_at), "dd MMM yyyy, HH:mm", {
                      locale: idLocale,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3">
              Aksi
            </p>
            {nextStatus ? (
              <Button
                onClick={() => setConfirmOpen(true)}
                className="w-full gap-2 bg-[#004AAB] hover:bg-[#003888] text-white"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Ubah ke {STATUS_CONFIG[nextStatus]?.label ?? nextStatus}
              </Button>
            ) : (
              <p className="text-sm text-emerald-600 font-medium text-center py-1">
                ✓ Ticket ini telah diselesaikan
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirm status change dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
            <AlertDialogDescription>
              Ubah status ticket dari{" "}
              <strong>
                {STATUS_CONFIG[ticket.status]?.label ?? ticket.status}
              </strong>{" "}
              ke{" "}
              <strong>
                {STATUS_CONFIG[nextStatus ?? ""]?.label ?? nextStatus}
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="bg-[#004AAB] hover:bg-[#003888]"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Ya, Ubah Status"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
