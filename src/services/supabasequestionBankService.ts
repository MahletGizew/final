import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Interface for the raw options JSON structure
interface Option {
  option: string;
  choice: string;
}

// Updated ExamQuestion interface
export interface ExamQuestion {
  id: string;
  question_number?: number | string; // Added from table
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

// Local storage keys (distinct from original code)
const STORED_QUESTIONS_KEY = 'ethio_questionbank_questions';
const QUESTION_USAGE_KEY = 'ethio_questionbank_usage';
const LAST_SYNC_KEY = 'ethio_questionbank_last_sync';

/**
 * Checks if the device is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Get stored questions from local storage (only for history)
 */
export const getStoredQuestions = (): ExamQuestion[] => {
  try {
    const storedQuestionsJson = localStorage.getItem(STORED_QUESTIONS_KEY);
    if (!storedQuestionsJson) return [];
    return JSON.parse(storedQuestionsJson);
  } catch (error) {
    console.error('Error retrieving stored questions:', error);
    return [];
  }
};

/**
 * Save questions to local storage for history
 */
export const storeQuestions = (questions: ExamQuestion[]): void => {
  try {
    localStorage.setItem(STORED_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (error) {
    console.error('Error storing questions:', error);
  }
};

/**
 * Track which questions have been used in which exam sessions
 */
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
 * Fetches questions from the Supabase questions table by subject and year
 */
export const fetchQuestionsBySubjectAndYear = async (
  supabase: SupabaseClient,
  count: number,
  subject: string,
  year: number | string,
  examId: string = Date.now().toString()
): Promise<{ questions: ExamQuestion[]; source: 'questionbank'; warning?: string }> => {
  if (!isOnline()) {
    throw new Error('An internet connection is required to fetch questions. Please connect and try again.');
  }

  console.log(`Fetching ${count} questions for subject: ${subject}, year: ${year}`);

  // Maximum attempts for retrying on transient errors
  const maxAttempts = 3;
  const baseDelay = 2000; // 2 second initial delay
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt}/${maxAttempts}`);

      // Inform user of retry attempts
      if (attempt > 1) {
        toast.info(`Retrying question fetch (attempt ${attempt}/${maxAttempts})...`);
      }

      // Build Supabase query
      let query = supabase
        .from('questions')
        .select('id, question_number, question_text, options, correct_answer, subject, year, explanation')
        .eq('subject', subject)
        .eq('year', year)
        .limit(count);

      const { data, error } = await query;

      if (error) {
        console.error(`Error from Supabase (attempt ${attempt}):`, error);
        lastError = new Error(`Database error: ${error.message}`);
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 15000); // Exponential backoff, max 15 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!data || data.length === 0) {
        console.error(`No questions found (attempt ${attempt})`);
        lastError = new Error('No questions found for the specified subject and year');
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 15000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Parse options and transform to ExamQuestion format
      const questions: ExamQuestion[] = data.map((q, index) => {
        let options: Option[] = [];
        try {
          options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        } catch (parseError) {
          console.warn(`Failed to parse options for question ${q.id}:`, parseError);
          options = [];
        }

        // Map options to option_a, option_b, option_c, option_d
        const optionMap: { [key: string]: string } = {};
        options.forEach((opt: Option) => {
          if (opt.option && opt.choice) {
            optionMap[opt.option.toUpperCase()] = opt.choice;
          }
        });

        return {
          id: q.id || `db-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
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

      // Filter out invalid questions (missing required fields)
      const validQuestions = questions.filter(q => 
        q.question_text && 
        q.option_a && 
        q.option_b && 
        q.option_c && 
        q.option_d && 
        q.correct_answer
      );

      if (validQuestions.length === 0) {
        console.error(`No valid questions after parsing (attempt ${attempt})`);
        lastError = new Error('No valid questions found after parsing options');
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 15000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Basic deduplication by question_text and options
      const unique = new Map<string, ExamQuestion>();
      for (const q of validQuestions) {
        const key =
          (q.question_text?.trim().toLowerCase() || '') +
          '|' +
          (q.option_a?.trim().toLowerCase() || '') +
          '|' +
          (q.option_b?.trim().toLowerCase() || '') +
          '|' +
          (q.option_c?.trim().toLowerCase() || '') +
          '|' +
          (q.option_d?.trim().toLowerCase() || '');
        if (!unique.has(key)) {
          unique.set(key, q);
        }
      }
      let finalQuestions = Array.from(unique.values());

      // Limit to requested count
      finalQuestions = finalQuestions.slice(0, count);

      // Store questions and track usage
      storeQuestions(finalQuestions);
      trackQuestionUsage(examId, finalQuestions.map(q => q.id));

      console.log(`Successfully fetched ${finalQuestions.length} unique questions after ${attempt} attempts`);

      return {
        questions: finalQuestions,
        source: 'questionbank',
        warning: data.length < count ? 'Not enough unique questions available' : undefined
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Attempt ${attempt}: Question fetch failed:`, errorMessage);
      lastError = error instanceof Error ? error : new Error(errorMessage);

      // Don't retry network errors
      if (errorMessage.includes('internet') || errorMessage.includes('network') || errorMessage.includes('connection')) {
        throw lastError;
      }

      // Wait before retrying
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 15000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  console.error(`All ${maxAttempts} attempts to fetch questions failed`);
  const finalError = lastError?.message || 'Failed to fetch questions after multiple attempts';

  // Show user-friendly error
  toast.error('Failed to fetch questions. Please try again in a moment.', {
    description: 'Our database service is experiencing temporary issues. We’re working on it!'
  });

  throw new Error(finalError);
};