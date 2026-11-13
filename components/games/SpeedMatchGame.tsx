'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameWord } from './types';
import { gameSound } from './GameSound';
import { useLearning } from '@/lib/store';
import confetti from 'canvas-confetti';
import {
  X,
  Timer,
  Heart,
  Zap,
  RotateCcw,
  Sparkles,
  Trophy,
  Settings2,
  Award,
} from 'lucide-react';

interface SpeedMatchGameProps {
  words: GameWord[];
  sourceName: string;
  onClose: () => void;
  onChangeSource: () => void;
}

interface MatchCard {
  id: string;
  text: string;
  type: 'en' | 'vi';
  wordTerm: string;
  pos?: string;
  isMatched: boolean;
  isError: boolean;
}

export function SpeedMatchGame({
  words,
  sourceName,
  onClose,
  onChangeSource,
}: SpeedMatchGameProps) {
  const { addXp } = useLearning();

  const [mode, setMode] = useState<'time' | 'survival'>('time');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Stats
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [lives, setLives] = useState(3);
  const [earnedXp, setEarnedXp] = useState(0);

  // Cards on board
  const [activeCards, setActiveCards] = useState<MatchCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Remaining words pool for refill
  const remainingPoolRef = useRef<GameWord[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Shuffle helper
  const shuffle = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Initialize and start game
  const startGame = useCallback((selectedMode: 'time' | 'survival' = mode) => {
    if (words.length < 4) return;

    setMode(selectedMode);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMatchedPairs(0);
    setTimeLeft(60);
    setLives(3);
    setIsGameOver(false);
    setSelectedCardId(null);
    setEarnedXp(0);

    // Shuffle full word pool
    const shuffledWords = shuffle(words);
    const initialPairs = shuffledWords.slice(0, 4);
    remainingPoolRef.current = shuffledWords.slice(4);

    // Create cards for the 4 pairs
    const cards: MatchCard[] = [];
    initialPairs.forEach((w) => {
      cards.push({
        id: `en_${w.term}_${Math.random()}`,
        text: w.term,
        type: 'en',
        wordTerm: w.term,
        pos: w.pos,
        isMatched: false,
        isError: false,
      });
      cards.push({
        id: `vi_${w.term}_${Math.random()}`,
        text: w.meaningVi,
        type: 'vi',
        wordTerm: w.term,
        pos: w.pos,
        isMatched: false,
        isError: false,
      });
    });

    setActiveCards(shuffle(cards));
    setIsPlaying(true);
  }, [mode, words]);

  // Handle Game Over
  const handleGameOver = useCallback(() => {
    setIsPlaying(false);
    setIsGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate XP reward
    const xp = Math.min(200, Math.max(20, Math.round(score / 15) + matchedPairs * 6));
    setEarnedXp(xp);
    addXp(xp);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
      });
      gameSound.playVictory();
    } catch {}
  }, [addXp, matchedPairs, score]);

  // Timer effect for Time Attack mode
  useEffect(() => {
    if (!isPlaying || mode !== 'time') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, mode, handleGameOver]);

  // Card click handler
  const handleCardClick = (card: MatchCard) => {
    if (!isPlaying || card.isMatched || card.isError) return;

    // First card selected
    if (!selectedCardId) {
      setSelectedCardId(card.id);
      if (card.type === 'en') {
        gameSound.speak(card.text);
      }
      return;
    }

    // Clicked the same card -> deselect
    if (selectedCardId === card.id) {
      setSelectedCardId(null);
      return;
    }

    const firstCard = activeCards.find((c) => c.id === selectedCardId);
    if (!firstCard) {
      setSelectedCardId(card.id);
      return;
    }

    // Clicked another card of SAME type -> switch selection
    if (firstCard.type === card.type) {
      setSelectedCardId(card.id);
      if (card.type === 'en') {
        gameSound.speak(card.text);
      }
      return;
    }

    // Clicked OPPOSITE type -> check match!
    const isMatch = firstCard.wordTerm.toLowerCase().trim() === card.wordTerm.toLowerCase().trim();

    if (isMatch) {
      // MATCH SUCCESS
      gameSound.playCorrect();
      gameSound.speak(firstCard.type === 'en' ? firstCard.text : card.text);

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      if (nextCombo >= 3) {
        gameSound.playCombo();
      }

      const points = Math.round(100 * (1 + (nextCombo - 1) * 0.25));
      setScore((prev) => prev + points);
      setMatchedPairs((prev) => prev + 1);

      // Mark matched
      setActiveCards((prev) =>
        prev.map((c) =>
          c.id === firstCard.id || c.id === card.id ? { ...c, isMatched: true } : c
        )
      );
      setSelectedCardId(null);

      // Refill pair after 300ms
      setTimeout(() => {
        // Pick new word from pool (or recycle)
        let nextWord: GameWord | undefined = remainingPoolRef.current.shift();
        if (!nextWord) {
          // Recycle from original list
          remainingPoolRef.current = shuffle(words);
          nextWord = remainingPoolRef.current.shift();
        }

        if (nextWord) {
          const newEnCard: MatchCard = {
            id: `en_${nextWord.term}_${Math.random()}`,
            text: nextWord.term,
            type: 'en',
            wordTerm: nextWord.term,
            pos: nextWord.pos,
            isMatched: false,
            isError: false,
          };
          const newViCard: MatchCard = {
            id: `vi_${nextWord.term}_${Math.random()}`,
            text: nextWord.meaningVi,
            type: 'vi',
            wordTerm: nextWord.term,
            pos: nextWord.pos,
            isMatched: false,
            isError: false,
          };

          setActiveCards((prev) => {
            const filtered = prev.filter((c) => c.id !== firstCard.id && c.id !== card.id);
            return shuffle([...filtered, newEnCard, newViCard]);
          });
        }
      }, 350);
    } else {
      // MATCH FAILED
      gameSound.playWrong();
      setCombo(0);

      // Shake animation
      setActiveCards((prev) =>
        prev.map((c) =>
          c.id === firstCard.id || c.id === card.id ? { ...c, isError: true } : c
        )
      );

      // Decrement life if survival mode
      if (mode === 'survival') {
        setLives((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setTimeout(() => handleGameOver(), 500);
          }
          return next;
        });
      }

      setTimeout(() => {
        setActiveCards((prev) =>
          prev.map((c) =>
            c.id === firstCard.id || c.id === card.id ? { ...c, isError: false } : c
          )
        );
        setSelectedCardId(null);
      }, 450);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Nối Từ Siêu Tốc
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  Speed Match
                </span>
              </div>
              <button
                onClick={onChangeSource}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Nguồn: {sourceName}</span>
                <Settings2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRE-GAME / MODE SELECTOR */}
        {!isPlaying && !isGameOver && (
          <div className="my-auto py-8 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Zap className="w-8 h-8 fill-amber-500" />
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Sẵn sàng thử thách phản xạ?
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
              Chạm vào cặp Từ tiếng Anh & Nghĩa tiếng Việt tương ứng thật nhanh. Combo càng cao, điểm thưởng và XP càng lớn!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
              <button
                onClick={() => setMode('time')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  mode === 'time'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Đua Thời Gian (60s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Nối được càng nhiều cặp từ trong 60 giây càng tốt.
                </p>
              </button>

              <button
                onClick={() => setMode('survival')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  mode === 'survival'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Sinh Tồn (3 Mạng)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mỗi lần nối sai mất 1 ❤️. Sai 3 lần game kết thúc!
                </p>
              </button>
            </div>

            <button
              onClick={() => startGame(mode)}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-[1.01]"
            >
              BẮT ĐẦU CHƠI NGAY
            </button>
          </div>
        )}

        {/* ACTIVE GAMEPLAY */}
        {isPlaying && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Live Status Bar */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 mb-4 text-xs font-bold">
              {/* Score & Combo */}
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Điểm số</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {score.toLocaleString()}
                  </span>
                </div>

                {combo > 1 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-bounce">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Combo x{combo}!</span>
                  </div>
                )}
              </div>

              {/* Mode Specific Status */}
              {mode === 'time' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <Timer className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
                  <span className={`text-sm font-black ${timeLeft <= 10 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                    {timeLeft}s
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((heart) => (
                    <Heart
                      key={heart}
                      className={`w-5 h-5 transition-all ${
                        heart <= lives
                          ? 'text-rose-500 fill-rose-500 scale-100'
                          : 'text-slate-300 dark:text-slate-700 scale-75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Cards Grid (8 Cards: 4 Pairs) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-auto py-2">
              {activeCards.map((card) => {
                const isSelected = selectedCardId === card.id;

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    disabled={card.isMatched}
                    className={`relative p-4 sm:p-5 rounded-2xl font-bold text-center transition-all cursor-pointer select-none min-h-[96px] sm:min-h-[115px] flex flex-col items-center justify-center shadow-sm border-2 ${
                      card.isMatched
                        ? 'opacity-0 scale-90 pointer-events-none'
                        : card.isError
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 animate-shake'
                        : isSelected
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-slate-900 dark:text-white scale-105 shadow-amber-400/20 shadow-md ring-2 ring-amber-400/40'
                        : card.type === 'en'
                        ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-200 hover:border-blue-400 hover:scale-[1.02]'
                        : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 hover:border-emerald-400 hover:scale-[1.02]'
                    }`}
                  >
                    {/* Badge EN / VI */}
                    <span
                      className={`absolute top-2 left-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        card.type === 'en'
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {card.type.toUpperCase()}
                      {card.pos ? ` • ${card.pos}` : ''}
                    </span>

                    {/* Word text */}
                    <span className="text-sm sm:text-base font-extrabold line-clamp-3 mt-2">
                      {card.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom mini tip */}
            <div className="text-center pt-3 text-[11px] text-slate-400">
              💡 Chạm 1 từ tiếng Anh và 1 nghĩa tiếng Việt để nối cặp.
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {isGameOver && (
          <div className="my-auto py-6 text-center max-w-md mx-auto animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-8 h-8" />
            </div>

            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Hoàn Thành Lượt Chơi!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Bạn đã thể hiện phản xạ từ vựng rất tuyệt vời!
            </p>

            {/* Stats Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 mb-6 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Điểm Số
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {score.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Cặp Nối Được
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {matchedPairs}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Combo Max
                </span>
                <span className="text-lg font-black text-amber-500">
                  x{maxCombo}
                </span>
              </div>
            </div>

            {/* XP Gained Reward Banner */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs mb-6">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>+{earnedXp} XP đã được cộng vào Cây Tri Thức!</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại</span>
              </button>
              <button
                onClick={onChangeSource}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Đổi Bộ Từ
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
