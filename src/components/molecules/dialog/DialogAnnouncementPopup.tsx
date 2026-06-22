import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
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
      }, 500); // Beri jeda 0.5 detik agar halaman selesai dimuat sepenuhnya
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
        className="sm:max-w-md p-0 overflow-hidden bg-white gap-0 border-none max-h-[90vh] flex flex-col"
      >
        <DialogClose asChild>
          <Button
            variant="ghost"
            className="absolute top-3 right-3 text-white bg-red-600 hover:bg-red-700 hover:text-white rounded-full z-20 w-8 h-8 p-0 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>

        <div className="overflow-y-auto">
          <div className="p-4 sm:p-6 pb-0">
            <div className="w-full relative rounded-lg overflow-hidden" style={{ aspectRatio: '4/5' }}>
              <Image
                src="/images/pop_up.png"
                alt="Pengumuman AmunisiPTN"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-4 text-xs sm:text-[13px] text-gray-700 leading-relaxed">
              <p>
                <strong>+1 Tiket kompensasi</strong> hanya diberikan kepada pengguna yang telah melakukan transaksi sebelum <strong>20 Juni 2026</strong>. Namun tenang! 🎉 Kamu tetap bisa mendapatkan tiket tambahan melalui giveaway dengan memasukkan kode di atas. Buka halaman <strong>Try Out</strong>, lalu klik <strong>Redeem Akses</strong> untuk menukarkan kode.
              </p>

              <p>
                Kami juga sangat membutuhkan masukan dari para <strong>Amunisian</strong> 💙. Jika memiliki saran, kritik, atau mengalami kendala saat menggunakan platform, silakan isi <strong>Form Feedback</strong> dan <strong>Form Aduan Kendala</strong> melalui tombol di bawah. Dukungan dan masukan kalian sangat berarti bagi pengembangan <strong>AmunisiPTN</strong>. 🚀
              </p>
            </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1 bg-primary text-white hover:bg-primary/90">
              <Link href="https://docs.google.com/forms/d/1PhNYNECweKvq0-WatZVwc2bXRIjT5BoRlEEcFcYjYGY/edit" target="_blank">
                Form Feedback
              </Link>
            </Button>
            <Button asChild className="flex-1 bg-primary text-white hover:bg-primary/90">
              <Link href="https://docs.google.com/forms/d/15_PKrySuif7eUNT3sq8Quv_n6v0fd8_cuCD718A15mQ/edit" target="_blank">
                Form Aduan
              </Link>
            </Button>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
            <Checkbox 
              id="dont-show" 
              checked={dontShowAgain} 
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)} 
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
