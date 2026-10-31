'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { LearningState, QuizAttempt, VocabWord, BookmarkedWord, UserPreferences } from './types';
import { supabase } from './supabase';

const STORAGE_KEY = 'forumflash_progress_v1';

const DEFAULT_PREFERENCES: UserPreferences = {
  textSize: 'M',
  theme: 'light',
  language: 'vi',
  reviewDir: 'en-vi',
  cardFront: 'term',
  autoSpeak: false,
  sound: true,
};

const DEFAULT_STATE: LearningState = {
  totalXp: 0,
  treeStage: 1,
  streak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  dailyDate: new Date().toISOString().split('T')[0],
  dailyXp: 0,
  dailyLevels: 0,
  dailyCorrect: 0,
  completedLessons: {},
  notebook: {},
  history: [],
  preferences: DEFAULT_PREFERENCES,
};

interface LearningContextType {
  state: LearningState;
  user: any | null;
  isLoading: boolean;
  addXp: (amount: number) => void;
  recordQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'completedAt'>) => void;
  toggleBookmark: (word: VocabWord, deckId?: string) => boolean;
  isBookmarked: (wordTerm: string) => boolean;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningState>(DEFAULT_STATE);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load initial state from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];

        // Check streak and daily stats reset
        let streak = parsed.streak || 1;
        let dailyDate = parsed.dailyDate || today;
        let dailyXp = parsed.dailyXp || 0;
        let dailyLevels = parsed.dailyLevels || 0;
        let dailyCorrect = parsed.dailyCorrect || 0;

        if (dailyDate !== today) {
          dailyDate = today;
          dailyXp = 0;
          dailyLevels = 0;
          dailyCorrect = 0;

          // Check if streak is continuous
          const lastDate = new Date(parsed.lastActiveDate || today);
          const currDate = new Date(today);
          const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            streak += 1;
          } else if (diffDays > 1) {
            streak = 1;
          }
        }

        setState({
          ...DEFAULT_STATE,
          ...parsed,
          streak,
          dailyDate,
          dailyXp,
          dailyLevels,
          dailyCorrect,
          preferences: {
            ...DEFAULT_PREFERENCES,
            ...(parsed.preferences || {}),
          },
        });
      }
    } catch (e) {
      console.warn('Failed to load local progress:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Auth listener & cloud sync
  const refreshUser = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch remote learning progress
        const { data: progress } = await supabase
          .from('learning_progress')
          .select('state')
          .eq('user_id', user.id)
          .maybeSingle();

        if (progress?.state) {
          // Merge local and remote
          setState((prev) => {
            const remote = progress.state as LearningState;
            const merged: LearningState = {
              ...prev,
              totalXp: Math.max(prev.totalXp, remote.totalXp || 0),
              streak: Math.max(prev.streak, remote.streak || 1),
              completedLessons: {
                ...(remote.completedLessons || {}),
                ...prev.completedLessons,
              },
              notebook: {
                ...(remote.notebook || {}),
                ...prev.notebook,
              },
              history: [...(remote.history || []), ...(prev.history || [])].slice(0, 100),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn('Supabase auth/sync error:', e);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(() => {
        refreshUser();
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [refreshUser]);

  // 3. Save to localStorage & schedule Supabase sync
  const saveState = useCallback(
    (newState: LearningState) => {
      setState(newState);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }

      // Sync to cloud if user logged in
      if (user && supabase) {
        const sb = supabase;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(async () => {
          try {
            await sb.from('learning_progress').upsert({
              user_id: user.id,
              state: newState,
              schema_version: 1,
              client_updated_at: new Date().toISOString(),
            });
          } catch (err) {
            console.warn('Cloud sync error:', err);
          }
        }, 1000);
      }
    },
    [user]
  );

  // Apply theme & text size to HTML element
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', state.preferences.theme);
    root.setAttribute('data-text-size', state.preferences.textSize.toLowerCase());
  }, [state.preferences.theme, state.preferences.textSize]);

  // Actions
  const addXp = useCallback(
    (amount: number) => {
      saveState({
        ...state,
        totalXp: state.totalXp + amount,
        dailyXp: state.dailyXp + amount,
        lastActiveDate: new Date().toISOString().split('T')[0],
      });
    },
    [state, saveState]
  );

  const recordQuizAttempt = useCallback(
    (attemptData: Omit<QuizAttempt, 'id' | 'completedAt'>) => {
      const attempt: QuizAttempt = {
        ...attemptData,
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        completedAt: new Date().toISOString(),
      };

      const prevCompleted = state.completedLessons[attempt.lessonId] || { rating: 0, bestScore: 0, attempts: 0 };
      const newRating = Math.max(prevCompleted.rating, attempt.rating);
      const newBestScore = Math.max(prevCompleted.bestScore, attempt.scorePercent);

      const updatedCompleted = {
        ...state.completedLessons,
        [attempt.lessonId]: {
          rating: newRating,
          bestScore: newBestScore,
          attempts: prevCompleted.attempts + 1,
        },
      };

      // Bonus XP for passing (80%+)
      const xpGained = attempt.scorePercent >= 80 ? (attempt.rating === 3 ? 150 : 100) : 40;

      saveState({
        ...state,
        totalXp: state.totalXp + xpGained,
        dailyXp: state.dailyXp + xpGained,
        dailyLevels: state.dailyLevels + 1,
        dailyCorrect: state.dailyCorrect + attempt.correctCount,
        completedLessons: updatedCompleted,
        history: [attempt, ...state.history].slice(0, 100),
      });

      // Also record into attempt_history table if Supabase is connected
      if (user && supabase) {
        const sb = supabase;
        sb.from('attempt_history').insert({
          user_id: user.id,
          lesson_id: attempt.lessonId,
          lesson_title: attempt.lessonTitle,
          track_id: attempt.trackId,
          level: attempt.level,
          correct_count: attempt.correctCount,
          total_questions: attempt.totalQuestions,
          score_percent: attempt.scorePercent,
          rating: attempt.rating,
        }).then();
      }
    },
    [state, user, saveState]
  );

  const toggleBookmark = useCallback(
    (word: VocabWord, deckId: string = 'general') => {
      const termKey = word.term.toLowerCase().trim();
      const existing = state.notebook[termKey];
      const updatedNotebook = { ...state.notebook };

      let isNowBookmarked = false;
      if (existing) {
        delete updatedNotebook[termKey];
        isNowBookmarked = false;
      } else {
        const item: BookmarkedWord = {
          word: word.term,
          deckId,
          pos: word.pos,
          meaningVi: word.meaningVi,
          memoryStatus: 'review',
          addedAt: new Date().toISOString(),
        };
        updatedNotebook[termKey] = item;
        isNowBookmarked = true;
      }

      saveState({
        ...state,
        notebook: updatedNotebook,
      });

      return isNowBookmarked;
    },
    [state, saveState]
  );

  const isBookmarked = useCallback(
    (wordTerm: string) => {
      return Boolean(state.notebook[wordTerm.toLowerCase().trim()]);
    },
    [state.notebook]
  );

  const updatePreferences = useCallback(
    (partial: Partial<UserPreferences>) => {
      saveState({
        ...state,
        preferences: {
          ...state.preferences,
          ...partial,
        },
      });
    },
    [state, saveState]
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
    }
  }, []);

  return (
    <LearningContext.Provider
      value={{
        state,
        user,
        isLoading,
        addXp,
        recordQuizAttempt,
        toggleBookmark,
        isBookmarked,
        updatePreferences,
        refreshUser,
        signOut,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}
