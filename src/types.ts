export type TopicId = 'areas' | 'arquitetura' | 'mlops' | 'ia' | 'spec';
export type Difficulty = 'facil' | 'medio' | 'dificil';
export type Format = 'objetiva' | 'contextualizada';
/** Formatos usados pelo professor na prova anterior. */
export type Style = 'direta' | 'cenario' | 'respectivamente' | 'afirmativas' | 'assercao';

export type Topic = {
  id: TopicId;
  name: string;
  short: string;
  /** Como o assunto aparece escrito no quadro. */
  board: string;
  summary: string;
};

export type Concept = {
  id: string;
  topic: TopicId;
  name: string;
  /** Termo exatamente como aparece no quadro (quando aparece). */
  board?: string;
  definition: string;
  example: string;
  contrast: string;
  /** Como o assunto costuma ser cobrado no estilo da prova. */
  exam: string;
  /** Observação de interpretação do quadro, quando o termo é ambíguo. */
  note?: string;
};

export type Option = { text: string; why: string };

export type Question = {
  id: string;
  topic: TopicId;
  concepts: string[];
  format: Format;
  style: Style;
  difficulty: Difficulty;
  /** Parágrafos do texto-base. */
  context: string[];
  /** Frase em negrito antes dos itens, como “Avalie as afirmações a seguir.” */
  lead?: string;
  /** Itens numerados (I, II, III / Situação 1, 2 / (a), (b)...). */
  items?: { label: string; text: string }[];
  /** Asserção–razão: [asserção I, asserção II]. */
  assertion?: [string, string];
  /** Comando da questão (aparece em negrito, como na prova). */
  command: string;
  options: Option[];
  /** Índice da alternativa correta em `options`. */
  answer: number;
  /** Alternativas em ordem fixa (asserção–razão e afirmativas). */
  fixedOrder?: boolean;
  hint: string;
  explanation: string;
};

export type Attempt = { q: string; ok: boolean; at: number; mode: 'treino' | 'simulado' };

export type SessionRecord = {
  id: string;
  date: number;
  mode: 'treino' | 'simulado';
  format: Format | 'misto';
  ids: string[];
  /** Resposta escolhida (índice original em `options`). */
  answers: Record<string, number>;
  seconds: number;
  score: number;
};

export type Progress = { attempts: Attempt[]; sessions: SessionRecord[]; theme: 'light' | 'dark' };
