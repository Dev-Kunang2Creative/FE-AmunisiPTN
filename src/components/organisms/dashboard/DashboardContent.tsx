"use client";

import HeroBanner from "@/components/molecules/dashboard/HeroBanner";
import InfoCardCarousel from "@/components/molecules/dashboard/InfoCardCarousel";
import LiveClassSection from "@/components/molecules/dashboard/LiveClassSection";
import DialogCompleteProfile from "@/components/molecules/dialog/DialogCompleteProfile";
import { useSession } from "next-auth/react";
import { useState } from "react";
import ReportIssueBanner from "@/components/molecules/dashboard/ReportIssueBanner";

export default function DashboardContent() {
  const { data: session } = useSession();
  const [profileDialogDismissed, setProfileDialogDismissed] = useState(false);
  const showProfileComplete =
    !!session?.user &&
    (!session.user.phone_number || !session.user.school_origin) &&
    !profileDialogDismissed;

  return (
    <>
      <section className="flex flex-col gap-8">
        <HeroBanner userName={session?.user?.name ?? "Amunisian"} />
        <ReportIssueBanner />
        <InfoCardCarousel />
        <LiveClassSection />
      </section>
      <DialogCompleteProfile
        open={showProfileComplete}
        onOpenChange={(open) => {
          if (!open) setProfileDialogDismissed(true);
        }}
      />
    </>
  );
}
