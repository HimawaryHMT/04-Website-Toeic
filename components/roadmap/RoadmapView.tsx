'use client';

import React, { useState } from 'react';
import { GrammarLesson, VocabDeck, CEFRLevel } from '@/lib/types';
import { CEFR_LEVELS, getGrammarByLevel, vocabDecks } from '@/lib/curriculum';
import { useLearning } from '@/lib/store';
import { LessonDrawer } from './LessonDrawer';
import { FlashcardPlayer } from '@/components/flashcard/FlashcardPlayer';
import { QuizPlayer } from '@/components/quiz/QuizPlayer';
import { BookOpen, Layers, GraduationCap, Star, Sparkles } from 'lucide-react';

interface RoadmapViewProps {
  initialTrack?: 'grammar' | 'topics' | 'cefr';
}

export function RoadmapView({ initialTrack = 'grammar' }: RoadmapViewProps) {
  const { state } = useLearning();
  const [activeTrack, setActiveTrack] = useState<'grammar' | 'topics' | 'cefr'>(initialTrack);
  const [selectedCefr, setSelectedCefr] = useState<CEFRLevel>('A1');

  // Selected item modal states
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarLesson | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<VocabDeck | null>(null);
  const [quizState, setQuizState] = useState<{
    lesson: GrammarLesson;
    level: 'easy' | 'medium' | 'hard';
  } | null>(null);

  const grammarList = getGrammarByLevel(selectedCefr);

  // Filter vocabulary decks
  const cefrDecks = vocabDecks.filter((d) => d.id.startsWith('oxford-'));
  const topicDecks = vocabDecks.filter((d) => !d.id.startsWith('oxford-'));

  const handleStartQuiz = (lesson: GrammarLesson, level: 'easy' | 'medium' | 'hard') => {
    setSelectedGrammar(null);
    setQuizState({ lesson, level });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Track Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-xl mx-auto mb-10 border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
        <button
          onClick={() => setActiveTrack('grammar')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTrack === 'grammar'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-md'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Ngữ pháp CEFR</span>
        </button>

        <button
          onClick={() => setActiveTrack('topics')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTrack === 'topics'
              ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-md'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Từ vựng Chủ đề</span>
        </button>

        <button
          onClick={() => setActiveTrack('cefr')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTrack === 'cefr'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-md'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Từ vựng Bậc</span>
        </button>
      </div>

      {/* TRACK 1: GRAMMAR BY CEFR */}
      {activeTrack === 'grammar' && (
        <div>
          {/* CEFR Level Milestones */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-8">
            {CEFR_LEVELS.map((lvl) => {
              const isSelected = selectedCefr === lvl.id;
              const countInLevel = getGrammarByLevel(lvl.id).length;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedCefr(lvl.id)}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-base font-black ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    Bậc {lvl.id}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{lvl.subtitle}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {countInLevel} bài học
                  </span>
                </button>
              );
            })}
          </div>

          {/* Level Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 mb-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                LỘ TRÌNH NGỮ PHÁP · BẬC {selectedCefr}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {CEFR_LEVELS.find((l) => l.id === selectedCefr)?.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Yêu cầu mở khoá: Đạt tối thiểu 80% câu đúng</span>
            </div>
          </div>

          {/* Grammar Lessons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grammarList.map((lesson, idx) => {
              const comp = state.completedLessons[lesson.id];
              const isCompleted = Boolean(comp && comp.attempts > 0);
              const stars = comp?.rating || 0;

              return (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedGrammar(lesson)}
                  className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-lg ${
                    isCompleted
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        BÀI {String(idx + 1).padStart(2, '0')} · {lesson.group}
                      </span>
                      {isCompleted ? (
                        <div className="flex text-amber-400">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= stars ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>

                    <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug mb-1">
                      {lesson.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {lesson.titleVi}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <code className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]">
                      {lesson.formula}
                    </code>
                    <span className="font-bold text-slate-400 hover:text-emerald-600">
                      Chi tiết →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRACK 2: IELTS VOCABULARY TOPICS */}
      {activeTrack === 'topics' && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              25 Chủ đề Từ vựng Học thuật IELTS
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hơn 5.000 từ vựng tuyển chọn kỹ lưỡng, kèm phát âm giọng bản ngữ và ví dụ thực tế.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topicDecks.map((deck) => {
              const prog = state.deckProgress?.[deck.id];
              const hasStarted = prog && prog.lastIndex > 0;
              const currentCardNum = (prog?.lastIndex ?? 0) + 1;
              const percent = Math.min(100, Math.round((currentCardNum / deck.items.length) * 100));

              return (
                <div
                  key={deck.id}
                  onClick={() => setSelectedDeck(deck)}
                  className="group p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        {deck.eyebrow || 'IELTS TOPIC'}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {deck.items.length} từ
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {deck.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {deck.description}
                    </p>

                    {hasStarted && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                          <span>Đang học: từ {currentCardNum}/{deck.items.length}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600">
                    <span>{hasStarted ? `Tiếp tục (từ ${currentCardNum})` : 'Học bằng Flashcard'}</span>
                    <span>{hasStarted ? 'Tiếp tục →' : 'Luyện ngay →'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRACK 3: CEFR VOCABULARY */}
      {activeTrack === 'cefr' && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Từ vựng Nền tảng theo 6 Bậc CEFR
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              4.922 từ vựng thiết yếu xếp từ A1 đến C2 theo chuẩn Oxford 5000.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cefrDecks.map((deck) => {
              const prog = state.deckProgress?.[deck.id];
              const hasStarted = prog && prog.lastIndex > 0;
              const currentCardNum = (prog?.lastIndex ?? 0) + 1;
              const percent = Math.min(100, Math.round((currentCardNum / deck.items.length) * 100));

              return (
                <div
                  key={deck.id}
                  onClick={() => setSelectedDeck(deck)}
                  className="group p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {deck.eyebrow || 'CEFR DECK'}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {deck.items.length} từ
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {deck.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {deck.description}
                    </p>

                    {hasStarted && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                          <span>Đang học: từ {currentCardNum}/{deck.items.length}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>{hasStarted ? `Tiếp tục (từ ${currentCardNum})` : 'Lật thẻ từ vựng'}</span>
                    <span>{hasStarted ? 'Tiếp tục →' : 'Bắt đầu →'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODALS */}
      {selectedGrammar && (
        <LessonDrawer
          lesson={selectedGrammar}
          onClose={() => setSelectedGrammar(null)}
          onStartQuiz={handleStartQuiz}
        />
      )}

      {selectedDeck && (
        <FlashcardPlayer
          deck={selectedDeck}
          onExit={() => setSelectedDeck(null)}
        />
      )}

      {quizState && (
        <QuizPlayer
          lesson={quizState.lesson}
          level={quizState.level}
          onExit={() => setQuizState(null)}
        />
      )}
    </div>
  );
}
