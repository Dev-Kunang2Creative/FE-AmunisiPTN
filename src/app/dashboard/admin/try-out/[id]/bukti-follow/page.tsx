import DashboardTitle from "@/components/atoms/typography/DashboardTitle";
import DashboardAdminBuktiFollowWrapper from "@/components/organisms/dashboard/admin/tryout/DashboardAdminBuktiFollowWrapper";

interface DashboardAdminBuktiFollowPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardAdminBuktiFollowPage({
  params,
}: DashboardAdminBuktiFollowPageProps) {
  const { id } = await params;

  return (
    <main>
      <DashboardTitle
        title="Bukti Follow Instagram"
        showBackButton
        backFallbackHref={`/dashboard/admin/try-out/${id}`}
      />
      <DashboardAdminBuktiFollowWrapper id={id} />
    </main>
  );
}
