import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, List } from "lucide-react";

type Props = {
  questions: { id: string }[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  onJumpToQuestion: (index: number) => void;
  completed?: boolean;
  getCorrectAnswer: (id: string) => string;
};

const QuestionNavigator: React.FC<Props> = ({
  questions,
  currentQuestionIndex,
  answers,
  onJumpToQuestion,
  completed = false,
  getCorrectAnswer,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Button styles reused
  const getButtonStyles = (
    index: number,
    qId: string
  ): { base: string; bg: string } => {
    const isCurrent = index === currentQuestionIndex;
    const userAnswer = answers[qId];
    const correctAnswer = getCorrectAnswer(qId);
    const isCorrect = userAnswer === correctAnswer;

    const baseStyle =
      "flex items-center gap-1 px-2 py-1 rounded text-sm font-medium border transition-colors";

    let bg = "bg-muted text-muted-foreground border-border hover:bg-muted/80";

    if (completed && userAnswer) {
      bg = isCorrect
        ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
        : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";
    } else if (userAnswer) {
      bg = "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
    }

    if (isCurrent && !completed) {
      bg = "bg-primary text-white border-primary";
    }

    return { base: baseStyle, bg };
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-primary text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle question navigator"
      >
        <List className="w-6 h-6" />
      </button>

      {/* Mobile Slide-in Panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-lg border-r p-4 transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <h3 className="text-lg font-semibold mb-4">Question Navigator</h3>
        <button
          className="mb-4 text-sm text-red-600 hover:underline"
          onClick={() => setMobileOpen(false)}
        >
          Close
        </button>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-6rem)]">
          {questions.map((q, index) => {
            const { base, bg } = getButtonStyles(index, q.id);
            const userAnswer = answers[q.id];
            const correctAnswer = getCorrectAnswer(q.id);
            const isCorrect = userAnswer === correctAnswer;

            return (
              <button
                key={q.id}
                className={cn(base, bg)}
                onClick={() => {
                  onJumpToQuestion(index);
                  setMobileOpen(false);
                }}
                title={`Question ${index + 1}`}
              >
                {completed && userAnswer ? (
                  isCorrect ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>{index + 1}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>{index + 1}</span>
                    </>
                  )
                ) : (
                  <>
                    <span>{index + 1}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Desktop Side Panel */}
      <aside className="hidden md:block sticky top-24 h-[calc(100vh-6rem)] w-64 overflow-y-auto border-r p-4">
        <h3 className="text-lg font-semibold mb-4">Question Navigator</h3>
        <div className="grid grid-cols-4 gap-2">
          {questions.map((q, index) => {
            const { base, bg } = getButtonStyles(index, q.id);
            const userAnswer = answers[q.id];
            const correctAnswer = getCorrectAnswer(q.id);
            const isCorrect = userAnswer === correctAnswer;

            return (
              <button
                key={q.id}
                className={cn(base, bg)}
                onClick={() => onJumpToQuestion(index)}
                title={`Question ${index + 1}`}
              >
                {completed && userAnswer ? (
                  isCorrect ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{index + 1}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>{index + 1}</span>
                    </>
                  )
                ) : (
                  <>
                    <span>{index + 1}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default QuestionNavigator;
