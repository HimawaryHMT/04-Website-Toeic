'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLearning } from '@/lib/store';
import { AuthModal } from '@/components/auth/AuthModal';
import { Sun, Moon, Laptop, LogOut, User, Flame, ChevronDown, Check } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'path' | 'review' | 'history';
  onNavigate: (view: 'home' | 'path' | 'review' | 'history') => void;
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  const { state, user, updatePreferences, signOut } = useLearning();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { textSize, theme, language } = state.preferences;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    updatePreferences({ theme: nextTheme });
  };

  const toggleLanguage = () => {
    updatePreferences({ language: language === 'vi' ? 'en' : 'vi' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className="flex flex-col text-left group cursor-pointer focus:outline-none"
              aria-label="Về trang chủ ForumFlash"
            >
              <div className="flex items-center text-xl font-black tracking-tight text-slate-900 dark:text-white">
                <span>F</span>
                <span className="inline-flex items-center justify-center w-5 h-5 mx-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">
                  ⚡
                </span>
                <span>rumFlash</span>
                <span className="text-emerald-500 font-extrabold">.</span>
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-300 -mt-0.5">
                TỪ THE FORUM CENTER
              </span>
            </button>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1.5 ml-2">
              <button
                onClick={() => onNavigate('home')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'home'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {language === 'vi' ? 'Trang chủ' : 'Home'}
              </button>
              <button
                onClick={() => onNavigate('path')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'path'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {language === 'vi' ? 'Lộ trình' : 'Path'}
              </button>
              <button
                onClick={() => onNavigate('review')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'review'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {language === 'vi' ? 'Ôn tập' : 'Review'}
              </button>
              <button
                onClick={() => onNavigate('history')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'history'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {language === 'vi' ? 'Lịch sử' : 'History'}
              </button>
            </nav>
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Badge */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-xs font-bold"
              title={`${state.streak} ngày học liên tiếp`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{state.streak}</span>
            </div>

            {/* Text Size S/M/L */}
            <div className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-0.5 text-xs">
              {(['S', 'M', 'L'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updatePreferences({ textSize: size })}
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold transition-colors cursor-pointer ${
                    textSize === size
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={`Cỡ chữ: ${size}`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Giao diện: ${theme}`}
              aria-label="Đổi giao diện"
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Laptop className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Language Toggle VI / EN */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đổi ngôn ngữ VI ↔ EN"
            >
              <span className={language === 'vi' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}>
                VI
              </span>
              <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
              <span className={language === 'en' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}>
                EN
              </span>
            </button>

            {/* Account Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500 transition-all text-xs font-semibold cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                  {user ? (user.email?.[0] || 'U').toUpperCase() : '↗'}
                </div>
                <span className="max-w-[90px] truncate text-slate-700 dark:text-slate-200">
                  {user ? user.user_metadata?.display_name || user.email?.split('@')[0] : 'Đăng nhập'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 text-xs z-50 animate-fade-in">
                  {!user ? (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                        CHẾ ĐỘ HỌC THỬ
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                        Tiến độ chưa được lưu đám mây
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                        Tài khoản khách chỉ lưu tiến độ trên trình duyệt này. Hãy đăng ký để lưu tiến độ lâu dài.
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            setAuthDefaultTab('login');
                            setAuthModalOpen(true);
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-center transition-colors cursor-pointer"
                        >
                          Đăng nhập
                        </button>
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            setAuthDefaultTab('register');
                            setAuthModalOpen(true);
                          }}
                          className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-center transition-colors cursor-pointer"
                        >
                          Đăng ký
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                          {(user.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {user.user_metadata?.display_name || 'Người học'}
                          </p>
                          <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                          <span>Tổng XP:</span>
                          <span className="font-bold text-emerald-600">{state.totalXp.toLocaleString()} XP</span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                          <span>Chuỗi Streak:</span>
                          <span className="font-bold text-amber-500">{state.streak} ngày</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          signOut();
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-semibold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 dark:border-slate-800/80 px-2 py-1.5 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1 rounded-lg ${currentView === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => onNavigate('path')}
            className={`px-3 py-1 rounded-lg ${currentView === 'path' ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}
          >
            Lộ trình
          </button>
          <button
            onClick={() => onNavigate('review')}
            className={`px-3 py-1 rounded-lg ${currentView === 'review' ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}
          >
            Ôn tập
          </button>
          <button
            onClick={() => onNavigate('history')}
            className={`px-3 py-1 rounded-lg ${currentView === 'history' ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}
          >
            Lịch sử
          </button>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />
    </>
  );
}
