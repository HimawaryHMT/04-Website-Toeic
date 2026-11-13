'use client';

import React, { useState } from 'react';
import { useLearning } from '@/lib/store';
import { gameSound } from '@/components/games/GameSound';
import { X, Volume2, Plus, Sparkles, Check } from 'lucide-react';

interface AddCustomWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POS_OPTIONS = [
  { value: 'n', label: 'n (Danh từ)' },
  { value: 'v', label: 'v (Động từ)' },
  { value: 'adj', label: 'adj (Tính từ)' },
  { value: 'adv', label: 'adv (Trạng từ)' },
  { value: 'phr', label: 'phr (Cụm từ/Idiom)' },
  { value: 'prep', label: 'prep (Giới từ)' },
];

export function AddCustomWordModal({ isOpen, onClose }: AddCustomWordModalProps) {
  const { addCustomWord, state } = useLearning();
  const [term, setTerm] = useState('');
  const [pos, setPos] = useState('n');
  const [meaningVi, setMeaningVi] = useState('');
  const [example, setExample] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleTestAudio = () => {
    if (!term.trim()) return;
    gameSound.speak(term.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTerm = term.trim();
    const cleanMeaning = meaningVi.trim();

    if (!cleanTerm) {
      setErrorMsg('Vui lòng nhập từ vựng tiếng Anh!');
      return;
    }
    if (!cleanMeaning) {
      setErrorMsg('Vui lòng nhập nghĩa tiếng Việt!');
      return;
    }

    // Check if word already exists in notebook
    const existing = state.notebook[cleanTerm.toLowerCase()];
    if (existing) {
      setErrorMsg(`Từ "${cleanTerm}" đã có trong sổ tay của bạn rồi!`);
      return;
    }

    addCustomWord({
      term: cleanTerm,
      pos,
      meaningVi: cleanMeaning,
    });

    gameSound.playCorrect();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setTerm('');
      setMeaningVi('');
      setExample('');
      setErrorMsg('');
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Thêm Từ Vựng Mới
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lưu vào sổ tay để ôn tập thẻ và chơi các trò chơi ghi nhớ từ vựng.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Term Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Từ tiếng Anh (Word / Phrase) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Ví dụ: resilient, breakthrough, take off..."
                className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                autoFocus
              />
              {term.trim() && (
                <button
                  type="button"
                  onClick={handleTestAudio}
                  title="Nghe phát âm thử"
                  className="absolute right-3 top-2.5 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Part of Speech */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Loại từ (Part of Speech)
            </label>
            <div className="flex flex-wrap gap-2">
              {POS_OPTIONS.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setPos(item.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pos === item.value
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meaning VI Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Nghĩa tiếng Việt <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={meaningVi}
              onChange={(e) => {
                setMeaningVi(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Ví dụ: kiên cường, sự đột phá, cất cánh..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Example Input (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Câu ví dụ (Tùy chọn)
            </label>
            <input
              type="text"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Ví dụ: She remains resilient in the face of difficulties."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Lưu Vào Sổ Tay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
