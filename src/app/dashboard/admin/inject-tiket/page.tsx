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
      <div className="mb-6">
        <DashboardTitle title="Injeksi Tiket VIP" />
        <p className="text-sm text-gray-500 mt-1">
          Pratinjau dan berikan tiket kompensasi secara massal kepada pengguna yang memiliki riwayat transaksi sukses.
        </p>
      </div>

      <DashboardInjectTiketWrapper />
    </main>
  );
}
