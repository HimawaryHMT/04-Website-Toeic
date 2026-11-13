'use client';

import React, { useState } from 'react';
import { useLearning } from '@/lib/store';
import { vocabDecks } from '@/lib/curriculum';
import { GameWord } from './types';
import { X, BookMarked, Sparkles, GraduationCap, Briefcase, ChevronRight, AlertCircle } from 'lucide-react';

interface WordSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSource: (words: GameWord[], sourceName: string) => void;
  gameTitle: string;
}

export function WordSourceModal({
  isOpen,
  onClose,
  onSelectSource,
  gameTitle,
}: WordSourceModalProps) {
  const { state } = useLearning();
  const [activeTab, setActiveTab] = useState<'notebook' | 'cefr' | 'ielts'>('notebook');

  if (!isOpen) return null;

  const notebookList = Object.values(state.notebook);

  // Filter CEFR vs IELTS decks
  const cefrDecks = vocabDecks.filter((d) => d.id.startsWith('cefr_'));
  const ieltsDecks = vocabDecks.filter((d) => !d.id.startsWith('cefr_'));

  const handleSelectNotebook = () => {
    if (notebookList.length < 4) return;
    const words: GameWord[] = notebookList.map((item) => ({
      term: item.word,
      pos: item.pos,
      meaningVi: item.meaningVi,
      deckName: 'Sổ tay cá nhân',
    }));
    onSelectSource(words, `Sổ tay cá nhân (${words.length} từ)`);
  };

  const handleSelectDeck = (deckId: string) => {
    const deck = vocabDecks.find((d) => d.id === deckId);
    if (!deck) return;
    const words: GameWord[] = deck.items.map((item) => ({
      term: item[0],
      pos: item[1],
      meaningVi: item[2],
      example: item[4]?.[0] || '',
      deckName: deck.title,
    }));
    onSelectSource(words, `${deck.title} (${words.length} từ)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 pr-8">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
            Chọn Bộ Từ Vựng
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
            Nguồn từ vựng cho: {gameTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bạn có thể chơi bằng từ trong Sổ tay của mình hoặc bất kỳ bộ từ vựng chuẩn nào dưới đây.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('notebook')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notebook'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Sổ Tay Cá Nhân ({notebookList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cefr')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cefr'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Oxford CEFR (6 bộ)</span>
          </button>

          <button
            onClick={() => setActiveTab('ielts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ielts'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>IELTS Chuyên Sâu (25 bộ)</span>
          </button>
        </div>

        {/* Content Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {/* TAB 1: NOTEBOOK */}
          {activeTab === 'notebook' && (
            <div className="py-2">
              {notebookList.length >= 4 ? (
                <div
                  onClick={handleSelectNotebook}
                  className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/30">
                      ★
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        Sổ Tay Từ Vựng Của Tôi
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Bao gồm các từ bạn đã lưu và thêm mới thủ công ({notebookList.length} từ).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <span>Chọn & Chơi Ngay</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                    Sổ tay hiện có {notebookList.length} từ (cần tối thiểu 4 từ để tạo game)
                  </h4>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 max-w-md mx-auto">
                    Hãy bấm &quot;Thêm Từ Mới&quot; hoặc đánh dấu sao từ vựng trong quá trình học. Bạn cũng có thể chọn ngay một bộ từ Oxford hoặc IELTS bên cạnh để chơi ngay lập tức!
                  </p>
                  <button
                    onClick={() => setActiveTab('cefr')}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Khám phá các bộ từ có sẵn</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CEFR DECKS */}
          {activeTab === 'cefr' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
              {cefrDecks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => handleSelectDeck(deck.id)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        {deck.eyebrow || 'CEFR'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {deck.items.length} từ
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {deck.title}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: IELTS DECKS */}
          {activeTab === 'ielts' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
              {ieltsDecks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => handleSelectDeck(deck.id)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                        IELTS
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {deck.items.length} từ
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {deck.title}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
