"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { Download, Search, X, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ALL_VALUE = "__all__";

export type AdminExportColumn<T> = {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
  format?: (
    value: string | number | boolean | null | undefined,
    row: T,
  ) => string | number;
};

export type AdminFilterOption<T> = {
  key: string;
  label: string;
  placeholder: string;
  options: { label: string; value: string }[];
  getValue: (row: T) => string | number | boolean | null | undefined;
};

export type AdminSortOption<T> = {
  key: string;
  label: string;
  compare: (a: T, b: T) => number;
};

type UseAdminTableControlsProps<T> = {
  data: T[];
  searchFields?: ((row: T) => string | number | null | undefined)[];
  filters?: AdminFilterOption<T>[];
  sortOptions?: AdminSortOption<T>[];
  defaultSort?: string;
};

type GetControlledAdminRowsProps<T> = UseAdminTableControlsProps<T> & {
  search: string;
  filterValues: Record<string, string>;
  sortKey: string;
};

export function getControlledAdminRows<T>({
  data,
  search,
  filterValues,
  sortKey,
  searchFields = [],
  filters = [],
  sortOptions = [],
}: GetControlledAdminRowsProps<T>) {
  const normalizedSearch = search.trim().toLowerCase();
  const selectedSort = sortOptions.find((option) => option.key === sortKey);

  return data
    .filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        searchFields.some((field) =>
          String(field(row) ?? "")
            .toLowerCase()
            .includes(normalizedSearch),
        );

      if (!matchesSearch) return false;

      return filters.every((filter) => {
        const selected = filterValues[filter.key];
        if (!selected || selected === ALL_VALUE) return true;
        return String(filter.getValue(row) ?? "") === selected;
      });
    })
    .slice()
    .sort((a, b) => (selectedSort ? selectedSort.compare(a, b) : 0));
}

