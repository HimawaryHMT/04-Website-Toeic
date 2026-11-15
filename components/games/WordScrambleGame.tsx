'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameWord } from './types';
import { gameSound } from './GameSound';
import { useLearning } from '@/lib/store';
import confetti from 'canvas-confetti';
import {
  X,
  Settings2,
  Award,
  RotateCcw,
  Lightbulb,
  CornerDownLeft,
  Trash2,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface WordScrambleGameProps {
  words: GameWord[];
  sourceName: string;
  onClose: () => void;
  onChangeSource: () => void;
}

interface LetterTile {
  id: string;
  char: string;
  isUsed: boolean;
  isHinted?: boolean;
}

export function WordScrambleGame({
  words,
  sourceName,
  onClose,
  onChangeSource,
}: WordScrambleGameProps) {
  const { addXp } = useLearning();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Game run data
  const [questionList, setQuestionList] = useState<GameWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Current question state
  const [availableTiles, setAvailableTiles] = useState<LetterTile[]>([]);
  const [placedTiles, setPlacedTiles] = useState<LetterTile[]>([]);
  const [isWordSolved, setIsWordSolved] = useState(false);
  const [isWordWrong, setIsWordWrong] = useState(false);
  const [hintsUsedThisWord, setHintsUsedThisWord] = useState(0);

  // Overall Stats
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalHints, setTotalHints] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);

  const TOTAL_QUESTIONS = Math.min(10, Math.max(4, words.length));

  // Shuffle helper
  const shuffle = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Setup current word
  const loadWord = useCallback((word: GameWord) => {
    // Only scramble alphabetic characters, handle spaces/hyphens
    const cleanTerm = word.term.trim().toLowerCase();
    const chars = cleanTerm.split('');

    const tiles: LetterTile[] = chars.map((char, index) => ({
      id: `tile_${index}_${char}_${Math.random()}`,
      char,
      isUsed: false,
    }));

    // Ensure shuffled order is different from original
    let shuffled = shuffle(tiles);
    if (shuffled.map((t) => t.char).join('') === cleanTerm && cleanTerm.length > 2) {
      shuffled = shuffle(tiles);
    }

    setAvailableTiles(shuffled);
    setPlacedTiles([]);
    setIsWordSolved(false);
    setIsWordWrong(false);
    setHintsUsedThisWord(0);
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    if (words.length < 4) return;
    const shuffled = shuffle(words).slice(0, TOTAL_QUESTIONS);
    setQuestionList(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setTotalHints(0);
    setIsGameOver(false);
    setIsPlaying(true);
    setEarnedXp(0);
    loadWord(shuffled[0]);
  }, [words, TOTAL_QUESTIONS, loadWord]);

  // Handle Game Over
  const handleGameOver = useCallback(
    (finalCorrect: number, finalScore: number) => {
      setIsPlaying(false);
      setIsGameOver(true);

      const xp = Math.min(220, Math.max(25, Math.round(finalScore / 12) + finalCorrect * 8));
      setEarnedXp(xp);
      addXp(xp);

      try {
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.55 },
        });
        gameSound.playVictory();
      } catch {}
    },
    [addXp]
  );

  // Move to next word
  const nextWord = useCallback(() => {
    if (currentIndex + 1 < questionList.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      loadWord(questionList[nextIdx]);
    } else {
      handleGameOver(correctCount, score);
    }
  }, [currentIndex, questionList, loadWord, handleGameOver, correctCount, score]);

  // Check word when placed letters reach full length
  const checkAnswer = useCallback(
    (newPlaced: LetterTile[]) => {
      const currentWord = questionList[currentIndex];
      if (!currentWord) return;

      const target = currentWord.term.trim().toLowerCase();
      const entered = newPlaced.map((t) => t.char).join('').toLowerCase();

      if (entered === target) {
        // SOLVED!
        setIsWordSolved(true);
        setIsWordWrong(false);
        gameSound.playCorrect();
        gameSound.speak(currentWord.term);

        const earnedPoints = Math.max(50, 150 - hintsUsedThisWord * 30);
        setScore((prev) => prev + earnedPoints);
        setCorrectCount((prev) => prev + 1);

        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.65 },
          });
        } catch {}

        // Auto advance after 1.1s
        setTimeout(() => {
          nextWord();
        }, 1100);
      } else {
        // WRONG ORDER
        setIsWordWrong(true);
        gameSound.playWrong();
        setTimeout(() => {
          setIsWordWrong(false);
        }, 500);
      }
    },
    [currentIndex, questionList, hintsUsedThisWord, nextWord]
  );

  // Click on available tile -> Place it
  const handlePlaceTile = useCallback(
    (tile: LetterTile) => {
      if (tile.isUsed || isWordSolved) return;

      const updatedAvailable = availableTiles.map((t) =>
        t.id === tile.id ? { ...t, isUsed: true } : t
      );
      const updatedPlaced = [...placedTiles, tile];

      setAvailableTiles(updatedAvailable);
      setPlacedTiles(updatedPlaced);

      const targetLength = questionList[currentIndex]?.term.trim().length || 0;
      if (updatedPlaced.length === targetLength) {
        checkAnswer(updatedPlaced);
      }
    },
    [availableTiles, placedTiles, isWordSolved, questionList, currentIndex, checkAnswer]
  );

  // Click on placed tile -> Return it
  const handleReturnTile = useCallback(
    (tile: LetterTile) => {
      if (isWordSolved || tile.isHinted) return;

      const updatedPlaced = placedTiles.filter((t) => t.id !== tile.id);
      const updatedAvailable = availableTiles.map((t) =>
        t.id === tile.id ? { ...t, isUsed: false } : t
      );

      setPlacedTiles(updatedPlaced);
      setAvailableTiles(updatedAvailable);
      setIsWordWrong(false);
    },
    [isWordSolved, placedTiles, availableTiles]
  );

  // Backspace undo last tile
  const handleUndo = useCallback(() => {
    if (placedTiles.length === 0 || isWordSolved) return;
    const lastTile = placedTiles[placedTiles.length - 1];
    if (lastTile.isHinted) return;
    handleReturnTile(lastTile);
  }, [placedTiles, isWordSolved, handleReturnTile]);

  // Clear all non-hinted placed tiles
  const handleClear = useCallback(() => {
    if (placedTiles.length === 0 || isWordSolved) return;
    const nonHinted = placedTiles.filter((t) => !t.isHinted);
    const nonHintedIds = new Set(nonHinted.map((t) => t.id));

    setPlacedTiles(placedTiles.filter((t) => t.isHinted));
    setAvailableTiles(
      availableTiles.map((t) => (nonHintedIds.has(t.id) ? { ...t, isUsed: false } : t))
    );
    setIsWordWrong(false);
  }, [placedTiles, isWordSolved, availableTiles]);

  // Hint: automatically place next correct character
  const handleHint = useCallback(() => {
    const currentWord = questionList[currentIndex];
    if (!currentWord || isWordSolved) return;

    const targetChars = currentWord.term.trim().toLowerCase().split('');
    const nextTargetIndex = placedTiles.length;
    if (nextTargetIndex >= targetChars.length) return;

    const neededChar = targetChars[nextTargetIndex];

    // Find an available unused tile with this char
    const candidate = availableTiles.find((t) => !t.isUsed && t.char.toLowerCase() === neededChar);
    if (!candidate) return;

    const hintedTile: LetterTile = { ...candidate, isHinted: true, isUsed: true };
    const updatedAvailable = availableTiles.map((t) =>
      t.id === candidate.id ? { ...t, isUsed: true } : t
    );
    const updatedPlaced = [...placedTiles, hintedTile];

    setAvailableTiles(updatedAvailable);
    setPlacedTiles(updatedPlaced);
    setHintsUsedThisWord((prev) => prev + 1);
    setTotalHints((prev) => prev + 1);

    if (updatedPlaced.length === targetChars.length) {
      checkAnswer(updatedPlaced);
    }
  }, [questionList, currentIndex, isWordSolved, placedTiles, availableTiles, checkAnswer]);

  // Keyboard navigation listener
  useEffect(() => {
    if (!isPlaying || isWordSolved) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
        return;
      }

      const keyChar = e.key.toLowerCase();
      // If user pressed a letter or space
      if (keyChar.length === 1) {
        const match = availableTiles.find((t) => !t.isUsed && t.char.toLowerCase() === keyChar);
        if (match) {
          e.preventDefault();
          handlePlaceTile(match);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isWordSolved, availableTiles, handleUndo, handleClear, handlePlaceTile]);

  const currentWord = questionList[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              🧩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Giải Mã Ký Tự
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  Word Scramble
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

        {/* PRE-GAME */}
        {!isPlaying && !isGameOver && (
          <div className="my-auto py-8 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/10">
              🧩
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Khắc sâu chính tả từ vựng
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
              Các chữ cái bị xáo trộn! Nhìn nghĩa tiếng Việt và ghép các ký tự lại thành từ tiếng Anh hoàn chỉnh. Bạn có thể bấm chuột hoặc gõ phím trực tiếp!
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-8 text-left space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span>Gõ phím hoặc chạm vào bong bóng chữ cái để ghép.</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span>Phím Backspace để xóa chữ vừa chọn, nút Gợi ý mở 1 chữ cái.</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span>Mỗi từ đúng nhận tối đa +150 điểm và cộng XP vào Cây Tri Thức!</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-[1.01]"
            >
              BẮT ĐẦU GIẢI MÃ ({TOTAL_QUESTIONS} TỪ)
            </button>
          </div>
        )}

        {/* ACTIVE GAMEPLAY */}
        {isPlaying && currentWord && (
          <div className="flex-1 flex flex-col justify-between py-1">
            {/* Status Header */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 mb-4 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Câu hỏi:</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {currentIndex + 1} / {questionList.length}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 mr-1.5">Điểm:</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {score}
                  </span>
                </div>
              </div>
            </div>

            {/* Word Clues Box */}
            <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-center mb-6 relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  {currentWord.pos ? currentWord.pos : 'Word'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {currentWord.term.length} chữ cái
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">
                {currentWord.meaningVi}
              </h2>

              {currentWord.example && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic max-w-md mx-auto mt-2">
                  &ldquo;{currentWord.example.replace(new RegExp(currentWord.term, 'gi'), '_____')}&rdquo;
                </p>
              )}
            </div>

            {/* Placed Letter Slots */}
            <div className="my-auto py-4">
              <div
                className={`flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 min-h-[58px] ${
                  isWordWrong ? 'animate-shake' : ''
                }`}
              >
                {Array.from({ length: currentWord.term.length }).map((_, idx) => {
                  const tile = placedTiles[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => tile && handleReturnTile(tile)}
                      disabled={isWordSolved || !tile || tile.isHinted}
                      className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black transition-all border-2 ${
                        isWordSolved
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : tile
                          ? tile.isHinted
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 cursor-default'
                            : 'border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-rose-400 cursor-pointer'
                          : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-transparent'
                      }`}
                    >
                      {tile ? tile.char.toUpperCase() : ''}
                    </button>
                  );
                })}
              </div>

              {/* Solved Banner */}
              {isWordSolved && (
                <div className="flex items-center justify-center gap-2 mt-4 text-emerald-600 dark:text-emerald-400 font-bold text-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Chính xác! {currentWord.term.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Available Tiles Bubble Area */}
            <div className="pt-2">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-5">
                {availableTiles.map((tile) => (
                  <button
                    key={tile.id}
                    onClick={() => handlePlaceTile(tile)}
                    disabled={tile.isUsed || isWordSolved}
                    className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black transition-all shadow-sm border-2 select-none ${
                      tile.isUsed
                        ? 'opacity-20 scale-90 border-transparent bg-slate-200 dark:bg-slate-800 pointer-events-none'
                        : 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 hover:border-emerald-500 hover:scale-105 active:scale-95 cursor-pointer shadow-emerald-500/10'
                    }`}
                  >
                    {tile.char.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Bottom Tool Buttons */}
              <div className="flex items-center justify-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={placedTiles.length === 0 || isWordSolved}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  <span>Xóa Chữ</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={placedTiles.length === 0 || isWordSolved}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Làm Lại</span>
                </button>

                <button
                  type="button"
                  onClick={handleHint}
                  disabled={isWordSolved || placedTiles.length >= currentWord.term.length}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5 fill-amber-500" />
                  <span>Gợi Ý Chữ Tiếp</span>
                </button>

                {isWordSolved && (
                  <button
                    type="button"
                    onClick={nextWord}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 animate-pulse ml-auto"
                  >
                    <span>Tiếp Theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {isGameOver && (
          <div className="my-auto py-6 text-center max-w-md mx-auto animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-3xl">
              🏆
            </div>

            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Tuyệt Vời! Đã Hoàn Thành
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Bạn đã giải mã thành công các từ vựng này.
            </p>

            {/* Stats Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 mb-6 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Điểm Số
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {score}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Đúng
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {correctCount}/{TOTAL_QUESTIONS}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Gợi Ý Đã Dùng
                </span>
                <span className="text-lg font-black text-amber-500">
                  {totalHints}
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
                onClick={startGame}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lượt Khác</span>
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
