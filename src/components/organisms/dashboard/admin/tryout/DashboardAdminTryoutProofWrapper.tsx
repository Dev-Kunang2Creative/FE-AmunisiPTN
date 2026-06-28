"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ExternalLink, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DataTable } from "@/components/molecules/datatable/DataTable";
import { proofsColumns } from "@/components/atoms/datacolumn/DataProofs";
import {
  useGetTryoutProofImages,
  type TryoutProofItem,
} from "@/http/tryout/get-tryout-proof-images";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardAdminTryoutProofWrapper() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const [selectedProof, setSelectedProof] = useState<TryoutProofItem | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isPending } = useGetTryoutProofImages({
    token: session?.access_token ?? "",
    page,
    perPage,
    search: debouncedSearch,
  });

  const rows = data?.data ?? [];

  const handleViewDetail = (item: TryoutProofItem) => {
    setSelectedProof(item);
    setIsDialogOpen(true);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Cari peserta atau tryout..."
            className="pl-9 w-full"
          />
        </div>
      </div>

      <DataTable
        columns={proofsColumns({ viewDetailHandler: handleViewDetail })}
        data={rows}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Bukti Follow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="font-semibold">
                {selectedProof?.user?.name ?? "Peserta"}
              </span>
              <span className="text-sm text-muted-foreground">
                {selectedProof?.user?.email ?? "-"}
              </span>
            </div>

            {(selectedProof?.proof_image_urls ?? []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedProof?.proof_image_urls ?? []).map((url, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-lg border bg-muted flex flex-col justify-between"
                  >
                    <img
                      src={url}
                      alt={`Bukti follow ${index + 1}`}
                      className="h-[60vh] w-full object-contain"
                    />
                    <div className="border-t bg-background px-2 py-1.5 mt-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-full text-xs"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Buka bukti {index + 1}
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Peserta ini belum mengunggah bukti follow.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
