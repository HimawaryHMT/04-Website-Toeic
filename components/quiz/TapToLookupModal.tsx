'use client';

import React from 'react';
import { VocabWord } from '@/lib/types';
import { Volume2, Bookmark, BookmarkCheck, X } from 'lucide-react';
import { useLearning } from '@/lib/store';

interface TapToLookupModalProps {
  word: VocabWord | null;
  rawWordText?: string;
  onClose: () => void;
}

export function TapToLookupModal({ word, rawWordText, onClose }: TapToLookupModalProps) {
  const { toggleBookmark, isBookmarked } = useLearning();

  if (!word && !rawWordText) return null;

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(word?.term || rawWordText);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const bookmarked = word ? isBookmarked(word.term) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 text-left">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        {word ? (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {word.term}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {word.pos}
              </span>
              <button
                onClick={handleSpeak}
                className="p-1 rounded-full text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                title="Phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
              {word.meaningVi}
            </p>

            {word.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                {word.notes}
              </p>
            )}

            {word.examples && word.examples.length > 0 && (
              <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5 mb-4">
                <span className="font-bold text-slate-400 text-[10px] uppercase">Ví dụ:</span>
                {word.examples.slice(0, 2).map((ex, idx) => (
                  <p key={idx} className="text-slate-700 dark:text-slate-300 pl-2 border-l-2 border-emerald-400">
                    “{ex}”
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => toggleBookmark(word)}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                bookmarked
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {bookmarked ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-amber-600" />
                  <span>Đã lưu vào Sổ tay</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Lưu vào Sổ tay ôn tập</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="py-2">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {rawWordText}
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Chưa có dữ liệu chi tiết cho từ này trong bộ 9.922 từ vựng chuẩn.
            </p>
            <button
              onClick={handleSpeak}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold"
            >
              <Volume2 className="w-4 h-4" />
              <span>Nghe phát âm</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Helper component that renders text with clickable words for Tap-to-Lookup */
export function TapSentence({
  text,
  onTapWord,
}: {
  text: string;
  onTapWord: (word: string) => void;
}) {
  if (!text) return null;

  // Split tokens preserving words & spaces/punctuations
  const tokens = text.split(/([a-zA-Z0-9'-]+)/);

  return (
    <span>
      {tokens.map((token, i) => {
        if (/^[a-zA-Z0-9'-]+$/.test(token)) {
          return (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onTapWord(token);
              }}
              className="tap-word"
            >
              {token}
            </span>
          );
        }
        return <span key={i}>{token}</span>;
      })}
    </span>
  );
}
