"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/sessionStore";
import Header from "@/components/ui/Header";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { ArrowRight, Check, X } from "lucide-react";

export default function GradingPage() {
  const router = useRouter();
  const store = useSessionStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGraded, setIsGraded] = useState(store.gradingComplete);

  useEffect(() => {
    if (!store.gradingComplete) {
      gradeAnswers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gradeAnswers = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: store.transcribedQuestions,
          answers: store.transcribedAnswers,
          questionBlocks: store.questionBlocks,
        }),
      });
      const data = await res.json();

      if (data.results) {
        // Apply grading results to question blocks
        const updatedBlocks = store.questionBlocks.map((block) => ({
          ...block,
          subQuestions: block.subQuestions.map((sq) => {
            const result = data.results.find(
              (r: { blockId: string; subQuestionId: string; isCorrect: boolean; explanation: string }) =>
                r.blockId === block.id && r.subQuestionId === sq.id
            );
            return result
              ? {
                  ...sq,
                  isCorrect: result.isCorrect,
                  explanation: result.explanation,
                }
              : sq;
          }),
        }));
        store.setQuestionBlocks(updatedBlocks);
        store.setGradingComplete(true);
        setIsGraded(true);
        
        // Start background AI processing for the next steps
        store.runBackgroundAnalysis();
      }
    } catch (error) {
      console.error("Grading error:", error);
      // Fallback: simple matching
      const updatedBlocks = store.questionBlocks.map((block) => ({
        ...block,
        subQuestions: block.subQuestions.map((sq) => ({
          ...sq,
          isCorrect: sq.studentAnswer.trim() === sq.correctAnswer.trim(),
          explanation:
            sq.studentAnswer.trim() === sq.correctAnswer.trim()
              ? `正解です。`
              : `不正解です。模範解答は「${sq.correctAnswer}」です。`,
        })),
      }));
      store.setQuestionBlocks(updatedBlocks);
      store.setGradingComplete(true);
      setIsGraded(true);
      
      // Start background AI processing for the next steps
      store.runBackgroundAnalysis();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    router.push("/analysis");
  };

  return (
    <>
      <Header />
      {isProcessing && (
        <LoadingOverlay
          message="採点中..."
          subMessage="AIが解答を評価しています"
        />
      )}
      <main className="flex-1 flex flex-col px-4 py-16 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-lg font-medium tracking-wide">採点・解説</h1>
          <p className="text-xs text-text-secondary mt-1">
            各問の正誤と詳しい解説を確認してください
          </p>
        </div>

        {/* Grading Cards */}
        <div className="space-y-6">
          {store.questionBlocks.map((block) => (
            <div key={block.id}>
              <h2 className="text-sm font-semibold mb-3 tracking-wide">
                {block.sectionNumber}
              </h2>

              <div className="space-y-4">
                {block.subQuestions.map((sq) => (
                  <div
                    key={sq.id}
                    className={`border p-5 ${
                      sq.isCorrect === undefined
                        ? "border-border"
                        : sq.isCorrect
                        ? "border-black"
                        : "border-black border-2"
                    }`}
                  >
                    {/* Header: number + badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">
                        {sq.questionNumber}
                      </span>
                      {sq.isCorrect !== undefined && (
                        <span
                          className={
                            sq.isCorrect ? "badge-success" : "badge-error"
                          }
                        >
                          {sq.isCorrect ? (
                            <>
                              <Check size={12} /> 正解
                            </>
                          ) : (
                            <>
                              <X size={12} /> 要復習
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Answers */}
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="text-text-secondary w-20 shrink-0">
                          あなたの解答
                        </span>
                        <span className="font-medium">
                          {sq.studentAnswer || "（未解答）"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-text-secondary w-20 shrink-0">
                          模範解答
                        </span>
                        <span className="font-medium">{sq.correctAnswer}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    {sq.explanation && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-text-secondary mb-1 tracking-wide">
                          解説
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {sq.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action */}
        {isGraded && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              className="btn-primary flex items-center gap-2"
            >
              <span>次へ</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </main>
    </>
  );
}
