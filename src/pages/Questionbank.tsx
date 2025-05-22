import React, { useEffect, useState } from "react";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { subjects } from "@/utils/subjects";
import { fetchQuestionsBySubjectAndYear , fetchDistinctYears} from "@/services/supabasequestionBankService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ExamQuestion as ExamQuestionType } from "@/services/questionBankService";
import ExamQuestion from "@/components/Exam/ExamQuestion";
import { ChevronLeft, ChevronRight, Check, ClipboardList } from "lucide-react";
import ProgressBar from '@ramonak/react-progress-bar';
import { ReactTimeoutButton } from 'react-timeout-button';





const QuestionBankExam = () => {
  const { toast } = useToast();

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  const [examStarted, setExamStarted] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [examCompleted, setExamCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

 useEffect(() => {
  const fetchYears = async () => {
    if (selectedSubject) {
      try {
        const years = await fetchDistinctYears(selectedSubject);
        setAvailableYears(years.map(String));
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    }
  };

  fetchYears();
}, [selectedSubject]);


const ProgressIndicator = ({ current, total }: { current: number; total: number }) => {
  const percentage = (current / total) * 100;

  return (
    <ProgressBar
      completed={percentage}
      maxCompleted={100}
      bgColor="#4caf50"
      labelColor="#fff"
      height="10px"
      labelAlignment="center"
      isLabelVisible={true}
    />
  );
};
  const handleStartExam = async () => {
    if (!selectedSubject || !selectedYear) {
      toast({
        title: "Missing Selection",
        description: "Please select both subject and year",
        variant: "destructive"
      });
      return;
    }

    toast({ title: "Fetching Questions..." });

    try {
     const result = await fetchQuestionsBySubjectAndYear(questionCount, selectedSubject, Number(selectedYear));

if (!result || result.questions.length === 0) {
  throw new Error("No questions found for this subject and year.");
}

setQuestions(result.questions);
setExamStarted(true);
setCurrentQuestionIndex(0);
setAnswers({});
setExamCompleted(false);

    } catch (error) {
      toast({
        title: "Failed to Load Questions",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleFinishExam();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleFinishExam = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });

    const score = Math.round((correct / questions.length) * 100);

    toast({
      title: "Exam Completed",
      description: `You scored ${score}% (${correct}/${questions.length})`
    });

    setExamCompleted(true);
  };



// const Timer = ({ duration }: { duration: number }) => {
//   const [timeLeft, setTimeLeft] = useState(duration);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div>
//       <h3>Time Remaining: {timeLeft}s</h3>
//       <ReactTimeoutButton
//         timeout={timeLeft * 1000}
//         onTimeout={() => alert('Time is up!')}
//       >
//         Finish Exam
//       </ReactTimeoutButton>
//     </div>
//   );
// };


  const handleReset = () => {
    setExamStarted(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setExamCompleted(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20">
        {!examStarted ? (
          <section className="py-10">
            <div className="container px-4 md:px-6 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                  <ClipboardList className="mr-1 size-4" />
                  <span>Question Bank Mode</span>
                </div>
                <h1 className="text-3xl font-bold">Practice Past Exam Questions</h1>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Setup Your Practice Exam</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div>
                    <Label>Subject</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a year" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Number of Questions</Label>
                    <Select
                      value={questionCount.toString()}
                      onValueChange={(val) => setQuestionCount(Number(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select count" />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleStartExam} className="w-full">
                    Start Exam
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        ) : (
            
          <section className="py-10">
            <ProgressIndicator current={currentQuestionIndex + 1} total={questions.length} />
            {/* <Timer duration={1800} /> 30 minutes */}


            <div className="container px-4 md:px-6 max-w-3xl mx-auto">
              <div className="mb-6 flex justify-between items-center">
                <Button variant="outline" onClick={handleReset}>
                  <ChevronLeft className="mr-2 size-4" /> Back
                </Button>
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
              </div>

              {currentQuestion && (
                <ExamQuestion
                  question={currentQuestion}
                  selectedAnswer={answers[currentQuestion.id]}
                  onSelectAnswer={(ans) => handleSelectAnswer(currentQuestion.id, ans)}
                  showCorrectAnswer={examCompleted}
                  questionNumber={currentQuestionIndex + 1}
                  source="questionbank"
                />
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                  <ChevronLeft className="mr-2 size-4" /> Previous
                </Button>

                {!examCompleted ? (
                  <Button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion?.id]}
                  >
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Next <ChevronRight className="ml-2 size-4" />
                      </>
                    ) : (
                      <>
                        Finish Exam <Check className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                ) : (<div>
                  {currentQuestionIndex < questions.length - 1 ? (<Button
                  variant="outline"
                    onClick={handleNext}
                    disabled={!answers[currentQuestion?.id]}
                  >
                        Next  <ChevronRight className="mr-2 size-4" /> 
                   
                  </Button>):
                  (<Button onClick={handleReset}>Start New Exam</Button>)}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default QuestionBankExam;
