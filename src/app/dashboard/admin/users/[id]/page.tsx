import DashboardTitle from "@/components/atoms/typography/DashboardTitle";
import DashboardAdminUserDetailWrapper from "@/components/organisms/dashboard/admin/users/DashboardAdminUserDetailWrapper";

export const metadata = {
  title: "Detail Pengguna - AmunisiPTN",
  description: "Halaman detail pengguna AmunisiPTN",
};

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  return (
    <main className="space-y-6 pb-8">
      <DashboardTitle title="Detail Pengguna" />
      <DashboardAdminUserDetailWrapper userId={id} />
    </main>
  );
}
