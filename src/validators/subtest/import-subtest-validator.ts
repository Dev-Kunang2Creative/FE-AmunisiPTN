import z from "zod";

export const importSubtestSchema = z.object({
  file: z.custom<File>((val) => val instanceof File, {
    message: "File Excel wajib diunggah",
  }),
  name: z.string().min(1, "Nama subtes wajib diisi"),
  category: z.string().min(1, "Kategori subtes wajib diisi"),
  max_questions: z.number().min(1, "Jumlah soal maksimal harus lebih dari 0"),
});

export type ImportSubtestType = z.infer<typeof importSubtestSchema>;
