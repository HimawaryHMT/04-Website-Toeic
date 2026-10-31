'use client';

import React from 'react';
import { useLearning } from '@/lib/store';
import { Award, Clock, Star, Flame, CheckCircle, BarChart3 } from 'lucide-react';
import { getTreeStageInfo } from '@/lib/curriculum';

export function HistoryView() {
  const { state } = useLearning();
  const treeInfo = getTreeStageInfo(state.totalXp);

  const history = state.history || [];
  const totalAttempts = history.length;
  const avgScore = totalAttempts > 0
    ? Math.round(history.reduce((acc, cur) => acc + cur.scorePercent, 0) / totalAttempts)
    : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Lịch Sử Làm Bài & Tiến Độ
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Theo dõi hành trình học tập, các lượt kiểm tra đã hoàn thành và số điểm tích lũy.
        </p>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Tổng tích luỹ XP
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
            {state.totalXp.toLocaleString()} <span className="text-xs font-bold text-slate-400">XP</span>
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Chuỗi ngày Streak
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-500 mt-0.5">
            {state.streak} <span className="text-xs font-bold text-slate-400">ngày</span>
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Cây học tập
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate">
            {treeInfo.nameVi}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Điểm TB kiểm tra
          </span>
          <p className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5">
            {avgScore}% <span className="text-xs font-bold text-slate-400">({totalAttempts} lần)</span>
          </p>
        </div>
      </div>

      {/* Attempts List */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">
          Nhật ký làm bài gần đây
        </h3>

        {history.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((att) => {
              const dateStr = new Date(att.completedAt).toLocaleString('vi-VN', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={att.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {att.lessonTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {att.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr}</span>
                      <span>·</span>
                      <span>{att.correctCount}/{att.totalQuestions} câu đúng</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-base font-black ${att.scorePercent >= 80 ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {att.scorePercent}%
                    </p>
                    <div className="flex text-amber-400 text-xs justify-end mt-0.5">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= att.rating ? 'fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            Bạn chưa thực hiện bài kiểm tra nào. Hãy chọn một bài trong Lộ trình để bắt đầu nhé!
          </div>
        )}
      </div>
    </div>
  );
}
