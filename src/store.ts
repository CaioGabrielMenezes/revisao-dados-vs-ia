import type { Attempt, Progress, SessionRecord } from './types';

const KEY = 'revisao-quadro-v2';

export const emptyProgress: Progress = { attempts: [], sessions: [], theme: 'light' };

/**
 * Cada acesso começa zerado (modo treino): respostas e sessões vivem só na memória.
 * Apenas a preferência de tema é persistida.
 */
export function loadProgress(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.theme) return { ...emptyProgress, theme: saved.theme };
  } catch { /* armazenamento indisponível */ }
  const prefersDark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  return { ...emptyProgress, theme: prefersDark ? 'dark' : 'light' };
}

export function saveProgress(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify({ theme: p.theme })); } catch { /* ignora */ }
}

export function recordAttempts(p: Progress, attempts: Attempt[]): Progress {
  return { ...p, attempts: [...p.attempts, ...attempts] };
}

export function recordSession(p: Progress, s: SessionRecord): Progress {
  return { ...p, sessions: [s, ...p.sessions].slice(0, 50) };
}

/** Última tentativa de cada questão. */
export function lastAttempts(p: Progress): Map<string, Attempt> {
  const map = new Map<string, Attempt>();
  for (const a of p.attempts) map.set(a.q, a);
  return map;
}

/** Questões cuja última resposta foi errada. */
export function wrongIds(p: Progress): string[] {
  return [...lastAttempts(p).values()].filter(a => !a.ok).map(a => a.q);
}
