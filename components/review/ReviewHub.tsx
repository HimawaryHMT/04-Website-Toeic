'use client';

import React, { useState } from 'react';
import { useLearning } from '@/lib/store';
import { VocabDeck } from '@/lib/types';
import { FlashcardPlayer } from '@/components/flashcard/FlashcardPlayer';
import { GameWord } from '@/components/games/types';
import { WordSourceModal } from '@/components/games/WordSourceModal';
import { SpeedMatchGame } from '@/components/games/SpeedMatchGame';
import { WordScrambleGame } from '@/components/games/WordScrambleGame';
import { MeteorFallGame } from '@/components/games/MeteorFallGame';
import { AddCustomWordModal } from './AddCustomWordModal';
import { gameSound } from '@/components/games/GameSound';
import {
  Bookmark,
  Volume2,
  Trash2,
  Search,
  Play,
  Plus,
  Gamepad2,
  BookMarked,
  Zap,
  Rocket,
  Sparkles,
  Flame,
  ArrowRight,
} from 'lucide-react';

export function ReviewHub() {
  const { state, toggleBookmark } = useLearning();

  // Navigation tab inside Review Hub: 'notebook' or 'games'
  const [activeTab, setActiveTab] = useState<'notebook' | 'games'>('games');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [pendingGameToStart, setPendingGameToStart] = useState<
    'speed_match' | 'scramble' | 'meteor' | null
  >(null);

  // Active game session
  const [activeGame, setActiveGame] = useState<
    'speed_match' | 'scramble' | 'meteor' | null
  >(null);
  const [gameWords, setGameWords] = useState<GameWord[]>([]);
  const [gameSourceName, setGameSourceName] = useState('');

  // Flashcard Deck Player
  const [reviewDeck, setReviewDeck] = useState<VocabDeck | null>(null);

  const notebookList = Object.values(state.notebook);

  const filteredWords = notebookList.filter(
    (item) =>
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaningVi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const speak = (word: string) => {
    gameSound.speak(word);
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

  // Click "Chơi Ngay" on any game
  const handleLaunchGame = (gameType: 'speed_match' | 'scramble' | 'meteor') => {
    // If notebook already has enough words, default to notebook or prompt
    if (notebookList.length >= 4 && !gameSourceName) {
      const words: GameWord[] = notebookList.map((item) => ({
        term: item.word,
        pos: item.pos,
        meaningVi: item.meaningVi,
        deckName: 'Sổ tay cá nhân',
      }));
      setGameWords(words);
      setGameSourceName(`Sổ tay cá nhân (${words.length} từ)`);
      setActiveGame(gameType);
    } else if (gameWords.length >= 4) {
      // Already has selected word pool
      setActiveGame(gameType);
    } else {
      // Open word source selection modal
      setPendingGameToStart(gameType);
      setIsSourceModalOpen(true);
    }
  };

  const handleSelectSource = (words: GameWord[], sourceName: string) => {
    setGameWords(words);
    setGameSourceName(sourceName);
    setIsSourceModalOpen(false);

    if (pendingGameToStart) {
      setActiveGame(pendingGameToStart);
      setPendingGameToStart(null);
    }
  };

  const getGameTitle = (gameType: 'speed_match' | 'scramble' | 'meteor' | null) => {
    switch (gameType) {
      case 'speed_match':
        return 'Nối Từ Siêu Tốc';
      case 'scramble':
        return 'Giải Mã Ký Tự';
      case 'meteor':
        return 'Thiên Thạch Rơi';
      default:
        return 'Trò Chơi Từ Vựng';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              TRUNG TÂM ÔN TẬP TỪ VỰNG
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>Chơi game nhận XP nuôi Cây!</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Đấu Trường & Sổ Tay Từ Vựng
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Luyện trí nhớ từ vựng qua 3 mini-games phản xạ kịch tính hoặc lật thẻ Flashcard 3D truyền thống từ sổ tay cá nhân của bạn.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAddWordModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm Từ Mới</span>
          </button>

          {notebookList.length > 0 && (
            <button
              onClick={startReviewAll}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Lật Thẻ ({notebookList.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 mb-8 pb-3">
        <button
          onClick={() => setActiveTab('games')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'games'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Đấu Trường Mini-Games (3 Trò Chơi)</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </button>

        <button
          onClick={() => setActiveTab('notebook')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'notebook'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Sổ Tay Từ Vựng ({notebookList.length} từ)</span>
        </button>
      </div>

      {/* TAB 1: GAME ARENA */}
      {activeTab === 'games' && (
        <div className="space-y-6 animate-fade-in">
          {/* Games Grid Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GAME 1: SPEED MATCH */}
            <div className="group relative rounded-3xl p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 hover:border-amber-500/70 transition-all hover:shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                    <Zap className="w-6 h-6 fill-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                    Phản Xạ Nhanh
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Nối Từ Siêu Tốc
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Nhanh tay chạm cặp Từ tiếng Anh & Nghĩa tiếng Việt. Chế độ Đua thời gian 60s hoặc Sinh tồn 3 Tim cực gây nghiện!
                </p>
              </div>

              <button
                onClick={() => handleLaunchGame('speed_match')}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              >
                <span>CHƠI NGAY</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* GAME 2: WORD SCRAMBLE */}
            <div className="group relative rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 hover:border-emerald-500/70 transition-all hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-600/30 text-2xl">
                    🧩
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                    Luyện Chính Tả
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Giải Mã Ký Tự
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Khắc sâu mặt chữ bằng cách ghép các bong bóng chữ cái xáo trộn thành từ vựng hoàn chỉnh. Hỗ trợ gõ trực tiếp từ bàn phím!
                </p>
              </div>

              <button
                onClick={() => handleLaunchGame('scramble')}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              >
                <span>CHƠI NGAY</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* GAME 3: METEOR FALL */}
            <div className="group relative rounded-3xl p-6 bg-gradient-to-br from-sky-500/15 via-blue-500/5 to-transparent border border-sky-400/40 hover:border-sky-500/80 transition-all hover:shadow-xl hover:shadow-sky-500/15 flex flex-col justify-between overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black shadow-lg shadow-sky-500/30">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300">
                    Arcade Kịch Tính
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Thiên Thạch Rơi
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Thiên thạch từ vựng đang lao xuống căn cứ! Nhanh mắt bấm đúng khẩu pháo laser [1-2-3-4] để bắn hạ nó trước khi chạm đất.
                </p>
              </div>

              <button
                onClick={() => handleLaunchGame('meteor')}
                className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              >
                <span>CHƠI NGAY</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Gamification Tip Box */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 fill-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chế độ chơi tự do với 31 bộ từ vựng tuyển chọn
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bạn có thể đổi bộ từ vựng bất kỳ lúc nào để chơi luyện tập cả 6 cấp độ Oxford CEFR hoặc 25 chủ đề IELTS.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setPendingGameToStart('speed_match');
                setIsSourceModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:border-emerald-500 transition-colors cursor-pointer shrink-0"
            >
              Chọn Bộ Từ Khác
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: NOTEBOOK & VOCABULARY LIST */}
      {activeTab === 'notebook' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt trong sổ tay..."
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => setIsAddWordModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm Từ Mới</span>
            </button>
          </div>

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
                        {item.pos || 'n'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                      {item.meaningVi}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => speak(item.word)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        toggleBookmark({
                          term: item.word,
                          pos: item.pos,
                          meaningVi: item.meaningVi,
                          examples: [],
                        })
                      }
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
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
              Không tìm thấy từ vựng nào khớp với từ khoá &ldquo;{searchTerm}&rdquo;.
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
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
                Bạn chưa lưu từ nào. Hãy bấm &ldquo;Thêm Từ Mới&rdquo; để tự tạo từ vựng cần học hoặc chọn sang Tab &ldquo;Đấu Trường Trò Chơi&rdquo; để chơi với 31 bộ từ vựng có sẵn!
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsAddWordModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Từ Đầu Tiên</span>
                </button>
                <button
                  onClick={() => setActiveTab('games')}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Chơi Trò Chơi Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Thêm từ mới thủ công */}
      <AddCustomWordModal
        isOpen={isAddWordModalOpen}
        onClose={() => setIsAddWordModalOpen(false)}
      />

      {/* MODAL: Chọn nguồn từ vựng */}
      <WordSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => {
          setIsSourceModalOpen(false);
          setPendingGameToStart(null);
        }}
        onSelectSource={handleSelectSource}
        gameTitle={getGameTitle(pendingGameToStart || activeGame)}
      />

      {/* GAME PLAYER 1: NỐI TỪ SIÊU TỐC */}
      {activeGame === 'speed_match' && (
        <SpeedMatchGame
          words={gameWords}
          sourceName={gameSourceName}
          onClose={() => setActiveGame(null)}
          onChangeSource={() => {
            setPendingGameToStart('speed_match');
            setIsSourceModalOpen(true);
          }}
        />
      )}

      {/* GAME PLAYER 2: GIẢI MÃ KÝ TỰ */}
      {activeGame === 'scramble' && (
        <WordScrambleGame
          words={gameWords}
          sourceName={gameSourceName}
          onClose={() => setActiveGame(null)}
          onChangeSource={() => {
            setPendingGameToStart('scramble');
            setIsSourceModalOpen(true);
          }}
        />
      )}

      {/* GAME PLAYER 3: THIÊN THẠCH RƠI */}
      {activeGame === 'meteor' && (
        <MeteorFallGame
          words={gameWords}
          sourceName={gameSourceName}
          onClose={() => setActiveGame(null)}
          onChangeSource={() => {
            setPendingGameToStart('meteor');
            setIsSourceModalOpen(true);
          }}
        />
      )}

      {/* FLASHCARD MODAL PLAYER */}
      {reviewDeck && (
        <FlashcardPlayer deck={reviewDeck} onExit={() => setReviewDeck(null)} />
      )}
    </div>
  );
}
