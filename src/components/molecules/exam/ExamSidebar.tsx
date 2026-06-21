"use client";

import type {
  ReviewQuestionStatus,
  TryoutLayoutMode,
} from "@/utils/tryout-review";

interface ExamSidebarProps {
  subtestName: string;
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: Set<string>;
  questionIds: string[];
  onQuestionClick: (index: number) => void;
  onFinishSubtest?: () => void;
  mode?: TryoutLayoutMode;
  reviewStatuses?: Record<string, ReviewQuestionStatus>;
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LayoutGrid } from "lucide-react";

export default function ExamSidebar({
  subtestName,
  totalQuestions,
  currentIndex,
  answeredQuestions,
  questionIds,
  onQuestionClick,
  onFinishSubtest,
  mode = "attempt",
  reviewStatuses = {},
}: ExamSidebarProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleQuestionSelect = (index: number) => {
    onQuestionClick(index);
    setIsMobileNavOpen(false);
  };

  const renderGrid = () => (
    <div className="border-2 border-[#004AAB]/20 rounded-xl p-4">
      <h4 className="font-bold text-sm text-gray-800 mb-3 text-center">
        Daftar Soal:
      </h4>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const qId = questionIds[i];
          const isActive = i === currentIndex;
          const isAnswered = qId && answeredQuestions.has(qId);
          const reviewStatus = qId ? reviewStatuses[qId] : undefined;
          const isReviewMode = mode === "review" || mode === "admin-review";
          const buttonClass = isReviewMode
            ? reviewStatus === "correct"
              ? "bg-green-600 text-white border border-green-600"
              : reviewStatus === "incorrect"
                ? "bg-red-600 text-white border border-red-600"
                : "bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300"
            : isAnswered
              ? "bg-[#3B9245] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200";

          return (
            <button
              key={qId ?? i}
              onClick={() => handleQuestionSelect(i)}
              className={`w-full aspect-square rounded-lg text-sm font-bold transition-all flex items-center justify-center ${
                isActive
                  ? "bg-[#004AAB] text-white ring-2 ring-[#004AAB] ring-offset-2"
                  : buttonClass
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderAction = () => (
    mode === "attempt" ? (
      <button
        onClick={() => {
          setIsMobileNavOpen(false);
          if (onFinishSubtest) onFinishSubtest();
        }}
        className="w-full bg-[#004AAB] hover:bg-[#003B8A] text-white py-3 rounded-xl font-bold text-sm transition-colors"
      >
        Akhiri Subtest
      </button>
    ) : (
      <div className="w-full bg-blue-50 border border-blue-100 text-[#004AAB] py-3 rounded-xl font-bold text-sm text-center">
        {mode === "admin-review" ? "Mode Review (Admin)" : "Mode Review"}
      </div>
    )
  );

  return (
    <div className="w-full lg:w-65 shrink-0 flex flex-col gap-4">
      <div className="lg:hidden flex flex-col gap-2">
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="w-full bg-[#EBF4FF] text-[#004AAB] py-3 rounded-xl font-bold text-sm border border-[#004AAB]/20 flex items-center justify-center gap-2 transition-colors hover:bg-[#D6E8FF]"
        >
          <LayoutGrid className="w-5 h-5" />
          Navigasi Soal
        </button>
        {mode === "attempt" && (
          <div className="w-full px-1 flex items-center gap-3 mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#3B9245] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min((answeredQuestions.size / Math.max(1, totalQuestions)) * 100, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-gray-600 shrink-0">
              {answeredQuestions.size}/{totalQuestions}
            </span>
          </div>
        )}
      </div>

      <div className="hidden lg:flex flex-col gap-4">
        {renderGrid()}
        {renderAction()}
      </div>

      <Dialog open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto w-[90vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-[#002B66]">Navigasi Soal</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            {renderGrid()}
            {renderAction()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
