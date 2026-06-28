import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export default function DialogAnnouncementPopup() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hide_announcement_popup");
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("hide_announcement_popup", "true");
    }
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm p-0 overflow-hidden bg-white gap-0 border-none flex flex-col"
      >
        <DialogTitle className="sr-only">Pengumuman</DialogTitle>
        <DialogClose asChild>
          <Button
            variant="ghost"
            className="absolute top-3 right-3 text-white bg-red-600 hover:bg-red-700 hover:text-white rounded-full z-20 w-8 h-8 p-0 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>

        <div className="flex flex-col h-full w-full max-h-[95vh]">
          <div className="p-4 pb-0 flex-shrink-0 flex justify-center">
            <div
              className="w-full max-w-[250px] sm:max-w-[280px] relative rounded-lg overflow-hidden"
              style={{ aspectRatio: "4/5" }}
            >
              <Image
                src="/images/pop_up.png"
                alt="Pengumuman AmunisiPTN"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="p-4 space-y-4 flex-grow flex flex-col justify-end">
            <div className="text-[11px] text-gray-700 leading-relaxed text-justify">
              <p>
                🎉 <strong>+1 Tiket kompensasi</strong> diberikan untuk pengguna
                yang telah bertransaksi sebelum <strong>20 Juni 2026</strong>.
                Belum memenuhi syarat? Tenang, kamu tetap bisa mendapatkan tiket
                tambahan melalui giveaway dengan menukarkan kode di atas di menu{" "}
                <strong>Try Out → Redeem Akses</strong>. Jangan lupa juga isi{" "}
                <strong>Form Feedback</strong> atau{" "}
                <strong>Form Aduan Kendala</strong> melalui tombol di bawah ya
                💙. Masukan dari para Amunisian sangat membantu kami dalam
                mengembangkan <strong>AmunisiPTN</strong> menjadi lebih baik! 🚀
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="flex-1 bg-primary text-white hover:bg-primary/90"
              >
                <Link
                  href="https://docs.google.com/forms/d/1PhNYNECweKvq0-WatZVwc2bXRIjT5BoRlEEcFcYjYGY/edit"
                  target="_blank"
                >
                  Form Feedback
                </Link>
              </Button>
              <Button
                asChild
                className="flex-1 bg-primary text-white hover:bg-primary/90"
              >
                <Link
                  href="https://docs.google.com/forms/d/15_PKrySuif7eUNT3sq8Quv_n6v0fd8_cuCD718A15mQ/edit"
                  target="_blank"
                >
                  Form Aduan
                </Link>
              </Button>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
              <Checkbox
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) =>
                  setDontShowAgain(checked as boolean)
                }
              />
              <label
                htmlFor="dont-show"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-500 cursor-pointer"
              >
                Jangan tampilkan lagi
              </label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
