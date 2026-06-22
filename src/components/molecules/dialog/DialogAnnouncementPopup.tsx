import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import Link from "next/link";

export default function DialogAnnouncementPopup() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hide_announcement_popup");
    if (!hasSeenPopup) {
      setOpen(true);
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
        showCloseButton={true}
        className="sm:max-w-xl p-0 overflow-hidden bg-white gap-0 border-none"
      >
        <div className="w-full aspect-video relative bg-blue-50">
          <Image
            src="/images/pop_up.png"
            alt="Pengumuman AmunisiPTN"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
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
      </DialogContent>
    </Dialog>
  );
}
