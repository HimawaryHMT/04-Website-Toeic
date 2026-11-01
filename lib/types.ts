export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface GrammarUseCase {
  title: string;
  detail: string;
  example: string;
}

export interface GrammarQuestion {
  id?: string;
  type?: 'choice' | 'fill' | 'spot';
  prompt: string;
  sentence?: string;
  options?: string[];
  answer: string;
  cue?: string;
  hint?: string;
  hintVi?: string;
  explain?: string;
}

export interface GrammarLesson {
  id: string;
  title: string;
  titleVi: string;
  group: string;
  summary: string;
  formula: string;
  example: string;
  mistake: string;
  lesson: {
    purpose: string;
    useCases: GrammarUseCase[];
  };
  questions?: GrammarQuestion[] | {
    easy?: GrammarQuestion[];
    medium?: GrammarQuestion[];
    hard?: GrammarQuestion[];
  };
  mediumQuestions?: GrammarQuestion[];
  hardQuestions?: GrammarQuestion[];
}

export interface VocabWord {
  term: string;
  pos: string;
  meaningVi: string;
  notes?: string;
  examples: string[];
  phonetic?: string;
}

export interface VocabDeck {
  id: string;
  eyebrow?: string;
  title: string;
  accent: 'mint' | 'coral' | 'yellow' | 'blue' | string;
  description: string;
  items: [string, string, string, string, string[]][]; // [term, pos, meaningVi, notes, examples]
}

export interface TreeStage {
  stage: number; // 1 to 6
  name: string;
  nameVi: string;
  thresholdXp: number;
  description: string;
}

export interface QuizAttempt {
  id: string;
  lessonId: string;
  lessonTitle: string;
  trackId: 'grammar' | 'topics' | 'cefr';
  level: 'easy' | 'medium' | 'hard';
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  rating: number; // 0..3 stars
  completedAt: string;
}

export interface BookmarkedWord {
  word: string;
  deckId: string;
  pos: string;
  meaningVi: string;
  memoryStatus: 'learning' | 'review' | 'mastered';
  addedAt: string;
}

export interface UserPreferences {
  textSize: 'S' | 'M' | 'L';
  theme: 'light' | 'dark' | 'system';
  language: 'vi' | 'en';
  reviewDir: 'en-vi' | 'vi-en';
  cardFront: 'term' | 'meaning';
  autoSpeak: boolean;
  sound: boolean;
}

export interface DeckProgress {
  lastIndex: number;
  exploredCount: number;
  totalCards: number;
  lastStudiedAt: string;
}

export interface LearningState {
  totalXp: number;
  treeStage: number;
  streak: number;
  lastActiveDate: string;
  dailyDate: string;
  dailyXp: number;
  dailyLevels: number;
  dailyCorrect: number;
  completedLessons: Record<string, { rating: number; bestScore: number; attempts: number }>;
  notebook: Record<string, BookmarkedWord>;
  deckProgress?: Record<string, DeckProgress>;
  history: QuizAttempt[];
  preferences: UserPreferences;
}
