import { GrammarLesson, VocabDeck, VocabWord, TreeStage, CEFRLevel } from './types';
import grammarDataRaw from '../data/grammar_101.json';
import vocabDataRaw from '../data/vocab_31_decks.json';

export const grammarLessons: GrammarLesson[] = grammarDataRaw as unknown as GrammarLesson[];
export const vocabDecks: VocabDeck[] = vocabDataRaw as unknown as VocabDeck[];

// Tree Growth Stages
export const TREE_STAGES: TreeStage[] = [
  {
    stage: 1,
    name: 'Seed',
    nameVi: 'Hạt giống',
    thresholdXp: 0,
    description: 'Bắt đầu hành trình gieo mầm tri thức tiếng Anh.',
  },
  {
    stage: 2,
    name: 'Sprout',
    nameVi: 'Nảy mầm',
    thresholdXp: 1500,
    description: 'Mầm cây đầu tiên xuất hiện qua từng bài học hoàn thành.',
  },
  {
    stage: 3,
    name: 'Trunk',
    nameVi: 'Phát triển thân',
    thresholdXp: 3500,
    description: 'Thân cây vươn cao vững chãi cùng nền tảng ngữ pháp vững chắc.',
  },
  {
    stage: 4,
    name: 'Branching',
    nameVi: 'Phân cành',
    thresholdXp: 6500,
    description: 'Các nhánh tri thức vươn rộng ra các chủ đề học thuật.',
  },
  {
    stage: 5,
    name: 'Foliage',
    nameVi: 'Ra lá',
    thresholdXp: 10500,
    description: 'Tán lá sum sê, vốn từ vựng phong phú tự tin giao tiếp.',
  },
  {
    stage: 6,
    name: 'Fruiting',
    nameVi: 'Kết trái',
    thresholdXp: 16000,
    description: 'Trái ngọt thành quả! Đạt mốc thành thạo chuẩn CEFR & IELTS.',
  },
];

export function getTreeStageInfo(xp: number) {
  let current = TREE_STAGES[0];
  let next = TREE_STAGES[1];

  for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
    if (xp >= TREE_STAGES[i].thresholdXp) {
      current = TREE_STAGES[i];
      next = TREE_STAGES[i + 1] || null;
      break;
    }
  }

  const currentThreshold = current.thresholdXp;
  const nextThreshold = next ? next.thresholdXp : current.thresholdXp + 5000;
  const range = nextThreshold - currentThreshold;
  const progressInStage = Math.max(0, xp - currentThreshold);
  const percentage = Math.min(100, Math.round((progressInStage / range) * 100));
  const xpNeeded = next ? Math.max(0, next.thresholdXp - xp) : 0;

  return {
    stage: current.stage,
    nameVi: current.nameVi,
    nameEn: current.name,
    description: current.description,
    percentage,
    xpNeeded,
    nextStageNameVi: next ? next.nameVi : 'Đỉnh cao',
  };
}

// Inverted Word Map for Tap-to-Lookup
const wordLookupMap = new Map<string, VocabWord>();

// Populate dictionary index
for (const deck of vocabDecks) {
  for (const item of deck.items) {
    const [term, pos, meaningVi, notes, examples] = item;
    const cleanKey = term.toLowerCase().trim();
    if (!wordLookupMap.has(cleanKey)) {
      wordLookupMap.set(cleanKey, {
        term,
        pos,
        meaningVi,
        notes,
        examples,
      });
    }
  }
}

export function lookupWord(rawWord: string): VocabWord | null {
  if (!rawWord) return null;
  const clean = rawWord
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”‘’]/g, '')
    .trim();

  if (wordLookupMap.has(clean)) {
    return wordLookupMap.get(clean)!;
  }

  // Basic lemmatization fallback (plural / s / ed / ing)
  if (clean.endsWith('ies') && wordLookupMap.has(clean.slice(0, -3) + 'y')) {
    return wordLookupMap.get(clean.slice(0, -3) + 'y')!;
  }
  if (clean.endsWith('es') && wordLookupMap.has(clean.slice(0, -2))) {
    return wordLookupMap.get(clean.slice(0, -2))!;
  }
  if (clean.endsWith('s') && wordLookupMap.has(clean.slice(0, -1))) {
    return wordLookupMap.get(clean.slice(0, -1))!;
  }
  if (clean.endsWith('ed') && wordLookupMap.has(clean.slice(0, -2))) {
    return wordLookupMap.get(clean.slice(0, -2))!;
  }
  if (clean.endsWith('ing') && wordLookupMap.has(clean.slice(0, -3))) {
    return wordLookupMap.get(clean.slice(0, -3))!;
  }

  return null;
}

export function getGrammarByLevel(level: CEFRLevel): GrammarLesson[] {
  const prefix = level.toLowerCase() + '-';
  return grammarLessons.filter((l) => l.id.startsWith(prefix));
}

export function getGrammarLesson(id: string): GrammarLesson | undefined {
  return grammarLessons.find((l) => l.id === id);
}

export function getVocabDeck(id: string): VocabDeck | undefined {
  return vocabDecks.find((d) => d.id === id);
}

export const CEFR_LEVELS: { id: CEFRLevel; title: string; subtitle: string; accent: string }[] = [
  { id: 'A1', title: 'Trình độ Căn bản', subtitle: 'Nền tảng câu tiếng Anh', accent: 'mint' },
  { id: 'A2', title: 'Trình độ Sơ cấp', subtitle: 'Các cấu trúc thông dụng', accent: 'yellow' },
  { id: 'B1', title: 'Trình độ Trung cấp', subtitle: 'Mở rộng và liên kết câu', accent: 'blue' },
  { id: 'B2', title: 'Trình độ Trung cao cấp', subtitle: 'Mệnh đề và sắc thái', accent: 'coral' },
  { id: 'C1', title: 'Trình độ Cao cấp', subtitle: 'Diễn đạt học thuật', accent: 'mint' },
  { id: 'C2', title: 'Trình độ Thành thạo', subtitle: 'Phối hợp cấu trúc linh hoạt', accent: 'yellow' },
];
