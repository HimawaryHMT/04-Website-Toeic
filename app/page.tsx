'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { LearningTree } from '@/components/tree/LearningTree';
import { TrackCards } from '@/components/home/TrackCards';
import { RoadmapView } from '@/components/roadmap/RoadmapView';
import { ReviewHub } from '@/components/review/ReviewHub';
import { HistoryView } from '@/components/history/HistoryView';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'home' | 'path' | 'review' | 'history'>('home');
  const [initialTrack, setInitialTrack] = useState<'grammar' | 'topics' | 'cefr'>('grammar');

  const handleSelectTrackFromHome = (track: 'grammar' | 'topics' | 'cefr') => {
    setInitialTrack(track);
    setCurrentView('path');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: 'home' | 'path' | 'review' | 'history') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Global Topbar */}
      <Header currentView={currentView} onNavigate={handleNavigate} />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <div className="animate-fade-in px-4">
            <HeroSection onExplore={() => handleNavigate('path')} />
            <LearningTree />
            <TrackCards onSelectTrack={handleSelectTrackFromHome} />
          </div>
        )}

        {currentView === 'path' && (
          <RoadmapView initialTrack={initialTrack} />
        )}

        {currentView === 'review' && (
          <ReviewHub />
        )}

        {currentView === 'history' && (
          <HistoryView />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
