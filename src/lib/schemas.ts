/**
 * JSON Schema definitions for Gemini Structured Outputs.
 */

// ===== OCR Schema =====
export const ocrSchema = {
  type: "object",
  properties: {
    questions: {
      type: "string",
      description: "問題文の文字起こし全文。大問・小問構造を保持。数式はLaTeX形式で表記。",
    },
    answers: {
      type: "string",
      description: "模範解答・解説の文字起こし全文。",
    },
  },
  required: ["questions", "answers"],
};

// ===== Classify Schema =====
export const classifySchema = {
  type: "object",
  properties: {
    problemTitle: {
      type: "string",
      description: "問題のタイトル（年度・学校名・大問番号など）",
    },
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          sectionNumber: {
            type: "string",
            description: "大問番号（例: 大問1, 第1問）",
          },
          subQuestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                questionNumber: {
                  type: "string",
                  description: "小問番号（例: (1), 問1）",
                },
                type: {
                  type: "string",
                  enum: ["choice", "multi-choice", "ordering", "translation", "essay"],
                  description: "問題形式: choice=単一選択, multi-choice=複数選択, ordering=並び替え, translation=和訳, essay=記述",
                },
                options: {
                  type: "array",
                  items: { type: "string" },
                  description: "選択肢記号の配列（選択問題の場合のみ）",
                },
                correctAnswer: {
                  type: "string",
                  description: "模範解答",
                },
              },
              required: ["id", "questionNumber", "type", "correctAnswer"],
            },
          },
        },
        required: ["id", "sectionNumber", "subQuestions"],
      },
    },
  },
  required: ["problemTitle", "blocks"],
};

// ===== Grading Schema =====
export const gradingSchema = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          blockId: { type: "string" },
          subQuestionId: { type: "string" },
          isCorrect: { type: "boolean" },
          explanation: {
            type: "string",
            description: "詳しい解説。記述問題では必須要素の過不足を箇条書きで指摘。",
          },
        },
        required: ["blockId", "subQuestionId", "isCorrect", "explanation"],
      },
    },
  },
  required: ["results"],
};

// ===== Analysis Schema =====
export const analysisSchema = {
  type: "object",
  properties: {
    weaknesses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: {
            type: "string",
            description: "身につけるべき力の名称（例: 前置詞の使い分け）",
          },
          description: {
            type: "string",
            description: "具体的説明（2〜3文）",
          },
          practiceType: {
            type: "string",
            enum: ["grammar", "translation", "reading"],
            description: "再現演習の形式。grammar=文法・語法, translation=和訳, reading=読解",
          },
        },
        required: ["id", "title", "description", "practiceType"],
      },
      description: "今つけるべき力を3つ",
    },
    parentReport: {
      type: "object",
      properties: {
        positives: {
          type: "string",
          description: "よい点（3〜4文、です・ます調の敬語）",
        },
        improvements: {
          type: "string",
          description: "改善点（3〜4文、です・ます調の敬語）",
        },
      },
      required: ["positives", "improvements"],
    },
  },
  required: ["weaknesses", "parentReport"],
};

// ===== Practice Generation Schema =====
export const practiceGrammarSchema = {
  type: "object",
  properties: {
    weaknessId: { type: "string" },
    type: { type: "string", enum: ["grammar"] },
    content: {
      type: "string",
      description: "問題セット全体のタイトルや説明",
    },
    grammarQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          sentence: {
            type: "string",
            description: "空欄を含む英文（空欄は (    ) で表記）",
          },
          options: {
            type: "array",
            items: { type: "string" },
            description: "4つの選択肢",
          },
          correctAnswer: {
            type: "string",
            description: "正解の選択肢",
          },
          explanation: {
            type: "string",
            description: "解説",
          },
        },
        required: ["id", "sentence", "options", "correctAnswer", "explanation"],
      },
    },
  },
  required: ["weaknessId", "type", "content", "grammarQuestions"],
};

export const practiceTranslationSchema = {
  type: "object",
  properties: {
    weaknessId: { type: "string" },
    type: { type: "string", enum: ["translation"] },
    content: {
      type: "string",
      description: "問題の指示文",
    },
    translationText: {
      type: "string",
      description: "和訳すべき英文（下線部）",
    },
    translationCorrect: {
      type: "string",
      description: "模範和訳",
    },
    translationExplanation: {
      type: "string",
      description: "構文解説と重要表現の説明",
    },
  },
  required: ["weaknessId", "type", "content", "translationText", "translationCorrect", "translationExplanation"],
};

export const practiceReadingSchema = {
  type: "object",
  properties: {
    weaknessId: { type: "string" },
    type: { type: "string", enum: ["reading"] },
    content: {
      type: "string",
      description: "問題の指示文",
    },
    readingPassage: {
      type: "string",
      description: "長文本文（500〜1000語）",
    },
    readingQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          question: {
            type: "string",
            description: "設問文",
          },
          type: {
            type: "string",
            enum: ["choice", "essay"],
          },
          options: {
            type: "array",
            items: { type: "string" },
            description: "選択肢（choice型の場合）",
          },
          correctAnswer: {
            type: "string",
            description: "正解",
          },
          explanation: {
            type: "string",
            description: "解説（本文からの根拠箇所を引用）",
          },
        },
        required: ["id", "question", "type", "correctAnswer", "explanation"],
      },
    },
  },
  required: ["weaknessId", "type", "content", "readingPassage", "readingQuestions"],
};

// ===== Practice Grading Schema =====
export const practiceGradingSchema = {
  type: "object",
  properties: {
    weaknessId: { type: "string" },
    isOvercome: {
      type: "boolean",
      description: "弱点を克服できたかどうか",
    },
    details: {
      type: "string",
      description: "採点結果の詳細解説",
    },
    questionResults: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionId: { type: "string" },
          isCorrect: { type: "boolean" },
          explanation: { type: "string" },
        },
        required: ["questionId", "isCorrect", "explanation"],
      },
    },
  },
  required: ["weaknessId", "isOvercome", "details"],
};
