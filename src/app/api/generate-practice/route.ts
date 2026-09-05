import { NextRequest, NextResponse } from "next/server";
import { generateStructuredContent } from "@/lib/gemini";
import {
  practiceGrammarSchema,
  practiceTranslationSchema,
  practiceReadingSchema,
} from "@/lib/schemas";

const GRAMMAR_INSTRUCTION = `あなたは英語入試問題の作問専門家です。
以下のルールを厳守して4択空欄補充問題を5問作成してください：

【作問制約】
1. 正解の一意性保証: 正解以外の3つの選択肢が文法的に成立しない客観的理由を内部でチェックすること
2. 典型的な誤答（日本語の直訳、紛らわしい語形）を意図的に配置すること
3. 生徒が引っかかったトラップを再現する問題を作ること
4. 各問題には正解と詳しい解説を含めること`;

const TRANSLATION_INSTRUCTION = `あなたは英語入試問題の作問専門家です。
以下のルールを厳守して和訳問題を1問作成してください：

【作問制約】
1. 生徒が読み違えた構文・重要表現を含む新規英文を作成すること
2. 元の問題と同等の難易度・分量にすること
3. 模範和訳と構文解説を含めること
4. 自然な英文であること`;

const READING_INSTRUCTION = `あなたは英語入試問題の作問専門家です。
以下のルールを厳守して長文読解問題を作成してください：

【作問制約】
1. 長文は必ず500〜1,000語の範囲内に収めること（厳守）
2. 設問は3問とすること
3. 正答根拠は生成した長文本文のみから100%直接導き出せるものに限定すること（外部知識の混入禁止）
4. 元問題の論理展開に合わせ、間違えた設問形式を再現すること
5. 各設問には正解と、本文からの根拠箇所を引用した解説を含めること`;

