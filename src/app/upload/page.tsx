"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/sessionStore";
import Header from "@/components/ui/Header";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { Upload, FileText, ClipboardPaste, X, ArrowRight } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const store = useSessionStore();
  const [questionFiles, setQuestionFiles] = useState<File[]>([]);
  const [answerFiles, setAnswerFiles] = useState<File[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [dragOverQuestion, setDragOverQuestion] = useState(false);
  const [dragOverAnswer, setDragOverAnswer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const questionInputRef = useRef<HTMLInputElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf", "text/plain",
  ];

  const handleFiles = (files: FileList, target: "question" | "answer") => {
    const validFiles = Array.from(files).filter((f) =>
      acceptedTypes.includes(f.type)
    );
    if (target === "question") {
      setQuestionFiles((prev) => [...prev, ...validFiles]);
    } else {
      setAnswerFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, target: "question" | "answer") => {
      e.preventDefault();
      if (target === "question") setDragOverQuestion(false);
      else setDragOverAnswer(false);
      handleFiles(e.dataTransfer.files, target);
    },
    []
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent, target: "question" | "answer") => {
      const files = e.clipboardData.files;
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files, target);
      }
    },
    []
  );

  const removeFile = (target: "question" | "answer", index: number) => {
    if (target === "question") {
      setQuestionFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAnswerFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const hasInput =
    questionFiles.length > 0 || answerFiles.length > 0 ||
    questionText.trim() || answerText.trim();

  const handleStart = async () => {
    if (!hasInput) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      questionFiles.forEach((f) => formData.append("questionFiles", f));
      answerFiles.forEach((f) => formData.append("answerFiles", f));
      if (questionText.trim()) formData.append("questionText", questionText);
      if (answerText.trim()) formData.append("answerText", answerText);

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();

      store.setQuestionFiles(questionFiles);
      store.setAnswerFiles(answerFiles);
      store.setQuestionText(questionText);
      store.setAnswerText(answerText);
      store.setTranscribedQuestions(data.questions || questionText || "");
      store.setTranscribedAnswers(data.answers || answerText || "");

      router.push("/transcription");
    } catch (error) {
      console.error("OCR error:", error);
      // Fallback: use text input directly
      store.setTranscribedQuestions(questionText || "");
      store.setTranscribedAnswers(answerText || "");
      router.push("/transcription");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderUploadZone = (
    target: "question" | "answer",
    files: File[],
    isDragOver: boolean,
    label: string,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => (
    <div className="flex-1 flex flex-col">
      <h2 className="text-sm font-medium mb-4 tracking-wide">{label}</h2>

      {/* Upload Zone */}
      <div
        className={`upload-zone mb-4 ${isDragOver ? "active" : ""} ${files.length > 0 ? "has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          target === "question" ? setDragOverQuestion(true) : setDragOverAnswer(true);
        }}
        onDragLeave={() => {
          target === "question" ? setDragOverQuestion(false) : setDragOverAnswer(false);
        }}
        onDrop={(e) => handleDrop(e, target)}
        onPaste={(e) => handlePaste(e, target)}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
      >
        <Upload size={24} className="mx-auto mb-3 text-text-secondary" />
        <p className="text-sm text-text-secondary mb-1">
          ファイルをドラッグ＆ドロップ
        </p>
        <p className="text-xs text-text-secondary">
          またはクリックして選択 / Ctrl+V で貼り付け
        </p>
        <p className="text-xs text-text-secondary mt-2">
          画像 / PDF / テキスト
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files, target);
          }}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-4 space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <FileText size={14} />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
              <button
                onClick={() => removeFile(target, i)}
                className="text-text-secondary hover:text-black"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Text Input */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardPaste size={12} className="text-text-secondary" />
          <span className="text-xs text-text-secondary">
            またはテキストを直接入力
          </span>
        </div>
        <textarea
          className="textarea-field text-sm"
          rows={6}
          placeholder={`${label}のテキストを入力...`}
          value={target === "question" ? questionText : answerText}
          onChange={(e) =>
            target === "question"
              ? setQuestionText(e.target.value)
              : setAnswerText(e.target.value)
          }
          onPaste={(e) => handlePaste(e, target)}
        />
      </div>
    </div>
  );

  return (
    <>
      <Header />
      {isProcessing && (
        <LoadingOverlay
          message="文字起こし処理中..."
          subMessage="AIが画像を解析しています"
        />
      )}
      <main className="flex-1 flex flex-col px-4 py-16 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-lg font-medium tracking-wide">
            問題・解答アップロード
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            入試問題と模範解答・解説のデータを取り込みます
          </p>
        </div>

        {/* 2 Column Layout */}
        <div className="flex-1 flex gap-8 flex-col md:flex-row">
          {renderUploadZone("question", questionFiles, dragOverQuestion, "問題用紙", questionInputRef)}
          <div className="hidden md:block w-px bg-border" />
          {renderUploadZone("answer", answerFiles, dragOverAnswer, "模範解答・解説", answerInputRef)}
        </div>

        {/* Action */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleStart}
            disabled={!hasInput}
            className="btn-primary flex items-center gap-2"
          >
            <span>スタート</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </main>
    </>
  );
}
