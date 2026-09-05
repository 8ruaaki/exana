"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/sessionStore";
import Header from "@/components/ui/Header";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { Check, X, RefreshCw, Home, Save } from "lucide-react";

interface PracticeResult {
  weaknessId: string;
  isOvercome: boolean;
  details: string;
  questionResults?: {
    questionId: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export default function ResultsPage() {
  const router = useRouter();
  const store = useSessionStore();
  const [isGrading, setIsGrading] = useState(false);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [isGraded, setIsGraded] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    if (!isGraded && store.practiceQuestions.length > 0) {
      gradeAllPractice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gradeAllPractice = async () => {
    setIsGrading(true);
    try {
      const allResults: PracticeResult[] = [];

      for (const pq of store.practiceQuestions) {
        // Build student answers
        const studentAnswers: Record<string, string> = {};
        if (pq.type === "grammar" && pq.grammarQuestions) {
          for (const gq of pq.grammarQuestions) {
            studentAnswers[gq.id] = gq.studentAnswer || "";
          }
        } else if (pq.type === "translation") {
          studentAnswers.translation = pq.translationAnswer || "";
        } else if (pq.type === "reading" && pq.readingQuestions) {
          for (const rq of pq.readingQuestions) {
            studentAnswers[rq.id] = rq.studentAnswer || "";
          }
        }

        const res = await fetch("/api/grade-practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ practiceQuestion: pq, studentAnswers }),
        });
        const data = await res.json();
        allResults.push(data);

        // Update weakness overcome status
        store.updateWeaknessOvercome(pq.weaknessId, data.isOvercome);
      }

      setResults(allResults);
      setIsGraded(true);

      // Update spreadsheet with practice status
      const overcomeCount = allResults.filter((r) => r.isOvercome).length;
      fetch("/api/spreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: store.nickname,
          problemTitle: store.problemTitle,
          weakness1: store.weaknesses[0]?.title || "",
          weakness2: store.weaknesses[1]?.title || "",
          weakness3: store.weaknesses[2]?.title || "",
          positives: store.parentReport?.positives || "",
          improvements: store.parentReport?.improvements || "",
          practiceStatus: `${overcomeCount}/${allResults.length} 克服達成`,
        }),
      }).catch(console.error);
    } catch (error) {
      console.error("Practice grading error:", error);
    } finally {
      setIsGrading(false);
    }
  };

  const handleRetry = async (weaknessId: string) => {
    setRetrying(weaknessId);
    try {
      const weakness = store.weaknesses.find((w) => w.id === weaknessId);
      if (!weakness) return;

      // Generate new practice for this weakness
      const res = await fetch("/api/generate-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weakness,
          originalQuestions: store.transcribedQuestions,
          originalAnswers: store.transcribedAnswers,
        }),
      });
      const newPractice = await res.json();

      // Replace the practice question for this weakness
      const updatedQuestions = store.practiceQuestions.map((pq) =>
        pq.weaknessId === weaknessId ? newPractice : pq
      );
      store.setPracticeQuestions(updatedQuestions);

      // Find the step index for this weakness
      const stepIndex = updatedQuestions.findIndex(
        (pq) => pq.weaknessId === weaknessId
      );
      store.setCurrentPracticeStep(stepIndex >= 0 ? stepIndex : 0);

      router.push("/practice");
    } catch (error) {
      console.error("Retry error:", error);
    } finally {
      setRetrying(null);
    }
  };

  const handleRetryAll = async () => {
    const unovercome = results.filter((r) => !r.isOvercome);
    if (unovercome.length === 0) return;

    setRetrying("all");
    try {
      const newQuestions = [];
      for (const result of unovercome) {
        const weakness = store.weaknesses.find((w) => w.id === result.weaknessId);
        if (!weakness) continue;

        const res = await fetch("/api/generate-practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weakness,
            originalQuestions: store.transcribedQuestions,
            originalAnswers: store.transcribedAnswers,
          }),
        });
        newQuestions.push(await res.json());
      }

      // Keep overcome questions, replace unovercome ones
      const overcomeQuestions = store.practiceQuestions.filter((pq) =>
        results.find((r) => r.weaknessId === pq.weaknessId && r.isOvercome)
      );
      store.setPracticeQuestions([...overcomeQuestions, ...newQuestions]);
      store.setCurrentPracticeStep(0);

      router.push("/practice");
    } catch (error) {
      console.error("Retry all error:", error);
    } finally {
      setRetrying(null);
    }
  };

  const handleFinish = () => {
    store.resetSession();
    router.push("/");
  };

  const overcomeCount = results.filter((r) => r.isOvercome).length;
  const hasUnovercome = results.some((r) => !r.isOvercome);

  return (
    <>
      <Header />
      {isGrading && (
        <LoadingOverlay
          message="採点中..."
          subMessage="再現演習の結果を評価しています"
        />
      )}
      {retrying && (
        <LoadingOverlay
          message="新しい問題を生成中..."
          subMessage="同じトラップ構造で別の問題を作成しています"
        />
      )}
      <main className="flex-1 flex flex-col px-4 py-16 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-lg font-medium tracking-wide">成果確認</h1>
          <p className="text-xs text-text-secondary mt-1">
            再現演習の結果を確認し、弱点の克服状況を確認しましょう
          </p>
        </div>

        {/* Overall Status */}
        {isGraded && (
          <div className="card-bordered mb-8 text-center py-6">
            <p className="text-xs text-text-secondary mb-2 tracking-wider uppercase">
              総合ステータス
            </p>
            <p className="text-2xl font-light tracking-wider">
              {overcomeCount} / {results.length}
            </p>
            <p className="text-sm text-text-secondary mt-1">克服達成</p>
          </div>
        )}

        {/* Detail Cards */}
        <div className="space-y-6">
          {results.map((result) => {
            const weakness = store.weaknesses.find(
              (w) => w.id === result.weaknessId
            );
            const practiceQ = store.practiceQuestions.find(
              (pq) => pq.weaknessId === result.weaknessId
            );

            return (
              <div key={result.weaknessId} className="card-bordered">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">
                    {weakness?.title || "弱点"}
                  </h3>
                  <span
                    className={
                      result.isOvercome ? "badge-success" : "badge-error"
                    }
                  >
                    {result.isOvercome ? (
                      <>
                        <Check size={12} /> 克服達成
                      </>
                    ) : (
                      <>
                        <X size={12} /> 要復習
                      </>
                    )}
                  </span>
                </div>

                {/* Details */}
                <p className="text-sm leading-relaxed text-text-secondary mb-4">
                  {result.details}
                </p>

                {/* Per-question results */}
                {result.questionResults && result.questionResults.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {result.questionResults.map((qr) => {
                      // Find the question for context
                      let questionText = "";
                      if (practiceQ?.type === "grammar") {
                        const gq = practiceQ.grammarQuestions?.find((g) => g.id === qr.questionId);
                        questionText = gq?.sentence || "";
                      } else if (practiceQ?.type === "reading") {
                        const rq = practiceQ.readingQuestions?.find((r) => r.id === qr.questionId);
                        questionText = rq?.question || "";
                      }

                      return (
                        <div
                          key={qr.questionId}
                          className={`border p-3 text-sm ${
                            qr.isCorrect ? "border-border" : "border-black"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {qr.isCorrect ? (
                              <Check size={12} />
                            ) : (
                              <X size={12} />
                            )}
                            <span className="font-medium truncate">
                              {questionText || qr.questionId}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed pl-5">
                            {qr.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Translation specific */}
                {practiceQ?.type === "translation" && (
                  <div className="space-y-3 mb-4">
                    <div className="border border-border p-3">
                      <p className="text-xs text-text-secondary mb-1">あなたの和訳</p>
                      <p className="text-sm">{practiceQ.translationAnswer || "（未解答）"}</p>
                    </div>
                    <div className="border border-border p-3">
                      <p className="text-xs text-text-secondary mb-1">模範和訳</p>
                      <p className="text-sm">{practiceQ.translationCorrect}</p>
                    </div>
                    {practiceQ.translationExplanation && (
                      <div className="border border-border p-3">
                        <p className="text-xs text-text-secondary mb-1">構文解説</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {practiceQ.translationExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Retry button for unovercome */}
                {!result.isOvercome && (
                  <button
                    onClick={() => handleRetry(result.weaknessId)}
                    disabled={retrying !== null}
                    className="btn-secondary text-xs py-2 px-4 flex items-center gap-2"
                  >
                    <RefreshCw size={12} />
                    <span>この弱点に再挑戦</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        {isGraded && (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
            {hasUnovercome && (
              <button
                onClick={handleRetryAll}
                disabled={retrying !== null}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>未克服の弱点を一括で再挑戦</span>
              </button>
            )}
            <button
              onClick={handleFinish}
              className="btn-primary flex items-center justify-center gap-2 sm:ml-auto"
            >
              <Save size={14} />
              <span>学習を記録してホームへ</span>
            </button>
          </div>
        )}
      </main>
    </>
  );
}
