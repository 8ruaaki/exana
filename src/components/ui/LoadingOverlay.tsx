"use client";

import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  subMessage?: string;
}

export default function LoadingOverlay({
  message = "処理中です...",
  subMessage,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white/90 z-50 flex flex-col items-center justify-center">
      <div className="border border-black w-12 h-12 flex items-center justify-center mb-6 loading-pulse">
        <Loader2 size={20} className="loading-spin" />
      </div>
      <p className="text-sm font-medium tracking-wide">{message}</p>
      {subMessage && (
        <p className="text-xs text-text-secondary mt-2">{subMessage}</p>
      )}
    </div>
  );
}
