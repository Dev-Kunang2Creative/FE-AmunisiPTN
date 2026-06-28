"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useGetUserById } from "@/http/users/get-user-by-id";
import { useAdminGetUserTicketReports } from "@/http/ticket-reports/admin-get-user-ticket-reports";
import { useGetAdminUserTryouts } from "@/http/tryout/get-admin-user-tryouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { DataTable } from "@/components/molecules/datatable/DataTable";
import { userTicketReportColumns } from "@/components/atoms/datacolumn/DataUserTicketReports";
import { userTryoutHistoryColumns } from "@/components/atoms/datacolumn/DataUserTryoutHistory";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminTableControls } from "@/components/molecules/datatable/AdminDataControls";
import {
  User as UserIcon,
  Mail,
  Phone,
  Ticket,
  Calendar,
  CalendarClock,
  Cake,
  Users,
  School,
  GraduationCap,
  Target,
  BookOpen,
} from "lucide-react";
import type { ReactNode } from "react";

const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: ReactNode;
}) => (
  <div className="flex gap-3 items-start p-3 rounded-lg transition-colors">
    <div className="mt-0.5 p-2 rounded-md bg-primary/10 text-primary shrink-0">
      <Icon className="h-4 w-4" />
    </div>
    <div className="space-y-1 overflow-hidden">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
        {label}
      </p>
      <p className="font-medium text-sm truncate" title={String(value)}>
        {value}
      </p>
    </div>
  </div>
);

