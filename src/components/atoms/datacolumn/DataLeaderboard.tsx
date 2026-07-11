"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  Clock,
  FileText,
  CheckCircle2,
  MinusCircle,
  XCircle,
  Images,
  Eye,
  Medal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ActionButton from "@/components/molecules/datatable/ActionButton";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { LeaderboardEntry } from "@/types/exam/exam";
import Link from "next/link";
import { formatJakartaDateTime } from "@/utils/date-time";
import { cn } from "@/lib/utils";
import React from "react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "-";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        rankBox: "bg-amber-50 text-amber-700 border border-amber-200",
        avatar: "bg-amber-100 text-amber-700",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        medal: "text-amber-500",
        label: "Juara 1",
      };
    case 2:
      return {
        rankBox: "bg-slate-100 text-slate-600 border border-slate-200",
        avatar: "bg-slate-200 text-slate-700",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        medal: "text-slate-400",
        label: "Juara 2",
      };
    case 3:
      return {
        rankBox: "bg-orange-50 text-orange-700 border border-orange-200",
        avatar: "bg-orange-100 text-orange-700",
        badge: "bg-orange-50 text-orange-700 border-orange-200",
        medal: "text-orange-500",
        label: "Juara 3",
      };
    default:
      return null;
  }
}

function AccuracyBar({ value }: { value: number }) {
  return (
    <div className="space-y-0.5 min-w-[56px]">
      <p className="text-sm font-semibold text-center">{value.toFixed(1)}%</p>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">Akurasi</p>
    </div>
  );
}

function StatPip({
  value,
  label,
  color,
  icon,
}: {
  value: number;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="text-center min-w-[36px]">
      <div
        className={cn(
          "flex items-center justify-center gap-0.5 font-semibold",
          color,
        )}
      >
        {icon}
        {value}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface DataLeaderboardProps {
  tryoutId: string;
  onViewProof: (entry: LeaderboardEntry) => void;
}

export const leaderboardColumns: (
  props: DataLeaderboardProps,
) => ColumnDef<LeaderboardEntry>[] = (props) => [
  {
    id: "rank",
    header: () => <div className="text-center">#</div>,
    cell: ({ row }) => {
      const entry = row.original;
      const rankStyle = getRankStyle(entry.rank);
      return (
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm mx-auto",
            rankStyle ? rankStyle.rankBox : "bg-muted text-muted-foreground",
          )}
        >
          {entry.rank <= 3 ? (
            <Medal className={cn("w-4 h-4", rankStyle?.medal)} />
          ) : (
            <span>{entry.rank}</span>
          )}
        </div>
      );
    },
  },
  {
    id: "user",
    header: "Peserta",
    cell: ({ row }) => {
      const entry = row.original;
      const rankStyle = getRankStyle(entry.rank);
      const finishedAt = entry.finished_at
        ? formatJakartaDateTime(entry.finished_at, { month: "short" })
        : "-";
      const duration = getDuration(entry.started_at!, entry.finished_at);
      return (
        <div className="flex items-center gap-4 min-w-[180px]">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback
              className={cn(
                "text-xs font-semibold",
                rankStyle?.avatar ?? "bg-muted text-muted-foreground",
              )}
            >
              {getInitials(entry.user_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-sm text-foreground truncate">
                {entry.user_name}
              </p>
              {rankStyle && (
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-[10px] px-1.5 py-0 h-4 border",
                    rankStyle.badge,
                  )}
                >
                  {rankStyle.label}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 shrink-0" />
              Percobaan #{entry.attempt_number} · {duration} · {finishedAt}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    id: "total_questions",
    header: () => <div className="text-center">Total Soal</div>,
    cell: ({ row }) => (
      <StatPip
        value={row.original.summary.total_questions}
        label="Total Soal"
        color="text-foreground"
        icon={<FileText className="w-3 h-3" />}
      />
    ),
  },
  {
    id: "answered",
    header: () => <div className="text-center">Dijawab</div>,
    cell: ({ row }) => (
      <StatPip
        value={row.original.summary.answered}
        label="Dijawab"
        color="text-foreground"
        icon={<CheckCircle2 className="w-3 h-3" />}
      />
    ),
  },
  {
    id: "unanswered",
    header: () => <div className="text-center">Tdk Dijawab</div>,
    cell: ({ row }) => (
      <StatPip
        value={row.original.summary.unanswered}
        label="Tidak Dijawab"
        color="text-amber-500"
        icon={<MinusCircle className="w-3 h-3" />}
      />
    ),
  },
  {
    id: "correct",
    header: () => <div className="text-center">Benar</div>,
    cell: ({ row }) => (
      <StatPip
        value={row.original.summary.correct}
        label="Benar"
        color="text-emerald-600"
        icon={<CheckCircle2 className="w-3 h-3" />}
      />
    ),
  },
  {
    id: "wrong",
    header: () => <div className="text-center">Salah</div>,
    cell: ({ row }) => (
      <StatPip
        value={row.original.summary.wrong}
        label="Salah"
        color="text-red-500"
        icon={<XCircle className="w-3 h-3" />}
      />
    ),
  },
  {
    id: "accuracy",
    header: () => <div className="text-center">Akurasi</div>,
    cell: ({ row }) => <AccuracyBar value={row.original.summary.accuracy} />,
  },
  {
    id: "score",
    header: () => <div className="text-right">Skor</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Skor
        </p>
        <p className="text-xl font-bold text-primary leading-tight">
          {row.original.score.final_score.toFixed(1)}
        </p>
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="flex justify-end">
          <ActionButton>
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            {(entry.proof_image_urls?.length ?? 0) > 0 && (
              <DropdownMenuItem onClick={() => props.onViewProof(entry)}>
                <Images className="mr-2 h-4 w-4" />
                <span>Lihat Bukti</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/admin/try-out/${props.tryoutId}/result/${entry.user_id}?attempt=${entry.attempt_number}`}
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>Lihat Detail</span>
              </Link>
            </DropdownMenuItem>
          </ActionButton>
        </div>
      );
    },
  },
];
