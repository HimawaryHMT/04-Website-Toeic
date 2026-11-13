'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { LearningState, QuizAttempt, VocabWord, BookmarkedWord, UserPreferences } from './types';
import { supabase } from './supabase';

export function getStorageKey(userId?: string | null): string {
  return userId ? `forumflash_progress_user_${userId}` : 'forumflash_progress_guest';
}

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

export function computeDailyAndStreak(rawState: Partial<LearningState>): LearningState {
  const today = getLocalTodayDateString();
  const lastActive = rawState.lastActiveDate || rawState.dailyDate || '';
  let streak = Math.max(1, rawState.streak || 1);

  if (lastActive) {
    const diff = getDaysDifference(lastActive, today);
    if (diff === 1) {
      streak += 1;
    } else if (diff > 1) {
      streak = 1;
    }
  }

  return {
    ...DEFAULT_STATE,
    ...rawState,
    totalXp: Math.max(0, rawState.totalXp || 0),
    treeStage: Math.max(1, rawState.treeStage || 1),
    streak,
    lastActiveDate: today,
    dailyDate: today,
    dailyXp: (rawState.dailyDate === today ? rawState.dailyXp : 0) || 0,
    dailyLevels: (rawState.dailyDate === today ? rawState.dailyLevels : 0) || 0,
    dailyCorrect: (rawState.dailyDate === today ? rawState.dailyCorrect : 0) || 0,
    completedLessons: rawState.completedLessons || {},
    notebook: rawState.notebook || {},
    deckProgress: rawState.deckProgress || {},
    history: (rawState.history || []).slice(0, 100),
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(rawState.preferences || {}),
    },
  };
}

export function loadLocalState(userId?: string | null): LearningState {
  if (typeof window === 'undefined') {
    return {
      ...DEFAULT_STATE,
      lastActiveDate: getLocalTodayDateString(),
      dailyDate: getLocalTodayDateString(),
    };
  }

  const key = getStorageKey(userId);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return computeDailyAndStreak(parsed);
    }
  } catch (e) {
    console.warn(`Failed to load local progress for ${key}:`, e);
  }

  const today = getLocalTodayDateString();
  return {
    ...DEFAULT_STATE,
    lastActiveDate: today,
    dailyDate: today,
  };
}

/**
 * Intelligently merge the local cache and remote cloud state for the SAME authenticated user.
 * Preserves the highest progress made on either local device or remote DB without cross-user bleeding.
 */
