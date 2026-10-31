'use client';

import React, { useState } from 'react';
import { useLearning } from '@/lib/store';
import { VocabDeck } from '@/lib/types';
import { FlashcardPlayer } from '@/components/flashcard/FlashcardPlayer';
import { Bookmark, Volume2, Trash2, Search, Play } from 'lucide-react';

export function ReviewHub() {
  const { state, toggleBookmark } = useLearning();
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewDeck, setReviewDeck] = useState<VocabDeck | null>(null);

  const notebookList = Object.values(state.notebook);

  const filteredWords = notebookList.filter(
    (item) =>
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaningVi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const speak = (word: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const startReviewAll = () => {
    if (notebookList.length === 0) return;
    const syntheticDeck: VocabDeck = {
      id: 'notebook-review',
      eyebrow: 'SỔ TAY CÁ NHÂN',
      title: 'Ôn tập Từ vựng Đã Lưu',
      accent: 'coral',
      description: 'Luyện tập các từ vựng bạn đã đánh dấu sao trong quá trình học.',
      items: notebookList.map((item) => [item.word, item.pos, item.meaningVi, '', []]),
    };
    setReviewDeck(syntheticDeck);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Sổ Tay Ôn Tập Từ Vựng
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý và ôn luyện các từ vựng bạn đã đánh dấu trong quá trình lật thẻ và làm bài.
          </p>
        </div>

        {notebookList.length > 0 && (
          <button
            onClick={startReviewAll}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Ôn tập {notebookList.length} từ đã lưu</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      {notebookList.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt trong sổ tay..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Word Cards List */}
      {filteredWords.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredWords.map((item) => (
            <div
              key={item.word}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all"
            >
              <div className="overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-black text-slate-900 dark:text-white truncate">
                    {item.word}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {item.pos}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                  {item.meaningVi}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => speak(item.word)}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleBookmark({ term: item.word, pos: item.pos, meaningVi: item.meaningVi, examples: [] })}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                  title="Xoá khỏi sổ tay"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : notebookList.length > 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Không tìm thấy từ vựng nào khớp với từ khoá "{searchTerm}".
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
            Sổ tay ôn tập đang trống
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Khi lật thẻ Flashcard hoặc chạm tra từ vựng trong bài thi, hãy bấm biểu tượng dấu sao ⭐ hoặc nút "Lưu vào sổ tay" để gom từ vào đây ôn tập nhé!
          </p>
        </div>
      )}

      {/* Review Flashcard Modal */}
      {reviewDeck && (
        <FlashcardPlayer
          deck={reviewDeck}
          onExit={() => setReviewDeck(null)}
        />
      )}
    </div>
  );
}
