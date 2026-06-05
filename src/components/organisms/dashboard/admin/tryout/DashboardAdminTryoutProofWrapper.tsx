"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ExternalLink, Images, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SmartPagination from "@/components/molecules/pagination/SmartPagination";
import { useGetTryoutProofImages } from "@/http/tryout/get-tryout-proof-images";

export default function DashboardAdminTryoutProofWrapper() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [search, setSearch] = useState("");

  const { data, isPending } = useGetTryoutProofImages({
    token: session?.access_token ?? "",
    page,
    perPage,
    search,
  });

  const rows = data?.data ?? [];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Cari peserta atau tryout"
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="w-fit">
          {data?.total ?? 0} data bukti
        </Badge>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-80 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : rows.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rows.map((item) => (
            <Card key={item.id}>
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {item.user?.name ?? "Peserta"}
                    </CardTitle>
                    <p className="truncate text-sm text-muted-foreground">
                      {item.user?.email ?? "-"}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {item.proof_image_urls.length} gambar
                  </Badge>
                </div>
                <p className="truncate text-sm font-medium text-[#004AAB]">
                  {item.tryout?.title ?? "Tryout"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {item.proof_image_urls.map((url, index) => (
                    <div key={`${item.id}-${url}-${index}`} className="overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={url}
                        alt={`Bukti follow ${index + 1}`}
                        className="h-44 w-full object-contain"
                      />
                      <div className="border-t bg-background p-2">
                        <Button variant="outline" size="sm" className="h-8 w-full text-xs" asChild>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1 size-3" />
                            Buka bukti {index + 1}
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Images className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-semibold">Belum ada bukti follow</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Data akan muncul setelah peserta mendaftar tryout gratis dan mengunggah bukti.
          </p>
        </div>
      )}

      <SmartPagination
        page={data?.current_page ?? page}
        totalItems={data?.total ?? 0}
        perPage={Number(data?.per_page ?? perPage)}
        perPageOptions={[6, 12, 24, 48]}
        itemLabel="bukti"
        onPageChange={setPage}
        onPerPageChange={(nextPerPage) => {
          setPerPage(nextPerPage);
          setPage(1);
        }}
      />
    </section>
  );
}
