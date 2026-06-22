"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkImportQuestions } from "@/http/questions/bulk-import-questions";
import { useCreateSubtest } from "@/http/subtest/create-subtest";
import { FileSpreadsheet, Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import {
  importSubtestSchema,
  ImportSubtestType,
} from "@/validators/subtest/import-subtest-validator";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

interface DialogImportSubtestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DialogImportSubtest({
  open,
  onOpenChange,
}: DialogImportSubtestProps) {
  const { data: session } = useSession();
  const token = session?.access_token as string;
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
    imported_images?: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ImportSubtestType>({
    resolver: zodResolver(importSubtestSchema),
    defaultValues: {
      name: "",
      category: "",
      max_questions: 20,
    },
    mode: "onChange",
  });

  const { mutateAsync: createSubtest } = useCreateSubtest();
  const { mutateAsync: bulkImport } = useBulkImportQuestions();

  const isValidFile = (file: File) => {
    const name = file.name.toLowerCase();
    return name.endsWith(".csv") || name.endsWith(".xlsx");
  };

  const handleFileChange = async (file: File | null) => {
    setResult(null);
    form.setValue("file", file as any, { shouldValidate: true });
    
    if (file) {
      // Auto-fill Subtest Name based on File Name
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      form.setValue("name", fileNameWithoutExt, { shouldValidate: true });

      // Auto-count questions
      try {
        if (file.name.toLowerCase().endsWith(".xlsx")) {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const validRows = data.filter((row: any) => row && row.length > 0);
          
          const rowCount = Math.max(0, validRows.length - 1); // exclude header
          
          if (rowCount > 0) {
            form.setValue("max_questions", rowCount, { shouldValidate: true });
          }
        }
      } catch (error) {
        console.error("Gagal membaca file Excel:", error);
      }
    } else {
      form.setValue("name", "", { shouldValidate: true });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) handleFileChange(file);
    else toast.error("Format tidak valid. Gunakan file .xlsx atau .csv");
  };

  const onSubmit = async (data: ImportSubtestType) => {
    if (!data.file) return;

    setIsImporting(true);
    setResult(null);

    try {
      // 1. Create Subtest
      const createRes = await createSubtest({
        name: data.name,
        category: data.category,
        max_questions: data.max_questions,
      });

      const newSubtestId = createRes?.subtest?.id;

      if (!newSubtestId) {
        throw new Error("Gagal mendapatkan ID subtes baru.");
      }

      // 2. Import Questions to the new Subtest
      const importRes = await bulkImport({
        subtestId: newSubtestId,
        file: data.file,
        token,
      });

      setResult({
        imported: importRes.imported,
        skipped: importRes.skipped,
        errors: importRes.errors,
        imported_images: importRes.imported_images,
      });

      if (importRes.imported > 0) {
        toast.success(`Subtes berhasil dibuat! ${importRes.imported} soal diimpor${importRes.skipped > 0 ? `, ${importRes.skipped} dilewati` : ''}${importRes.imported_images ? ` & ${importRes.imported_images} gambar terbaca` : ''}.`);
        queryClient.invalidateQueries({ queryKey: ["get-all-subtests"] });
        
        setCountdown(3);
        let currentCount = 3;
        countdownIntervalRef.current = setInterval(() => {
          currentCount -= 1;
          if (currentCount <= 0) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setCountdown(null);
            form.reset();
            setResult(null);
            onOpenChange(false);
          } else {
            setCountdown(currentCount);
          }
        }, 1000);
      } else {
        toast.error("Subtes terbuat, tapi tidak ada soal yang berhasil diimpor.");
        queryClient.invalidateQueries({ queryKey: ["get-all-subtests"] });
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan!", {
        description: error.response?.data?.message || error.message || "Proses gagal.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(null);
    form.reset();
    setResult(null);
    onOpenChange(false);
  };

  const selectedFile = form.watch("file");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Import Cepat Subtes
          </DialogTitle>
          <DialogDescription>
            Buat subtes baru sekaligus mengimpor soal dari file Excel (.xlsx) atau CSV.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 mt-2" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-blue-400 bg-blue-50"
                : selectedFile
                ? "border-green-400 bg-green-50"
                : form.formState.errors.file
                ? "border-red-400 bg-red-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && isValidFile(file)) handleFileChange(file);
                else if (file) toast.error("Format tidak valid. Gunakan file .xlsx atau .csv");
              }}
            />

            {selectedFile ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-green-700">
                  <FileSpreadsheet className="w-8 h-8 shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-sm truncate max-w-60">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleFileChange(null); }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-medium">Klik atau Drag & Drop file Excel</p>
                <p className="text-xs text-gray-400">Nama file akan otomatis menjadi Nama Subtes</p>
              </div>
            )}
            {form.formState.errors.file && (
              <p className="text-sm text-red-500 mt-2">{form.formState.errors.file.message as string}</p>
            )}
          </div>

          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Nama Subtes <span className="text-red-500">*</span></FieldLabel>
                  <Input {...field} placeholder="Masukkan nama subtes" />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Kategori <span className="text-red-500">*</span></FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TPS">TPS</SelectItem>
                        <SelectItem value="Literasi">Literasi</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="max_questions"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Maks Soal <span className="text-red-500">*</span></FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Maks soal"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 space-y-2 text-sm ${result.imported > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex items-center gap-2 font-semibold">
                {result.imported > 0
                  ? <><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-green-800">Selesai</span></>
                  : <><AlertCircle className="w-4 h-4 text-red-600" /><span className="text-red-800">Gagal Impor Soal</span></>
                }
              </div>
              <div className="text-gray-700">
                Subtes dibuat.
                {result.imported > 0 && (
                  <span className="font-medium text-green-700 ml-1">
                    {result.imported} soal diimpor
                    {result.imported_images ? ` (${result.imported_images} gambar terbaca)` : ''}
                  </span>
                )}
                {result.skipped > 0 && <span className="font-medium text-red-600">, {result.skipped} baris dilewati</span>}.
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isImporting}>
              {result?.imported ? (countdown !== null ? `Tutup (${countdown}s)` : "Tutup") : "Batal"}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isImporting || (result !== null && result.imported > 0)}
            >
              {isImporting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : result?.imported ? (
                "Selesai"
              ) : (
                <>Simpan & Import</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
