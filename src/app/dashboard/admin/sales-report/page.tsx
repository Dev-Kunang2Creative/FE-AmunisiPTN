"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  useGetFeeTryoutReport,
  useGetSalesReport,
  type FeeTryoutReportRow,
  type SalesReportRow,
} from "@/http/sales-report/get-sales-report";
import SmartPagination from "@/components/molecules/pagination/SmartPagination";
import {
  exportAdminRowsToExcel,
  exportAdminRowsToPdf,
  type AdminExportColumn,
} from "@/components/molecules/datatable/AdminDataControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  Boxes,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatPrice } from "@/utils/format-price";
import { formatJakartaDate } from "@/utils/date-time";

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2, THIS_YEAR - 3];
const PER_PAGE_OPTIONS = [10, 15, 25, 50];
const ALL_FILTER = "all";
const salesExportColumns: AdminExportColumn<SalesReportRow>[] = [
  { header: "Periode", accessor: (row) => monthLabel(row.month, row.year) },
  { header: "Produk/TO", accessor: (row) => row.product_name },
  {
    header: "Harga",
    accessor: (row) => row.average_price,
    format: (value) => formatPrice(Number(value || 0)),
  },
  { header: "Item Terjual", accessor: (row) => row.total_item_sold },
  { header: "Order", accessor: (row) => row.order_count },
  {
    header: "Total",
    accessor: (row) => row.total_sales,
    format: (value) => formatPrice(Number(value || 0)),
  },
];
const feeExportColumns: AdminExportColumn<FeeTryoutReportRow>[] = [
  {
    header: "Periode",
    accessor: (row) =>
      row.period_start
        ? formatJakartaDate(row.period_start, {
            month: "long",
            year: "numeric",
          })
        : monthLabel(row.month, row.year),
  },
  { header: "Nama TO", accessor: (row) => row.tryout_name },
  { header: "Peserta", accessor: (row) => row.participant_count },
  {
    header: "Total Fee",
    accessor: (row) => row.total_fee,
    format: (value) => formatPrice(Number(value || 0)),
  },
];

type ActiveReport = "sales" | "fee";
type SortDirection = "asc" | "desc";
type SalesSortKey =
  | "period_start"
  | "product_name"
  | "average_price"
  | "total_sales"
  | "total_item_sold"
  | "order_count";
type FeeSortKey =
  | "period_start"
  | "tryout_name"
  | "participant_count"
  | "total_fee";

function monthLabel(month: number, year: number) {
  return `${MONTH_NAMES[month] || "-"} ${year}`;
}

function compactCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function toTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortString(
  a: string | null | undefined,
  b: string | null | undefined,
  direction: SortDirection,
) {
  const result = String(a || "").localeCompare(String(b || ""), "id-ID");
  return direction === "asc" ? result : -result;
}