export function useAdminTableControls<T>({
  data,
  searchFields = [],
  filters = [],
  sortOptions = [],
  defaultSort,
}: UseAdminTableControlsProps<T>) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState(
    defaultSort || sortOptions[0]?.key || "",
  );

  const rows = useMemo(() => {
    return getControlledAdminRows({
      data,
      search,
      filterValues,
      sortKey,
      searchFields,
      filters,
      sortOptions,
    });
  }, [data, filterValues, filters, search, searchFields, sortKey, sortOptions]);

  const setFilter = (key: string, value: string) => {
    setFilterValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const reset = () => {
    setSearch("");
    setFilterValues({});
    setSortKey(defaultSort || sortOptions[0]?.key || "");
  };

  const hasActiveControls =
    Boolean(search.trim()) ||
    Object.values(filterValues).some((value) => value && value !== ALL_VALUE) ||
    Boolean(sortKey && sortKey !== (defaultSort || sortOptions[0]?.key || ""));

  return {
    search,
    setSearch,
    filterValues,
    setFilter,
    sortKey,
    setSortKey,
    rows,
    reset,
    hasActiveControls,
  };
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildExportRows<T>(rows: T[], columns: AdminExportColumn<T>[]) {
  return rows.map((row) =>
    columns.reduce<Record<string, string | number>>((acc, column) => {
      const value = column.accessor(row);
      acc[column.header] = column.format
        ? column.format(value, row)
        : String(value ?? "-");
      return acc;
    }, {}),
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function loadImageAsDataUrl(src: string) {
  const response = await fetch(src);
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const image = await loadImage(dataUrl);

  return {
    dataUrl,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  };
}

export async function exportAdminRowsToExcel<T>({
  rows,
  columns,
  title,
}: {
  rows: T[];
  columns: AdminExportColumn<T>[];
  title: string;
}) {
  if (!rows.length) {
    toast.error("Tidak ada data untuk diexport.");
    return;
  }

  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(buildExportRows(rows, columns));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${safeFileName(title)}-${today()}.xlsx`);
}

export async function exportAdminRowsToPdf<T>({
  rows,
  columns,
  title,
  filterSummary,
}: {
  rows: T[];
  columns: AdminExportColumn<T>[];
  title: string;
  filterSummary?: string;
}) {
  if (!rows.length) {
    toast.error("Tidak ada data untuk diexport.");
    return;
  }

  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const logo = await loadImageAsDataUrl("/images/logo/amunisiptn.png");
    const logoWidth = 96;
    const logoHeight =
      logo.height > 0 ? (logoWidth * logo.height) / logo.width : 32;
    doc.addImage(
      logo.dataUrl,
      "PNG",
      pageWidth - 40 - logoWidth,
      24,
      logoWidth,
      logoHeight,
    );
  } catch {
    // Logo is optional for export generation; keep the PDF downloadable if the asset fails to load.
  }

  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(9);
  doc.text(`Tanggal export: ${new Date().toLocaleString("id-ID")}`, 40, 58);
  if (filterSummary) {
    doc.text(`Filter aktif: ${filterSummary}`, 40, 74, { maxWidth: 760 });
  }

  autoTable(doc, {
    startY: filterSummary ? 92 : 76,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) =>
      columns.map((column) => {
        const value = column.accessor(row);
        return String(
          column.format ? column.format(value, row) : (value ?? "-"),
        );
      }),
    ),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [0, 74, 171] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${safeFileName(title)}-${today()}.pdf`);
}

type AdminDataToolbarProps<T> = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: AdminFilterOption<T>[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  sortOptions?: AdminSortOption<T>[];
  sortKey: string;
  onSortChange: (value: string) => void;
  onReset: () => void;
  hasActiveControls: boolean;
  rows: T[];
  exportRows?: T[] | (() => Promise<T[]>);
  exportColumns: AdminExportColumn<T>[];
  exportTitle: string;
  filterSummary?: string;
  children?: React.ReactNode;
};

export function AdminDataToolbar<T>({
  search,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filters = [],
  filterValues,
  onFilterChange,
  sortOptions = [],
  sortKey,
  onSortChange,
  onReset,
  hasActiveControls,
  rows,
  exportRows,
  exportColumns,
  exportTitle,
  filterSummary,
  children,
}: AdminDataToolbarProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const runExport = async (type: "excel" | "pdf") => {
    setIsExporting(true);
    try {
      const rowsToExport =
        typeof exportRows === "function"
          ? await exportRows()
          : (exportRows ?? rows);

      if (type === "excel") {
        await exportAdminRowsToExcel({
          rows: rowsToExport,
          columns: exportColumns,
          title: exportTitle,
        });
      } else {
        await exportAdminRowsToPdf({
          rows: rowsToExport,
          columns: exportColumns,
          title: exportTitle,
          filterSummary,
        });
      }
    } catch {
      toast.error(`Gagal membuat file ${type === "excel" ? "Excel" : "PDF"}.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
      <div className="flex flex-1 flex-wrap items-center gap-2 md:gap-3">
        {/* Search */}
        <div className="relative w-full md:max-w-sm flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 w-full bg-background"
          />
        </div>

        {/* Filter & Export Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="bg-background relative">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Filter & Export</span>
              <span className="sm:hidden">Menu</span>
              {hasActiveControls && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-primary" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter & Export</SheetTitle>
              <SheetDescription>
                Sesuaikan tampilan data dan ekspor laporan ke format Excel atau
                PDF.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4">
              {filters.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Filter Data</h4>
                  <div className="flex flex-col gap-3">
                    {filters.map((filter) => (
                      <div key={filter.key} className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">
                          {filter.label}
                        </label>
                        <Select
                          value={filterValues[filter.key] || ALL_VALUE}
                          onValueChange={(value) =>
                            onFilterChange(filter.key, value)
                          }
                        >
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder={filter.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ALL_VALUE}>
                              Semua {filter.label}
                            </SelectItem>
                            {filter.options.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sorting */}
              {sortOptions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Urutkan Data</h4>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Pilih urutan
                    </label>
                    <Select value={sortKey} onValueChange={onSortChange}>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Urutkan" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Reset Filters */}
              {hasActiveControls && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onReset}
                  className="w-full justify-center text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset Filter
                </Button>
              )}

              <hr className="border-border" />

              {/* Export Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Export Laporan</h4>
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => runExport("excel")}
                    disabled={isExporting}
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => runExport("pdf")}
                    disabled={isExporting}
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
