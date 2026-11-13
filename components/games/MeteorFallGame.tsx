'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameWord } from './types';
import { gameSound } from './GameSound';
import { useLearning } from '@/lib/store';
import confetti from 'canvas-confetti';
import {
  X,
  Shield,
  RotateCcw,
  Settings2,
  Award,
  Rocket,
} from 'lucide-react';

interface MeteorFallGameProps {
  words: GameWord[];
  sourceName: string;
  onClose: () => void;
  onChangeSource: () => void;
}

interface CannonOption {
  text: string;
  isCorrect: boolean;
  keyLabel: string;
}

export function MeteorFallGame({
  words,
  sourceName,
  onClose,
  onChangeSource,
}: MeteorFallGameProps) {
  const { addXp } = useLearning();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Gameplay state
  const [currentWord, setCurrentWord] = useState<GameWord | null>(null);
  const [options, setOptions] = useState<CannonOption[]>([]);
  const [meteorProgress, setMeteorProgress] = useState(0); // 0 (top) to 100 (bottom)
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [shields, setShields] = useState(3);
  const [laserFiringIndex, setLaserFiringIndex] = useState<number | null>(null);
  const [isExploding, setIsExploding] = useState(false);
  const [isBaseShaking, setIsBaseShaking] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const wordPoolRef = useRef<GameWord[]>([]);

  // Shuffle helper
  const shuffle = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Generate a meteor question
  const spawnMeteor = useCallback(
    (pool: GameWord[], currentWaveNum: number) => {
      if (pool.length === 0) {
        wordPoolRef.current = shuffle(words);
      }
      const targetWord = wordPoolRef.current.pop() || words[0];
      setCurrentWord(targetWord);
      setMeteorProgress(0);
      setIsExploding(false);
      setLaserFiringIndex(null);

      // Generate 3 distractors
      const otherWords = words.filter(
        (w) => w.term.toLowerCase() !== targetWord.term.toLowerCase()
      );
      const shuffledOthers = shuffle(otherWords).slice(0, 3);

      const opts: CannonOption[] = [
        { text: targetWord.meaningVi, isCorrect: true, keyLabel: '1' },
        ...shuffledOthers.map((w, idx) => ({
          text: w.meaningVi,
          isCorrect: false,
          keyLabel: String(idx + 2),
        })),
      ];

      // Shuffle options and assign key labels 1, 2, 3, 4
      const shuffledOpts = shuffle(opts).map((opt, idx) => ({
        ...opt,
        keyLabel: String(idx + 1),
      }));

      setOptions(shuffledOpts);
      lastTimeRef.current = performance.now();
    },
    [words]
  );

  // Handle Game Over
  const handleGameOver = useCallback(
    (finalScore: number, finalDestroyed: number) => {
      setIsPlaying(false);
      setIsGameOver(true);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      const xp = Math.min(250, Math.max(30, Math.round(finalScore / 15) + finalDestroyed * 7));
      setEarnedXp(xp);
      addXp(xp);

      try {
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.55 },
        });
        gameSound.playVictory();
      } catch {}
    },
    [addXp]
  );

  // Start Game
  const startGame = useCallback(() => {
    if (words.length < 4) return;
    wordPoolRef.current = shuffle(words);
    setScore(0);
    setWave(1);
    setDestroyedCount(0);
    setShields(3);
    setIsGameOver(false);
    setIsPlaying(true);
    setEarnedXp(0);
    spawnMeteor(wordPoolRef.current, 1);
  }, [words, spawnMeteor]);

  // Handle Meteor Hit Ground
  const handleMeteorHit = useCallback(() => {
    gameSound.playExplosion();
    setIsBaseShaking(true);
    setTimeout(() => setIsBaseShaking(false), 500);

    setShields((prev) => {
      const nextShields = prev - 1;
      if (nextShields <= 0) {
        handleGameOver(score, destroyedCount);
      } else {
        // Spawn next meteor
        setTimeout(() => {
          spawnMeteor(wordPoolRef.current, wave);
        }, 500);
      }
      return nextShields;
    });
  }, [score, destroyedCount, handleGameOver, spawnMeteor, wave]);

  // Meteor falling animation loop
  useEffect(() => {
    if (!isPlaying || isExploding || !currentWord) return;

    // Speed formula based on wave: Wave 1: ~7s, Wave 5: ~4s
    const baseSpeed = 12 + wave * 2.2; // percent per second

    const updateFall = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setMeteorProgress((prev) => {
        const next = prev + baseSpeed * delta;
        if (next >= 100) {
          handleMeteorHit();
          return 100;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(updateFall);
    };

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateFall);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, isExploding, currentWord, wave, handleMeteorHit]);

  // Fire cannon action
  const handleFireCannon = useCallback(
    (index: number) => {
      if (!isPlaying || isExploding || !currentWord) return;
      const selectedOption = options[index];
      if (!selectedOption) return;

      if (selectedOption.isCorrect) {
        // HIT!
        setLaserFiringIndex(index);
        gameSound.playLaser();

        setTimeout(() => {
          setIsExploding(true);
          gameSound.playExplosion();
          gameSound.speak(currentWord.term);

          try {
            confetti({
              particleCount: 35,
              spread: 60,
              origin: { y: 0.35 },
            });
          } catch {}

          // Speed bonus: higher points the earlier the meteor was shot
          const speedBonus = Math.round((100 - meteorProgress) * 1.5);
          const pts = 100 + speedBonus;
          setScore((prev) => prev + pts);
          setDestroyedCount((prev) => {
            const nextCount = prev + 1;
            if (nextCount % 5 === 0) {
              setWave((w) => w + 1);
              gameSound.playCombo();
            }
            return nextCount;
          });

          // Spawn next meteor after explosion
          setTimeout(() => {
            spawnMeteor(wordPoolRef.current, wave);
          }, 600);
        }, 150);
      } else {
        // WRONG CANNON
        gameSound.playWrong();
        setScore((prev) => Math.max(0, prev - 30));
      }
    },
    [isPlaying, isExploding, currentWord, options, meteorProgress, wave, spawnMeteor]
  );

  // Keyboard controls for 1, 2, 3, 4
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const keyIndexMap: Record<string, number> = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
        a: 0,
        b: 1,
        c: 2,
        d: 3,
        A: 0,
        B: 1,
        C: 2,
        D: 3,
      };

      if (keyIndexMap[e.key] !== undefined) {
        e.preventDefault();
        handleFireCannon(keyIndexMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handleFireCannon]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-3xl bg-gradient-to-b from-sky-50 via-blue-50/70 to-indigo-50/50 dark:from-slate-900 dark:via-sky-950/30 dark:to-slate-900 border border-sky-200 dark:border-sky-900/60 rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden text-slate-800 dark:text-white ${
          isBaseShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Soft pastel ambient glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-sky-200/80 dark:border-slate-800 pb-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black shadow-sm">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Thiên Thạch Rơi
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60">
                  Meteor Fall
                </span>
              </div>
              <button
                onClick={onChangeSource}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Nguồn: {sourceName}</span>
                <Settings2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-sky-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRE-GAME */}
        {!isPlaying && !isGameOver && (
          <div className="my-auto py-8 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center text-3xl shadow-lg shadow-sky-500/15">
              🚀
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Phòng Thủ Căn Cứ Từ Vựng
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
              Thiên thạch mang từ tiếng Anh đang lao xuống! Hãy kích hoạt khẩu pháo laser mang đúng nghĩa tiếng Việt để bắn hạ nó trước khi chạm đáy căn cứ.
            </p>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-sky-200/80 dark:border-sky-900/50 mb-8 text-left space-y-2 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-5 h-5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Bấm phím 1, 2, 3, 4 trên bàn phím hoặc chạm chuột vào khẩu pháo.</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-5 h-5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Bắn càng cao khi thiên thạch mới rơi, điểm cộng tốc độ càng lớn!</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-5 h-5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-[10px]">3</span>
                <span>Bạn có 3 lá chắn 🛡️. Thiên thạch chạm đất 3 lần là căn cứ sụp đổ!</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-sky-500/30 transition-all cursor-pointer hover:scale-[1.01]"
            >
              KÍCH HOẠT HỆ THỐNG PHÒNG THỦ
            </button>
          </div>
        )}

        {/* ACTIVE GAMEPLAY */}
        {isPlaying && currentWord && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Status Bar */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/85 dark:bg-slate-800/80 border border-sky-200/80 dark:border-sky-900/50 shadow-sm mb-3 text-xs font-bold">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Làn sóng (Wave)</span>
                  <span className="text-sm font-black text-sky-600 dark:text-sky-400">Wave {wave}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Điểm số</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{score.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Đã hạ</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{destroyedCount}</span>
                </div>
              </div>

              {/* Shields Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50/80 dark:bg-slate-700/60 border border-sky-200 dark:border-slate-600">
                <span className="text-slate-400 text-[10px] uppercase mr-1">Khiên:</span>
                {[1, 2, 3].map((shield) => (
                  <Shield
                    key={shield}
                    className={`w-4 h-4 transition-all ${
                      shield <= shields
                        ? 'text-sky-500 fill-sky-500'
                        : 'text-slate-300 dark:text-slate-600 scale-75'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* SKY / BATTLEFIELD ARENA (PASTEL BLUE SKY) */}
            <div className="relative flex-1 rounded-3xl bg-gradient-to-b from-sky-200/75 via-sky-100/50 to-blue-50/80 dark:from-sky-950/70 dark:via-slate-900 dark:to-slate-950 border-2 border-sky-300/80 dark:border-sky-800/60 overflow-hidden min-h-[260px] sm:min-h-[300px] flex flex-col justify-between p-4 shadow-inner">
              {/* Subtle pastel stars / cloud particles */}
              <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#0284c7_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

              {/* Laser Beam Animation */}
              {laserFiringIndex !== null && (
                <div
                  className="absolute bottom-2 w-1.5 bg-sky-500 shadow-[0_0_14px_#0284c7] z-20 animate-fade-in transition-all"
                  style={{
                    left: `${(laserFiringIndex + 0.5) * 25}%`,
                    top: `${Math.max(10, meteorProgress)}%`,
                  }}
                />
              )}

              {/* Falling Meteor */}
              <div
                className="absolute left-1/2 -translate-x-1/2 z-10 transition-transform duration-75 flex flex-col items-center"
                style={{
                  top: `${Math.min(85, meteorProgress)}%`,
                }}
              >
                {!isExploding ? (
                  <div className="flex flex-col items-center group">
                    {/* Flame trail above meteor */}
                    <div className="w-8 h-10 bg-gradient-to-t from-sky-500 via-cyan-400 to-transparent rounded-full blur-[2px] opacity-80 -mb-3 animate-pulse" />

                    {/* Meteor Rock Core */}
                    <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600 text-white font-black shadow-xl shadow-sky-600/30 border-2 border-sky-200 flex flex-col items-center">
                      <span className="text-xs uppercase tracking-widest text-sky-200 font-extrabold text-[10px]">
                        {currentWord.pos ? `[${currentWord.pos}]` : 'TARGET'}
                      </span>
                      <span className="text-base sm:text-xl font-black tracking-wide drop-shadow-md">
                        {currentWord.term.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-radial from-amber-200 via-sky-400 to-transparent flex items-center justify-center animate-ping">
                    <span className="text-2xl">💥</span>
                  </div>
                )}
              </div>

              {/* Danger Warning line at bottom */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/80 to-transparent pointer-events-none" />
            </div>

            {/* DEFENSE BATTERY (4 CANNON OPTIONS) */}
            <div className="pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFireCannon(idx)}
                    className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-sky-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700/80 hover:shadow-lg hover:shadow-sky-500/10 transition-all cursor-pointer flex items-center gap-3 text-left group shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-slate-700 border border-sky-200 dark:border-slate-600 text-sky-700 dark:text-sky-300 group-hover:bg-sky-500 group-hover:text-white font-black text-xs flex items-center justify-center transition-colors shrink-0">
                      {option.keyLabel}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-900 dark:group-hover:text-white line-clamp-2">
                      {option.text}
                    </span>
                  </button>
                ))}
              </div>

              <div className="text-center pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                💡 Phím tắt bàn phím: [1], [2], [3], [4] tương ứng với các bệ phóng.
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {isGameOver && (
          <div className="my-auto py-6 text-center max-w-md mx-auto animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-3xl">
              🚀
            </div>

            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Chiến Dịch Hoàn Thành!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              Bạn đã phòng thủ căn cứ xuất sắc trước các đợt thiên thạch.
            </p>

            {/* Stats Summary Card */}
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-sky-200/80 dark:border-slate-700 mb-6 grid grid-cols-3 gap-2 text-center shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Điểm Số
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {score.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Thiên Thạch Hạ
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {destroyedCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Wave Đạt Được
                </span>
                <span className="text-lg font-black text-sky-600 dark:text-sky-400">
                  Wave {wave}
                </span>
              </div>
            </div>

            {/* XP Gained Reward Banner */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs mb-6">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>+{earnedXp} XP đã được cộng vào Cây Tri Thức!</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-sky-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại</span>
              </button>
              <button
                onClick={onChangeSource}
                className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Đổi Bộ Từ
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
