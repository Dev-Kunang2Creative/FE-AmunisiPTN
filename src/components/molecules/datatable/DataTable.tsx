"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  defaultPageSize?: number;
  disablePagination?: boolean;
  tableFooter?: React.ReactNode;

  serverSidePagination?: boolean;
  serverPageCount?: number;
  serverTotalData?: number;
  serverPageIndex?: number;
  serverPageSize?: number;
  onServerPageChange?: (pageIndex: number) => void;
  onServerPageSizeChange?: (pageSize: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  isError = false,
  errorMessage = "Gagal memuat data.",
  defaultPageSize = 10,
  disablePagination = false,
  tableFooter,

  serverSidePagination = false,
  serverPageCount = 1,
  serverTotalData = 0,
  serverPageIndex = 0,
  serverPageSize = 10,
  onServerPageChange,
  onServerPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [pageIndex, setPageIndex] = React.useState(0);

  const activePageIndex = serverSidePagination ? serverPageIndex : pageIndex;
  const activePageSize = serverSidePagination ? serverPageSize : pageSize;
  const effectivePageSize = disablePagination ? 9999 : activePageSize;

  const handlePageChange = (newPageIndex: number) => {
    if (serverSidePagination && onServerPageChange) {
      onServerPageChange(newPageIndex);
    } else {
      setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (serverSidePagination && onServerPageSizeChange) {
      onServerPageSizeChange(newPageSize);
    } else {
      setPageSize(newPageSize);
      setPageIndex(0);
    }
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination: {
        pageIndex: disablePagination ? 0 : activePageIndex,
        pageSize: effectivePageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (disablePagination) return;
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: activePageIndex, pageSize: effectivePageSize })
          : updater;
      handlePageChange(next.pageIndex);
      if (next.pageSize !== effectivePageSize) {
        handlePageSizeChange(next.pageSize);
      }
    },
    manualPagination: serverSidePagination,
    pageCount: serverSidePagination ? serverPageCount : undefined,
  });

  // Reset ke halaman 1 jika data berubah dan bukan server side
  React.useEffect(() => {
    if (!serverSidePagination) {
      setPageIndex(0);
    }
  }, [data, serverSidePagination]);

  const pageCountToUse = serverSidePagination
    ? serverPageCount
    : table.getPageCount();
  const currentPageToUse = activePageIndex + 1;
  const totalDataCount = serverSidePagination ? serverTotalData : data.length;
  const from = activePageIndex * activePageSize + 1;
  const to = Math.min((activePageIndex + 1) * activePageSize, totalDataCount);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader className="table-header">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-red-500"
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map(
                (_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {columns.map((_, colIndex) => (
                      <TableCell key={`skeleton-${rowIndex}-${colIndex}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ),
              )
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`table-row-hover ${
                    index % 2 === 0 ? "table-row-even" : "table-row-odd"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const context = cell.getContext();
                    const rowProxy = Object.create(context.row);
                    rowProxy.index = activePageIndex * activePageSize + index;
                    const modifiedContext = {
                      ...context,
                      row: rowProxy,
                    };

                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          modifiedContext,
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {tableFooter}
        </Table>
      </div>

      {!isLoading && totalDataCount > 0 && !disablePagination && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-sm">
            <span>
              {totalDataCount > 0
                ? `Menampilkan ${from}–${to} dari ${totalDataCount} data`
                : "Tidak ada data"}
            </span>
          </div>
          <Pagination className="mx-0 w-auto">
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (activePageIndex > 0)
                      handlePageChange(Math.max(0, activePageIndex - 1));
                  }}
                  className={`h-9 w-9 p-0 cursor-pointer border border-primary/60 text-gray-900 hover:bg-primary/10 ${
                    activePageIndex === 0
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                />
              </PaginationItem>

              {(() => {
                const getPaginationItems = (current: number, total: number) => {
                  if (total <= 6) {
                    return Array.from({ length: total }, (_, i) => i + 1);
                  }
                  if (current <= 3) {
                    return [1, 2, 3, "...", total - 1, total];
                  }
                  if (current >= total - 2) {
                    return [1, 2, "...", total - 2, total - 1, total];
                  }
                  return [
                    1,
                    "...",
                    current - 1,
                    current,
                    current + 1,
                    "...",
                    total,
                  ];
                };

                return getPaginationItems(currentPageToUse, pageCountToUse).map(
                  (page, i) => {
                    if (page === "...") {
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis className="h-9 w-9" />
                        </PaginationItem>
                      );
                    }
                    const isCurrent = page === currentPageToUse;
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange((page as number) - 1);
                          }}
                          isActive={isCurrent}
                          className={`h-9 w-9 p-0 cursor-pointer border ${
                            isCurrent
                              ? "bg-primary text-white hover:bg-primary border-primary hover:text-white"
                              : "text-gray-900 border-primary/60 hover:bg-primary/10"
                          }`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  },
                );
              })()}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (activePageIndex < pageCountToUse - 1)
                      handlePageChange(
                        Math.min(pageCountToUse - 1, activePageIndex + 1),
                      );
                  }}
                  className={`h-9 w-9 p-0 cursor-pointer border border-primary/60 text-gray-900 hover:bg-primary/10 ${
                    activePageIndex >= pageCountToUse - 1
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
