"use client";

import AlertDialogDeleteUser from "@/components/atoms/alert-dialog/user/AlertDialogDeleteUser";
import {
  AdminDataToolbar,
  AdminExportColumn,
  AdminFilterOption,
  AdminSortOption,
  getControlledAdminRows,
  useAdminTableControls,
} from "@/components/molecules/datatable/AdminDataControls";
import { userColumns } from "@/components/atoms/datacolumn/DataUser";
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteUser } from "@/http/users/delete-user";
import {
  GetAllUsersForExportHandler,
  useGetAllUsers,
} from "@/http/users/get-all-users";
import type { User } from "@/types/user/user";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { useInjectVipTickets } from "@/http/users/inject-vip-tickets";
import { useGetUserTicketLogs } from "@/http/users/get-user-ticket-logs";
import { ticketLogColumns } from "@/components/atoms/datacolumn/DataInjectTiket";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const userExportColumns: AdminExportColumn<User>[] = [
  { header: "Nama", accessor: (row) => row.name },
  { header: "Email", accessor: (row) => row.email },
  {
    header: "Role",
    accessor: (row) => (row.role === "admin" ? "Admin" : "Siswa"),
  },
  { header: "No HP", accessor: (row) => row.phone_number || "-" },
  { header: "Asal Sekolah", accessor: (row) => row.school_origin || "-" },
  { header: "Kelas", accessor: (row) => row.grade_level || "-" },
  { header: "Tiket", accessor: (row) => row.ticket_balance ?? 0 },
  {
    header: "Tanggal Daftar",
    accessor: (row) => new Date(row.created_at).toLocaleDateString("id-ID"),
  },
];
const userSortOptions: AdminSortOption<User>[] = [
  {
    key: "newest",
    label: "Terbaru",
    compare: (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  },
  {
    key: "oldest",
    label: "Terlama",
    compare: (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  },
  {
    key: "az",
    label: "Nama A-Z",
    compare: (a, b) => a.name.localeCompare(b.name, "id-ID"),
  },
  {
    key: "za",
    label: "Nama Z-A",
    compare: (a, b) => b.name.localeCompare(a.name, "id-ID"),
  },
  {
    key: "tickets",
    label: "Tiket terbanyak",
    compare: (a, b) => (b.ticket_balance ?? 0) - (a.ticket_balance ?? 0),
  },
];

export default function DashboardAdminUserWrapper() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState<User | null>(
    null,
  );

  // Single Form State
  const [selectedTicketUser, setSelectedTicketUser] = useState<User | null>(
    null,
  );
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [singleMode, setSingleMode] = useState<"inject" | "pull">("inject");
  const [singleAmount, setSingleAmount] = useState(1);
  const [singleDescription, setSingleDescription] =
    useState("Kompensasi Khusus");
  const [isSingleConfirmOpen, setIsSingleConfirmOpen] = useState(false);

  const { data, isPending } = useGetAllUsers({
    token: session?.access_token as string,
    page,
    perPage,
    search: debouncedSearch,
    options: { enabled: status === "authenticated" },
  });
  const userRows = data?.data ?? [];
  const userFilters: AdminFilterOption<User>[] = [
    {
      key: "role",
      label: "Semua Role",
      placeholder: "Role",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Siswa", value: "user" },
      ],
      getValue: (row) => row.role,
    },
  ];
  const controls = useAdminTableControls({
    data: userRows,
    searchFields: [
      (row) => row.name,
      (row) => row.email,
      (row) => row.school_origin,
      (row) => row.grade_level,
    ],
    filters: userFilters,
    sortOptions: userSortOptions,
    defaultSort: "newest",
  });

  const getExportRows = async () => {
    const rows = await GetAllUsersForExportHandler(
      session?.access_token as string,
      debouncedSearch,
    );

    return getControlledAdminRows({
      data: rows,
      search: "", // disable local search for export since it's already filtered by server
      filterValues: controls.filterValues,
      sortKey: controls.sortKey,
      searchFields: [
        (row) => row.name,
        (row) => row.email,
        (row) => row.school_origin,
        (row) => row.grade_level,
      ],
      filters: userFilters,
      sortOptions: userSortOptions,
    });
  };

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser({
    onError: (error) => {
      toast.error("Gagal menghapus pengguna!", {
        description: error.response?.data?.message || "Terjadi kesalahan.",
      });
    },
    onSuccess: () => {
      setSelectedDeleteUser(null);
      setIsDeleteDialogOpen(false);
      toast.success("Berhasil menghapus pengguna!");
      queryClient.invalidateQueries({ queryKey: ["get-all-users"] });
    },
  });

  const injectMutation = useInjectVipTickets({
    token: session?.access_token as string,
    options: {
      onSuccess: (res) => {
        toast.success(res.message);
        setIsSingleConfirmOpen(false);
        setIsSingleModalOpen(false);
        setSelectedTicketUser(null);
        queryClient.invalidateQueries({ queryKey: ["get-all-users"] });
      },
      onError: (err: any) => {
        toast.error("Gagal melakukan injeksi tiket", {
          description: err.response?.data?.message || err.message,
        });
        setIsSingleConfirmOpen(false);
      },
    },
  });

  const handleDeleteUser = () => {
    if (selectedDeleteUser) {
      deleteUser({
        id: selectedDeleteUser.id,
        token: session?.access_token as string,
      });
    }
  };

  const handleSingleExecute = () => {
    if (!selectedTicketUser) return;
    injectMutation.mutate({
      amount: singleAmount,
      description: singleDescription,
      filter_type: "single_user",
      user_id: selectedTicketUser.id,
      action: singleMode,
    });
  };

  return (
    <section>
      <div className="space-y-6">
        <AdminDataToolbar
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari nama atau email pengguna..."
          filters={userFilters}
          filterValues={controls.filterValues}
          onFilterChange={controls.setFilter}
          sortOptions={userSortOptions}
          sortKey={controls.sortKey}
          onSortChange={controls.setSortKey}
          onReset={controls.reset}
          hasActiveControls={controls.hasActiveControls || Boolean(searchInput)}
          rows={controls.rows}
          exportRows={getExportRows}
          exportColumns={userExportColumns}
          exportTitle="laporan-pengguna"
          filterSummary={`Search server: ${debouncedSearch || "-"}; filter toolbar diterapkan ke semua data`}
        />

        <DataTable
          columns={userColumns({
            deleteUserHandler: (user) => {
              setSelectedDeleteUser(user);
              setIsDeleteDialogOpen(true);
            },
            setSelectedUser: setSelectedTicketUser,
            setSingleMode,
            setIsSingleModalOpen,
          })}
          data={controls.rows}
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
      </div>

      {selectedDeleteUser && (
        <AlertDialogDeleteUser
          open={isDeleteDialogOpen}
          setOpen={setIsDeleteDialogOpen}
          confirmDelete={handleDeleteUser}
          isPending={isDeleting}
        />
      )}

      {/* Modal Single Input Form */}
      <Dialog open={isSingleModalOpen} onOpenChange={setIsSingleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {singleMode === "inject"
                ? "Beri Tiket Spesial"
                : "Tarik Tiket Pengguna"}
            </DialogTitle>
            <DialogDescription>
              {singleMode === "inject"
                ? "Berikan tiket tambahan khusus untuk"
                : "Tarik tiket dari saldo"}{" "}
              <strong>{selectedTicketUser?.name}</strong> (
              {selectedTicketUser?.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Jumlah Tiket</Label>
              <Input
                type="number"
                min={1}
                value={singleAmount}
                onChange={(e) => setSingleAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Pesan Log Khusus</Label>
              <Input
                type="text"
                placeholder="Contoh: Kompensasi Khusus"
                value={singleDescription}
                onChange={(e) => setSingleDescription(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Pesan log akan menggunakan nama pengirim &quot;Sistem
                AmunisiPTN&quot;.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSingleModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                setIsSingleModalOpen(false);
                setIsSingleConfirmOpen(true);
              }}
            >
              Lanjut Eksekusi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Single Confirmation */}
      <AlertDialog
        open={isSingleConfirmOpen}
        onOpenChange={setIsSingleConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Konfirmasi {singleMode === "inject" ? "Pemberian" : "Penarikan"}{" "}
              Tiket
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {singleMode === "inject" ? "Berikan" : "Tarik"}{" "}
                <strong>{singleAmount} tiket</strong>{" "}
                {singleMode === "inject" ? "kepada" : "dari"}{" "}
                <strong>{selectedTicketUser?.name}</strong> dengan pesan:{" "}
                <span className="italic">&quot;{singleDescription}&quot;</span>?
              </p>
              {singleMode === "pull" && (
                <p className="text-red-600 dark:text-red-400 font-semibold mt-2">
                  Jika saldo saat ini kurang dari {singleAmount}, maka saldo
                  akan ditarik seluruhnya hingga 0.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={injectMutation.isPending}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSingleExecute();
              }}
              disabled={injectMutation.isPending}
              className={
                singleMode === "pull"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary"
              }
            >
              {injectMutation.isPending
                ? "Mengeksekusi..."
                : singleMode === "pull"
                  ? "Tarik Tiket"
                  : "Berikan Tiket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