export async function POST(request: NextRequest) {
  try {
    const { weakness, originalQuestions, originalAnswers } = await request.json();

    const { id, title, description, practiceType } = weakness;

    let result;

    if (practiceType === "grammar") {
      const prompt = `以下の弱点を克服するための4択空欄補充問題を5問作成してください。

【弱点】
タイトル: ${title}
説明: ${description}

【元の問題の文脈】
${originalQuestions}

生徒がこの弱点で引っかかったトラップを再現し、同じ思考の罠にはまらないよう訓練するための問題を作成してください。
weaknessIdには "${id}" を設定してください。`;

      result = await generateStructuredContent(
        prompt,
        practiceGrammarSchema,
        GRAMMAR_INSTRUCTION
      );

      if (!result) {
        result = {
          weaknessId: id,
          type: "grammar",
          content: `${title}の演習問題`,
          grammarQuestions: [
            {
              id: "g1",
              sentence: "She is looking forward to (    ) you at the party.",
              options: ["see", "seeing", "seen", "saw"],
              correctAnswer: "seeing",
              explanation: "「look forward to」の to は前置詞なので、後ろには動名詞（-ing形）が続きます。",
            },
            {
              id: "g2",
              sentence: "If I (    ) rich, I would travel around the world.",
              options: ["am", "was", "were", "be"],
              correctAnswer: "were",
              explanation: "仮定法過去では、be動詞は主語に関わらず were を使います。",
            },
            {
              id: "g3",
              sentence: "The book (    ) on the desk belongs to Mary.",
              options: ["lying", "laying", "lain", "lay"],
              correctAnswer: "lying",
              explanation: "「横たわっている」は lie-lying（自動詞）。lay は他動詞で「〜を置く」。",
            },
            {
              id: "g4",
              sentence: "He insisted that she (    ) the meeting.",
              options: ["attends", "attended", "attend", "attending"],
              correctAnswer: "attend",
              explanation: "insist that S + 動詞原形（仮定法現在）。要求・提案・命令を表す動詞のthat節では原形を使います。",
            },
            {
              id: "g5",
              sentence: "Not until he arrived (    ) the truth.",
              options: ["I knew", "did I know", "I did know", "knew I"],
              correctAnswer: "did I know",
              explanation: "否定語句（Not until...）が文頭に来ると、主節は倒置（疑問文の語順）になります。",
            },
          ],
        };
      }
    } else if (practiceType === "translation") {
      const prompt = `以下の弱点を克服するための和訳問題を1問作成してください。

【弱点】
タイトル: ${title}
説明: ${description}

【元の問題の文脈】
${originalQuestions}

生徒が読み違えた構文・重要表現を含む新規英文を作成し、模範和訳と構文解説を提供してください。
weaknessIdには "${id}" を設定してください。`;

      result = await generateStructuredContent(
        prompt,
        practiceTranslationSchema,
        TRANSLATION_INSTRUCTION
      );

      if (!result) {
        result = {
          weaknessId: id,
          type: "translation",
          content: `${title}の和訳演習`,
          translationText: "What makes this discovery particularly significant is not so much the finding itself as the methodology employed to arrive at it, which has since been adopted by researchers across multiple disciplines.",
          translationCorrect: "この発見を特に重要なものにしているのは、発見そのものというよりも、それに至るために用いられた方法論であり、その方法論はその後、複数の分野の研究者たちに採用されてきた。",
          translationExplanation: "【構文解説】主語は「What makes this discovery particularly significant」（関係代名詞whatが導く名詞節）。述語は「is」。補語部分に「not so much A as B（AというよりもむしろB）」の構文が使われています。whichは非制限用法の関係代名詞で、methodology を先行詞としています。",
        };
      }
    } else {
      // reading
      const prompt = `以下の弱点を克服するための長文読解問題を作成してください。

【弱点】
タイトル: ${title}
説明: ${description}

【元の問題の文脈】
${originalQuestions}

【重要】
- 長文は500〜1,000語の範囲に収めてください
- 設問は3問にしてください
- 正答根拠は本文のみから導出可能にしてください
- 間違えた設問形式を再現してください

weaknessIdには "${id}" を設定してください。`;

      result = await generateStructuredContent(
        prompt,
        practiceReadingSchema,
        READING_INSTRUCTION
      );

      if (!result) {
        result = {
          weaknessId: id,
          type: "reading",
          content: `${title}の長文読解演習`,
          readingPassage: `The concept of urban green spaces has evolved significantly over the past century. What were once considered mere aesthetic additions to city landscapes are now recognized as essential components of public health infrastructure. Recent studies have demonstrated that access to parks and gardens can reduce stress levels by up to 30 percent, while also improving cardiovascular health and mental well-being among urban residents.

In the early twentieth century, urban planners primarily viewed parks as recreational areas designed to provide city dwellers with a temporary escape from the concrete jungle. However, the paradigm shift began in the 1970s when environmental scientists started documenting the ecological benefits of urban vegetation. Trees and plants in cities were found to absorb significant amounts of carbon dioxide, filter air pollutants, and reduce the urban heat island effect—a phenomenon where cities experience higher temperatures than surrounding rural areas.

Perhaps most compelling is the growing body of evidence linking green spaces to social cohesion. A landmark study conducted in Chicago revealed that neighborhoods with more trees and grass experienced 25 percent fewer violent crimes compared to areas with minimal vegetation. Researchers attributed this finding to the fact that green spaces encourage residents to spend time outdoors, thereby increasing natural surveillance and fostering a sense of community.

Despite these well-documented benefits, many cities continue to prioritize commercial development over green space preservation. This trend is particularly pronounced in rapidly growing cities in developing countries, where the pressure to accommodate expanding populations often leads to the destruction of existing parks and gardens. Urban planners in these regions face the difficult challenge of balancing economic growth with environmental sustainability.

Some innovative solutions have emerged in response to this challenge. Vertical gardens, rooftop parks, and pocket parks—small parks created on vacant lots—represent creative approaches to integrating nature into dense urban environments. Singapore, for example, has become a global leader in this area, requiring all new buildings to incorporate greenery into their designs. The city-state's "Garden City" initiative has resulted in a remarkable transformation, with green spaces now covering nearly 50 percent of the island's total land area.

Looking ahead, the integration of technology and urban green spaces promises even greater possibilities. Smart sensors embedded in parks can monitor air quality, soil moisture, and biodiversity in real time, enabling city managers to optimize the health and sustainability of these vital resources. As urbanization continues to accelerate worldwide, the thoughtful incorporation of nature into city planning will become not just desirable but essential for the well-being of future generations.`,
          readingQuestions: [
            {
              id: "r1",
              question: "According to the passage, what was the primary view of urban parks in the early twentieth century?",
              type: "choice" as const,
              options: [
                "They were essential for public health.",
                "They were recreational areas for temporary escape.",
                "They were tools for reducing crime rates.",
                "They were important for environmental protection.",
              ],
              correctAnswer: "They were recreational areas for temporary escape.",
              explanation: "第2段落第1文 'In the early twentieth century, urban planners primarily viewed parks as recreational areas designed to provide city dwellers with a temporary escape from the concrete jungle.' が根拠です。",
            },
            {
              id: "r2",
              question: "What did the Chicago study reveal about neighborhoods with more vegetation?",
              type: "choice" as const,
              options: [
                "Residents had better physical health.",
                "Property values increased significantly.",
                "Violent crimes were reduced by 25 percent.",
                "Air quality improved dramatically.",
              ],
              correctAnswer: "Violent crimes were reduced by 25 percent.",
              explanation: "第3段落 'A landmark study conducted in Chicago revealed that neighborhoods with more trees and grass experienced 25 percent fewer violent crimes compared to areas with minimal vegetation.' が根拠です。",
            },
            {
              id: "r3",
              question: "Based on the passage, explain why Singapore is mentioned as a global leader in urban green space integration. Provide specific evidence from the text.",
              type: "essay" as const,
              correctAnswer: "シンガポールは、全ての新築建物に緑化を義務付けており、「ガーデンシティ」構想により、島の総面積の約50%が緑地で覆われるという顕著な変革を達成したため、都市緑化統合の世界的リーダーとして言及されている。",
              explanation: "第5段落 'Singapore...has become a global leader in this area, requiring all new buildings to incorporate greenery into their designs. The city-state's \"Garden City\" initiative has resulted in a remarkable transformation, with green spaces now covering nearly 50 percent of the island's total land area.' が根拠です。",
            },
          ],
        };
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Generate Practice API] Error:", error);
    return NextResponse.json(
      { error: "Practice generation failed" },
      { status: 500 }
    );
  }
}
