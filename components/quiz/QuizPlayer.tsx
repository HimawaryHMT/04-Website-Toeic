'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GrammarLesson, GrammarQuestion } from '@/lib/types';
import { useLearning } from '@/lib/store';
import { lookupWord } from '@/lib/curriculum';
import { TapSentence, TapToLookupModal } from './TapToLookupModal';
import { X, Check, ArrowRight, RotateCcw, Award, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizPlayerProps {
  lesson: GrammarLesson;
  level: 'easy' | 'medium' | 'hard';
  onExit: () => void;
  onNextLesson?: () => void;
}

export function QuizPlayer({ lesson, level, onExit, onNextLesson }: QuizPlayerProps) {
  const { recordQuizAttempt } = useLearning();

  // Extract questions according to selected level (easy, medium, hard)
  const questions: GrammarQuestion[] = useMemo(() => {
    let list: GrammarQuestion[] = [];
    if (level === 'hard') {
      if (Array.isArray(lesson.hardQuestions) && lesson.hardQuestions.length > 0) {
        list = lesson.hardQuestions;
      } else if (lesson.questions && !Array.isArray(lesson.questions) && lesson.questions.hard) {
        list = lesson.questions.hard;
      }
    } else if (level === 'medium') {
      if (Array.isArray(lesson.mediumQuestions) && lesson.mediumQuestions.length > 0) {
        list = lesson.mediumQuestions;
      } else if (lesson.questions && !Array.isArray(lesson.questions) && lesson.questions.medium) {
        list = lesson.questions.medium;
      }
    } else {
      // easy level
      if (Array.isArray(lesson.questions) && lesson.questions.length > 0) {
        list = lesson.questions;
      } else if (lesson.questions && !Array.isArray(lesson.questions) && lesson.questions.easy) {
        list = lesson.questions.easy;
      }
    }

    // Fallbacks if current level list is empty
    if (!list || list.length === 0) {
      if (Array.isArray(lesson.questions) && lesson.questions.length > 0) {
        list = lesson.questions;
      } else if (Array.isArray(lesson.mediumQuestions) && lesson.mediumQuestions.length > 0) {
        list = lesson.mediumQuestions;
      } else if (Array.isArray(lesson.hardQuestions) && lesson.hardQuestions.length > 0) {
        list = lesson.hardQuestions;
      }
    }

    if (list && list.length > 0) {
      // 10 questions per quiz session for optimal focus and pacing
      return list.slice(0, 10);
    }

    return [
      {
        prompt: `Chọn đáp án đúng theo quy tắc: ${lesson.title}`,
        sentence: lesson.example || 'This is ___ student.',
        options: ['a', 'an', 'the', 'some'],
        answer: 'a',
        type: 'choice',
      },
    ];
  }, [lesson, level]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [fillInput, setFillInput] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tap-to-lookup state
  const [lookupTarget, setLookupTarget] = useState<{ word: any; raw: string } | null>(null);

  const currentQ = questions[currentIndex] || questions[0];
  const isFill = currentQ.type === 'fill' || (!currentQ.options && currentQ.sentence?.includes('___'));

  // Reset timer on each question
  useEffect(() => {
    setTimeLeft(30);
    setIsAnswered(false);
    setSelectedAnswer('');
    setFillInput('');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex]);

  const handleTimeExpire = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      setIsCorrect(false);
    }
  };

  // Keyboard shortcut listener for Multiple Choice (1-4 or A-D)
  useEffect(() => {
    if (isAnswered || isFill || !currentQ.options) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      let optIndex = -1;
      if (['1', '2', '3', '4'].includes(key)) {
        optIndex = parseInt(key) - 1;
      } else if (['a', 'b', 'c', 'd'].includes(key)) {
        optIndex = key.charCodeAt(0) - 97;
      }

      if (optIndex >= 0 && optIndex < (currentQ.options?.length || 0)) {
        e.preventDefault();
        handleChoiceSubmit(currentQ.options![optIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, isAnswered, isFill]);

  const handleChoiceSubmit = (chosen: string) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const right = chosen.trim().toLowerCase() === currentQ.answer.trim().toLowerCase();
    setSelectedAnswer(chosen);
    setIsAnswered(true);
    setIsCorrect(right);
    if (right) setCorrectCount((prev) => prev + 1);
  };

  const handleFillSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered || !fillInput.trim()) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const right = fillInput.trim().toLowerCase() === currentQ.answer.trim().toLowerCase();
    setIsAnswered(true);
    setIsCorrect(right);
    if (right) setCorrectCount((prev) => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCompleted(true);

    const total = questions.length;
    const finalCorrect = isCorrect ? correctCount : correctCount;
    const scorePct = Math.round((finalCorrect / total) * 100);

    let rating = 0;
    if (scorePct >= 100) rating = 3;
    else if (scorePct >= 90) rating = 2;
    else if (scorePct >= 80) rating = 1;

    // Trigger confetti on passing
    if (scorePct >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }

    // Save to learning store & Supabase
    recordQuizAttempt({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      trackId: 'grammar',
      level,
      correctCount: finalCorrect,
      totalQuestions: total,
      scorePercent: scorePct,
      rating,
    });
  };

  const handleTapWord = (raw: string) => {
    const found = lookupWord(raw);
    setLookupTarget({ word: found, raw });
  };

  const scorePct = Math.round((correctCount / questions.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-left my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Thoát bài làm"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {lesson.title} · Mức {level.toUpperCase()}
              </span>
              <p className="text-xs text-slate-400">
                Câu {currentIndex + 1} / {questions.length}
              </p>
            </div>
          </div>

          {!isCompleted && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* QUIZ COMPLETION SUMMARY */}
        {isCompleted ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Award className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {scorePct >= 80 ? 'Hoàn thành xuất sắc!' : 'Cần cố gắng thêm!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              {scorePct >= 80
                ? 'Bạn đã vượt qua bài kiểm tra với điểm số đạt chuẩn mở khóa bài tiếp theo!'
                : 'Bạn cần đạt tối thiểu 80% để mở khóa bài học kế tiếp. Hãy thử lại nhé!'}
            </p>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Điểm số</span>
                <p className="text-xl font-black text-emerald-600">{scorePct}%</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Câu đúng</span>
                <p className="text-xl font-black text-slate-800 dark:text-slate-200">
                  {correctCount}/{questions.length}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Đánh giá</span>
                <p className="text-xl font-black text-amber-500">
                  {scorePct >= 100 ? '⭐⭐⭐' : scorePct >= 90 ? '⭐⭐' : scorePct >= 80 ? '⭐' : 'Chưa đạt'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setCorrectCount(0);
                  setIsCompleted(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại</span>
              </button>
              {onNextLesson && scorePct >= 80 ? (
                <button
                  onClick={onNextLesson}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
                >
                  <span>Bài tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onExit}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
                >
                  <span>Về lộ trình</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE QUESTION VIEW */
          <div>
            {/* Prompt */}
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.prompt}
              </h2>
            </div>

            {/* Sentence context with Tap-to-lookup */}
            {currentQ.sentence && (
              <div className="p-4 sm:p-5 mb-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                  NGỮ CẢNH:
                </span>
                <p>
                  <TapSentence text={currentQ.sentence} onTapWord={handleTapWord} />
                </p>

                {/* Hint if present */}
                {(currentQ.hint || currentQ.hintVi) && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">Gợi ý: </span>
                    {currentQ.hint} {currentQ.hintVi && `(${currentQ.hintVi})`}
                  </div>
                )}
              </div>
            )}

            {/* Question Type: Choice or Fill */}
            {!isFill && currentQ.options ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {currentQ.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSelected = selectedAnswer === opt;
                  const isAnswerKey = opt.trim().toLowerCase() === currentQ.answer.trim().toLowerCase();

                  let btnStyle = 'border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800';
                  if (isAnswered) {
                    if (isAnswerKey) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300';
                    } else {
                      btnStyle = 'opacity-40 border-slate-200 dark:border-slate-700';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      disabled={isAnswered}
                      onClick={() => handleChoiceSubmit(opt)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left text-sm transition-all cursor-pointer ${btnStyle}`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {isAnswered && isAnswerKey ? '✓' : isAnswered && isSelected && !isCorrect ? '✕' : letter}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Fill Question */
              <form onSubmit={handleFillSubmit} className="mb-6 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    disabled={isAnswered}
                    value={fillInput}
                    onChange={(e) => setFillInput(e.target.value)}
                    placeholder="Nhập từ hoặc cụm từ rồi nhấn Enter"
                    className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-semibold text-slate-800 dark:text-slate-100"
                  />
                  {!isAnswered && (
                    <button
                      type="submit"
                      disabled={!fillInput.trim()}
                      className="px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                    >
                      Kiểm tra
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Feedback & Detailed Explanation Box */}
            {isAnswered && (
              <div
                className={`p-4 rounded-2xl mb-6 text-sm animate-fade-in border ${
                  isCorrect
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1 text-sm">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Chính xác! Đáp án đúng: <b className="underline font-bold">{currentQ.answer}</b></span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Chưa chính xác! Đáp án đúng là: <b className="underline font-bold">{currentQ.answer}</b></span>
                    </>
                  )}
                </div>

                {currentQ.explain && (
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
                    <span className="font-bold text-slate-900 dark:text-white">💡 Giải thích chi tiết: </span>
                    <span>{currentQ.explain}</span>
                  </div>
                )}
              </div>
            )}

            {/* Next Question Button once answered */}
            {isAnswered && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tap-to-Lookup Dictionary Popup */}
      {lookupTarget && (
        <TapToLookupModal
          word={lookupTarget.word}
          rawWordText={lookupTarget.raw}
          onClose={() => setLookupTarget(null)}
        />
      )}
    </div>
  );
}
