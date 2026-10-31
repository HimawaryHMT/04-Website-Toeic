'use client';

import React from 'react';
import { ArrowRight, BookOpen, Layers, Award } from 'lucide-react';

interface HeroSectionProps {
  onExplore: () => void;
}

export function HeroSection({ onExplore }: HeroSectionProps) {
  return (
    <section className="relative w-full py-12 sm:py-16 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center px-4">
        {/* Badges */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-6 animate-fade-in shadow-xs">
          <span>⚡ Phương pháp Gamification Cây tri thức</span>
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          <span>Chuẩn CEFR A1 – C2</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
          Học theo từng chặng, <br />
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            nhớ theo từng bài.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
          Nền tảng học tiếng Anh độc quyền với 101 bài ngữ pháp chuyên sâu, hơn 9.900 từ vựng học thuật IELTS & CEFR, kết hợp nuôi dưỡng Cây Tri Thức qua từng mốc điểm XP.
        </p>

        {/* 3 Metric Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-10 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>101 bài Grammar</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>9.922 từ vựng IELTS & CEFR</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <Award className="w-4 h-4 text-blue-500" />
            <span>6 bậc năng lực A1 – C2</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onExplore}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>Bắt đầu hành trình học tập</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
