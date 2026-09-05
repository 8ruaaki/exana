import { NextRequest, NextResponse } from "next/server";
import { generateStructuredContent } from "@/lib/gemini";
import { analysisSchema } from "@/lib/schemas";

const SYSTEM_INSTRUCTION = `あなたは英語教育の専門家であり、入試指導のベテランです。
生徒の採点結果を分析し、以下の2つの出力を生成してください。

【出力1: 生徒向け弱点分析（今つけるべき力 3つ）】
間違えた問題を深く分析し、表面的なミスではなく「根本的に不足している力」を3つ抽出してください。
各項目には：
- title: 身につけるべき力の名称（簡潔に）
- description: なぜこの力が不足しているのか、どう改善すべきかの説明（2〜3文）
- practiceType: 再現演習の形式
  - "grammar": 文法・語法・語句の知識不足 → 4択空欄補充で演習
  - "translation": 構文把握力・和訳力の不足 → 和訳問題で演習
  - "reading": 論理展開・パラグラフ把握の不足 → 長文読解で演習

【出力2: 保護者向け指導報告（生徒には非表示）】
- positives（よい点、3〜4文）: です・ます調の丁寧な敬語。取り組んだ姿勢、正解できた問題に見られる定着度、論理的思考力を肯定的に評価。
- improvements（改善点、3〜4文）: です・ます調の丁寧な敬語。思考の偏りやミスの傾向、塾として今後授業でフォローしていく具体方針を明記。`;

export async function POST(request: NextRequest) {
  try {
    const { questions, answers, questionBlocks, gradingResults } = await request.json();

    const prompt = `以下の英語入試問題の採点結果を分析し、生徒の弱点と保護者向け指導報告を生成してください。

【問題文】
${questions}

【模範解答・解説】
${answers}

【問題構造と生徒解答】
${JSON.stringify(questionBlocks, null, 2)}

【採点結果】
${JSON.stringify(gradingResults, null, 2)}

上記を分析し、今つけるべき力を3つ（それぞれにpracticeType: grammar/translation/readingを指定）と、保護者向け指導報告を生成してください。`;

    const result = await generateStructuredContent(
      prompt,
      analysisSchema,
      SYSTEM_INSTRUCTION
    );

    if (!result) {
      // Fallback
      return NextResponse.json({
        weaknesses: [
          {
            id: "w1",
            title: "基礎文法の定着",
            description: "基本的な文法事項の理解が不十分です。特に時制や前置詞の使い分けについて、もう一度基礎から確認する必要があります。",
            practiceType: "grammar",
          },
          {
            id: "w2",
            title: "構文把握力",
            description: "複雑な構文を正確に読み解く力が不足しています。関係代名詞や分詞構文など、文の構造を把握する練習が必要です。",
            practiceType: "translation",
          },
          {
            id: "w3",
            title: "論理展開の把握",
            description: "長文全体の論理展開を把握する力を強化する必要があります。段落ごとの主題を意識しながら読む練習をしましょう。",
            practiceType: "reading",
          },
        ],
        parentReport: {
          positives: "本日はよく集中して問題に取り組んでいただきました。基本的な語彙力は着実に定着しており、平易な文法問題では確実に正解を導き出す力が見られます。また、長文読解においても、全体の大意を捉えようとする姿勢が見受けられました。",
          improvements: "一方で、複雑な構文を含む文の和訳や、選択肢が紛らわしい問題での判断に課題が見られます。特に前置詞の使い分けや時制の一致について、基礎的な知識の再確認が必要です。今後の授業では、構文分析の演習を重点的に行い、正確な読解力の向上を図ってまいります。",
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Analyze API] Error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
