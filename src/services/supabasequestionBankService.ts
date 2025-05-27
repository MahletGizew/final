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
  subject: string,
  year: number
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

      // Use fetchId to get the test id for the subject and year
      const firstTestId = await fetchId(subject, year);
      console.log('Fetching questions for test_id:', firstTestId);

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', firstTestId)
        .order('question_number', { ascending: true });

      console.log('Query response:', { dataLength: data?.length, error });

      if (error) {
        console.error('Supabase query error:', error.message, error.details, error.hint);
        throw new Error(`Failed to fetch questions: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('No questions found for test_id:', firstTestId);
        return {
          questions: [],
          source: 'questionbank',
          warning: `No questions found for test_id ${firstTestId}.`,
        };
      }

      console.log('Raw data sample:', data.slice(0, 2)); // Log first 2 rows for inspection

      const questions: ExamQuestion[] = data.map((q, index) => {
        let options: Option[] = [];
        try {
          options = typeof q.options === 'string' ? JSON.parse(q.options) : Array.isArray(q.options) ? q.options : [];
        } catch (parseError) {
          console.warn(`Invalid options JSON for question ${q.id}:`, parseError, 'Raw options:', q.options);
          options = [];
        }

        const optionMap: { [key: string]: string } = {};
        options.forEach(opt => {
          if (opt?.option && opt?.choice) {
            optionMap[opt.option.toUpperCase()] = opt.choice;
          }
        });

        const question = {
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
          explanation: q.explanation,
        };

        console.log(`Mapped question ${q.id}:`, {
          question_text: question.question_text,
          options: optionMap,
          correct_answer: question.correct_answer,
        }); // Debug mapping

        return question;
      });

      // Filter invalid questions
      const valid = questions.filter(q =>
        q.question_text && q.option_a && q.option_b && q.option_c && q.option_d && q.correct_answer
      );
      console.log('Valid questions count:', valid.length); // Debug filter

      // Deduplicate
      const unique = new Map<string, ExamQuestion>();
      valid.forEach(q => {
        const key = `${q.question_text?.trim().toLowerCase()}|${q.option_a}|${q.option_b}|${q.option_c}|${q.option_d}`;
        if (!unique.has(key)) {
          unique.set(key, q);
        }
      });
      console.log('Unique questions count:', unique.size); // Debug deduplication

      const final = Array.from(unique.values());

      // Sort by question number
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
        warning: final.length === 0 ? 'No valid questions found after filtering' : undefined,
      };

    } catch (error) {
      console.log(error);
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
    .from('subject_tests')
    .select('year')
    .eq('subject_id', subject);

  if (error) throw new Error(error.message);

  return Array.from(
    new Set((data || []).map(item => item.year).filter((y): y is number => typeof y === 'number'))
  ).sort((a, b) => b - a);
};

export const fetchId = async (
  subject: string,
  year: number
): Promise<string> => {
  const { data, error } = await supabase
    .from('subject_tests')
    .select('id')
    .eq('subject_id', subject)
    .eq('year', year);

  if (error) throw new Error(error.message);
  if (!data || !data[0]) throw new Error('No test found for given subject and year');
  console.log('Fetched test id:', data[0].id);
  return data[0].id;
};