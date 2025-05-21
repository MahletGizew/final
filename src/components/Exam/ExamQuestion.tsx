import { MathJax } from 'mathjax';
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Extend MathJax type to align with es5/tex-mml-chtml.js runtime
interface ExtendedMathJax extends MathJax {
  typeset: () => void;
  typesetPromise?: (elements: (HTMLElement | string)[]) => Promise<void>;
  startup: {
    defaultReady: () => void;
    ready: () => void;
    promise: Promise<void>;
  };
}

// Declare window.MathJax with extended type
declare global {
  interface Window {
    MathJax: ExtendedMathJax;
  }
}

// Interface for ExamQuestionProps (supports both aiQuestionService and questionBankService)
interface ExamQuestionProps {
  question: {
    id: string;
    question_number?: number | string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation?: string;
    subject?: string;
    year?: number | string;
    difficulty_level?: number;
    created_at?: string;
    unit_objective?: string;
    isAIGenerated?: boolean;
  };
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showCorrectAnswer?: boolean;
  questionNumber: number;
  source?: 'ai' | 'questionbank' | 'local';
}

const ExamQuestion: React.FC<ExamQuestionProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  showCorrectAnswer = false,
  questionNumber,
  source,
}) => {
  // Ref for MathJax typesetting
  const containerRef = useRef<HTMLDivElement>(null);
  // State to track MathJax initialization
  const [isMathJaxInitialized, setIsMathJaxInitialized] = useState(!!window.MathJax?.startup?.promise);


  useEffect(() => {
    // Check if MathJax is already loaded or not
    if (window.MathJax) {
      if (window.MathJax.startup?.promise) {
        window.MathJax.startup.promise.then(() => {
          setIsMathJaxInitialized(true);
        }).catch((err: unknown) => {
          console.error('MathJax startup error:', err);
        });
      }
      return; // Skip loading if MathJax is already initialized
    }

    // Load MathJax script if not already loaded
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.id = 'MathJax-script';
    
    // On load callback
    script.onload = () => {
      window.MathJax.startup.promise
        .then(() => {
          setIsMathJaxInitialized(true);
        })
        .catch((err: unknown) => {
          console.error('MathJax startup error:', err);
        });
    };

    // On error callback
    script.onerror = () => {
      console.error('Failed to load MathJax script');
    };

    // Append the script to head
    document.head.appendChild(script);

    // Cleanup script on component unmount
    return () => {
      const mathJaxScript = document.getElementById('MathJax-script');
      if (mathJaxScript) {
        document.head.removeChild(mathJaxScript);
      }
    };
  }, []); // Run effect once when component mounts




  // Typeset MathJax when content changes or MathJax initializes
  useEffect(() => {
    if (!isMathJaxInitialized || !window.MathJax || !containerRef.current) return;

    try {
      window.MathJax.typeset();
    } catch (err: unknown) {
      console.error('MathJax typesetting error:', err);
    }
  }, [isMathJaxInitialized, question]);

  const isCorrect = (option: string) => {
    if (!showCorrectAnswer) return false;
    return option === question.correct_answer;
  };

  const isIncorrect = (option: string) => {
    if (!showCorrectAnswer) return false;
    return selectedAnswer === option && option !== question.correct_answer;
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="mb-4 mathjax-process" ref={containerRef}>
          <div className="flex gap-2 mb-2">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {questionNumber}
            </span>
            <div className="text-lg font-medium flex-1">
              <div className="flex flex-wrap gap-2">
                {question.subject && (
                  <span className="inline-block mr-2 text-sm font-medium text-muted-foreground">
                    {question.subject}
                  </span>
                )}
                {question.year && (
                  <span className="inline-block mr-2 text-sm font-medium text-muted-foreground">
                    Year: {question.year}
                  </span>
                )}
                {question.question_number && (
                  <span className="inline-block mr-2 text-sm font-medium text-muted-foreground">
                    Q{question.question_number}
                  </span>
                )}
                {question.difficulty_level && (
                  <span className="inline-block mr-2 text-sm font-medium text-muted-foreground">
                    Difficulty: {question.difficulty_level}/5
                  </span>
                )}
                {question.created_at && (
                  <span className="inline-block mr-2 text-sm font-medium text-muted-foreground">
                    Created: {new Date(question.created_at).toLocaleDateString()}
                  </span>
                )}
                {question.unit_objective && (
                  <span className="inline-block mr-2 text-sm font-medium text-muted-foreground">
                    Objective: {question.unit_objective}
                  </span>
                )}
              </div>
              <div className="mt-1">{question.question_text}</div>
            </div>
          </div>

          <RadioGroup
            value={selectedAnswer || ''}
            onValueChange={onSelectAnswer}
            className="space-y-3"
          >
            {['A', 'B', 'C', 'D'].map((option) => {
              const optionText = {
                A: question.option_a,
                B: question.option_b,
                C: question.option_c,
                D: question.option_d,
              }[option];
              return (
                <div
                  key={option}
                  className={cn(
                    'flex items-start space-x-2 rounded-md border p-3 mathjax-process',
                    isCorrect(option) && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                    isIncorrect(option) && 'border-red-500 bg-red-50 dark:bg-red-950/30'
                  )}
                >
                  <RadioGroupItem
                    value={option}
                    id={`option-${question.id}-${option}`}
                  />
                  <Label
                    htmlFor={`option-${question.id}-${option}`}
                    className="flex grow cursor-pointer items-center gap-2 font-normal"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border mathjax-ignore">
                      {option}
                    </span>
                    <span className="flex-1">{optionText}</span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {showCorrectAnswer && question.explanation && (
            <div className="mt-4 p-3 bg-secondary/20 rounded-md mathjax-process">
              <div className="font-semibold mb-1">Explanation:</div>
              <div className="text-sm">{question.explanation}</div>
              {selectedAnswer && !isCorrect(selectedAnswer) && (
                <div className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                  You selected option {selectedAnswer}, but the correct answer is option{' '}
                  {question.correct_answer}.
                </div>
              )}
              {selectedAnswer && isCorrect(selectedAnswer) && (
                <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                  Correct! You selected the right answer.
                </div>
              )}
            </div>
          )}

          {source && (
            <div className="mt-3 text-xs text-muted-foreground text-right mathjax-ignore">
              Source:{' '}
              {source === 'ai'
                ? 'AI-Generated'
                : source === 'questionbank'
                ? 'Question Bank'
                : 'Local Storage'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamQuestion;