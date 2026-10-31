import type { Metadata } from 'next';
import './globals.css';
import { LearningProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'ForumFlash · Lộ trình học tiếng Anh CEFR & IELTS',
  description: 'Trò chơi học từ vựng IELTS và ngữ pháp xếp theo sáu bậc CEFR, từ A1 đến C2.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-theme="light" data-text-size="m">
      <body className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        <LearningProvider>
          {children}
        </LearningProvider>
      </body>
    </html>
  );
}
