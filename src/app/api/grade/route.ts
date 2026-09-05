import { NextRequest, NextResponse } from "next/server";
import { generateStructuredContent } from "@/lib/gemini";
import { gradingSchema } from "@/lib/schemas";

const SYSTEM_INSTRUCTION = `あなたは英語入試問題の採点専門アシスタントです。
以下のルールに従って正確に採点してください：

1. 選択問題: 正解と生徒の解答が完全一致する場合のみ正解
2. 並び替え問題: 語順が完全一致する場合のみ正解
3. 和訳問題: 以下の基準で採点
   - 構文の正確な把握ができているか
   - 重要語句の訳出が適切か
   - 日本語として自然な表現か
   - 部分点がある場合は不正解とし、不足要素を指摘
4. 記述問題: 必須要素の過不足を箇条書きで具体的に指摘
5. 解説の作成ルール（重要）:
   - 正解した問題については「正解です。」など簡潔な解説にとどめてください。
   - 不正解だった問題（間違えた問題）のみ、以下の点を含めて非常に詳しく解説を作成してください。
     - 読解問題の場合：どこに着目すべきか、解答の根拠となる本文の箇所とその探し方、またその箇所の正確な和訳や文構造の解説を含めること。
     - その他の問題の場合：なぜその解答が間違いなのか、正解に至るための論理的なステップを丁寧に説明すること。

点数やスコアは付けません。正誤と解説のみを返してください。`;

export async function POST(request: NextRequest) {
  try {
    const { questions, answers, questionBlocks } = await request.json();

    const prompt = `以下の英語入試問題の生徒解答を採点してください。

【問題文】
${questions}

【模範解答・解説】
${answers}

【生徒の解答データ】
${JSON.stringify(questionBlocks, null, 2)}

各小問について正誤判定と詳しい解説を返してください。記述問題では必須要素の過不足を箇条書きで指摘してください。`;

    const result = await generateStructuredContent(
      prompt,
      gradingSchema,
      SYSTEM_INSTRUCTION
    );

    if (!result) {
      // Fallback: simple exact-match grading
      const results: Array<{
        blockId: string;
        subQuestionId: string;
        isCorrect: boolean;
        explanation: string;
      }> = [];

      interface QuestionBlock {
        id: string;
        subQuestions: Array<{
          id: string;
          correctAnswer: string;
          studentAnswer: string;
        }>;
      }

      for (const block of questionBlocks as QuestionBlock[]) {
        for (const sq of block.subQuestions) {
          results.push({
            blockId: block.id,
            subQuestionId: sq.id,
            isCorrect: sq.studentAnswer.trim() === sq.correctAnswer.trim(),
            explanation: sq.studentAnswer.trim() === sq.correctAnswer.trim()
              ? `正解です。模範解答: ${sq.correctAnswer}`
              : `不正解です。あなたの解答「${sq.studentAnswer}」に対し、模範解答は「${sq.correctAnswer}」です。`,
          });
        }
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Grade API] Error:", error);
    return NextResponse.json(
      { error: "Grading failed" },
      { status: 500 }
    );
  }
}
