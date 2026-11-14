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

/** Siglas explicadas na legenda das questões (as do quadro primeiro). */
const GLOSSARY: Record<string, string> = {
  DB: 'Banco de dados (database)',
  BI: 'Business Intelligence',
  'A.D': 'Análise de Dados',
  'C.D': 'Ciência de Dados',
  'M.L': 'Machine Learning',
  'E.D': 'Engenharia de Dados',
  ML: 'Machine Learning',
  ETL: 'Extract, Transform, Load (extrair, transformar, carregar)',
  ELT: 'Extract, Load, Transform (carrega antes de transformar)',
  DBA: 'Administrador de banco de dados',
  LLM: 'Large Language Model (grande modelo de linguagem)',
  PLN: 'Processamento de Linguagem Natural',
  RAG: 'Retrieval-Augmented Generation (geração com busca em documentos)',
  API: 'Interface de programação de aplicações',
  SQL: 'Linguagem de consulta a bancos de dados',
  GPU: 'Unidade de processamento gráfico',
  ERP: 'Sistema de gestão empresarial',
  TI: 'Tecnologia da Informação'
};
const ACRONYM = new RegExp(`(?<![\\w.])(${Object.keys(GLOSSARY).map(k => k.replace('.', '\\.')).join('|')})(?![\\w])`, 'g');

/** Siglas presentes no enunciado (não nas alternativas), na ordem em que aparecem. */
export function acronymsIn(q: Question): [string, string][] {
  const text = [...q.context, q.lead, ...(q.items ?? []).map(i => i.text), ...(q.assertion ?? []), q.command].join(' ');
  const found = new Set([...text.matchAll(ACRONYM)].map(m => m[1]));
  return [...found].map(k => [k, GLOSSARY[k]]);
}

export const pct =(a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
