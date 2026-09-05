import { NextRequest, NextResponse } from "next/server";
import { generateStructuredContent } from "@/lib/gemini";
import { practiceGradingSchema } from "@/lib/schemas";

const SYSTEM_INSTRUCTION = `あなたは英語入試問題の採点専門家です。
再現演習の生徒解答を採点し、弱点を克服できたかどうかを判定してください。

【判定基準】
- grammar（文法問題）: 5問中4問以上正解で克服達成
- translation（和訳問題）: 構文把握と重要語句の訳出が概ね正確であれば克服達成
- reading（読解問題）: 3問中2問以上正解で克服達成

【解説の作成ルール（重要）】
- 正解した問題の解説は「正解です。」など簡潔にとどめてください。
- 不正解だった問題（間違えた問題）のみ、非常に詳しく解説を作成してください。
  - 読解問題の場合：どこに着目すべきか、解答の根拠となる本文の箇所とその探し方、またその箇所の正確な和訳を含めること。
  - その他の問題の場合：なぜ間違いなのか、正解に至るための論理的なステップを丁寧に説明すること。`;

export async function POST(request: NextRequest) {
  try {
    const { practiceQuestion, studentAnswers } = await request.json();

    const prompt = `以下の再現演習の生徒解答を採点し、弱点克服の判定を行ってください。

【演習問題】
${JSON.stringify(practiceQuestion, null, 2)}

【生徒の解答】
${JSON.stringify(studentAnswers, null, 2)}

weaknessIdには "${practiceQuestion.weaknessId}" を設定してください。`;

    const result = await generateStructuredContent(
      prompt,
      practiceGradingSchema,
      SYSTEM_INSTRUCTION
    );

    if (!result) {
      // Fallback: basic comparison
      let correctCount = 0;
      let totalCount = 0;
      const questionResults: Array<{
        questionId: string;
        isCorrect: boolean;
        explanation: string;
      }> = [];

      if (practiceQuestion.type === "grammar" && practiceQuestion.grammarQuestions) {
        for (const gq of practiceQuestion.grammarQuestions) {
          totalCount++;
          const studentAns = studentAnswers[gq.id] || "";
          const isCorrect = studentAns.trim() === gq.correctAnswer.trim();
          if (isCorrect) correctCount++;
          questionResults.push({
            questionId: gq.id,
            isCorrect,
            explanation: gq.explanation,
          });
        }
        return NextResponse.json({
          weaknessId: practiceQuestion.weaknessId,
          isOvercome: correctCount >= 4,
          details: `${totalCount}問中${correctCount}問正解。${correctCount >= 4 ? "克服達成です。" : "もう一度挑戦しましょう。"}`,
          questionResults,
        });
      }

      if (practiceQuestion.type === "translation") {
        const studentAns = studentAnswers.translation || "";
        const isCorrect = studentAns.length > 10;
        return NextResponse.json({
          weaknessId: practiceQuestion.weaknessId,
          isOvercome: isCorrect,
          details: practiceQuestion.translationExplanation || "和訳の採点結果です。",
          questionResults: [{
            questionId: "translation",
            isCorrect,
            explanation: practiceQuestion.translationExplanation || "",
          }],
        });
      }

      if (practiceQuestion.type === "reading" && practiceQuestion.readingQuestions) {
        for (const rq of practiceQuestion.readingQuestions) {
          totalCount++;
          const studentAns = studentAnswers[rq.id] || "";
          const isCorrect = rq.type === "choice"
            ? studentAns.trim() === rq.correctAnswer.trim()
            : studentAns.length > 10;
          if (isCorrect) correctCount++;
          questionResults.push({
            questionId: rq.id,
            isCorrect,
            explanation: rq.explanation,
          });
        }
        return NextResponse.json({
          weaknessId: practiceQuestion.weaknessId,
          isOvercome: correctCount >= 2,
          details: `${totalCount}問中${correctCount}問正解。${correctCount >= 2 ? "克服達成です。" : "もう一度挑戦しましょう。"}`,
          questionResults,
        });
      }

      return NextResponse.json({
        weaknessId: practiceQuestion.weaknessId,
        isOvercome: false,
        details: "採点できませんでした。",
        questionResults: [],
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Grade Practice API] Error:", error);
    return NextResponse.json(
      { error: "Practice grading failed" },
      { status: 500 }
    );
  }
}
