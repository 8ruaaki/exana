"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/sessionStore";
import Header from "@/components/ui/Header";
import { ArrowRight } from "lucide-react";

export default function AnswerInputPage() {
  const router = useRouter();
  const store = useSessionStore();
  const { questionBlocks, updateStudentAnswer } = store;

  const handleNext = () => {
    router.push("/grading");
  };

  const hasAnyAnswer = questionBlocks.some((block) =>
    block.subQuestions.some((sq) => sq.studentAnswer.trim() !== "")
  );

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col px-4 py-16 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-lg font-medium tracking-wide">生徒解答入力</h1>
          <p className="text-xs text-text-secondary mt-1">
            紙の解答用紙を見ながら、各問の解答を入力してください
          </p>
        </div>

        {/* Question Blocks */}
        <div className="space-y-8">
          {questionBlocks.map((block) => (
            <div key={block.id} className="card-bordered">
              <h2 className="text-sm font-semibold mb-4 tracking-wide border-b border-border pb-3">
                {block.sectionNumber}
              </h2>

              <div className="space-y-5">
                {block.subQuestions.map((sq) => (
                  <div key={sq.id} className="flex gap-4 items-start">
                    {/* Question Number */}
                    <span className="text-sm font-medium w-12 pt-2 shrink-0">
                      {sq.questionNumber}
                    </span>

                    {/* Input Area */}
                    <div className="flex-1">
                      {/* Choice (single) */}
                      {sq.type === "choice" && sq.options && (
                        <div className="flex gap-2 flex-wrap">
                          {sq.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() =>
                                updateStudentAnswer(
                                  block.id,
                                  sq.id,
                                  sq.studentAnswer === opt ? "" : opt
                                )
                              }
                              className={`marksheet-option ${
                                sq.studentAnswer === opt ? "selected" : ""
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Multi-choice */}
                      {sq.type === "multi-choice" && sq.options && (
                        <div className="flex gap-2 flex-wrap">
                          {sq.options.map((opt) => {
                            const selected = sq.studentAnswer
                              .split(",")
                              .map((s) => s.trim())
                              .includes(opt);
                            return (
                              <button
                                key={opt}
                                onClick={() => {
                                  const current = sq.studentAnswer
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  const next = selected
                                    ? current.filter((c) => c !== opt)
                                    : [...current, opt];
                                  updateStudentAnswer(
                                    block.id,
                                    sq.id,
                                    next.join(", ")
                                  );
                                }}
                                className={`marksheet-option ${
                                  selected ? "selected" : ""
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Ordering */}
                      {sq.type === "ordering" && (
                        <input
                          type="text"
                          className="input-field text-sm"
                          placeholder="語句を正しい順に入力..."
                          value={sq.studentAnswer}
                          onChange={(e) =>
                            updateStudentAnswer(block.id, sq.id, e.target.value)
                          }
                        />
                      )}

                      {/* Translation */}
                      {sq.type === "translation" && (
                        <textarea
                          className="textarea-field text-sm"
                          rows={3}
                          placeholder="和訳を入力..."
                          value={sq.studentAnswer}
                          onChange={(e) =>
                            updateStudentAnswer(block.id, sq.id, e.target.value)
                          }
                        />
                      )}

                      {/* Essay */}
                      {sq.type === "essay" && (
                        <textarea
                          className="textarea-field text-sm"
                          rows={4}
                          placeholder="解答を入力..."
                          value={sq.studentAnswer}
                          onChange={(e) =>
                            updateStudentAnswer(block.id, sq.id, e.target.value)
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {questionBlocks.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-sm text-text-secondary">
                問題データがありません。前の画面に戻って入力してください。
              </p>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!hasAnyAnswer}
            className="btn-primary flex items-center gap-2"
          >
            <span>次へ（採点する）</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </main>
    </>
  );
}
