import { NextRequest, NextResponse } from "next/server";
import { generateStructuredContent } from "@/lib/gemini";
import { classifySchema } from "@/lib/schemas";

const SYSTEM_INSTRUCTION = `あなたは英語入試問題の構造分析の専門家です。
与えられた問題文と解答を分析し、以下のルールに従って構造化してください：

1. 大問ごとにブロックを分ける
2. 各小問の形式を正確に判定する:
   - choice: 単一選択問題（4択等）
   - multi-choice: 複数選択問題
   - ordering: 並び替え・整序問題
   - translation: 和訳問題
   - essay: 記述問題（英作文、要約、説明等）
3. 選択問題の場合、選択肢の記号（ア〜エ、A〜D等）をoptionsに含める
4. 模範解答を正確にcorrectAnswerに設定する
5. 問題のタイトル（年度・学校名等）が推定できる場合はproblemTitleに設定する`;

export async function POST(request: NextRequest) {
  try {
    const { questions, answers } = await request.json();

    const prompt = `以下の英語入試問題を構造分析してください。

【問題文】
${questions}

【模範解答・解説】
${answers}

各小問の問題形式（choice/multi-choice/ordering/translation/essay）を判定し、選択肢と正解を構造化してください。`;

    const result = await generateStructuredContent(
      prompt,
      classifySchema,
      SYSTEM_INSTRUCTION
    );

    if (!result) {
      // Fallback: return a basic structure
      return NextResponse.json({
        problemTitle: "問題",
        blocks: [
          {
            id: "block-1",
            sectionNumber: "大問1",
            subQuestions: [
              {
                id: "q-1-1",
                questionNumber: "(1)",
                type: "choice",
                options: ["ア", "イ", "ウ", "エ"],
                correctAnswer: "",
              },
            ],
          },
        ],
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Classify API] Error:", error);
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}
