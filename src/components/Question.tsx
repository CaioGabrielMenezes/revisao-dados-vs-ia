import { Check, Strikethrough, X } from 'lucide-react';
import { conceptById, topicById } from '../data/concepts';
import { LETTERS, difficultyName, styleName } from '../lib';
import type { Question } from '../types';

type SheetProps = {
  q: Question;
  number: number;
  order: number[];
  chosen?: number;
  reveal: boolean;
  struck?: number[];
  onChoose?: (original: number) => void;
  onStrike?: (original: number) => void;
  showMeta?: boolean;
};

/** Enunciado + alternativas, no formato da prova anterior. */
export function QuestionSheet({ q, number, order, chosen, reveal, struck = [], onChoose, onStrike, showMeta = true }: SheetProps) {
  return (
    <article className="sheet">
      <header className="sheet-head">
        <h2>QUESTÃO {number}</h2>
        {showMeta && (
          <div className="sheet-tags">
            <span className="tag">{topicById[q.topic].short}</span>
            <span className="tag">{styleName[q.style]}</span>
            <span className={`tag diff-${q.difficulty}`}>{difficultyName[q.difficulty]}</span>
          </div>
        )}
      </header>

      <div className="sheet-body">
        {q.context.map((p, i) => <p key={i}>{p}</p>)}
        {q.lead && <p className="sheet-strong">{q.lead}</p>}
        {q.items && (
          <div className="sheet-items">
            {q.items.map(item => (
              <p key={item.label}><b>{item.label}</b> {item.text}</p>
            ))}
          </div>
        )}
        {q.assertion && (
          <div className="sheet-assertion">
            <p><b>I.</b> {q.assertion[0]}</p>
            <p className="porque">PORQUE</p>
            <p><b>II.</b> {q.assertion[1]}</p>
          </div>
        )}
        <p className="sheet-strong">{q.command}</p>
      </div>

      <ol className="options" aria-label="Alternativas">
        {order.map((original, display) => {
          const isChosen = chosen === original;
          const isAnswer = reveal && original === q.answer;
          const isWrongChoice = reveal && isChosen && original !== q.answer;
          const isStruck = struck.includes(original) && !reveal;
          return (
            <li key={original} className={['option', isChosen && 'chosen', isAnswer && 'correct', isWrongChoice && 'incorrect', isStruck && 'struck'].filter(Boolean).join(' ')}>
              <button type="button" className="option-main" disabled={reveal || !onChoose} onClick={() => onChoose?.(original)} aria-pressed={isChosen}>
                <span className="letter">{LETTERS[display]}</span>
                <span className="option-text">{q.options[original].text}</span>
                {isAnswer && <Check className="mark" size={18} aria-label="Alternativa correta" />}
                {isWrongChoice && <X className="mark" size={18} aria-label="Sua resposta" />}
              </button>
              {onStrike && !reveal && (
                <button type="button" className="strike" onClick={() => onStrike(original)} aria-label={`Riscar alternativa ${LETTERS[display]}`} title="Riscar alternativa">
                  <Strikethrough size={15} />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </article>
  );
}

/** Correção completa: resultado, explicação, motivo de cada alternativa e conceitos. */
export function Correction({ q, order, chosen, onConcept }: { q: Question; order: number[]; chosen?: number; onConcept?: (id: string) => void }) {
  const ok = chosen === q.answer;
  const answered = chosen !== undefined;
  return (
    <section className={`correction ${ok ? 'good' : 'bad'}`} aria-live="polite">
      <div className="correction-verdict">
        {ok ? <Check size={20} /> : <X size={20} />}
        <strong>{ok ? 'Resposta correta' : answered ? `Resposta incorreta — a correta é ${LETTERS[order.indexOf(q.answer)]}` : `Sem resposta — a correta é ${LETTERS[order.indexOf(q.answer)]}`}</strong>
      </div>
      <p className="correction-explain">{q.explanation}</p>

      <details className="why-list" open={!ok}>
        <summary>Por que cada alternativa está certa ou errada</summary>
        <ul>
          {order.map((original, display) => (
            <li key={original} className={original === q.answer ? 'is-answer' : original === chosen ? 'is-chosen' : ''}>
              <span className="letter small">{LETTERS[display]}</span>
              <span>{original === q.answer ? <><b>Correta.</b> {q.explanation}</> : q.options[original].why}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="correction-concepts">
        <span>Revise:</span>
        {q.concepts.map(id => conceptById[id] && (
          <button key={id} type="button" className="chip" onClick={() => onConcept?.(id)}>{conceptById[id].name}</button>
        ))}
      </div>
    </section>
  );
}
