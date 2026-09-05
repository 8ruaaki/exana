import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exana — 入試対策演習システム",
  description: "入試問題の弱点を分析し、思考プロセスを再現する類題演習で完全定着を図る学習支援アプリケーション",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
