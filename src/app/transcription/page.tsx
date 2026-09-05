"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/sessionStore";
import Header from "@/components/ui/Header";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { ArrowRight, Edit3 } from "lucide-react";

export default function TranscriptionPage() {
  const router = useRouter();
  const store = useSessionStore();
  const [questions, setQuestions] = useState(store.transcribedQuestions);
  const [answers, setAnswers] = useState(store.transcribedAnswers);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = async () => {
    if (!questions.trim() && !answers.trim()) return;
    setIsProcessing(true);

    try {
      store.setTranscribedQuestions(questions);
      store.setTranscribedAnswers(answers);

      // Classify question structure
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers }),
      });
      const data = await res.json();

      if (data.problemTitle) {
        store.setProblemTitle(data.problemTitle);
      }

      if (data.blocks) {
        // Initialize student answers as empty strings
        const blocks = data.blocks.map((block: { id: string; sectionNumber: string; subQuestions: Array<{ id: string; questionNumber: string; type: string; options?: string[]; correctAnswer: string }> }) => ({
          ...block,
          subQuestions: block.subQuestions.map((sq: { id: string; questionNumber: string; type: string; options?: string[]; correctAnswer: string }) => ({
            ...sq,
            studentAnswer: "",
          })),
        }));
        store.setQuestionBlocks(blocks);
      }

      router.push("/answer-input");
    } catch (error) {
      console.error("Classify error:", error);
      router.push("/answer-input");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Header />
      {isProcessing && (
        <LoadingOverlay
          message="問題形式を判定中..."
          subMessage="AIが問題構造を分析しています"
        />
      )}
      <main className="flex-1 flex flex-col px-4 py-16 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Edit3 size={16} />
            <h1 className="text-lg font-medium tracking-wide">
              文字起こし確認・修正
            </h1>
          </div>
          <p className="text-xs text-text-secondary">
            AIによる文字起こし結果を確認し、必要に応じて修正してください
          </p>
        </div>

        {/* 2 Column Editors */}
        <div className="flex-1 flex gap-8 flex-col md:flex-row">
          {/* Questions */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-sm font-medium mb-3 tracking-wide">問題文</h2>
            <textarea
              className="textarea-field flex-1 text-sm font-mono leading-relaxed"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              style={{ minHeight: "400px" }}
              placeholder="問題文の文字起こしがここに表示されます..."
            />
          </div>

          <div className="hidden md:block w-px bg-border" />

          {/* Answers */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-sm font-medium mb-3 tracking-wide">
              模範解答・解説
            </h2>
            <textarea
              className="textarea-field flex-1 text-sm font-mono leading-relaxed"
              value={answers}
              onChange={(e) => setAnswers(e.target.value)}
              style={{ minHeight: "400px" }}
              placeholder="模範解答・解説の文字起こしがここに表示されます..."
            />
          </div>
        </div>

        {/* Action */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!questions.trim() && !answers.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <span>次へ</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </main>
    </>
  );
}
