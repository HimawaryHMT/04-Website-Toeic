'use client';

import React from 'react';

interface FooterProps {
  onNavigate: (view: 'home' | 'path' | 'review' | 'history') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-20 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start text-xl font-black text-slate-900 dark:text-white">
              <span>F</span>
              <span className="inline-flex items-center justify-center w-5 h-5 mx-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                ⚡
              </span>
              <span>rumFlash</span>
              <span className="text-emerald-500 font-extrabold">.</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trò chơi học từ vựng IELTS và ngữ pháp xếp theo sáu bậc CEFR, từ A1 đến C2.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <button
              onClick={() => onNavigate('path')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Lộ trình
            </button>
            <button
              onClick={() => onNavigate('review')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Ôn tập
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Lịch sử
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-xs gap-3">
          <p>© 2026 ForumFlash. Phát triển từ The Forum Center.</p>
          <p className="text-[11px]">Hệ thống Gamification Cây tri thức & 101 bài học chuẩn quốc tế.</p>
        </div>
      </div>
    </footer>
  );
}
