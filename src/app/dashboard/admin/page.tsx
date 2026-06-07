"use client";

import { useSession } from "next-auth/react";
import { useGetAdminStats } from "@/http/stats/get-admin-stats";
import { formatPrice } from "@/utils/format-price";
import {
  Users,
  BookOpen,
  ShoppingCart,
  Banknote,
  UserPlus,
  FileQuestion,
  Package,
  Activity,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import DashboardTitle from "@/components/atoms/typography/DashboardTitle";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  paid: "#3B82F6",
  approved: "#10B981",
  rejected: "#EF4444",
  cancelled: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  paid: "Sudah Bayar",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 h-full">
        <div className={`p-3 rounded-xl shrink-0 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900 truncate">
            {isLoading ? "..." : value}
          </p>
          {sub && !isLoading && (
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardAdminPage() {
  const { data: session } = useSession();
  const token = session?.access_token || "";

  const { data, isLoading } = useGetAdminStats({ token });
  const stats = data?.data;

  const pieData = (stats?.order_by_status ?? []).map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    fill: STATUS_COLORS[s.status] ?? "#9CA3AF",
  }));

  const topTryoutsData = (stats?.top_tryouts ?? []).map((t) => ({
    name: t.title.length > 20 ? t.title.slice(0, 20) + "…" : t.title,
    fullName: t.title,
    enrolled: t.enrolled,
  }));

  return (
    <main className="space-y-6">
      <DashboardTitle title="Dashboard Admin" />

      {/* Row 1 — 4 stat cards utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Pengguna"
          value={stats?.total_users ?? 0}
          sub={`+${stats?.new_users_week ?? 0} minggu ini`}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Pendapatan"
          value={formatPrice(stats?.total_revenue ?? 0)}
          sub={`dari ${stats?.total_orders ?? 0} transaksi`}
          icon={Banknote}
          color="bg-purple-50 text-purple-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Try Out"
          value={stats?.total_tryouts ?? 0}
          icon={BookOpen}
          color="bg-green-50 text-green-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Transaksi"
          value={stats?.total_orders ?? 0}
          icon={ShoppingCart}
          color="bg-yellow-50 text-yellow-600"
          isLoading={isLoading}
        />
      </div>

      {/* Row 2 — 4 stat cards sekunder */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Pendaftar Baru (30h)"
          value={stats?.new_users_month ?? 0}
          sub={`${stats?.new_users_week ?? 0} minggu ini`}
          icon={UserPlus}
          color="bg-indigo-50 text-indigo-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Soal"
          value={stats?.total_questions ?? 0}
          icon={FileQuestion}
          color="bg-orange-50 text-orange-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Paket Aktif"
          value={stats?.total_packages ?? 0}
          icon={Package}
          color="bg-pink-50 text-pink-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Sesi Ujian Hari Ini"
          value={stats?.sessions_today ?? 0}
          icon={Activity}
          color="bg-teal-50 text-teal-600"
          isLoading={isLoading}
        />
      </div>

      {/* Row 3 — Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart - Monthly Revenue */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pendapatan per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Memuat data...
              </div>
            ) : (stats?.monthly_revenue?.length ?? 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Belum ada data pendapatan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={stats!.monthly_revenue}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("id-ID", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(v)
                    }
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatPrice(Number(value)),
                      "Pendapatan",
                    ]}
                  />
                  <Bar dataKey="total" fill="#004AAB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Memuat data...
              </div>
            ) : pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Belum ada data transaksi.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Pendaftaran & Top Tryout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Line Chart - Pendaftaran 30 hari */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pendaftaran Pengguna (30 Hari Terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-56 flex items-center justify-center text-gray-400">
                Memuat data...
              </div>
            ) : (stats?.user_registrations?.length ?? 0) === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400">
                Belum ada pendaftar baru.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <LineChart data={stats!.user_registrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(v) => `Tanggal: ${v}`}
                    formatter={(value) => [value, "Pendaftar"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#004AAB"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Horizontal Bar - Top Tryout */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Try Out Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-56 flex items-center justify-center text-gray-400">
                Memuat data...
              </div>
            ) : topTryoutsData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400">
                Belum ada data enrollment.
              </div>
            ) : (
              <div className="space-y-3">
                {topTryoutsData.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold w-5 shrink-0 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-300"}`}
                    >
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        title={t.fullName}
                      >
                        {t.fullName}
                      </p>
                      <div className="mt-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-[#004AAB] h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (t.enrolled / (topTryoutsData[0]?.enrolled || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 shrink-0">
                      {t.enrolled}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
