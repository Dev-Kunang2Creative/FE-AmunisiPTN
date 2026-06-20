export {};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runAudit() {
  console.log("===========================================");
  console.log("🕵️ AUDIT REPORT: SIMULASI TRYOUT 10 SUBTEST");
  console.log("===========================================\n");

  const backendDatabase: any = {};
  let totalSaved = 0;
  let activeMutations = 0;

  // Mock API: Submit Answer
  async function submitAnswerApi(questionId: string, answer: string, subtestId: string) {
    activeMutations++;
    console.log(`[API] Mengirim jawaban ${questionId}...`);
    
    // Simulate real-world network latency (300ms - 800ms)
    const latency = 300 + Math.random() * 500;
    await sleep(latency);
    
    // Check if subtest is already finished (Backend behavior)
    if (backendDatabase[`${subtestId}_status`] === "FINISHED") {
      console.log(`[Backend] ❌ Menolak jawaban ${questionId}! Subtest ${subtestId} sudah ditutup.`);
    } else {
      backendDatabase[questionId] = answer;
      totalSaved++;
      console.log(`[Backend] ✅ Jawaban ${questionId} tersimpan.`);
    }
    activeMutations--;
  }

  // Mock API: Finish Subtest
  async function finishSubtestApi(subtestId: string) {
    console.log(`[API] Mengirim instruksi Akhiri Subtest ${subtestId}...`);
    // Finish requests are usually faster (100ms)
    await sleep(100); 
    backendDatabase[`${subtestId}_status`] = "FINISHED";
    console.log(`[Backend] 🔒 Status Subtest ${subtestId} dikunci menjadi FINISHED.`);
  }

  const subtests = [
    { id: 'S1', count: 5 },
    { id: 'S2', count: 5 },
    { id: 'S3', count: 5 },
    { id: 'S4', count: 10 },
    { id: 'S5', count: 10 },
    { id: 'S6', count: 5 },
    { id: 'S7', count: 5 },
    { id: 'S8', count: 5 },
    { id: 'S9', count: 5 },
    { id: 'S10', count: 1 }
  ];

  let qNumber = 1;

  for (let i = 0; i < subtests.length; i++) {
    const subtest = subtests[i];
    console.log(`\n--- Memulai Subtest ${subtest.id} (${subtest.count} soal) ---`);
    
    // User answers all questions in the subtest
    for (let j = 0; j < subtest.count; j++) {
      const qId = `Q${qNumber}`;
      console.log(`[User] Memilih jawaban untuk ${qId}`);
      // Do NOT await, because in React the mutate call is asynchronous and fire-and-forget
      submitAnswerApi(qId, "A", subtest.id);
      
      // Simulate user clicking fast (500ms between clicks)
      // If user is fast, they might click faster than network latency!
      await sleep(200); 
      qNumber++;
    }

    // User finishes subtest
    console.log(`[User] Klik tombol Selesai untuk Subtest ${subtest.id}`);
    
    // In current un-fixed code, finish runs immediately WITHOUT waiting for activeMutations
    finishSubtestApi(subtest.id);

    // Simulate page transition delay
    await sleep(300);
  }

  // Wait for all remaining background requests to settle
  await sleep(2000);

  console.log("\n===========================================");
  console.log("📊 HASIL SIMULASI TRYOUT PENUH");
  console.log("===========================================");
  console.log(`Total Soal: 56`);
  console.log(`Total Jawaban Diterima Backend: ${totalSaved}`);
  console.log(`Total Kosong: ${56 - totalSaved}`);
  
  if (totalSaved < 56) {
    console.log("\n❌ KESIMPULAN BUG:");
    console.log("Kondisi 'Race Condition' berantai terjadi karena User menjawab dengan cepat,");
    console.log("namun internet/server memproses jawaban (300-800ms) lebih lambat dari pada");
    console.log("kecepatan user menekan tombol 'Selesai' (100ms).");
    console.log("Akibatnya, puluhan jawaban tertolak berturut-turut di setiap Subtest!");
  }
}

runAudit();
