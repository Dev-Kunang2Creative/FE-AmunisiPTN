"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  ImageIcon,
  Calendar,
  RefreshCw,
  MessageCircle,
  Send,
  Loader2,
  User,
  Info,
} from "lucide-react";
import { useGetTicketReportDetail } from "@/http/ticket-reports/get-ticket-report-detail";
import { usePostTicketReply } from "@/http/ticket-reports/post-ticket-reply";
import { TicketStatusBadge } from "@/components/atoms/datacolumn/DataTicketReport";
import RichTextRenderer from "@/components/atoms/rich-text/RichTextRenderer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "";

export default function TicketReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.access_token || "";
  const queryClient = useQueryClient();

  const [replyText, setReplyText] = useState("");

  const { data, isLoading, isError } = useGetTicketReportDetail({ token, id });
  const ticket = data?.data;

  const { mutate: postReply, isPending: isReplying } = usePostTicketReply();

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    postReply(
      { token, id, message: replyText },
      {
        onSuccess: () => {
          setReplyText("");
          toast.success("Balasan berhasil dikirim");
          queryClient.invalidateQueries({
            queryKey: ["get-ticket-report-detail", id],
          });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? "Gagal mengirim balasan.";
          toast.error(msg);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center py-24 gap-4 ">
        <p className="text-lg font-medium text-slate-600">
          Laporan tidak ditemukan
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    );
  }

  const imageUrls: string[] = Array.isArray(ticket.images)
    ? ticket.images.map((path) =>
        path.startsWith("http") ? path : `${API_BASE}/storage/${path}`,
      )
    : [];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">
          Detail Laporan
        </h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 flex gap-3 items-start text-sm">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Info buat Amunisian!</p>
          <p className="leading-relaxed">
            Amunisian otomatis mendapatkan tiket tryout (maksimum 1 tiket per
            akun) ketika sudah membuat sebuah laporan. Silakan gunakan kode
            redeem <strong>AMUNISICOMEBACK</strong> di menu Try Out!
          </p>
        </div>
      </div>

      {/* Status & meta */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">{ticket.title}</h2>
            <p className="text-xs uppercase mt-1 text-muted-foreground">
              ID: #{ticket.id}
            </p>
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>

        <div className="flex flex-wrap gap-4 text-sm border-t border-slate-100 pt-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Dibuat:{" "}
            <span suppressHydrationWarning className="text-black">
              {format(new Date(ticket.created_at), "dd MMM yyyy, HH:mm", {
                locale: idLocale,
              })}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
            Diperbarui:{" "}
            <span suppressHydrationWarning className="text-black">
              {format(new Date(ticket.updated_at), "dd MMM yyyy, HH:mm", {
                locale: idLocale,
              })}
            </span>
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3">
          Deskripsi
        </h3>
        <RichTextRenderer html={ticket.description} className="text-sm" />
      </div>

      {/* Images */}
      {imageUrls.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Gambar Lampiran ({imageUrls.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imageUrls.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer">
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
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
              reply.user.role === "admin" || reply.user.role === "superadmin";

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
            <form onSubmit={handleReply} className="flex gap-3">
              <Textarea
                placeholder="Tulis balasan..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[44px] max-h-32 resize-y text-sm bg-white"
                rows={1}
              />
              <Button
                type="submit"
                disabled={isReplying || !replyText.trim()}
                className="shrink-0 bg-[#004AAB] hover:bg-[#003888] h-auto"
              >
                {isReplying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        )}
        {ticket.status === "SOLVED" && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Ticket ini telah diselesaikan, Anda tidak dapat membalas lagi.
            </p>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.back()}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Kembali ke Daftar Laporan
      </Button>
    </div>
  );
}
