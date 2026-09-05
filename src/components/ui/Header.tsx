"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Home } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);

  const isHome = pathname === "/";

  // Pages where navigation guard should be shown
  const guardedPages = ["/upload", "/transcription", "/answer-input", "/practice"];
  const needsGuard = guardedPages.includes(pathname);

  const handleHomeClick = () => {
    if (needsGuard) {
      setShowModal(true);
    } else {
      router.push("/");
    }
  };

  const handleConfirmLeave = () => {
    setShowModal(false);
    router.push("/");
  };

  if (isHome) return null;

  return (
    <>
      <header className="fixed top-0 right-0 z-40 p-4">
        <button
          onClick={handleHomeClick}
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-4"
        >
          <Home size={14} />
          <span>ホームに戻る</span>
        </button>
      </header>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="bg-white border border-black p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-3">確認</h3>
            <p className="text-sm text-text-secondary mb-6">
              入力内容が破棄されますがよろしいですか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmLeave}
                className="btn-primary text-xs py-2 px-4"
              >
                破棄して戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
