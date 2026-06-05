"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useGetDetailTryout } from "@/http/tryout/get-detail-tryout";
import { useExportTryoutPdf } from "@/http/tryout/export-tryout-pdf";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { id as IdLocale } from "date-fns/locale";
import { useGetSubtestByTryout } from "@/http/subtest/get-subtest-by-tryout";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { subtestTryoutColumns } from "@/components/atoms/datacolumn/DataSubtestByTryout";
import { Button } from "@/components/ui/button";
import { Eye, Plus, Download, ExternalLink, Images } from "lucide-react";
import { useState } from "react";
import DialogCreateSubtestTryout from "@/components/atoms/dialog/subtest/DialogCreateSubtestTryout";
import Image from "next/image";
import { useDeleteSubtestFromTryout } from "@/http/subtest/delete-subtest-from-tryout";
import AlertDialogDeleteSubtest from "@/components/atoms/alert-dialog/subtest/AlertDialogDeleteSubtest";
import { SubtestByTryout } from "@/types/subtest/subtest";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";

interface DashboardAdminTryoutDetailWrapperProps {
  id: string;
}

export default function DashboardAdminTryoutDetailWrapper({
  id,
}: DashboardAdminTryoutDetailWrapperProps) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubtest, setSelectedSubtest] =
    useState<SubtestByTryout | null>(null);
  const { mutate: exportPdf, isPending: isDownloadingPdf } = useExportTryoutPdf(
    {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Tryout_${data?.data.title?.replace(/\s+/g, "_") ?? "Package"}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success("PDF berhasil diunduh");
      },
      onError: (error) => {
        console.error(error);
        toast.error("Gagal mengunduh PDF");
      },
    },
  );

  const handleDownloadPdf = () => {
    if (!session?.access_token) return;
    exportPdf({ tryoutId: id, token: session.access_token });
  };

  const { mutate: deleteSubtest, isPending: isDeleting } =
    useDeleteSubtestFromTryout({
      onSuccess: () => {
        toast.success("Subtes berhasil dihapus dari tryout.");
        setDeleteDialogOpen(false);
        setSelectedSubtest(null);
        queryClient.invalidateQueries({
          queryKey: ["get-subtest-by-tryout", id],
        });
      },
      onError: () => {
        toast.error("Gagal menghapus subtes dari tryout.");
      },
    });

  const handleDeleteClick = (data: SubtestByTryout) => {
    setSelectedSubtest(data);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedSubtest || !session?.access_token) return;
    deleteSubtest({
      tryoutId: id,
      tryoutSubtestId: selectedSubtest.id,
      token: session.access_token,
    });
  };

  const { data } = useGetDetailTryout({
    id,
    token: session?.access_token as string,
    options: {
      enabled: status === "authenticated",
    },
  });

  const { data: subtest, isPending: isPendingSubtest } = useGetSubtestByTryout({
    id,
    token: session?.access_token as string,
    options: {
      enabled: status === "authenticated",
    },
  });

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const proofAccesses = (data?.data.user_accesses ?? []).filter(
    (access) => (access.proof_image_urls?.length ?? 0) > 0,
  );

  return (
    <section>
      <Card>
        <CardContent className="space-y-12">
          <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground">Judul Tryout</h3>
              <span className="font-medium">{data?.data.title}</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground">Deskripsi Tryout</h3>
              <span className="font-medium">{data?.data.description}</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground">Status Tryout</h3>
              <Badge
                className={
                  data?.data.is_published
                    ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs"
                    : "bg-red-100 text-red-700 hover:bg-red-100 text-xs"
                }
              >
                {data?.data.is_published ? "Dipublish" : "Draft"}
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground">Dibuat Oleh</h3>
              <span className="font-medium">{data?.data.creator.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground">Tanggal Dibuat</h3>
              <span className="font-medium">
                {data?.data.created_at
                  ? format(
                      new Date(data.data.created_at),
                      "dd MMM yyyy HH:mm",
                      {
                        locale: IdLocale,
                      },
                    )
                  : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground">Tanggal Diubah</h3>
              <span className="font-medium">
                {data?.data.updated_at
                  ? format(
                      new Date(data.data.updated_at),
                      "dd MMM yyyy HH:mm",
                      {
                        locale: IdLocale,
                      },
                    )
                  : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground">Tanggal Mulai</h3>
              <span className="font-medium">
                {data?.data.start_date
                  ? format(
                      new Date(data.data.start_date),
                      "dd MMM yyyy HH:mm",
                      {
                        locale: IdLocale,
                      },
                    )
                  : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground">Tanggal Selesai</h3>
              <span className="font-medium">
                {data?.data.end_date
                  ? format(new Date(data.data.end_date), "dd MMM yyyy HH:mm", {
                      locale: IdLocale,
                    })
                  : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground">Thumbnail</h3>
              <Image
                src={data?.data.image_url ?? ""}
                alt="Thumbnail"
                width={200}
                height={100}
              />
            </div>
          </div>

          {data?.data.is_free && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-lg">Bukti Follow Instagram</h3>
                  <p className="text-sm text-muted-foreground">
                    Bukti gambar yang diunggah peserta saat daftar tryout gratis.
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {proofAccesses.length} peserta
                </Badge>
              </div>

              {proofAccesses.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {proofAccesses.map((access) => (
                    <div key={access.id} className="rounded-xl border p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{access.user?.name ?? "Peserta"}</p>
                          <p className="text-xs text-muted-foreground truncate">{access.user?.email ?? "-"}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {access.proof_image_urls?.length ?? 0} gambar
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {(access.proof_image_urls ?? []).map((url, index) => (
                          <div key={`${access.id}-${url}-${index}`} className="overflow-hidden rounded-lg border bg-muted">
                            <img
                              src={url}
                              alt={`Bukti follow ${access.user?.name ?? "peserta"} ${index + 1}`}
                              className="h-36 w-full object-contain"
                            />
                            <div className="border-t bg-background px-2 py-1.5">
                              <Button variant="ghost" size="sm" className="h-7 w-full text-xs" asChild>
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Buka bukti {index + 1}
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <Images className="mx-auto mb-2 size-6" />
                  Belum ada bukti follow yang diunggah.
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-medium text-lg">Subtes</h3>
              <div className="flex gap-3 items-center">
                <Button size={"lg"} variant={"outline"} asChild>
                  <Link href={`/dashboard/admin/try-out/${id}/result`}>
                    <Eye /> Lihat Hasil
                  </Link>
                </Button>
                <Button
                  size={"lg"}
                  variant={"outline"}
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  <Download
                    className={isDownloadingPdf ? "animate-pulse" : ""}
                  />{" "}
                  Download PDF
                </Button>
                <Button size={"lg"} onClick={handleOpenDialog}>
                  <Plus /> Tambahkan Subtes
                </Button>
              </div>
            </div>
            <DataTable
              columns={subtestTryoutColumns({
                deleteHandler: handleDeleteClick,
              })}
              data={subtest?.data ?? []}
              isLoading={isPendingSubtest}
            />
          </div>
        </CardContent>
      </Card>

      <DialogCreateSubtestTryout
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
        tryoutId={id}
      />

      <AlertDialogDeleteSubtest
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        confirmDelete={handleConfirmDelete}
        isPending={isDeleting}
      />
    </section>
  );
}