function sortNumber(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: SortDirection,
) {
  const result = Number(a || 0) - Number(b || 0);
  return direction === "asc" ? result : -result;
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-medium text-gray-600"
    >
      <span>{label}</span>
      {active ? (
        direction === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : null}
    </button>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`rounded-xl p-3 ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold text-gray-900">
            {value}
          </p>
          {sub ? <p className="mt-0.5 text-xs text-gray-400">{sub}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function StateBox({ message }: { message: string }) {
  return (
    <div className="flex h-52 items-center justify-center p-8 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}

function buildSalesTrend(rows: SalesReportRow[]) {
  const map = new Map<
    string,
    {
      label: string;
      sort: number;
      total_sales: number;
      total_item_sold: number;
    }
  >();

  rows.forEach((row) => {
    const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
    const current = map.get(key) ?? {
      label: monthLabel(row.month, row.year),
      sort: row.year * 100 + row.month,
      total_sales: 0,
      total_item_sold: 0,
    };

    current.total_sales += Number(row.total_sales || 0);
    current.total_item_sold += Number(row.total_item_sold || 0);
    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => a.sort - b.sort);
}

function buildFeeTrend(rows: FeeTryoutReportRow[]) {
  const map = new Map<
    string,
    {
      label: string;
      sort: number;
      total_fee: number;
      participant_count: number;
    }
  >();

  rows.forEach((row) => {
    const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
    const current = map.get(key) ?? {
      label: monthLabel(row.month, row.year),
      sort: row.year * 100 + row.month,
      total_fee: 0,
      participant_count: 0,
    };

    current.total_fee += Number(row.total_fee || 0);
    current.participant_count += Number(row.participant_count || 0);
    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => a.sort - b.sort);
}

function buildFeeByTryout(rows: FeeTryoutReportRow[]) {
  const map = new Map<
    string,
    { tryout_name: string; total_fee: number; participant_count: number }
  >();

  rows.forEach((row) => {
    const current = map.get(row.tryout_name) ?? {
      tryout_name: row.tryout_name,
      total_fee: 0,
      participant_count: 0,
    };
    current.total_fee += Number(row.total_fee || 0);
    current.participant_count += Number(row.participant_count || 0);
    map.set(row.tryout_name, current);
  });

  return Array.from(map.values())
    .sort((a, b) => b.total_fee - a.total_fee)
    .slice(0, 8);
}

export default function SalesReportPage() {
  const { data: session } = useSession();
  const token = session?.access_token || "";

  const [activeReport, setActiveReport] = useState<ActiveReport>("sales");
  const [year, setYear] = useState<number | undefined>(THIS_YEAR);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [salesProductFilter, setSalesProductFilter] = useState(ALL_FILTER);
  const [feeTryoutFilter, setFeeTryoutFilter] = useState(ALL_FILTER);
  const [salesSort, setSalesSort] = useState<{
    key: SalesSortKey;
    direction: SortDirection;
  }>({
    key: "period_start",
    direction: "desc",
  });
  const [feeSort, setFeeSort] = useState<{
    key: FeeSortKey;
    direction: SortDirection;
  }>({
    key: "period_start",
    direction: "desc",
  });
  const [salesPage, setSalesPage] = useState(1);
  const [feePage, setFeePage] = useState(1);
  const [salesPerPage, setSalesPerPage] = useState(10);
  const [feePerPage, setFeePerPage] = useState(10);

  const salesQuery = useGetSalesReport({ token, year, month });
  const feeQuery = useGetFeeTryoutReport({ token, year, month });

  const salesRows = useMemo(
    () => salesQuery.data?.data ?? [],
    [salesQuery.data?.data],
  );
  const feeRows = useMemo(
    () => feeQuery.data?.data ?? [],
    [feeQuery.data?.data],
  );

  const salesProductOptions = useMemo(
    () =>
      Array.from(new Set(salesRows.map((row) => row.product_name))).sort(
        (a, b) => a.localeCompare(b, "id-ID"),
      ),
    [salesRows],
  );
  const feeTryoutOptions = useMemo(
    () =>
      Array.from(new Set(feeRows.map((row) => row.tryout_name))).sort((a, b) =>
        a.localeCompare(b, "id-ID"),
      ),
    [feeRows],
  );

  const filteredSalesRows = useMemo(() => {
    return salesRows
      .filter(
        (row) =>
          salesProductFilter === ALL_FILTER ||
          row.product_name === salesProductFilter,
      )
      .sort((a, b) => {
        if (salesSort.key === "period_start") {
          return sortNumber(
            toTimestamp(a.period_start),
            toTimestamp(b.period_start),
            salesSort.direction,
          );
        }
        if (salesSort.key === "product_name") {
          return sortString(
            a.product_name,
            b.product_name,
            salesSort.direction,
          );
        }
        return sortNumber(
          a[salesSort.key],
          b[salesSort.key],
          salesSort.direction,
        );
      });
  }, [salesProductFilter, salesRows, salesSort]);

  const filteredFeeRows = useMemo(() => {
    return feeRows
      .filter(
        (row) =>
          feeTryoutFilter === ALL_FILTER || row.tryout_name === feeTryoutFilter,
      )
      .sort((a, b) => {
        if (feeSort.key === "period_start") {
          return sortNumber(
            toTimestamp(a.period_start),
            toTimestamp(b.period_start),
            feeSort.direction,
          );
        }
        if (feeSort.key === "tryout_name") {
          return sortString(a.tryout_name, b.tryout_name, feeSort.direction);
        }
        return sortNumber(a[feeSort.key], b[feeSort.key], feeSort.direction);
      });
  }, [feeRows, feeSort, feeTryoutFilter]);

  const feeSummary = feeQuery.data?.summary ?? {
    fee_per_participant: 6000,
    total_fee: 0,
    total_participants: 0,
    tryout_count: 0,
    average_fee_per_tryout: 0,
  };
  const filteredSalesSummary = useMemo(() => {
    const totalSales = filteredSalesRows.reduce(
      (sum, row) => sum + Number(row.total_sales || 0),
      0,
    );
    const totalItemSold = filteredSalesRows.reduce(
      (sum, row) => sum + Number(row.total_item_sold || 0),
      0,
    );
    const orderCount = filteredSalesRows.reduce(
      (sum, row) => sum + Number(row.order_count || 0),
      0,
    );

    return {
      total_sales: totalSales,
      total_item_sold: totalItemSold,
      amunisi_revenue: Math.round(totalSales * 0.8),
      developer_revenue: Math.round(totalSales * 0.2),
      order_count: orderCount,
    };
  }, [filteredSalesRows]);
  const filteredFeeSummary = useMemo(() => {
    const totalFee = filteredFeeRows.reduce(
      (sum, row) => sum + Number(row.total_fee || 0),
      0,
    );
    const totalParticipants = filteredFeeRows.reduce(
      (sum, row) => sum + Number(row.participant_count || 0),
      0,
    );
    const tryoutCount = new Set(filteredFeeRows.map((row) => row.tryout_id))
      .size;

    return {
      fee_per_participant: feeSummary.fee_per_participant,
      total_fee: totalFee,
      total_participants: totalParticipants,
      tryout_count: tryoutCount,
      average_fee_per_tryout:
        tryoutCount > 0 ? Math.round(totalFee / tryoutCount) : 0,
    };
  }, [feeSummary.fee_per_participant, filteredFeeRows]);

  const salesTrend = useMemo(
    () => buildSalesTrend(filteredSalesRows),
    [filteredSalesRows],
  );
  const feeTrend = useMemo(
    () => buildFeeTrend(filteredFeeRows),
    [filteredFeeRows],
  );
  const feeByTryout = useMemo(
    () => buildFeeByTryout(filteredFeeRows),
    [filteredFeeRows],
  );
  const revenueSplit = [
    {
      name: "Amunisi PTN",
      value: filteredSalesSummary.amunisi_revenue,
      fill: "#16A34A",
    },
    {
      name: "Developer",
      value: filteredSalesSummary.developer_revenue,
      fill: "#004AAB",
    },
  ];

  const salesTotalPages = Math.max(
    1,
    Math.ceil(filteredSalesRows.length / salesPerPage),
  );
  const feeTotalPages = Math.max(
    1,
    Math.ceil(filteredFeeRows.length / feePerPage),
  );
  const safeSalesPage = Math.min(salesPage, salesTotalPages);
  const safeFeePage = Math.min(feePage, feeTotalPages);
  const paginatedSalesRows = filteredSalesRows.slice(
    (safeSalesPage - 1) * salesPerPage,
    safeSalesPage * salesPerPage,
  );
  const paginatedFeeRows = filteredFeeRows.slice(
    (safeFeePage - 1) * feePerPage,
    safeFeePage * feePerPage,
  );

  const setSalesSortKey = (key: SalesSortKey) => {
    setSalesSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const setFeeSortKey = (key: FeeSortKey) => {
    setFeeSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-50 p-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Admin</h1>
            <p className="text-sm text-gray-500">
              Pantau penjualan paket dan fee Try Out.
            </p>
          </div>
        </div>

        <div className="flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveReport("sales")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              activeReport === "sales"
                ? "bg-[#004AAB] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Penjualan
          </button>
          <button
            type="button"
            onClick={() => setActiveReport("fee")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              activeReport === "fee"
                ? "bg-[#004AAB] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Fee TO
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select
              value={year ? String(year) : ALL_FILTER}
              onValueChange={(value) => {
                setYear(value === ALL_FILTER ? undefined : Number(value));
                setSalesPage(1);
                setFeePage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full bg-white md:w-40">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Semua Tahun</SelectItem>
                {YEAR_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={month ? String(month) : ALL_FILTER}
              onValueChange={(value) => {
                setMonth(value === ALL_FILTER ? undefined : Number(value));
                setSalesPage(1);
                setFeePage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full bg-white md:w-44">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Semua Bulan</SelectItem>
                {MONTH_NAMES.slice(1).map((name, index) => (
                  <SelectItem key={name} value={String(index + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeReport === "sales" ? (
              <Select
                value={salesProductFilter}
                onValueChange={(value) => {
                  setSalesProductFilter(value);
                  setSalesPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full bg-white md:w-72">
                  <SelectValue placeholder="Produk/Paket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>Semua Produk</SelectItem>
                  {salesProductOptions.map((product) => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={feeTryoutFilter}
                onValueChange={(value) => {
                  setFeeTryoutFilter(value);
                  setFeePage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full bg-white md:w-72">
                  <SelectValue placeholder="Nama Try Out" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>Semua Try Out</SelectItem>
                  {feeTryoutOptions.map((tryout) => (
                    <SelectItem key={tryout} value={tryout}>
                      {tryout}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {activeReport === "sales" ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Penjualan"
              value={formatPrice(filteredSalesSummary.total_sales)}
              icon={Banknote}
              tone="bg-green-50 text-green-600"
            />
            <KpiCard
              label="Total Item Terjual"
              value={filteredSalesSummary.total_item_sold.toLocaleString(
                "id-ID",
              )}
              icon={Boxes}
              tone="bg-blue-50 text-blue-600"
            />
            <KpiCard
              label="Pendapatan Amunisi PTN"
              value={formatPrice(filteredSalesSummary.amunisi_revenue)}
              sub="80% dari total penjualan"
              icon={CircleDollarSign}
              tone="bg-emerald-50 text-emerald-600"
            />
            <KpiCard
              label="Pendapatan Developer"
              value={formatPrice(filteredSalesSummary.developer_revenue)}
              sub="20% dari total penjualan"
              icon={Users}
              tone="bg-indigo-50 text-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Tren Penjualan dan Item Terjual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesQuery.isLoading ? (
                  <StateBox message="Memuat chart penjualan..." />
                ) : salesTrend.length === 0 ? (
                  <StateBox message="Belum ada data penjualan untuk periode ini." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={salesTrend}
                      margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis
                        yAxisId="sales"
                        tickFormatter={(value) =>
                          compactCurrency(Number(value))
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        yAxisId="items"
                        orientation="right"
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "Penjualan"
                            ? formatPrice(Number(value))
                            : Number(value).toLocaleString("id-ID")
                        }
                      />
                      <Line
                        yAxisId="sales"
                        type="monotone"
                        dataKey="total_sales"
                        name="Penjualan"
                        stroke="#004AAB"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="items"
                        type="monotone"
                        dataKey="total_item_sold"
                        name="Item Terjual"
                        stroke="#16A34A"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Distribusi Pendapatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesQuery.isLoading ? (
                  <StateBox message="Memuat distribusi pendapatan..." />
                ) : filteredSalesSummary.total_sales <= 0 ? (
                  <StateBox message="Belum ada pendapatan untuk periode ini." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={revenueSplit}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {revenueSplit.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatPrice(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Tabel Penjualan</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() =>
                      exportAdminRowsToExcel({
                        rows: filteredSalesRows,
                        columns: salesExportColumns,
                        title: "laporan-penjualan",
                      })
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() =>
                      exportAdminRowsToPdf({
                        rows: filteredSalesRows,
                        columns: salesExportColumns,
                        title: "laporan-penjualan",
                        filterSummary: `Tahun: ${year ?? "Semua"}; Bulan: ${month ? MONTH_NAMES[month] : "Semua"}; Produk: ${salesProductFilter === ALL_FILTER ? "Semua" : salesProductFilter}`,
                      })
                    }
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {salesQuery.isError ? (
                <StateBox message="Gagal memuat laporan penjualan. Coba refresh halaman." />
              ) : salesQuery.isLoading ? (
                <StateBox message="Memuat data penjualan..." />
              ) : filteredSalesRows.length === 0 ? (
                <StateBox message="Tidak ada data penjualan yang cocok dengan filter." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12 px-4">No</TableHead>
                        <TableHead className="px-4">
                          <SortButton
                            label="Tanggal"
                            active={salesSort.key === "period_start"}
                            direction={salesSort.direction}
                            onClick={() => setSalesSortKey("period_start")}
                          />
                        </TableHead>
                        <TableHead className="px-4">
                          <SortButton
                            label="Produk/TO"
                            active={salesSort.key === "product_name"}
                            direction={salesSort.direction}
                            onClick={() => setSalesSortKey("product_name")}
                          />
                        </TableHead>
                        <TableHead className="px-4 text-right">
                          <SortButton
                            label="Harga"
                            active={salesSort.key === "average_price"}
                            direction={salesSort.direction}
                            onClick={() => setSalesSortKey("average_price")}
                          />
                        </TableHead>
                        <TableHead className="px-4 text-right">
                          <SortButton
                            label="Item Terjual"
                            active={salesSort.key === "total_item_sold"}
                            direction={salesSort.direction}
                            onClick={() => setSalesSortKey("total_item_sold")}
                          />
                        </TableHead>
                        <TableHead className="px-4 text-right">
                          <SortButton
                            label="Order"
                            active={salesSort.key === "order_count"}
                            direction={salesSort.direction}
                            onClick={() => setSalesSortKey("order_count")}
                          />
                        </TableHead>
                        <TableHead className="px-4 text-right">
                          <SortButton
                            label="Total"
                            active={salesSort.key === "total_sales"}
                            direction={salesSort.direction}
                            onClick={() => setSalesSortKey("total_sales")}
                          />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSalesRows.map((row, index) => (
                        <TableRow
                          key={`${row.product_name}-${row.year}-${row.month}`}
                        >
                          <TableCell className="px-4 text-gray-400">
                            {(safeSalesPage - 1) * salesPerPage + index + 1}
                          </TableCell>
                          <TableCell className="px-4 text-gray-600">
                            {monthLabel(row.month, row.year)}
                          </TableCell>
                          <TableCell className="px-4 font-medium text-gray-800">
                            {row.product_name}
                          </TableCell>
                          <TableCell className="px-4 text-right text-gray-700">
                            {formatPrice(row.average_price)}
                          </TableCell>
                          <TableCell className="px-4 text-right text-gray-700">
                            {Number(row.total_item_sold || 0).toLocaleString(
                              "id-ID",
                            )}
                          </TableCell>
                          <TableCell className="px-4 text-right text-gray-700">
                            {Number(row.order_count || 0).toLocaleString(
                              "id-ID",
                            )}
                          </TableCell>
                          <TableCell className="px-4 text-right font-semibold text-gray-900">
                            {formatPrice(row.total_sales)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="px-4 font-bold">
                          Grand Total
                        </TableCell>
                        <TableCell className="px-4 text-right font-bold">
                          {filteredSalesSummary.total_item_sold.toLocaleString(
                            "id-ID",
                          )}
                        </TableCell>
                        <TableCell className="px-4 text-right font-bold">
                          {filteredSalesSummary.order_count.toLocaleString(
                            "id-ID",
                          )}
                        </TableCell>
                        <TableCell className="px-4 text-right font-bold text-green-600">
                          {formatPrice(filteredSalesSummary.total_sales)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>

                  <SmartPagination
                    page={safeSalesPage}
                    totalItems={filteredSalesRows.length}
                    perPage={salesPerPage}
                    perPageOptions={PER_PAGE_OPTIONS}
                    itemLabel="baris"
                    onPageChange={setSalesPage}
                    onPerPageChange={(value) => {
                      setSalesPerPage(value);
                      setSalesPage(1);
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Fee"
              value={formatPrice(filteredFeeSummary.total_fee)}
              sub={`${formatPrice(filteredFeeSummary.fee_per_participant)} x peserta`}
              icon={Banknote}
              tone="bg-green-50 text-green-600"
            />
            <KpiCard
              label="Total Peserta"
              value={filteredFeeSummary.total_participants.toLocaleString(
                "id-ID",
              )}
              icon={Users}
              tone="bg-blue-50 text-blue-600"
            />
            <KpiCard
              label="Jumlah TO"
              value={filteredFeeSummary.tryout_count.toLocaleString("id-ID")}
              icon={Boxes}
              tone="bg-indigo-50 text-indigo-600"
            />
            <KpiCard
              label="Rata-rata Fee per TO"
              value={formatPrice(filteredFeeSummary.average_fee_per_tryout)}
              icon={CircleDollarSign}
              tone="bg-amber-50 text-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tren Fee per Waktu</CardTitle>
              </CardHeader>
              <CardContent>
                {feeQuery.isLoading ? (
                  <StateBox message="Memuat chart fee..." />
                ) : feeTrend.length === 0 ? (
                  <StateBox message="Belum ada data fee untuk periode ini." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={feeTrend}
                      margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value) =>
                          compactCurrency(Number(value))
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "Fee"
                            ? formatPrice(Number(value))
                            : Number(value).toLocaleString("id-ID")
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="total_fee"
                        name="Fee"
                        stroke="#004AAB"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="participant_count"
                        name="Peserta"
                        stroke="#16A34A"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fee per TO</CardTitle>
              </CardHeader>
              <CardContent>
                {feeQuery.isLoading ? (
                  <StateBox message="Memuat chart fee per TO..." />
                ) : feeByTryout.length === 0 ? (
                  <StateBox message="Belum ada data fee per TO." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={feeByTryout}
                      layout="vertical"
                      margin={{ left: 16, right: 16, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) =>
                          compactCurrency(Number(value))
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        dataKey="tryout_name"
                        type="category"
                        width={120}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value) => formatPrice(Number(value))}
                      />
                      <Bar
                        dataKey="total_fee"
                        name="Total Fee"
                        fill="#004AAB"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Tabel Fee TO</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() =>
                      exportAdminRowsToExcel({
                        rows: filteredFeeRows,
                        columns: feeExportColumns,
                        title: "laporan-fee-tryout",
                      })
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() =>
                      exportAdminRowsToPdf({
                        rows: filteredFeeRows,
                        columns: feeExportColumns,
                        title: "laporan-fee-tryout",
                        filterSummary: `Tahun: ${year ?? "Semua"}; Bulan: ${month ? MONTH_NAMES[month] : "Semua"}; Try Out: ${feeTryoutFilter === ALL_FILTER ? "Semua" : feeTryoutFilter}`,
                      })
                    }
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {feeQuery.isError ? (
                <StateBox message="Gagal memuat laporan fee TO. Coba refresh halaman." />
              ) : feeQuery.isLoading ? (
                <StateBox message="Memuat data fee TO..." />
              ) : filteredFeeRows.length === 0 ? (
                <StateBox message="Tidak ada data fee TO yang cocok dengan filter." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12 px-4">No</TableHead>
                        <TableHead className="px-4">
                          <SortButton
                            label="Tanggal"
                            active={feeSort.key === "period_start"}
                            direction={feeSort.direction}
                            onClick={() => setFeeSortKey("period_start")}
                          />
                        </TableHead>
                        <TableHead className="px-4">
                          <SortButton
                            label="Nama TO"
                            active={feeSort.key === "tryout_name"}
                            direction={feeSort.direction}
                            onClick={() => setFeeSortKey("tryout_name")}
                          />
                        </TableHead>
                        <TableHead className="px-4 text-right">
                          <SortButton
                            label="Peserta"
                            active={feeSort.key === "participant_count"}
                            direction={feeSort.direction}
                            onClick={() => setFeeSortKey("participant_count")}
                          />
                        </TableHead>
                        <TableHead className="px-4 text-right">
                          Fee per Peserta
                        </TableHead>
                        <TableHead className="px-4 text-right">
                          <SortButton
                            label="Total Fee"
                            active={feeSort.key === "total_fee"}
                            direction={feeSort.direction}
                            onClick={() => setFeeSortKey("total_fee")}
                          />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedFeeRows.map((row, index) => (
                        <TableRow
                          key={`${row.tryout_id}-${row.year}-${row.month}`}
                        >
                          <TableCell className="px-4 text-gray-400">
                            {(safeFeePage - 1) * feePerPage + index + 1}
                          </TableCell>
                          <TableCell className="px-4 text-gray-600">
                            {row.period_start
                              ? formatJakartaDate(row.period_start, {
                                  month: "long",
                                  year: "numeric",
                                })
                              : monthLabel(row.month, row.year)}
                          </TableCell>
                          <TableCell className="px-4 font-medium text-gray-800">
                            {row.tryout_name}
                          </TableCell>
                          <TableCell className="px-4 text-right text-gray-700">
                            {Number(row.participant_count || 0).toLocaleString(
                              "id-ID",
                            )}
                          </TableCell>
                          <TableCell className="px-4 text-right text-gray-700">
                            {formatPrice(
                              filteredFeeSummary.fee_per_participant,
                            )}
                          </TableCell>
                          <TableCell className="px-4 text-right font-semibold text-gray-900">
                            {formatPrice(row.total_fee)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="px-4 font-bold">
                          Grand Total
                        </TableCell>
                        <TableCell className="px-4 text-right font-bold">
                          {filteredFeeSummary.total_participants.toLocaleString(
                            "id-ID",
                          )}
                        </TableCell>
                        <TableCell className="px-4 text-right font-bold">
                          {formatPrice(filteredFeeSummary.fee_per_participant)}
                        </TableCell>
                        <TableCell className="px-4 text-right font-bold text-green-600">
                          {formatPrice(filteredFeeSummary.total_fee)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>

                  <SmartPagination
                    page={safeFeePage}
                    totalItems={filteredFeeRows.length}
                    perPage={feePerPage}
                    perPageOptions={PER_PAGE_OPTIONS}
                    itemLabel="baris"
                    onPageChange={setFeePage}
                    onPerPageChange={(value) => {
                      setFeePerPage(value);
                      setFeePage(1);
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  );
}
