const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runAudit() {
  console.log("===========================================");
  console.log("🕵️ AUDIT REPORT: SIMULASI BUG JAWABAN UJIAN");
  console.log("===========================================\n");

  // SIMULASI 1: BUG DEBOUNCE ESSAY
  console.log(">>> [SIMULASI 1] Uji Coba Kecepatan Ketik Essay & Pindah Soal");
  let debounceTimer: NodeJS.Timeout | null = null;
  let backendDatabase: any = {};
  
  // Fungsi tiruan dari QuestionView.tsx (handleEssayChange)
  function handleEssayChange(questionId: string, value: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    
    debounceTimer = setTimeout(() => {
      // Simulasikan pemanggilan API ke Backend
      backendDatabase[questionId] = value;
      console.log(`[Backend] Jawaban Essay tersimpan untuk Soal: ${questionId} -> "${value}"`);
    }, 650);
  }

  // Aksi User:
  console.log("[User] Mengetik di Soal 1...");
  handleEssayChange("SOAL_1", "Ini jawaban essay soal satu.");
  
  // User langsung klik "Next" dalam 200ms (kurang dari 650ms)
  await sleep(200); 
  console.log("[User] Klik Next dengan cepat!");
  
  console.log("[User] Mengetik di Soal 2...");
  handleEssayChange("SOAL_2", "Ini jawaban essay soal dua.");

  // Tunggu 1 detik agar semua timeout selesai
  await sleep(1000);
  
  console.log("--- HASIL SIMULASI 1 ---");
  console.log("Database Backend menerima:", backendDatabase);
  if (!backendDatabase["SOAL_1"]) {
    console.log("❌ CELAH BUG DITEMUKAN: Jawaban Soal 1 HILANG secara gaib karena sistem penundaan (debounce) ditimpa oleh Soal 2!");
  }

  console.log("\n===========================================\n");

  // SIMULASI 2: BUG RACE CONDITION "SELESAI"
  console.log(">>> [SIMULASI 2] Uji Coba Klik Jawaban Terakhir & Selesai");
  let subtestStatus = "IN_PROGRESS";
  
  // Fungsi tiruan dari page.tsx (Submit API)
  async function submitAnswerApi(questionId: string, answer: string) {
    console.log(`[API] Mengirim jawaban ${questionId}...`);
    await sleep(500); // Simulasi delay internet (500ms)
    
    if (subtestStatus === "FINISHED") {
      console.log(`[Backend] ❌ Menolak jawaban ${questionId}! Error: Subtest sudah ditutup!`);
      return false;
    }
    
    backendDatabase[questionId] = answer;
    console.log(`[Backend] ✅ Jawaban ${questionId} berhasil disimpan.`);
    return true;
  }

  // Fungsi tiruan Finish API
  async function finishSubtestApi() {
    console.log(`[API] Mengirim instruksi Akhiri Ujian...`);
    await sleep(100); // Instruksi finish biasanya lebih ringan/cepat (100ms)
    subtestStatus = "FINISHED";
    console.log(`[Backend] 🔒 Status Subtest dikunci menjadi FINISHED.`);
  }

  // Aksi User:
  console.log("[User] Memilih jawaban 'A' untuk Soal 56...");
  const promiseAnswer = submitAnswerApi("SOAL_56", "A");
  
  // User super cepat klik Selesai (beda 50ms)
  await sleep(50);
  console.log("[User] Klik tombol 'Selesai' dengan sangat cepat!");
  const promiseFinish = finishSubtestApi();

  await Promise.all([promiseAnswer, promiseFinish]);

  console.log("--- HASIL SIMULASI 2 ---");
  console.log("Database Backend menerima:", backendDatabase);
  if (!backendDatabase["SOAL_56"]) {
    console.log("❌ CELAH BUG DITEMUKAN: Jawaban terakhir (Soal 56) DITOLAK oleh server karena status ujian keburu ditutup!");
  }
}

runAudit();
