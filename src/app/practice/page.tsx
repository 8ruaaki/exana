"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore, PracticeQuestion } from "@/store/sessionStore";
import Header from "@/components/ui/Header";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import StepIndicator from "@/components/ui/StepIndicator";
import { ArrowRight, Send } from "lucide-react";

export default function PracticePage() {
  const router = useRouter();
  const store = useSessionStore();
  const [currentStep, setCurrentStep] = useState(store.currentPracticeStep || 0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const isGenerating = store.isGeneratingPractice;
  const allGenerated = store.practiceQuestions.length > 0;

  useEffect(() => {
    if (store.practiceQuestions.length === 0 && store.weaknesses.length > 0 && !store.isGeneratingPractice) {
      store.runBackgroundPracticeGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.practiceQuestions.length, store.weaknesses.length, store.isGeneratingPractice]);

  const currentQuestion = store.practiceQuestions[currentStep];
  const totalSteps = store.practiceQuestions.length;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      store.setCurrentPracticeStep(currentStep + 1);
      setAnswers({});
    }
  };

  const handleSubmitAll = async () => {
    // Store the current step's answers, then navigate to results
    store.setCurrentPracticeStep(0);
    router.push("/results");
  };

  const isLastStep = currentStep === totalSteps - 1;

  // Store answers for current question when moving forward
  const handleStepAction = async () => {
    // Save answers to practice question
    const updatedQuestions = [...store.practiceQuestions];
    const q = updatedQuestions[currentStep];
    if (q) {
      if (q.type === "grammar" && q.grammarQuestions) {
        q.grammarQuestions = q.grammarQuestions.map((gq) => ({
          ...gq,
          studentAnswer: answers[gq.id] || "",
        }));
      } else if (q.type === "translation") {
        q.translationAnswer = answers.translation || "";
      } else if (q.type === "reading" && q.readingQuestions) {
        q.readingQuestions = q.readingQuestions.map((rq) => ({
          ...rq,
          studentAnswer: answers[rq.id] || "",
        }));
      }
      store.setPracticeQuestions(updatedQuestions);
    }

    if (isLastStep) {
      handleSubmitAll();
    } else {
      handleNextStep();
    }
  };

  const practiceTypeTitle = (type: string) => {
    switch (type) {
      case "grammar": return "文法・語法 空欄補充";
      case "translation": return "和訳問題";
      case "reading": return "長文読解";
      default: return "演習問題";
    }
  };

  const renderGrammarQuestion = (q: PracticeQuestion) => (
    <div className="space-y-6">
      {q.grammarQuestions?.map((gq, index) => (
        <div key={gq.id} className="card-bordered">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-6 h-6 border border-black flex items-center justify-center text-xs font-semibold shrink-0">
              {index + 1}
            </span>
            <p className="text-sm leading-relaxed">{gq.sentence}</p>
          </div>
          <div className="flex gap-2 flex-wrap pl-9">
            {gq.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswerChange(gq.id, opt)}
                className={`marksheet-option ${
                  answers[gq.id] === opt ? "selected" : ""
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTranslationQuestion = (q: PracticeQuestion) => (
    <div className="space-y-6">
      <div className="card-bordered">
        <p className="text-xs text-text-secondary mb-2 tracking-wide">
          次の英文を和訳しなさい
        </p>
        <p className="text-sm leading-relaxed font-medium border-l-2 border-black pl-4 py-2">
          {q.translationText}
        </p>
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-2 block tracking-wide">
          あなたの和訳
        </label>
        <textarea
          className="textarea-field text-sm"
          rows={5}
          placeholder="和訳を入力してください..."
          value={answers.translation || ""}
          onChange={(e) => handleAnswerChange("translation", e.target.value)}
        />
      </div>
    </div>
  );

  const renderReadingQuestion = (q: PracticeQuestion) => (
    <div className="space-y-6">
      {/* Passage */}
      <div className="card-bordered">
        <p className="text-xs text-text-secondary mb-3 tracking-wide">
          次の英文を読んで、設問に答えなさい
        </p>
        <div className="text-sm leading-loose whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-2">
          {q.readingPassage}
        </div>
      </div>

      {/* Questions */}
      {q.readingQuestions?.map((rq, index) => (
        <div key={rq.id} className="card-bordered">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-6 h-6 border border-black flex items-center justify-center text-xs font-semibold shrink-0">
              {index + 1}
            </span>
            <p className="text-sm leading-relaxed">{rq.question}</p>
          </div>

          {rq.type === "choice" && rq.options ? (
            <div className="space-y-2 pl-9">
              {rq.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleAnswerChange(rq.id, opt)}
                  className={`w-full text-left text-sm px-4 py-2.5 border transition-colors ${
                    answers[rq.id] === opt
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-border hover:border-black"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="pl-9">
              <textarea
                className="textarea-field text-sm"
                rows={3}
                placeholder="解答を入力..."
                value={answers[rq.id] || ""}
                onChange={(e) => handleAnswerChange(rq.id, e.target.value)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Header />
      {isGenerating && (
        <LoadingOverlay
          message="再現問題を生成中..."
          subMessage="AIがあなたの弱点に合わせた問題を作成しています"
        />
      )}
      <main className="flex-1 flex flex-col px-4 py-16 max-w-7xl mx-auto w-full">
        {allGenerated && currentQuestion && (
          <>
            {/* Step Indicator */}
            <div className="mb-6 flex items-center justify-between">
              <StepIndicator current={currentStep + 1} total={totalSteps} />
              <span className="text-xs text-text-secondary">
                {practiceTypeTitle(currentQuestion.type)}
              </span>
            </div>

            {/* Question Title */}
            <div className="mb-6">
              <h1 className="text-lg font-medium tracking-wide">
                再現演習 — {currentQuestion.content}
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                同じ思考の罠にはまらないよう、類似の問題に挑戦しましょう
              </p>
            </div>

            {/* Question Content */}
            {currentQuestion.type === "grammar" && renderGrammarQuestion(currentQuestion)}
            {currentQuestion.type === "translation" && renderTranslationQuestion(currentQuestion)}
            {currentQuestion.type === "reading" && renderReadingQuestion(currentQuestion)}

            {/* Action */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleStepAction}
                className="btn-primary flex items-center gap-2"
              >
                {isLastStep ? (
                  <>
                    <span>解答を提出する</span>
                    <Send size={16} />
                  </>
                ) : (
                  <>
                    <span>次のステップへ</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {!allGenerated && !isGenerating && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-text-secondary">
              演習データの準備ができていません
            </p>
          </div>
        )}
      </main>
    </>
  );
}
