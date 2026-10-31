'use client';

import React from 'react';
import { BookOpen, Layers, GraduationCap, ArrowRight } from 'lucide-react';

interface TrackCardsProps {
  onSelectTrack: (track: 'grammar' | 'topics' | 'cefr') => void;
}

export function TrackCards({ onSelectTrack }: TrackCardsProps) {
  return (
    <section className="w-full my-12" aria-labelledby="tracks-heading">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 id="tracks-heading" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Chọn nội dung học
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bắt đầu bài học theo lộ trình khoa học, từ ngữ pháp chuẩn quốc tế đến từ vựng học thuật.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Track 1: Grammar CEFR */}
          <div
            onClick={() => onSelectTrack('grammar')}
            className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl dark:hover:shadow-emerald-950/20 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="inline-flex px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold uppercase mb-2">
                101 Bài học · A1 – C2
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Ngữ pháp theo bậc CEFR
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                101 bài trải đều sáu bậc từ A1 tới C2. Mỗi bài có phần lý thuyết ngắn gọn rồi tới bài kiểm tra ở ba mức Dễ, Vừa và Khó.
              </p>
            </div>

            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Khám phá lộ trình</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Track 2: Vocabulary by Topics */}
          <div
            onClick={() => onSelectTrack('topics')}
            className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-xl dark:hover:shadow-amber-950/20 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shadow-sm">
                <Layers className="w-6 h-6" />
              </div>
              <div className="inline-flex px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-bold uppercase mb-2">
                25 Chủ đề · 5.000 Từ IELTS
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Từ vựng theo chủ đề
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                Hơn 5.000 từ học thuật chia theo 25 chủ đề IELTS. Học bằng thẻ từ kèm nghĩa tiếng Việt, ví dụ và cách phát âm.
              </p>
            </div>

            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Học từ vựng chủ đề</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Track 3: Vocabulary by CEFR */}
          <div
            onClick={() => onSelectTrack('cefr')}
            className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-xl dark:hover:shadow-blue-950/20 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 shadow-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="inline-flex px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-bold uppercase mb-2">
                6 Cấp độ · 4.922 Từ Oxford
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Từ vựng theo bậc CEFR
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                Từ vựng nền tảng theo chuẩn CEFR, sắp xếp theo sáu bậc A1 đến C2, hợp cho người mới bắt đầu xây gốc từ vựng.
              </p>
            </div>

            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Luyện từ vựng CEFR</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
