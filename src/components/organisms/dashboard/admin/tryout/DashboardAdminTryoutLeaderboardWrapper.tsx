"use client";

import { useGetTryoutLeaderboard } from "@/http/tryout/get-tryout-leaderboard";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { LeaderboardEntry } from "@/types/exam/exam";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { leaderboardColumns } from "@/components/atoms/datacolumn/DataLeaderboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
// No pagination imports needed for DataTable wrapper
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  Target,
  TrendingUp,
  Users,
  BarChart2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardAdminTryoutLeaderboardWrapperProps {
  tryoutId: string;
}

// Helpers moved to DataLeaderboard.tsx

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg?: string;
}

function StatCard({
  icon,
  label,
  value,
  iconBg = "bg-primary/10 text-primary",
}: StatCardProps): React.JSX.Element {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className={cn("rounded-lg p-2.5", iconBg)}>{icon}</div>
        <div className="space-y-2">
          <p className="text-muted-foreground leading-none">{label}</p>
          <p className="text-lg font-bold leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// LeaderboardTableRow moved to DataLeaderboard.tsx

function ProofImagesDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: LeaderboardEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const proofUrls = entry?.proof_image_urls ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bukti Follow Instagram</DialogTitle>
          <DialogDescription>
            {entry?.user_name ?? "Peserta"} mengunggah {proofUrls.length} gambar
            bukti.
          </DialogDescription>
        </DialogHeader>

        {proofUrls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
            {proofUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-lg border bg-background"
              >
                <img
                  src={url}
                  alt={`Bukti follow ${index + 1}`}
                  className="h-64 w-full object-contain bg-muted"
                />
                <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Bukti {index + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    asChild
                  >
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Buka
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada bukti gambar.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Trophy className="size-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg">Belum Ada Data</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          Leaderboard akan muncul setelah peserta menyelesaikan tryout ini.
        </p>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title }: { title?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2 shrink-0">
        <Trophy className="size-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Leaderboard</h2>
        {title && <p className="text-sm text-muted-foreground">{title}</p>}
      </div>
    </div>
  );
}

export default function DashboardAdminTryoutLeaderboardWrapper({
  tryoutId,
}: DashboardAdminTryoutLeaderboardWrapperProps) {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selectedProofEntry, setSelectedProofEntry] =
    useState<LeaderboardEntry | null>(null);

  const { data, isPending } = useGetTryoutLeaderboard({
    token: session?.access_token ?? "",
    tryoutId,
    page,
    perPage,
  });

  const leaderboard = data?.data.leaderboard?.data ?? [];
  const totalPages = data?.data.leaderboard?.last_page ?? 1;
  const tryoutTitle = data?.data.tryout_title;
  const leaderboardBasis = data?.data.leaderboard_basis;
  const statistics = data?.data.statistics;

  if (!isPending && leaderboard.length === 0) {
    return (
      <section className="space-y-4">
        <SectionHeader title={tryoutTitle} />
        <LeaderboardEmpty />
      </section>
    );
  }

  const totalParticipants = statistics?.total_participants ?? 0;
  const maxScore = statistics?.highest_score ?? 0;
  const avgScore = statistics?.average_score ?? 0;
  const avgAccuracy = statistics?.average_accuracy ?? 0;

  return (
    <section className="space-y-5">
      <SectionHeader title={tryoutTitle} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isPending ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={<Users className="size-4" />}
              label="Total Peserta"
              value={totalParticipants}
              iconBg="bg-teal-500/10 text-teal-600"
            />
            <StatCard
              icon={<Trophy className="size-4" />}
              label="Skor Tertinggi"
              value={maxScore.toFixed(1)}
              iconBg="bg-amber-500/10 text-amber-600"
            />
            <StatCard
              icon={<TrendingUp className="size-4" />}
              label="Rata-rata Skor"
              value={avgScore.toFixed(1)}
              iconBg="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              icon={<Target className="size-4" />}
              label="Rata-rata Akurasi"
              value={`${avgAccuracy.toFixed(1)}%`}
              iconBg="bg-purple-500/10 text-purple-600"
            />
          </>
        )}
      </div>

      {/* Basis tag */}
      {leaderboardBasis && (
        <p className="text-xs text-muted-foreground bg-muted inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full">
          <BarChart2 className="w-3 h-3" />
          {leaderboardBasis === "attempt_number_1"
            ? "Peringkat berdasarkan percobaan ke-1"
            : "Peringkat berdasarkan skor terbaik"}
        </p>
      )}

      {/* Table */}
      <div className="overflow-hidden w-full">
        <div className="flex flex-row items-start justify-between gap-4 py-4">
          <div>
            <h3 className="text-base font-semibold leading-none tracking-tight">
              Hasil Tryout Peserta
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar hasil tryout berdasarkan skor
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {leaderboard.length} peserta
          </Badge>
        </div>

        <div className="w-full">
          <DataTable
            columns={leaderboardColumns({
              tryoutId,
              onViewProof: setSelectedProofEntry,
            })}
            data={leaderboard}
            isLoading={isPending}
            serverSidePagination={true}
            serverPageCount={data?.data.leaderboard.last_page ?? 1}
            serverTotalData={data?.data.leaderboard.total ?? 0}
            serverPageIndex={page - 1}
            serverPageSize={perPage}
            onServerPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
            onServerPageSizeChange={(newSize) => {
              setPerPage(newSize);
              setPage(1);
            }}
          />
        </div>
      </div>

      <ProofImagesDialog
        entry={selectedProofEntry}
        open={!!selectedProofEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedProofEntry(null);
        }}
      />
    </section>
  );
}
