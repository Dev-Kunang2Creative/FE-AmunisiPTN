import Link from "next/link";
import { Info } from "lucide-react";

export default function ReportIssueBanner() {
  return (
    <Link href="/dashboard/ticket-report" className="block w-full">
      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 flex gap-3 items-start text-sm">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[15px] mb-1">
            Ada kendala saat menggunakan platform kami?
          </p>
          <p className="leading-relaxed text-sm">
            Yuk, laporkan kendala yang kamu temui! Dapatkan langsung 1 tiket
            tryout gratis sebagai apresiasi dari kami setelah kamu membuat
            laporan.
          </p>
        </div>
      </div>
    </Link>
  );
}