export default function DashboardAdminUserDetailWrapper({
  userId,
}: {
  userId: string;
}) {
  const { data: session } = useSession();
  const token = session?.access_token || "";

  // Dialog states
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("tryouts");

  // Fetch Data
  const { data: userData, isPending: isUserPending } = useGetUserById({
    token,
    userId,
  });
  const user = userData?.data;

  // Ticket Reports State & Fetch
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketPerPage, setTicketPerPage] = useState(10);

  const {
    search: ticketSearchInput,
    setSearch: setTicketSearchInput,
    filterValues: ticketFilterValues,
    setFilter: setTicketFilter,
    sortKey: ticketSortKey,
    setSortKey: setTicketSortKey,
    reset: resetTicketFilters,
    hasActiveControls: hasTicketActiveControls,
  } = useAdminTableControls({ data: [] });

  const debouncedTicketSearch = useDebounce(ticketSearchInput, 500);

  const { data: ticketsData, isPending: isTicketsPending } =
    useAdminGetUserTicketReports({
      token,
      userId,
      page: ticketPage,
      per_page: ticketPerPage,
      search: debouncedTicketSearch,
    });

  // Tryouts State & Fetch
  const [tryoutPage, setTryoutPage] = useState(1);
  const [tryoutPerPage, setTryoutPerPage] = useState(10);

  const {
    search: tryoutSearchInput,
    setSearch: setTryoutSearchInput,
    filterValues: tryoutFilterValues,
    setFilter: setTryoutFilter,
    sortKey: tryoutSortKey,
    setSortKey: setTryoutSortKey,
    reset: resetTryoutFilters,
    hasActiveControls: hasTryoutActiveControls,
  } = useAdminTableControls({ data: [] });

  const debouncedTryoutSearch = useDebounce(tryoutSearchInput, 500);

  const { data: tryoutsData, isPending: isTryoutsPending } =
    useGetAdminUserTryouts({
      token,
      userId,
      page: tryoutPage,
      perPage: tryoutPerPage,
      search: debouncedTryoutSearch,
    });

  const handleAction = (action: string) => {
    switch (action) {
      case "suspend":
        setIsSuspendDialogOpen(true);
        break;
      case "ban":
        setIsBanDialogOpen(true);
        break;
      case "reset_password":
        toast.info("Fitur reset password belum tersedia.");
        break;
      case "view_tickets":
        setActiveTab("tickets");
        break;
      case "view_tryouts":
        setActiveTab("tryouts");
        break;
    }
  };

  const confirmSuspend = () => {
    toast.success(`Pengguna berhasil disuspend.`);
    setIsSuspendDialogOpen(false);
  };

  const confirmBan = () => {
    toast.success(`Pengguna berhasil dibanned.`);
    setIsBanDialogOpen(false);
  };

  if (isUserPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-semibold mb-2">
          Pengguna tidak ditemukan
        </h2>
        <p className="text-muted-foreground">
          Pengguna yang Anda cari mungkin telah dihapus atau tidak ada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card className="overflow-hidden">
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-primary/10">
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-black">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {user.name}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" /> {user.email}
              </p>
            </div>
            <div className="mt-2 md:mt-0 md:ml-auto">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 capitalize"
              >
                Role: {user.role}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <InfoItem
              icon={Phone}
              label="No. Telepon"
              value={user.phone_number || "-"}
            />
            <InfoItem
              icon={Cake}
              label="Tanggal Lahir"
              value={
                user.birth_date
                  ? new Date(user.birth_date).toLocaleDateString("id-ID", {
                      dateStyle: "long",
                    })
                  : "-"
              }
            />
            <InfoItem
              icon={Users}
              label="Jenis Kelamin"
              value={
                user.gender === "L"
                  ? "Laki-laki"
                  : user.gender === "P"
                    ? "Perempuan"
                    : "-"
              }
            />
            <InfoItem
              icon={School}
              label="Asal Sekolah"
              value={user.school_origin || "-"}
            />
            <InfoItem
              icon={GraduationCap}
              label="Kelas"
              value={user.grade_level || "-"}
            />
            <InfoItem
              icon={Target}
              label="Target PTN 1"
              value={user.target_university_1 || "-"}
            />
            <InfoItem
              icon={BookOpen}
              label="Target Jurusan 1"
              value={user.target_major_1 || "-"}
            />
            <InfoItem
              icon={Target}
              label="Target PTN 2"
              value={user.target_university_2 || "-"}
            />
            <InfoItem
              icon={BookOpen}
              label="Target Jurusan 2"
              value={user.target_major_2 || "-"}
            />
            <InfoItem
              icon={Ticket}
              label="Saldo Tiket"
              value={`${user.ticket_balance ?? 0} Tiket`}
            />
            <InfoItem
              icon={Calendar}
              label="Tanggal Bergabung"
              value={new Date(user.created_at).toLocaleDateString("id-ID", {
                dateStyle: "long",
              })}
            />
            <InfoItem
              icon={CalendarClock}
              label="Terakhir Diperbarui"
              value={new Date(user.updated_at).toLocaleDateString("id-ID", {
                dateStyle: "long",
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Laporan Tiket
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {user.statistics?.total_tickets ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tryout
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {user.statistics?.total_tryouts ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tryout Selesai
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {user.statistics?.completed_tryouts ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Skor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {user.statistics?.average_score ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[300px]">
          <TabsTrigger value="tryouts">Riwayat Tryout</TabsTrigger>
          <TabsTrigger value="tickets">Laporan Masalah</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-3">
          <DataTable
            columns={userTicketReportColumns}
            data={ticketsData?.data ?? []}
            isLoading={isTicketsPending}
            serverSidePagination={true}
            serverPageCount={ticketsData?.last_page ?? 1}
            serverTotalData={ticketsData?.total ?? 0}
            serverPageIndex={ticketPage - 1}
            serverPageSize={ticketPerPage}
            onServerPageChange={(newPageIndex) =>
              setTicketPage(newPageIndex + 1)
            }
            onServerPageSizeChange={(newSize) => {
              setTicketPerPage(newSize);
              setTicketPage(1);
            }}
          />
        </TabsContent>

        <TabsContent value="tryouts" className="mt-6">
          <DataTable
            columns={userTryoutHistoryColumns}
            data={tryoutsData?.data ?? []}
            isLoading={isTryoutsPending}
            serverSidePagination={true}
            serverPageCount={tryoutsData?.last_page ?? 1}
            serverTotalData={tryoutsData?.total ?? 0}
            serverPageIndex={tryoutPage - 1}
            serverPageSize={tryoutPerPage}
            onServerPageChange={(newPageIndex) =>
              setTryoutPage(newPageIndex + 1)
            }
            onServerPageSizeChange={(newSize) => {
              setTryoutPerPage(newSize);
              setTryoutPage(1);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Alert Dialogs for Moderation */}
      <AlertDialog
        open={isSuspendDialogOpen}
        onOpenChange={setIsSuspendDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin men-suspend pengguna{" "}
              <strong>{user.name}</strong>? Pengguna tidak akan bisa login
              selama masa suspend aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspend}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Ya, Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Banned Pengguna Secara Permanen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini sangat destruktif. Apakah Anda yakin ingin memblokir{" "}
              <strong>{user.name}</strong> secara permanen dari sistem?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBan}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ya, Banned Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
