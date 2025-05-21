import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface Option {
  option: string;
  choice: string;
}

export interface ExamQuestion {
  id: string;
  question_number?: number | string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  subject?: string;
  year?: number | string;
  explanation?: string;
}

const STORED_QUESTIONS_KEY = 'ethio_questionbank_questions';
const QUESTION_USAGE_KEY = 'ethio_questionbank_usage';

/**
 * Check if online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Local storage handlers
 */
export const getStoredQuestions = (): ExamQuestion[] => {
  try {
    const stored = localStorage.getItem(STORED_QUESTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to retrieve stored questions', err);
    return [];
  }
};

export const storeQuestions = (questions: ExamQuestion[]): void => {
  try {
    localStorage.setItem(STORED_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (err) {
    console.error('Failed to store questions', err);
  }
};

export const trackQuestionUsage = (examId: string, questionIds: string[]): void => {
  try {
    const usageJson = localStorage.getItem(QUESTION_USAGE_KEY);
    const usage = usageJson ? JSON.parse(usageJson) : {};
    usage[examId] = questionIds;
    localStorage.setItem(QUESTION_USAGE_KEY, JSON.stringify(usage));
  } catch (error) {
    console.error('Error tracking question usage:', error);
  }
};

/**
 * Fetches questions from the questionbank table based on subject/year/count
 */
export const fetchQuestionsBySubjectAndYear = async (
  count: number,
  subject: string,
  year: number | string
): Promise<{ questions: ExamQuestion[]; source: 'questionbank'; warning?: string }> => {
  if (!isOnline()) {
    throw new Error('An internet connection is required to fetch questions. Please connect and try again.');
  }

  const maxAttempts = 3;
  const baseDelay = 2000;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        toast.info(`Retrying question fetch (attempt ${attempt}/${maxAttempts})...`);
      }

      const { data, error } = await supabase
        .from('questions')
        .select('id, question_number, question_text, options, correct_answer, subject, year, explanation')
        .eq('subject', subject)
        .eq('year', typeof year === 'string' ? parseInt(year) : year)
        .order('question_number', { ascending: true })
        .limit(count * 2); 

      if (error) {
        console.error('Supabase error:', error);
        lastError = new Error(error.message);
        await new Promise(res => setTimeout(res, Math.min(baseDelay * Math.pow(2, attempt - 1), 15000)));
        continue;
      }

      if (!data || data.length === 0) {
        lastError = new Error('No questions found for the specified subject and year.');
        await new Promise(res => setTimeout(res, Math.min(baseDelay * Math.pow(2, attempt - 1), 15000)));
        continue;
      }

      const questions: ExamQuestion[] = data.map((q, index) => {
        let options: Option[] = [];
        try {
          options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        } catch (parseError) {
          console.warn(`Invalid options JSON for question ${q.id}:`, parseError);
          options = [];
        }

        const optionMap: { [key: string]: string } = {};
        options.forEach(opt => {
          if (opt.option && opt.choice) {
            optionMap[opt.option.toUpperCase()] = opt.choice;
          }
        });

        return {
          id: q.id,
          question_number: q.question_number,
          question_text: q.question_text || '',
          option_a: optionMap['A'] || '',
          option_b: optionMap['B'] || '',
          option_c: optionMap['C'] || '',
          option_d: optionMap['D'] || '',
          correct_answer: q.correct_answer || '',
          subject: q.subject,
          year: q.year,
          explanation: q.explanation
        };
      });

      // Filter invalid questions
      const valid = questions.filter(q =>
        q.question_text && q.option_a && q.option_b && q.option_c && q.option_d && q.correct_answer
      );

      // Deduplicate
      const unique = new Map<string, ExamQuestion>();
      valid.forEach(q => {
        const key = `${q.question_text?.trim().toLowerCase()}|${q.option_a}|${q.option_b}|${q.option_c}|${q.option_d}`;
        if (!unique.has(key)) {
          unique.set(key, q);
        }
      });

      let final = Array.from(unique.values()).slice(0, count);

      // Sort by question number (optional enhancement)
      final.sort((a, b) => {
        const numA = typeof a.question_number === 'string' ? parseInt(a.question_number) : a.question_number || 0;
        const numB = typeof b.question_number === 'string' ? parseInt(b.question_number) : b.question_number || 0;
        return numA - numB;
      });

      storeQuestions(final);
      trackQuestionUsage(subject + '-' + year, final.map(q => q.id));

      return {
        questions: final,
        source: 'questionbank',
        warning: data.length < count ? 'Not enough unique questions available' : undefined
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unexpected error occurred');
      await new Promise(res => setTimeout(res, Math.min(baseDelay * Math.pow(2, attempt - 1), 15000)));
    }
  }

  toast.error('Failed to fetch questions. Please try again later.', {
    description: 'Our database service may be temporarily unavailable.'
  });

  throw lastError!;
};

/**
 * Returns all distinct years available for a given subject
 */
export const fetchDistinctYears = async (
  subject: string
): Promise<number[]> => {
  const { data, error } = await supabase
    .from('questions')
    .select('year')
    .eq('subject', subject);

  if (error) throw new Error(error.message);

  return Array.from(
    new Set((data || []).map(item => item.year).filter((y): y is number => typeof y === 'number'))
  ).sort((a, b) => b - a);
};
