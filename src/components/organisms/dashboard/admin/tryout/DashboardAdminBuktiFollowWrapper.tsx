"use client";

import { useGetDetailTryout } from "@/http/tryout/get-detail-tryout";
import { useSession } from "next-auth/react";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { buktiFollowColumns } from "@/components/atoms/datacolumn/DataBuktiFollow";
import { useState } from "react";
import { UserTryoutAccess } from "@/types/tryout/tryout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DashboardAdminBuktiFollowWrapperProps {
  id: string;
}

export default function DashboardAdminBuktiFollowWrapper({
  id,
}: DashboardAdminBuktiFollowWrapperProps) {
  const { data: session, status } = useSession();
  const [selectedAccess, setSelectedAccess] = useState<UserTryoutAccess | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isPending } = useGetDetailTryout({
    id,
    token: session?.access_token as string,
    options: {
      enabled: status === "authenticated",
    },
  });

  const proofAccesses = (data?.data.user_accesses ?? []).filter(
    (access) => (access.proof_image_urls?.length ?? 0) > 0,
  );

  const filteredAccesses = proofAccesses.filter((access) => {
    const nameMatch = access.user?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const emailMatch = access.user?.email
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  const handleViewDetail = (access: UserTryoutAccess) => {
    setSelectedAccess(access);
    setIsDialogOpen(true);
  };

  return (
    <section>
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                Bukti Follow: {data?.data.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Daftar peserta yang telah mengunggah bukti follow Instagram
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari nama atau email..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <DataTable
            columns={buktiFollowColumns({
              viewDetailHandler: handleViewDetail,
            })}
            data={filteredAccesses}
            isLoading={isPending}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Bukti Follow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="font-semibold">
                {selectedAccess?.user?.name ?? "Peserta"}
              </span>
              <span className="text-sm text-muted-foreground">
                {selectedAccess?.user?.email ?? "-"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedAccess?.proof_image_urls ?? []).map((url, index) => (
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
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
