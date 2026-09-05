"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/sessionStore";
import { ArrowRight } from "lucide-react";

export default function EntryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const setNickname = useSessionStore((s) => s.setNickname);
  const resetSession = useSessionStore((s) => s.resetSession);

  const handleStart = () => {
    if (!name.trim()) return;
    resetSession();
    setNickname(name.trim());
    router.push("/upload");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleStart();
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo / Title */}
        <div className="mb-12">
          <h1 className="text-3xl font-light tracking-[0.2em] mb-2">
            EXANA
          </h1>
          <div className="w-8 h-px bg-black mx-auto mb-4" />
          <p className="text-xs text-text-secondary tracking-wider uppercase">
            Exam Analysis & Practice System
          </p>
        </div>

        {/* Input Area */}
        <div className="mb-8">
          <label
            htmlFor="nickname"
            className="block text-xs text-text-secondary mb-3 tracking-wide"
          >
            ニックネームを入力してください
          </label>
          <input
            id="nickname"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-field text-center"
            placeholder="例: たろう"
            autoFocus
            autoComplete="off"
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!name.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <span>学習をスタートする</span>
          <ArrowRight size={16} />
        </button>

        {/* Footer */}
        <p className="text-xs text-text-secondary mt-12 tracking-wide">
          入試問題の弱点を分析し、完全定着を目指す
        </p>
      </div>
    </main>
  );
}
