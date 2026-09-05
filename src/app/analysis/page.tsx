"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/sessionStore";
import Header from "@/components/ui/Header";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { ArrowRight, Target } from "lucide-react";

export default function AnalysisPage() {
  const router = useRouter();
  const store = useSessionStore();
  const isProcessing = store.isAnalyzing;
  const isAnalyzed = store.weaknesses.length > 0;

  useEffect(() => {
    if (store.weaknesses.length === 0 && !store.isAnalyzing) {
      store.runBackgroundAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.weaknesses.length, store.isAnalyzing]);

  const handleNext = () => {
    router.push("/practice");
  };

  const practiceTypeLabel = (type: string) => {
    switch (type) {
      case "grammar":
        return "文法・語法";
      case "translation":
        return "和訳";
      case "reading":
        return "読解";
      default:
        return type;
    }
  };

  return (
    <>
      <Header />
      {isProcessing && (
        <LoadingOverlay
          message="弱点を分析中..."
          subMessage="AIが間違いの根本原因を特定しています"
        />
      )}
      <main className="flex-1 flex flex-col px-4 py-16 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} />
            <h1 className="text-lg font-medium tracking-wide">
              今つけるべき3つの力
            </h1>
          </div>
          <p className="text-xs text-text-secondary">
            間違えた問題の分析に基づき、あなたが今強化すべきポイントを特定しました
          </p>
        </div>

        {/* Weakness Cards */}
        <div className="space-y-6">
          {store.weaknesses.map((weakness, index) => (
            <div key={weakness.id} className="card-bordered">
              <div className="flex items-start gap-4">
                {/* Number */}
                <div className="w-8 h-8 border border-black flex items-center justify-center text-sm font-semibold shrink-0">
                  {index + 1}
                </div>

                <div className="flex-1">
                  {/* Title */}
                  <h3 className="text-base font-semibold mb-1">
                    {weakness.title}
                  </h3>

                  {/* Practice Type Tag */}
                  <span className="inline-block text-xs text-text-secondary border border-border px-2 py-0.5 mb-3">
                    {practiceTypeLabel(weakness.practiceType)}
                  </span>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {weakness.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {store.weaknesses.length === 0 && !isProcessing && (
            <div className="card text-center py-12">
              <p className="text-sm text-text-secondary">
                分析データがありません
              </p>
            </div>
          )}
        </div>

        {/* Action */}
        {isAnalyzed && store.weaknesses.length > 0 && (
          <div className="mt-10 flex justify-end">
            <button
              onClick={handleNext}
              className="btn-primary flex items-center gap-2"
            >
              <span>再現演習へ進む</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </main>
    </>
  );
}
