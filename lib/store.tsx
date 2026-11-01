'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { LearningState, QuizAttempt, VocabWord, BookmarkedWord, UserPreferences } from './types';
import { supabase } from './supabase';

const STORAGE_KEY = 'forumflash_progress_v1';

export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalDateStringFromIso(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.split('T')[0] || '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return (isoString || '').split('T')[0] || '';
  }
}

export function getDaysDifference(fromDateStr: string, toDateStr: string): number {
  if (!fromDateStr || !toDateStr) return 999;
  if (fromDateStr === toDateStr) return 0;

  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);

  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 999;

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

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
  lastActiveDate: getLocalTodayDateString(),
  dailyDate: getLocalTodayDateString(),
  dailyXp: 0,
  dailyLevels: 0,
  dailyCorrect: 0,
  completedLessons: {},
  notebook: {},
  deckProgress: {},
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
  saveDeckProgress: (deckId: string, currentIndex: number, totalCards: number) => void;
  resetDeckProgress: (deckId: string) => void;
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
      const today = getLocalTodayDateString();
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const lastActive = parsed.lastActiveDate || parsed.dailyDate || '';
        let streak = Math.max(1, parsed.streak || 1);

        if (lastActive) {
          const diff = getDaysDifference(lastActive, today);
          if (diff === 1) {
            streak += 1;
          } else if (diff > 1) {
            streak = 1;
          }
        }

        const nextState: LearningState = {
          ...DEFAULT_STATE,
          ...parsed,
          streak,
          lastActiveDate: today,
          dailyDate: today,
          dailyXp: (parsed.dailyDate === today ? parsed.dailyXp : 0) || 0,
          dailyLevels: (parsed.dailyDate === today ? parsed.dailyLevels : 0) || 0,
          dailyCorrect: (parsed.dailyDate === today ? parsed.dailyCorrect : 0) || 0,
          preferences: {
            ...DEFAULT_PREFERENCES,
            ...(parsed.preferences || {}),
          },
        };

        setState(nextState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } else {
        const initial = {
          ...DEFAULT_STATE,
          lastActiveDate: today,
          dailyDate: today,
        };
        setState(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
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
        const today = getLocalTodayDateString();

        // Fetch remote learning progress
        const { data: progress } = await supabase
          .from('learning_progress')
          .select('state')
          .eq('user_id', user.id)
          .maybeSingle();

        setState((prev) => {
          let remote: Partial<LearningState> = {};
          if (progress?.state) {
            remote = progress.state as LearningState;
          }

          // Determine previous active date from all available sources
          const lastActiveDateCandidate =
            remote.lastActiveDate ||
            remote.dailyDate ||
            (remote.history && remote.history.length > 0 && remote.history[0].completedAt
              ? getLocalDateStringFromIso(remote.history[0].completedAt)
              : '') ||
            (user.last_sign_in_at ? getLocalDateStringFromIso(user.last_sign_in_at) : '') ||
            (user.created_at ? getLocalDateStringFromIso(user.created_at) : '') ||
            prev.lastActiveDate ||
            '';

          let streak = Math.max(1, remote.streak || prev.streak || 1);

          if (lastActiveDateCandidate) {
            const diff = getDaysDifference(lastActiveDateCandidate, today);
            if (diff === 1) {
              // Logged in on consecutive day! Streak increases by 1!
              streak += 1;
            } else if (diff > 1) {
              // Missed more than 1 day
              streak = 1;
            }
            // If diff === 0, same day login, keep current streak
          }

          const merged: LearningState = {
            ...DEFAULT_STATE,
            ...prev,
            ...remote,
            totalXp: Math.max(prev.totalXp, remote.totalXp || 0),
            streak,
            lastActiveDate: today,
            dailyDate: today,
            dailyXp: (remote.dailyDate === today ? remote.dailyXp : prev.dailyDate === today ? prev.dailyXp : 0) || 0,
            dailyLevels: (remote.dailyDate === today ? remote.dailyLevels : prev.dailyDate === today ? prev.dailyLevels : 0) || 0,
            dailyCorrect: (remote.dailyDate === today ? remote.dailyCorrect : prev.dailyDate === today ? prev.dailyCorrect : 0) || 0,
            completedLessons: {
              ...(remote.completedLessons || {}),
              ...prev.completedLessons,
            },
            notebook: {
              ...(remote.notebook || {}),
              ...prev.notebook,
            },
            deckProgress: {
              ...(remote.deckProgress || {}),
              ...(prev.deckProgress || {}),
            },
            history: [...(remote.history || []), ...(prev.history || [])].slice(0, 100),
            preferences: {
              ...DEFAULT_PREFERENCES,
              ...(remote.preferences || {}),
              ...(prev.preferences || {}),
            },
          };

          // Save locally
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch (e) {}

          // Immediately persist updated streak and lastActiveDate to Supabase cloud
          if (supabase && user) {
            const sb = supabase;
            sb.from('learning_progress')
              .upsert({
                user_id: user.id,
                state: merged,
                schema_version: 1,
                client_updated_at: new Date().toISOString(),
              })
              .then(({ error }) => {
                if (error) console.warn('Supabase learning_progress upsert error:', error);
              });
          }

          return merged;
        });
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
        }, 800);
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
      const today = getLocalTodayDateString();
      setState((prev) => {
        const next: LearningState = {
          ...prev,
          totalXp: prev.totalXp + amount,
          dailyXp: (prev.dailyDate === today ? prev.dailyXp : 0) + amount,
          lastActiveDate: today,
          dailyDate: today,
        };
        saveState(next);
        return next;
      });
    },
    [saveState]
  );

  const recordQuizAttempt = useCallback(
    (attemptData: Omit<QuizAttempt, 'id' | 'completedAt'>) => {
      const today = getLocalTodayDateString();
      const attempt: QuizAttempt = {
        ...attemptData,
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        completedAt: new Date().toISOString(),
      };

      setState((prev) => {
        const prevCompleted = prev.completedLessons[attempt.lessonId] || { rating: 0, bestScore: 0, attempts: 0 };
        const newRating = Math.max(prevCompleted.rating, attempt.rating);
        const newBestScore = Math.max(prevCompleted.bestScore, attempt.scorePercent);

        const updatedCompleted = {
          ...prev.completedLessons,
          [attempt.lessonId]: {
            rating: newRating,
            bestScore: newBestScore,
            attempts: prevCompleted.attempts + 1,
          },
        };

        // Bonus XP for passing (80%+)
        const xpGained = attempt.scorePercent >= 80 ? (attempt.rating === 3 ? 150 : 100) : 40;

        const next: LearningState = {
          ...prev,
          totalXp: prev.totalXp + xpGained,
          dailyXp: (prev.dailyDate === today ? prev.dailyXp : 0) + xpGained,
          dailyLevels: (prev.dailyDate === today ? prev.dailyLevels : 0) + 1,
          dailyCorrect: (prev.dailyDate === today ? prev.dailyCorrect : 0) + attempt.correctCount,
          lastActiveDate: today,
          dailyDate: today,
          completedLessons: updatedCompleted,
          history: [attempt, ...prev.history].slice(0, 100),
        };

        saveState(next);
        return next;
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
    [user, saveState]
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

  const saveDeckProgress = useCallback(
    (deckId: string, currentIndex: number, totalCards: number) => {
      const today = getLocalTodayDateString();
      setState((prev) => {
        const prevProg = prev.deckProgress?.[deckId];
        const explored = Math.max(prevProg?.exploredCount || 0, currentIndex + 1);
        const updatedDeckProgress = {
          ...(prev.deckProgress || {}),
          [deckId]: {
            lastIndex: currentIndex,
            exploredCount: Math.min(explored, totalCards),
            totalCards,
            lastStudiedAt: new Date().toISOString(),
          },
        };

        const next: LearningState = {
          ...prev,
          lastActiveDate: today,
          dailyDate: today,
          deckProgress: updatedDeckProgress,
        };

        saveState(next);
        return next;
      });
    },
    [saveState]
  );

  const resetDeckProgress = useCallback(
    (deckId: string) => {
      setState((prev) => {
        const prevProg = prev.deckProgress?.[deckId];
        const updatedDeckProgress = {
          ...(prev.deckProgress || {}),
          [deckId]: {
            lastIndex: 0,
            exploredCount: prevProg?.exploredCount || 0,
            totalCards: prevProg?.totalCards || 0,
            lastStudiedAt: new Date().toISOString(),
          },
        };
        const next: LearningState = {
          ...prev,
          deckProgress: updatedDeckProgress,
        };
        saveState(next);
        return next;
      });
    },
    [saveState]
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
        saveDeckProgress,
        resetDeckProgress,
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
