import { create } from "zustand";

// ===== Type Definitions =====

export interface SubQuestion {
  id: string;
  questionNumber: string;       // e.g., "(1)", "問1"
  type: "choice" | "multi-choice" | "ordering" | "translation" | "essay";
  options?: string[];            // For choice/multi-choice: ["ア", "イ", "ウ", "エ"]
  correctAnswer: string;
  studentAnswer: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface QuestionBlock {
  id: string;
  sectionNumber: string;        // e.g., "大問1", "第1問"
  subQuestions: SubQuestion[];
}

export interface WeaknessItem {
  id: string;
  title: string;                 // e.g., "前置詞の使い分け"
  description: string;           // 2-3 sentences explanation
  practiceType: "grammar" | "translation" | "reading";
  isOvercome: boolean;
}

export interface PracticeQuestion {
  weaknessId: string;
  type: "grammar" | "translation" | "reading";
  content: string;               // The question content (markdown/text)
  // For grammar: array of sub-questions with choices
  grammarQuestions?: {
    id: string;
    sentence: string;
    options: string[];
    correctAnswer: string;
    studentAnswer: string;
    explanation: string;
  }[];
  // For translation
  translationText?: string;
  translationAnswer?: string;
  translationCorrect?: string;
  translationExplanation?: string;
  // For reading
  readingPassage?: string;
  readingQuestions?: {
    id: string;
    question: string;
    type: "choice" | "essay";
    options?: string[];
    correctAnswer: string;
    studentAnswer: string;
    explanation: string;
  }[];
}

export interface ParentReport {
  positives: string;             // 3-4 sentences, polite Japanese
  improvements: string;          // 3-4 sentences, polite Japanese
}

export interface SessionState {
  // Screen 0
  nickname: string;

  // Screen 1
  questionFiles: File[];
  answerFiles: File[];
  questionText: string;          // For direct text input
  answerText: string;            // For direct text input

  // Screen 2
  transcribedQuestions: string;
  transcribedAnswers: string;

  // Screen 3
  questionBlocks: QuestionBlock[];

  // Screen 4
  gradingComplete: boolean;

  // Screen 5
  weaknesses: WeaknessItem[];
  parentReport: ParentReport | null;
  problemTitle: string;          // e.g., "2025年 ○○大学 大問1"

  // Screen 6
  practiceQuestions: PracticeQuestion[];
  currentPracticeStep: number;

  // Screen 7
  practiceResults: {
    weaknessId: string;
    isOvercome: boolean;
    details: string;
  }[];

  // Navigation
  currentScreen: number;
  isLoading: boolean;
  loadingMessage: string;
  isAnalyzing: boolean;
  isGeneratingPractice: boolean;

