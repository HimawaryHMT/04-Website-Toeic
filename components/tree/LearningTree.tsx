'use client';

import React, { useState } from 'react';
import { useLearning } from '@/lib/store';
import { TREE_STAGES, getTreeStageInfo } from '@/lib/curriculum';
import { Sparkles, SlidersHorizontal, RefreshCcw } from 'lucide-react';

export function LearningTree() {
  const { state } = useLearning();
  const [simulatedXp, setSimulatedXp] = useState<number | null>(null);

  const activeXp = simulatedXp !== null ? simulatedXp : state.totalXp;
  const stageInfo = getTreeStageInfo(activeXp);
  const isSimulating = simulatedXp !== null;

  return (
    <section className="w-full my-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-emerald-50/70 to-teal-50/30 dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/40 shadow-sm transition-all">
      <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Giai đoạn {String(stageInfo.stage).padStart(2, '0')}: {stageInfo.nameVi}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Cây Tri Thức Của Bạn
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Mỗi bài hoàn thành bổ sung XP cho cây. Cây lớn dần theo tiến độ của toàn bộ khoá học.
            </p>
          </div>

          {/* XP Badge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between bg-white dark:bg-slate-800/90 px-4 py-2.5 rounded-2xl border border-emerald-100 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isSimulating ? 'XP Mô phỏng' : 'Tổng tích luỹ'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {activeXp.toLocaleString()} <span className="text-xs font-bold text-slate-400">XP</span>
            </div>
          </div>
        </div>

        {/* Tree Visual Illustration & Stage Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-6">
          {/* SVG Tree Art based on stage */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-3xl bg-white dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-800 shadow-inner flex items-center justify-center p-4 overflow-hidden group">
              {/* Radial glow */}
              <div className="absolute inset-0 bg-radial from-emerald-400/10 via-transparent to-transparent opacity-70 pointer-events-none" />

              {/* Vector Tree SVG Art according to stage */}
              <TreeSvg stage={stageInfo.stage} />

              <div className="absolute bottom-3 text-center px-3 py-1 rounded-full bg-slate-900/80 dark:bg-black/60 text-white text-[11px] font-bold backdrop-blur-sm">
                Giai đoạn {stageInfo.stage} / 6
              </div>
            </div>
          </div>

          {/* Progress Breakdown */}
          <div className="md:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {stageInfo.nameVi}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {stageInfo.xpNeeded > 0
                    ? `Còn ${stageInfo.xpNeeded.toLocaleString()} XP để đạt ${stageInfo.nextStageNameVi}`
                    : 'Đã hoàn thành toàn bộ các giai đoạn!'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${stageInfo.percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
                <span>{stageInfo.description}</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">{stageInfo.percentage}%</span>
              </div>
            </div>

            {/* 6 Stage Timeline Pills */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {TREE_STAGES.map((s) => {
                const isPassed = stageInfo.stage >= s.stage;
                const isCurrent = stageInfo.stage === s.stage;
                return (
                  <div
                    key={s.stage}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 shadow-sm scale-105'
                        : isPassed
                        ? 'border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-800/60 opacity-80'
                        : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 opacity-40'
                    }`}
                  >
                    <span className="text-[10px] font-black text-slate-400">0{s.stage}</span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate w-full mt-0.5">
                      {s.nameVi.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive XP Simulator Slider */}
        <div className="pt-4 border-t border-emerald-100/70 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mô phỏng XP của cây</span>
              <span className="text-slate-400 font-normal">
                (Kéo thanh để xem trước các giai đoạn. XP thật không đổi)
              </span>
            </div>

            {isSimulating && (
              <button
                onClick={() => setSimulatedXp(null)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
              >
                <RefreshCcw className="w-3 h-3" />
                <span>Trở về XP thực tế</span>
              </button>
            )}
          </div>

          <input
            type="range"
            min={0}
            max={18000}
            step={250}
            value={activeXp}
            onChange={(e) => setSimulatedXp(Number(e.target.value))}
            className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer transition-all"
          />
        </div>
      </div>
    </section>
  );
}

// Stage-specific SVG illustrations
function TreeSvg({ stage }: { stage: number }) {
  switch (stage) {
    case 1: // Hạt giống (Seed)
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 drop-shadow-md">
          {/* Soil ground */}
          <path d="M30 160 Q100 150 170 160 L170 185 L30 185 Z" fill="#8d6e63" />
          <path d="M40 165 Q100 155 160 165" stroke="#6d4c41" strokeWidth="3" fill="none" />
          {/* Seed pod */}
          <ellipse cx="100" cy="148" rx="20" ry="14" fill="#a1887f" transform="rotate(-15 100 148)" />
          <ellipse cx="100" cy="148" rx="16" ry="10" fill="#6d4c41" transform="rotate(-15 100 148)" />
          {/* Tiny spark */}
          <circle cx="104" cy="138" r="3" fill="#86efac" />
          <path d="M104 138 Q108 128 114 126" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 2: // Nảy mầm (Sprout)
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 drop-shadow-md animate-pulse">
          <path d="M30 160 Q100 150 170 160 L170 185 L30 185 Z" fill="#8d6e63" />
          <path d="M100 155 Q98 120 102 95" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Left leaf */}
          <path d="M102 95 Q80 85 75 100 Q88 112 102 95" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
          {/* Right leaf */}
          <path d="M102 95 Q125 75 130 90 Q118 108 102 95" fill="#4ade80" stroke="#15803d" strokeWidth="1.5" />
        </svg>
      );
    case 3: // Phát triển thân (Trunk / Sapling)
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 drop-shadow-md">
          <path d="M30 165 Q100 155 170 165 L170 185 L30 185 Z" fill="#8d6e63" />
          {/* Trunk */}
          <path d="M93 165 Q96 110 98 70 L106 70 Q104 110 107 165 Z" fill="#795548" />
          {/* Sapling leaves canopy */}
          <circle cx="102" cy="65" r="28" fill="#22c55e" />
          <circle cx="85" cy="72" r="20" fill="#16a34a" />
          <circle cx="118" cy="70" r="22" fill="#4ade80" />
        </svg>
      );
    case 4: // Phân cành (Branching)
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 drop-shadow-md">
          <path d="M30 165 Q100 155 170 165 L170 185 L30 185 Z" fill="#8d6e63" />
          <path d="M92 165 Q97 120 100 85 L108 85 Q105 120 108 165 Z" fill="#5d4037" />
          {/* Branches */}
          <path d="M99 105 Q80 90 65 80" stroke="#5d4037" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M102 95 Q120 80 138 72" stroke="#5d4037" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Leaf clusters on branches */}
          <circle cx="62" cy="76" r="22" fill="#22c55e" />
          <circle cx="140" cy="68" r="24" fill="#16a34a" />
          <circle cx="100" cy="55" r="26" fill="#4ade80" />
        </svg>
      );
    case 5: // Ra lá (Foliage)
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 drop-shadow-lg">
          <path d="M30 165 Q100 155 170 165 L170 185 L30 185 Z" fill="#8d6e63" />
          <path d="M90 165 Q96 120 98 85 L110 85 Q106 120 110 165 Z" fill="#4e342e" />
          {/* Big lush crown */}
          <circle cx="100" cy="50" r="32" fill="#15803d" />
          <circle cx="70" cy="68" r="30" fill="#16a34a" />
          <circle cx="130" cy="65" r="30" fill="#22c55e" />
          <circle cx="100" cy="85" r="34" fill="#4ade80" opacity="0.9" />
          <circle cx="102" cy="62" r="24" fill="#86efac" opacity="0.6" />
        </svg>
      );
    case 6: // Kết trái (Fruiting - Master Level)
    default:
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 drop-shadow-xl">
          <path d="M30 165 Q100 155 170 165 L170 185 L30 185 Z" fill="#8d6e63" />
          <path d="M90 165 Q96 120 98 85 L110 85 Q106 120 110 165 Z" fill="#4e342e" />
          {/* Full Crown */}
          <circle cx="100" cy="48" r="34" fill="#15803d" />
          <circle cx="68" cy="68" r="32" fill="#16a34a" />
          <circle cx="132" cy="65" r="32" fill="#22c55e" />
          <circle cx="100" cy="85" r="35" fill="#4ade80" opacity="0.9" />
          {/* Golden Apples / Fruits */}
          <circle cx="72" cy="65" r="7" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="128" cy="62" r="7" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="100" cy="42" r="7" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="92" cy="86" r="6" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="118" cy="88" r="6" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          {/* Star crown on top */}
          <polygon points="100,12 103,20 112,20 105,25 108,34 100,28 92,34 95,25 88,20 97,20" fill="#fbbf24" />
        </svg>
      );
  }
}
