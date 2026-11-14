import type { Difficulty, Question, Style } from './types';

export const LETTERS = 'ABCDE';

export const difficultyName: Record<Difficulty, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };

export const styleName: Record<Style, string> = {
  direta: 'Conceito',
  cenario: 'Cenário',
  respectivamente: 'Respectivamente',
  afirmativas: 'Afirmativas I, II, III',
  assercao: 'Asserção–razão'
};

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ordem de exibição das alternativas (índices originais). */
export function optionOrder(q: Question): number[] {
  const idx = q.options.map((_, i) => i);
  return q.fixedOrder ? idx : shuffle(idx);
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}min ${String(s).padStart(2, '0')}s`;
}

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
