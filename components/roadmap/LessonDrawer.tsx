'use client';

import React, { useState } from 'react';
import { GrammarLesson } from '@/lib/types';
import { useLearning } from '@/lib/store';
import { X, Play, BookOpen, AlertTriangle, CheckCircle, Star } from 'lucide-react';

interface LessonDrawerProps {
  lesson: GrammarLesson | null;
  onClose: () => void;
  onStartQuiz: (lesson: GrammarLesson, level: 'easy' | 'medium' | 'hard') => void;
}

export function LessonDrawer({ lesson, onClose, onStartQuiz }: LessonDrawerProps) {
  const { state } = useLearning();
  const [level, setLevel] = useState<'easy' | 'medium' | 'hard'>('easy');

  if (!lesson) return null;

  const completedInfo = state.completedLessons[lesson.id];
  const hasCompleted = Boolean(completedInfo && completedInfo.attempts > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto p-6 sm:p-8 animate-slide-left">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {lesson.group || 'NGỮ PHÁP'}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-1">
            {lesson.title}
          </h2>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-4">
            {lesson.titleVi}
          </p>

          {/* Past Result Badge */}
          {hasCompleted && (
            <div className="flex items-center justify-between p-3.5 mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-xs">
              <div>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  Đã hoàn thành ({completedInfo.attempts} lần)
                </span>
                <p className="text-emerald-600 dark:text-emerald-400">
                  Điểm cao nhất: {completedInfo.bestScore}%
                </p>
              </div>
              <div className="flex text-amber-400 text-sm">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= completedInfo.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Theory Summary Card */}
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                TÓM TẮT QUY TẮC:
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {lesson.summary}
              </p>
            </div>

            {/* Formula & Example */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-0.5">
                  Công thức:
                </span>
                <code className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {lesson.formula}
                </code>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <span className="text-[10px] font-bold uppercase text-blue-600 block mb-0.5">
                  Ví dụ chuẩn:
                </span>
                <p className="text-xs italic text-slate-800 dark:text-slate-200">
                  “{lesson.example}”
                </p>
              </div>
            </div>

            {/* Common Mistake Warning */}
            {lesson.mistake && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Lỗi thường gặp: </span>
                  <span>{lesson.mistake}</span>
                </div>
              </div>
            )}

            {/* Purpose & Use Cases Breakdown */}
            {lesson.lesson?.purpose && (
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Bản chất ngữ pháp:
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {lesson.lesson.purpose}
                </p>

                {lesson.lesson.useCases && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Các trường hợp ứng dụng:
                    </span>
                    {lesson.lesson.useCases.map((uc, i) => (
                      <div key={i} className="text-xs pl-2.5 border-l-2 border-emerald-500 py-0.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{uc.title}</p>
                        <p className="text-slate-500 text-[11px]">{uc.detail}</p>
                        <p className="text-emerald-600 dark:text-emerald-400 italic text-[11px] mt-0.5">
                          Ex: {uc.example}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Level Selector & Start Quiz Action */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Chọn mức độ bài kiểm tra:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'easy', label: 'Dễ', desc: 'Có gợi ý đầy đủ' },
                { id: 'medium', label: 'Vừa', desc: 'Nhiều câu điền từ' },
                { id: 'hard', label: 'Khó', desc: 'IELTS học thuật' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id as any)}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    level === lvl.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className={`text-xs font-bold ${level === lvl.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {lvl.label}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {lvl.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStartQuiz(lesson, level)}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Bắt đầu làm bài kiểm tra</span>
          </button>
        </div>
      </div>
    </div>
  );
}
