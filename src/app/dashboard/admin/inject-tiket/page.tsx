import DashboardTitle from "@/components/atoms/typography/DashboardTitle";
import DashboardInjectTiketWrapper from "@/components/organisms/dashboard/admin/inject-tiket/DashboardInjectTiketWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Injeksi Tiket VIP | Amunisi PTN",
  description: "Manajemen injeksi tiket gratis untuk pengguna VIP.",
};

export default function InjectTiketPage() {
  return (
    <main>
      <DashboardTitle title="Injeksi Tiket" />
      <DashboardInjectTiketWrapper />
    </main>
  );
}
