"use client";

import { useEffect, useRef, useState } from "react";
import type { ExamQuestion } from "@/types/exam/exam";
import RichTextRenderer from "@/components/atoms/rich-text/RichTextRenderer";
import RichTextEditor from "@/components/atoms/rich-text/RichTextEditor";
import {
  getReviewOptionState,
  type TryoutLayoutMode,
} from "@/utils/tryout-review";

interface QuestionViewProps {
  question: ExamQuestion;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string | null, questionId?: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  mode?: TryoutLayoutMode;
  currentNumber: number;
  totalQuestions: number;
  subtestName: string;
}

export default function QuestionView({
  question,
  selectedAnswer,
  onSelectAnswer,
  onPrev,
  onNext,
  onFinish,
  hasPrev,
  hasNext,
  mode = "attempt",
  currentNumber,
  totalQuestions,
  subtestName,
}: QuestionViewProps) {
  const isReviewMode = mode === "review" || mode === "admin-review";
  const isEssay = question.question_type === "essay";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fontSize, setFontSize] = useState(16);
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

  const getSubtestLabel = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("penalaran umum (induktif)")) return "PUI";
    if (n.includes("penalaran umum (deduktif)")) return "PUD";
    if (n.includes("penalaran kuantitatif") && n.includes("penalaran umum")) return "PUK";
    if (n.includes("pengetahuan dan pemahaman umum")) return "PPU";
    if (n.includes("pemahaman bacaan dan menulis")) return "PBM";
    if (n.includes("pengetahuan kuantitatif")) return "PK";
    if (n.includes("literasi bahasa indonesia") || n.includes("literasi dalam bahasa indonesia")) return "LBI";
    if (n.includes("literasi bahasa inggris") || n.includes("literasi dalam bahasa inggris")) return "LBE";
    if (n.includes("penalaran matematika")) return "PM";
    if (n.includes("wawasan kebangsaan")) return "WB";
    return name.substring(0, 3).toUpperCase();
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleOptionClick = (optionKey: string) => {
    if (isReviewMode) return;

    if (selectedAnswer === optionKey) {
      onSelectAnswer(null);
    } else {
      onSelectAnswer(optionKey);
    }
  };

  const handleEssayChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const hasContent = value.replace(/<[^>]*>/g, "").trim().length > 0;
      onSelectAnswer(hasContent ? value : null, question.id);
    }, 650);
  };

  return (
    <div className="flex flex-col lg:flex-1 lg:min-h-0">
      <div className="p-6 lg:p-8 lg:flex-1 lg:overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
              {getSubtestLabel(subtestName)}
            </span>
            <span className="text-sm text-gray-600">
              Soal <strong className="text-gray-900">{currentNumber}</strong> dari <strong className="text-gray-900">{totalQuestions}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-semibold shadow-sm">
            <button onClick={decreaseFontSize} className="hover:text-[#004AAB] transition-colors px-1">-</button>
            <span className="w-5 text-center">{fontSize}</span>
            <button onClick={increaseFontSize} className="hover:text-[#004AAB] transition-colors px-1">+</button>
          </div>
        </div>

        {question.question_image_url && (
          <div className="mb-6 flex justify-center">
            <div className="relative max-w-full max-h-75 w-auto">
              <img
                src={question.question_image_url}
                alt="Soal"
                className="max-h-75 w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}>
          <RichTextRenderer
            html={question.question_text}
            className="mb-6 text-gray-800 font-normal"
          />
        </div>

        {isEssay ? (
          <div className="space-y-4">
            {isReviewMode ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="mb-3 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  Essay: Otomatis Benar
                </div>
                {selectedAnswer ? (
                  <RichTextRenderer
                    html={selectedAnswer}
                    className="text-gray-800"
                  />
                ) : (
                  <p className="text-sm text-gray-500">Tidak ada jawaban.</p>
                )}
              </div>
            ) : (
              <RichTextEditor
                key={question.id}
                value={selectedAnswer ?? ""}
                onChange={handleEssayChange}
                placeholder="Tulis jawaban essay..."
                minHeightClassName="min-h-48"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option.option_key;
              const visualOptionKey = String.fromCharCode(65 + index);
              const reviewState = getReviewOptionState({
                optionKey: option.option_key,
                userAnswer: selectedAnswer,
                correctAnswer: question.correct_answer,
              });
              const isCorrectAnswer = reviewState === "correct_answer";
              const isUserWrongAnswer = reviewState === "user_wrong_answer";

              const optionClass = isReviewMode
                ? isCorrectAnswer
                  ? "border-green-500 bg-green-100 text-green-900"
                  : isUserWrongAnswer
                    ? "border-red-400 bg-red-100 text-red-900"
                    : "border-gray-200 bg-white text-gray-900"
                : isSelected
                  ? "border-[#004AAB] bg-[#EBF4FF]"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";

              const markerClass = isReviewMode
                ? isCorrectAnswer
                  ? "bg-green-600 text-white"
                  : isUserWrongAnswer
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600"
                : isSelected
                  ? "bg-[#004AAB] text-white"
                  : "bg-gray-100 text-gray-600";

              const textClass = isReviewMode
                ? isCorrectAnswer
                  ? "text-green-900 font-semibold"
                  : isUserWrongAnswer
                    ? "text-red-900 font-semibold"
                    : "text-gray-700"
                : isSelected
                  ? "text-[#004AAB] font-semibold"
                  : "text-gray-700";

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionClick(option.option_key)}
                  disabled={isReviewMode}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all disabled:cursor-default ${optionClass}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${markerClass}`}
                  >
                    {visualOptionKey}
                  </div>
                  <div className="flex-1 min-w-0">
                    <RichTextRenderer
                      html={option.option_text}
                      className={`pt-1 ${textClass}`}
                    />
                    {isReviewMode && (isCorrectAnswer || isUserWrongAnswer) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {isCorrectAnswer && (
                          <span className="rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white">
                            Kunci Jawaban
                          </span>
                        )}
                        {isSelected && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              isUserWrongAnswer
                                ? "bg-red-600 text-white"
                                : "bg-green-700 text-white"
                            }`}
                          >
                            {mode === "admin-review"
                              ? "Jawaban Pengguna"
                              : "Jawaban Kamu"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {isReviewMode && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="mb-3 text-sm font-bold text-[#004AAB]">
              Pembahasan
            </h3>
            {question.discussion ? (
              <RichTextRenderer
                html={question.discussion}
                className="text-gray-700"
              />
            ) : (
              <p className="text-sm leading-relaxed text-gray-600">
                Pembahasan belum tersedia untuk soal ini.
              </p>
            )}
            {question.discussion_image_url && (
              <img
                src={question.discussion_image_url}
                alt="Pembahasan"
                className="mt-4 max-h-[240px] rounded-lg object-contain"
              />
            )}
            {!isEssay && !question.correct_answer && (
              <p className="mt-3 text-xs font-medium text-amber-700">
                Kunci jawaban belum tersedia.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            hasPrev
              ? "text-gray-600 hover:text-gray-900"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <span>{"<"}</span>
          <span>Sebelumnya</span>
        </button>

        {hasNext ? (
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-colors bg-[#004AAB] hover:bg-[#003B8A] text-white"
          >
            <span>Selanjutnya</span>
            <span>{">"}</span>
          </button>
        ) : (
          <button
            onClick={onFinish}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-colors bg-[#004AAB] hover:bg-[#003B8A] text-white"
          >
            <span>{isReviewMode ? "Kembali ke Hasil" : "Selesai"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
