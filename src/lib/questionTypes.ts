export const QUESTION_TYPES = ["multiple_choice", "true_false", "puzzle", "image"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const TIMER_OPTIONS = [5, 10, 20, 30, 60] as const;
