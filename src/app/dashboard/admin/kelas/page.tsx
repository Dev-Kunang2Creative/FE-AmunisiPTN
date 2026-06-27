"use client";

import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import {
  GetAllKelasAdminForExportHandler,
  useGetAllKelasAdmin,
} from "@/http/kelas/get-all-kelas-admin";
import { useDeleteKelasAdmin } from "@/http/kelas/delete-kelas-admin";
import {
  AdminDataToolbar,
  AdminExportColumn,
  AdminFilterOption,
  AdminSortOption,
  getControlledAdminRows,
  useAdminTableControls,
} from "@/components/molecules/datatable/AdminDataControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/utils/get-error-message";
import { Kelas } from "@/types/kelas/kelas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DashboardTitle from "@/components/atoms/typography/DashboardTitle";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { kelasColumns } from "@/components/atoms/datacolumn/DataKelas";

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50];
const kelasExportColumns: AdminExportColumn<Kelas>[] = [
  { header: "Nama", accessor: (row) => row.name },
  {
    header: "Harga",
    accessor: (row) => row.price,
    format: (value) =>
      Number(value || 0) === 0
        ? "Gratis"
        : `Rp${Number(value || 0).toLocaleString("id-ID")}`,
  },
  {
    header: "Diskon",
    accessor: (row) => row.discount_price,
    format: (value) =>
      value == null ? "-" : `Rp${Number(value).toLocaleString("id-ID")}`,
  },
  { header: "Tiket Bonus", accessor: (row) => row.ticket_amount },
  { header: "Peserta", accessor: (row) => row.enrollments_count ?? 0 },
  {
    header: "Status",
    accessor: (row) => (row.is_active ? "Aktif" : "Nonaktif"),
  },
];
const kelasSortOptions: AdminSortOption<Kelas>[] = [
  {
    key: "newest",
    label: "Terbaru",
    compare: (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  },
  {
    key: "az",
    label: "Nama A-Z",
    compare: (a, b) => a.name.localeCompare(b.name, "id-ID"),
  },
  {
    key: "price-high",
    label: "Harga tertinggi",
    compare: (a, b) =>
      Number(b.discount_price ?? b.price) - Number(a.discount_price ?? a.price),
  },
  {
    key: "participants",
    label: "Peserta terbanyak",
    compare: (a, b) => (b.enrollments_count ?? 0) - (a.enrollments_count ?? 0),
  },
];

export default function AdminKelasPage() {
  const { data: session } = useSession();
  const token = session?.access_token || "";
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useGetAllKelasAdmin({
    token,
    page,
    perPage,
    search,
  });
  const kelasList = data?.data ?? [];
  const kelasFilters: AdminFilterOption<Kelas>[] = [
    {
      key: "status",
      label: "Semua Status",
      placeholder: "Status",
      options: [
        { label: "Aktif", value: "active" },
        { label: "Nonaktif", value: "inactive" },
      ],
      getValue: (row) => (row.is_active ? "active" : "inactive"),
    },
  ];
  const controls = useAdminTableControls({
    data: kelasList,
    searchFields: [(row) => row.name, (row) => row.description],
    filters: kelasFilters,
    sortOptions: kelasSortOptions,
    defaultSort: "newest",
  });
  const getExportRows = async () => {
    const rows = await GetAllKelasAdminForExportHandler(token, search);

    return getControlledAdminRows({
      data: rows,
      search: controls.search,
      filterValues: controls.filterValues,
      sortKey: controls.sortKey,
      searchFields: [(row) => row.name, (row) => row.description],
      filters: kelasFilters,
      sortOptions: kelasSortOptions,
    });
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { mutate: deleteKelas, isPending: isDeleting } = useDeleteKelasAdmin({
    onSuccess: () => {
      toast.success("Kelas berhasil dihapus!");
      if (kelasList.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
      queryClient.invalidateQueries({ queryKey: ["get-all-kelas-admin"] });
      setDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, "Gagal menghapus kelas.");
      toast.error(message);
    },
  });

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteKelas({ id: deleteId, token });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <DashboardTitle title="Kelas" />

      <div className="flex items-center justify-between">
        <AdminDataToolbar
          search={controls.search}
          onSearchChange={controls.setSearch}
          searchPlaceholder="Filter halaman ini..."
          filters={kelasFilters}
          filterValues={controls.filterValues}
          onFilterChange={controls.setFilter}
          sortOptions={kelasSortOptions}
          sortKey={controls.sortKey}
          onSortChange={controls.setSortKey}
          onReset={controls.reset}
          hasActiveControls={controls.hasActiveControls}
          rows={controls.rows}
          exportRows={getExportRows}
          exportColumns={kelasExportColumns}
          exportTitle="laporan-kelas"
          filterSummary={`Search server: ${search || "-"}; filter toolbar diterapkan ke semua data`}
        />

        <Link href="/dashboard/admin/kelas/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Kelas
          </Button>
        </Link>
      </div>

      <DataTable
        columns={kelasColumns({
          deleteHandler: handleDeleteClick,
        })}
        data={controls.rows}
        isLoading={isLoading}
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
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Kelas yang dihapus tidak
              dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
