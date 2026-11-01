'use client';

import React, { useState, useEffect } from 'react';
import { VocabDeck, VocabWord } from '@/lib/types';
import { useLearning } from '@/lib/store';
import { Volume2, Bookmark, BookmarkCheck, ArrowLeft, ArrowRight, RotateCw, X, RotateCcw } from 'lucide-react';

interface FlashcardPlayerProps {
  deck: VocabDeck;
  onExit: () => void;
}

export function FlashcardPlayer({ deck, onExit }: FlashcardPlayerProps) {
  const { state, toggleBookmark, isBookmarked, addXp, saveDeckProgress, resetDeckProgress } = useLearning();

  // Parse items into VocabWord objects
  const words: VocabWord[] = deck.items.map(([term, pos, meaningVi, notes, examples]) => ({
    term,
    pos,
    meaningVi,
    notes,
    examples: examples || [],
  }));

  // Resume from saved progress or start from 0
  const savedProgress = state.deckProgress?.[deck.id];
  const initialIndex =
    savedProgress?.lastIndex !== undefined &&
    savedProgress.lastIndex >= 0 &&
    savedProgress.lastIndex < words.length
      ? savedProgress.lastIndex
      : 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'en-vi' | 'vi-en'>('en-vi');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [jumpInput, setJumpInput] = useState('');

  const currentWord = words[currentIndex] || words[0];
  const bookmarked = isBookmarked(currentWord.term);

  // Auto speak on change if enabled
  useEffect(() => {
    setIsFlipped(false);
    if (autoSpeak) {
      speakWord(currentWord.term);
    }
  }, [currentIndex, autoSpeak]);

  // Auto-save progress whenever currentIndex changes
  useEffect(() => {
    saveDeckProgress(deck.id, currentIndex, words.length);
  }, [deck.id, currentIndex, words.length, saveDeckProgress]);

  const speakWord = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      saveDeckProgress(deck.id, nextIdx, words.length);
      addXp(5); // 5 XP per card explored
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      saveDeckProgress(deck.id, prevIdx, words.length);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= words.length) {
      const newIdx = target - 1;
      setCurrentIndex(newIdx);
      saveDeckProgress(deck.id, newIdx, words.length);
      setIsJumpOpen(false);
      setJumpInput('');
    }
  };

  const handleResetToStart = () => {
    if (window.confirm('Bạn có muốn học lại bộ từ này từ đầu (từ số 1)?')) {
      setCurrentIndex(0);
      resetDeckProgress(deck.id);
      setIsJumpOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
        {/* Top Header */}
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onExit}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {deck.eyebrow || 'THẺ TỪ VỰNG'}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-xs">
                  {deck.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Jump / Position Button */}
              <button
                onClick={() => {
                  setJumpInput(String(currentIndex + 1));
                  setIsJumpOpen(!isJumpOpen);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Bấm để nhảy nhanh tới từ bất kỳ"
              >
                <span>{currentIndex + 1}</span>
                <span className="text-slate-400">/</span>
                <span>{words.length}</span>
              </button>

              {/* Reset to Start Button */}
              {currentIndex > 0 && (
                <button
                  onClick={handleResetToStart}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                  title="Học lại từ đầu (Về từ 1)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round(((currentIndex + 1) / words.length) * 100)}%` }}
            />
          </div>

          {/* Jump Modal / Popover */}
          {isJumpOpen && (
            <form
              onSubmit={handleJumpSubmit}
              className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center gap-2 animate-fade-in"
            >
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                Nhảy đến từ số:
              </span>
              <input
                type="number"
                min={1}
                max={words.length}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                autoFocus
                placeholder={`1 - ${words.length}`}
                className="w-24 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Đi
              </button>
              <button
                type="button"
                onClick={() => setIsJumpOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg text-xs cursor-pointer"
              >
                Hủy
              </button>
            </form>
          )}
        </div>

        {/* 3D Flip Card Container */}
        <div className="my-6 perspective-1000 min-h-[300px] flex items-center justify-center">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full min-h-[290px] p-6 sm:p-8 rounded-3xl border-2 transition-all duration-500 transform-style-preserve-3d cursor-pointer flex flex-col justify-between shadow-lg relative ${
              isFlipped
                ? 'border-emerald-400/80 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60'
            }`}
          >
            {/* Top Bar on Card */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase">
                {currentWord.pos}
              </span>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => speakWord(currentWord.term)}
                  className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/80 transition-colors cursor-pointer"
                  title="Phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toggleBookmark(currentWord, deck.id)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    bookmarked
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title={bookmarked ? 'Bỏ lưu' : 'Lưu vào Sổ tay'}
                >
                  {bookmarked ? <BookmarkCheck className="w-5 h-5 fill-amber-500" /> : <Bookmark className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Main Word / Meaning Content */}
            <div className="py-6 text-center my-auto">
              {!isFlipped ? (
                direction === 'en-vi' ? (
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                      {currentWord.term}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Nhấn vào thẻ để xem nghĩa tiếng Việt & ví dụ
                    </p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                      {currentWord.meaningVi}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Nhấn vào thẻ để xem từ tiếng Anh
                    </p>
                  </div>
                )
              ) : (
                <div className="animate-fade-in text-left">
                  <div className="text-center mb-3">
                    <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mb-1">
                      {direction === 'en-vi' ? currentWord.meaningVi : currentWord.term}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {currentWord.term} ({currentWord.pos})
                    </p>
                  </div>

                  {currentWord.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 mb-3">
                      {currentWord.notes}
                    </p>
                  )}

                  {currentWord.examples && currentWord.examples.length > 0 && (
                    <div className="space-y-1.5 text-xs">
                      <span className="font-bold text-[10px] uppercase text-slate-400">Câu ví dụ:</span>
                      {currentWord.examples.map((ex, i) => (
                        <p key={i} className="text-slate-800 dark:text-slate-200 pl-2.5 border-l-2 border-emerald-500">
                          “{ex}”
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Flip Indicator */}
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Lật mặt thẻ</span>
            </div>
          </div>
        </div>

        {/* Controls Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDirection(direction === 'en-vi' ? 'vi-en' : 'en-vi')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đổi chiều lật"
            >
              {direction === 'en-vi' ? 'Anh → Việt' : 'Việt → Anh'}
            </button>

            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${
                autoSpeak
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
              title="Tự động phát âm khi chuyển từ"
            >
              Phát âm: {autoSpeak ? 'Bật' : 'Tắt'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Từ trước"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentIndex + 1 >= words.length}
              onClick={handleNext}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-30 shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-colors cursor-pointer"
              title="Từ tiếp theo"
            >
              <span>Tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