export function mergeUserStates(
  local: Partial<LearningState>,
  remote: Partial<LearningState>
): LearningState {
  const today = getLocalTodayDateString();

  // 1. Merge deck progress (take highest explored count & last index per deck)
  const mergedDeckProgress: Record<string, any> = {
    ...(remote.deckProgress || {}),
  };
  if (local.deckProgress) {
    for (const [deckId, prog] of Object.entries(local.deckProgress)) {
      const existing = mergedDeckProgress[deckId];
      if (!existing) {
        mergedDeckProgress[deckId] = prog;
      } else {
        mergedDeckProgress[deckId] = {
          lastIndex: Math.max(existing.lastIndex ?? 0, prog.lastIndex ?? 0),
          exploredCount: Math.max(existing.exploredCount ?? 0, prog.exploredCount ?? 0),
          totalCards: prog.totalCards || existing.totalCards || 0,
          lastStudiedAt:
            prog.lastStudiedAt && existing.lastStudiedAt
              ? (prog.lastStudiedAt > existing.lastStudiedAt ? prog.lastStudiedAt : existing.lastStudiedAt)
              : (prog.lastStudiedAt || existing.lastStudiedAt || new Date().toISOString()),
        };
      }
    }
  }

  // 2. Merge completed lessons (take best scores & ratings)
  const mergedCompletedLessons: Record<string, any> = {
    ...(remote.completedLessons || {}),
  };
  if (local.completedLessons) {
    for (const [lessonId, comp] of Object.entries(local.completedLessons)) {
      const existing = mergedCompletedLessons[lessonId];
      if (!existing) {
        mergedCompletedLessons[lessonId] = comp;
      } else {
        mergedCompletedLessons[lessonId] = {
          rating: Math.max(existing.rating ?? 0, comp.rating ?? 0),
          bestScore: Math.max(existing.bestScore ?? 0, comp.bestScore ?? 0),
          attempts: Math.max(existing.attempts ?? 0, comp.attempts ?? 0),
        };
      }
    }
  }

  // 3. Merge notebook bookmarks
  const mergedNotebook = {
    ...(remote.notebook || {}),
    ...(local.notebook || {}),
  };

  // 4. Merge quiz history (unique by attempt ID)
  const historyMap = new Map<string, QuizAttempt>();
  for (const h of remote.history || []) {
    if (h && h.id) historyMap.set(h.id, h);
  }
  for (const h of local.history || []) {
    if (h && h.id) historyMap.set(h.id, h);
  }
  const mergedHistory = Array.from(historyMap.values())
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 100);

  const rawMerged: Partial<LearningState> = {
    totalXp: Math.max(local.totalXp || 0, remote.totalXp || 0),
    treeStage: Math.max(local.treeStage || 1, remote.treeStage || 1),
    streak: Math.max(local.streak || 1, remote.streak || 1),
    lastActiveDate: local.lastActiveDate || remote.lastActiveDate || today,
    dailyDate: today,
    dailyXp: (local.dailyDate === today ? local.dailyXp : 0) || (remote.dailyDate === today ? remote.dailyXp : 0) || 0,
    dailyLevels: (local.dailyDate === today ? local.dailyLevels : 0) || (remote.dailyDate === today ? remote.dailyLevels : 0) || 0,
    dailyCorrect: (local.dailyDate === today ? local.dailyCorrect : 0) || (remote.dailyDate === today ? remote.dailyCorrect : 0) || 0,
    completedLessons: mergedCompletedLessons,
    notebook: mergedNotebook,
    deckProgress: mergedDeckProgress,
    history: mergedHistory,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(remote.preferences || {}),
      ...(local.preferences || {}),
    },
  };

  return computeDailyAndStreak(rawMerged);
}