  // Actions
  setNickname: (name: string) => void;
  setQuestionFiles: (files: File[]) => void;
  setAnswerFiles: (files: File[]) => void;
  setQuestionText: (text: string) => void;
  setAnswerText: (text: string) => void;
  setTranscribedQuestions: (text: string) => void;
  setTranscribedAnswers: (text: string) => void;
  setQuestionBlocks: (blocks: QuestionBlock[]) => void;
  updateStudentAnswer: (blockId: string, subId: string, answer: string) => void;
  setGradingComplete: (complete: boolean) => void;
  setWeaknesses: (items: WeaknessItem[]) => void;
  setParentReport: (report: ParentReport) => void;
  setProblemTitle: (title: string) => void;
  setPracticeQuestions: (questions: PracticeQuestion[]) => void;
  setCurrentPracticeStep: (step: number) => void;
  setPracticeResults: (results: SessionState["practiceResults"]) => void;
  updateWeaknessOvercome: (id: string, isOvercome: boolean) => void;
  setCurrentScreen: (screen: number) => void;
  setLoading: (loading: boolean, message?: string) => void;
  resetSession: () => void;
  runBackgroundAnalysis: () => Promise<void>;
  runBackgroundPracticeGeneration: () => Promise<void>;
}

const initialState = {
  nickname: "",
  questionFiles: [],
  answerFiles: [],
  questionText: "",
  answerText: "",
  transcribedQuestions: "",
  transcribedAnswers: "",
  questionBlocks: [],
  gradingComplete: false,
  weaknesses: [],
  parentReport: null,
  problemTitle: "",
  practiceQuestions: [],
  currentPracticeStep: 0,
  practiceResults: [],
  currentScreen: 0,
  isLoading: false,
  loadingMessage: "",
  isAnalyzing: false,
  isGeneratingPractice: false,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  setNickname: (name) => set({ nickname: name }),
  setQuestionFiles: (files) => set({ questionFiles: files }),
  setAnswerFiles: (files) => set({ answerFiles: files }),
  setQuestionText: (text) => set({ questionText: text }),
  setAnswerText: (text) => set({ answerText: text }),
  setTranscribedQuestions: (text) => set({ transcribedQuestions: text }),
  setTranscribedAnswers: (text) => set({ transcribedAnswers: text }),
  setQuestionBlocks: (blocks) => set({ questionBlocks: blocks }),
  updateStudentAnswer: (blockId, subId, answer) =>
    set((state) => ({
      questionBlocks: state.questionBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              subQuestions: block.subQuestions.map((sq) =>
                sq.id === subId ? { ...sq, studentAnswer: answer } : sq
              ),
            }
          : block
      ),
    })),
  setGradingComplete: (complete) => set({ gradingComplete: complete }),
  setWeaknesses: (items) => set({ weaknesses: items }),
  setParentReport: (report) => set({ parentReport: report }),
  setProblemTitle: (title) => set({ problemTitle: title }),
  setPracticeQuestions: (questions) => set({ practiceQuestions: questions }),
  setCurrentPracticeStep: (step) => set({ currentPracticeStep: step }),
  setPracticeResults: (results) => set({ practiceResults: results }),
  updateWeaknessOvercome: (id, isOvercome) =>
    set((state) => ({
      weaknesses: state.weaknesses.map((w) =>
        w.id === id ? { ...w, isOvercome } : w
      ),
    })),
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setLoading: (loading, message = "") =>
    set({ isLoading: loading, loadingMessage: message }),
  resetSession: () => set(initialState),

  runBackgroundAnalysis: async () => {
    const state = get();
    if (state.isAnalyzing || state.weaknesses.length > 0) return;
    
    set({ isAnalyzing: true });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: state.transcribedQuestions,
          answers: state.transcribedAnswers,
          questionBlocks: state.questionBlocks,
          gradingResults: state.questionBlocks.flatMap((block) =>
            block.subQuestions.map((sq) => ({
              blockId: block.id,
              subQuestionId: sq.id,
              isCorrect: sq.isCorrect,
              explanation: sq.explanation,
            }))
          ),
        }),
      });
      const data = await res.json();

      if (data.weaknesses) {
        set({
          weaknesses: data.weaknesses.map((w: any) => ({
            ...w,
            isOvercome: false,
          })),
        });
      }

      if (data.parentReport) {
        set({ parentReport: data.parentReport });
        
        // Spreadsheet update logic
        const currentState = get();
        fetch("/api/spreadsheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: currentState.nickname,
            problemTitle: currentState.problemTitle,
            weakness1: currentState.weaknesses[0]?.title || "",
            weakness2: currentState.weaknesses[1]?.title || "",
            weakness3: currentState.weaknesses[2]?.title || "",
            positives: data.parentReport.positives,
            improvements: data.parentReport.improvements,
            practiceStatus: "未実施",
          }),
        }).catch(console.error);
        
        // Automatically start the next background task
        get().runBackgroundPracticeGeneration();
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      set({ isAnalyzing: false });
    }
  },

  runBackgroundPracticeGeneration: async () => {
    const state = get();
    if (state.isGeneratingPractice || state.practiceQuestions.length > 0) return;
    
    set({ isGeneratingPractice: true });
    try {
      const targetWeaknesses = get().weaknesses.filter((w) => !w.isOvercome);
      
      const promises = targetWeaknesses.map(async (weakness) => {
        const res = await fetch("/api/generate-practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weakness,
            originalQuestions: state.transcribedQuestions,
            originalAnswers: state.transcribedAnswers,
          }),
        });
        return await res.json();
      });

      const practiceQuestions = await Promise.all(promises);
      set({ practiceQuestions });
    } catch (error) {
      console.error("Practice generation error:", error);
    } finally {
      set({ isGeneratingPractice: false });
    }
  },
}));
