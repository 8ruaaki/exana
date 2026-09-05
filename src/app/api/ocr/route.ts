import { NextRequest, NextResponse } from "next/server";
import { generateMultimodalContent, generateStructuredContent } from "@/lib/gemini";
import { ocrSchema } from "@/lib/schemas";

const SYSTEM_INSTRUCTION = `あなたは入試問題のOCR専門のアシスタントです。
画像やPDFから文字を正確に読み取り、以下のルールに従って文字起こしを行ってください：
- 大問・小問の構造を保持する
- 数式はLaTeX形式で表記する
- 特殊記号や図表の説明も含める
- 英語の問題文は原文のまま正確に転写する
- 選択肢の記号（ア、イ、ウ、エ等）を正確に識別する`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const questionFiles = formData.getAll("questionFiles") as File[];
    const answerFiles = formData.getAll("answerFiles") as File[];
    const questionText = formData.get("questionText") as string | null;
    const answerText = formData.get("answerText") as string | null;

    // Build images array for multimodal input
    const images: { data: string; mimeType: string }[] = [];

    for (const file of [...questionFiles, ...answerFiles]) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      images.push({ data: base64, mimeType: file.type });
    }

    let prompt = "以下の入試問題と模範解答・解説を文字起こししてください。\n\n";

    if (questionText) {
      prompt += `【問題テキスト（直接入力）】\n${questionText}\n\n`;
    }
    if (answerText) {
      prompt += `【解答テキスト（直接入力）】\n${answerText}\n\n`;
    }

    if (images.length > 0) {
      prompt += "添付画像から問題文と解答・解説を読み取ってください。";
    }

    // If text was provided directly without images, use text-only generation
    if (images.length === 0 && (questionText || answerText)) {
      const result = await generateStructuredContent(
        prompt,
        ocrSchema,
        SYSTEM_INSTRUCTION
      );

      if (!result) {
        // Return input text as-is if AI is unavailable
        return NextResponse.json({
          questions: questionText || "",
          answers: answerText || "",
        });
      }

      return NextResponse.json(result);
    }

    // Multimodal with images
    const result = await generateMultimodalContent(
      prompt,
      images,
      ocrSchema,
      SYSTEM_INSTRUCTION
    );

    if (!result) {
      return NextResponse.json({
        questions: questionText || "[AIが利用できません。手動で文字起こしを入力してください。]",
        answers: answerText || "[AIが利用できません。手動で文字起こしを入力してください。]",
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[OCR API] Error:", error);
    return NextResponse.json(
      { error: "OCR processing failed" },
      { status: 500 }
    );
  }
}