interface LearningContextType {
  state: LearningState;
  user: any | null;
  isLoading: boolean;
  addXp: (amount: number) => void;
  recordQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'completedAt'>) => void;
  toggleBookmark: (word: VocabWord, deckId?: string) => boolean;
  addCustomWord: (custom: { term: string; pos?: string; meaningVi: string }) => void;
  removeBookmark: (term: string) => void;
  isBookmarked: (wordTerm: string) => boolean;
  saveDeckProgress: (deckId: string, currentIndex: number, totalCards: number) => void;
  resetDeckProgress: (deckId: string) => void;
  resetAccountProgress: () => Promise<void>;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  refreshUser: (explicitUser?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningState>(DEFAULT_STATE);
  const stateRef = useRef<LearningState>(DEFAULT_STATE);
  const [user, setUser] = useState<any | null>(null);
  const userRef = useRef<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep references always synced
  stateRef.current = state;
  userRef.current = user;

  // Cloud sync helper with onConflict: 'user_id'
  const syncToCloud = useCallback(async (userId: string, stateToSync: LearningState) => {
    if (!supabase || !userId) return;
    try {
      const { error } = await supabase.from('learning_progress').upsert(
        {
          user_id: userId,
          state: stateToSync,
          schema_version: 1,
          client_updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (error) {
        console.error('Supabase learning_progress upsert error:', error);
      }
    } catch (err) {
      console.warn('Supabase learning_progress upsert exception:', err);
    }
  }, []);

  // Save to user-scoped localStorage & debounce Supabase sync (does NOT call setState)
  const persistState = useCallback(
    (newState: LearningState) => {
      stateRef.current = newState;
      const currentUserId = userRef.current?.id;
      const key = getStorageKey(currentUserId);
      try {
        localStorage.setItem(key, JSON.stringify(newState));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }

      // Debounce sync to cloud if user is logged in
      if (currentUserId && supabase) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          syncToCloud(currentUserId, newState);
        }, 500);
      }
    },
    [syncToCloud]
  );

  // Immediately flush any pending sync to cloud
  const flushPendingSync = useCallback(async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    const currentUserId = userRef.current?.id;
    if (currentUserId && supabase) {
      await syncToCloud(currentUserId, stateRef.current);
    }
  }, [syncToCloud]);

  // Window unload listener to flush local progress
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentUserId = userRef.current?.id;
      if (currentUserId) {
        try {
          localStorage.setItem(getStorageKey(currentUserId), JSON.stringify(stateRef.current));
        } catch (e) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // refreshUser loads progress STRICTLY for the target user, never bleeding previous user state
  const refreshUser = useCallback(
    async (explicitUser?: any) => {
      let currentUser = explicitUser;
      if (currentUser === undefined && supabase) {
        try {
          const { data: { user: fetchedUser } } = await supabase.auth.getUser();
          currentUser = fetchedUser;
        } catch (e) {
          currentUser = null;
        }
      }

      userRef.current = currentUser || null;
      setUser(currentUser || null);

      if (!currentUser) {
        // Guest mode: load clean guest state
        const guestState = loadLocalState(null);
        stateRef.current = guestState;
        setState(guestState);
        return;
      }

      // Authenticated user: load local cache for THIS user ID
      const localUserState = loadLocalState(currentUser.id);

      try {
        if (supabase) {
          const { data: progress } = await supabase
            .from('learning_progress')
            .select('state')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          const remoteState =
            progress?.state && typeof progress.state === 'object'
              ? (progress.state as Partial<LearningState>)
              : {};

          // Intelligently merge THIS user's local cache with THIS user's cloud state
          const targetState = mergeUserStates(localUserState, remoteState);

          stateRef.current = targetState;
          setState(targetState);

          // Save merged state to user-scoped localStorage
          try {
            localStorage.setItem(getStorageKey(currentUser.id), JSON.stringify(targetState));
          } catch (e) {}

          // Ensure cloud is immediately in sync with onConflict: 'user_id'
          await syncToCloud(currentUser.id, targetState);
        } else {
          stateRef.current = localUserState;
          setState(localUserState);
        }
      } catch (e) {
        console.warn('Supabase auth/sync error:', e);
        stateRef.current = localUserState;
        setState(localUserState);
      }
    },
    [syncToCloud]
  );

  // Auth listener & initial sync
  useEffect(() => {
    let mounted = true;

    // Initial load
    refreshUser().finally(() => {
      if (mounted) setIsLoading(false);
    });

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT' || !session?.user) {
          if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = null;
          }
          userRef.current = null;
          setUser(null);
          const guestState = loadLocalState(null);
          stateRef.current = guestState;
          setState(guestState);
          setIsLoading(false);
        } else if (session?.user) {
          await refreshUser(session.user);
          setIsLoading(false);
        }
      });

      return () => {
        mounted = false;
        authListener?.subscription?.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  // Sign out: cleanly flushes pending cloud saves, resets state, and disconnects user
  const signOut = useCallback(async () => {
    await flushPendingSync();
    if (supabase) {
      await supabase.auth.signOut();
    }
    userRef.current = null;
    setUser(null);
    const guestState = loadLocalState(null);
    stateRef.current = guestState;
    setState(guestState);
  }, [flushPendingSync]);

  // Reset account progress: clears progress to 0 and streak to 1 for this account
  const resetAccountProgress = useCallback(async () => {
    const today = getLocalTodayDateString();
    const cleanState: LearningState = {
      ...DEFAULT_STATE,
      totalXp: 0,
      treeStage: 1,
      streak: 1,
      lastActiveDate: today,
      dailyDate: today,
      dailyXp: 0,
      dailyLevels: 0,
      dailyCorrect: 0,
      completedLessons: {},
      notebook: {},
      deckProgress: {},
      history: [],
      preferences: stateRef.current.preferences,
    };

    stateRef.current = cleanState;
    setState(cleanState);
    const currentUserId = userRef.current?.id;
    if (currentUserId) {
      try {
        localStorage.setItem(getStorageKey(currentUserId), JSON.stringify(cleanState));
      } catch (e) {}

      if (supabase) {
        await syncToCloud(currentUserId, cleanState);
      }
    }
  }, [syncToCloud]);

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
        persistState(next);
        return next;
      });
    },
    [persistState]
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

        persistState(next);
        return next;
      });

      // Also record into attempt_history table if Supabase is connected
      const currentUserId = userRef.current?.id;
      if (currentUserId && supabase) {
        const sb = supabase;
        sb.from('attempt_history').insert({
          user_id: currentUserId,
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
    [persistState]
  );

  const toggleBookmark = useCallback(
    (word: VocabWord, deckId: string = 'general') => {
      const termKey = word.term.toLowerCase().trim();
      let isNowBookmarked = false;

      setState((prev) => {
        const existing = prev.notebook[termKey];
        const updatedNotebook = { ...prev.notebook };

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

        const next: LearningState = {
          ...prev,
          notebook: updatedNotebook,
        };
        persistState(next);
        return next;
      });

      return isNowBookmarked;
    },
    [persistState]
  );

  const addCustomWord = useCallback(
    (custom: { term: string; pos?: string; meaningVi: string }) => {
      const termKey = custom.term.toLowerCase().trim();
      if (!termKey) return;

      setState((prev) => {
        const item: BookmarkedWord = {
          word: custom.term.trim(),
          deckId: 'custom',
          pos: (custom.pos || 'n').trim(),
          meaningVi: custom.meaningVi.trim(),
          memoryStatus: 'review',
          addedAt: new Date().toISOString(),
        };
        const next: LearningState = {
          ...prev,
          notebook: {
            ...prev.notebook,
            [termKey]: item,
          },
        };
        persistState(next);
        return next;
      });

      const currentUserId = userRef.current?.id;
      if (currentUserId && supabase) {
        supabase
          .from('user_notebook')
          .upsert({
            user_id: currentUserId,
            word: custom.term.trim(),
            deck_id: 'custom',
            pos: (custom.pos || 'n').trim(),
            meaning_vi: custom.meaningVi.trim(),
            memory_level: 0,
          })
          .then();
      }
    },
    [persistState]
  );

  const removeBookmark = useCallback(
    (term: string) => {
      const termKey = term.toLowerCase().trim();
      setState((prev) => {
        const updatedNotebook = { ...prev.notebook };
        delete updatedNotebook[termKey];
        const next: LearningState = {
          ...prev,
          notebook: updatedNotebook,
        };
        persistState(next);
        return next;
      });

      const currentUserId = userRef.current?.id;
      if (currentUserId && supabase) {
        supabase
          .from('user_notebook')
          .delete()
          .match({
            user_id: currentUserId,
            word: term.trim(),
          })
          .then();
      }
    },
    [persistState]
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
        const next: LearningState = {
          ...prev,
          lastActiveDate: today,
          dailyDate: today,
          deckProgress: {
            ...(prev.deckProgress || {}),
            [deckId]: {
              lastIndex: currentIndex,
              exploredCount: Math.min(explored, totalCards),
              totalCards,
              lastStudiedAt: new Date().toISOString(),
            },
          },
        };
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const resetDeckProgress = useCallback(
    (deckId: string) => {
      setState((prev) => {
        const prevProg = prev.deckProgress?.[deckId];
        const next: LearningState = {
          ...prev,
          deckProgress: {
            ...(prev.deckProgress || {}),
            [deckId]: {
              lastIndex: 0,
              exploredCount: prevProg?.exploredCount || 0,
              totalCards: prevProg?.totalCards || 0,
              lastStudiedAt: new Date().toISOString(),
            },
          },
        };
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const updatePreferences = useCallback(
    (partial: Partial<UserPreferences>) => {
      setState((prev) => {
        const next: LearningState = {
          ...prev,
          preferences: {
            ...prev.preferences,
            ...partial,
          },
        };
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  return (
    <LearningContext.Provider
      value={{
        state,
        user,
        isLoading,
        addXp,
        recordQuizAttempt,
        toggleBookmark,
        addCustomWord,
        removeBookmark,
        isBookmarked,
        saveDeckProgress,
        resetDeckProgress,
        resetAccountProgress,
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
