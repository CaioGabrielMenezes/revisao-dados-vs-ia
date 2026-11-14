import { Check, RotateCcw, X } from 'lucide-react';
import type { Go } from '../App';
import { topicById, topics } from '../data/concepts';
import { LETTERS, formatTime, pct } from '../lib';
import type { Question } from '../types';
import { Correction, QuestionSheet } from './Question';

type Props = {
  items: Question[];
  orders: Record<string, number[]>;
  answers: Record<string, number>;
  seconds: number;
  exam?: boolean;
  onRetry: () => void;
  onRetryWrong?: () => void;
  onBack: () => void;
  go: Go;
};

export default function Results({ items, orders, answers, seconds, exam, onRetry, onRetryWrong, onBack, go }: Props) {
  const correct = items.filter(q => answers[q.id] === q.answer).length;
  const wrong = items.length - correct;
  const percent = pct(correct, items.length);
  const grade = correct * 5;
  const headline = percent >= 80 ? 'Ótimo resultado.' : percent >= 60 ? 'Bom caminho — revise os erros.' : 'Use a correção para ver o que revisar.';

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">{exam ? 'Simulado' : 'Treino'} concluído</span>
        <h1>{headline}</h1>
      </div>

      <section className="result-hero">
        <div className="score-ring" style={{ ['--p' as string]: percent }}>
          <div>
            {exam ? <><strong>{grade}</strong><span>de 80 pontos</span></> : <><strong>{percent}%</strong><span>de acerto</span></>}
          </div>
        </div>
        <div className="result-info">
          <p className="result-line"><b>{correct}</b> acertos · <b>{wrong}</b> erros · {formatTime(seconds)}</p>
          {exam && <p className="muted">Na prova, cada questão vale 5 pontos (16 questões = 80 pontos), somados aos 20 da Medida de Eficiência.</p>}
          <div className="result-actions">
            {wrong > 0 && onRetryWrong && <button type="button" className="btn primary" onClick={onRetryWrong}><RotateCcw size={16} /> Refazer só os erros</button>}
            <button type="button" className={`btn ${wrong > 0 && onRetryWrong ? 'ghost' : 'primary'}`} onClick={onRetry}>Refazer tudo</button>
            <button type="button" className="btn ghost" onClick={onBack}>Nova sessão</button>
          </div>
        </div>
      </section>

      {exam && (
        <section className="section">
          <div className="section-head"><div><h2>Gabarito</h2><p>Sua marcação comparada ao gabarito oficial.</p></div></div>
          <div className="gabarito result">
            {items.map((q, i) => {
              const order = orders[q.id];
              const chosen = answers[q.id];
              const ok = chosen === q.answer;
              return (
                <a key={q.id} href={`#r-${q.id}`} className={`gab-cell ${ok ? 'ok' : 'bad'}`}>
                  <span className="gab-n">{i + 1}</span>
                  <span className="gab-mark">{chosen === undefined ? '–' : LETTERS[order.indexOf(chosen)]}</span>
                  <span className="gab-key">{ok ? <Check size={14} /> : LETTERS[order.indexOf(q.answer)]}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head"><div><h2>Por assunto</h2></div></div>
        <div className="topic-list compact">
          {topics.map(t => {
            const list = items.filter(q => q.topic === t.id);
            if (!list.length) return null;
            const ok = list.filter(q => answers[q.id] === q.answer).length;
            return (
              <div key={t.id} className="topic-row">
                <div className="topic-info"><strong>{t.name}</strong></div>
                <div className="topic-meter">
                  <div className={`bar ${pct(ok, list.length) < 60 ? 'warn' : ''}`}><i style={{ width: `${pct(ok, list.length)}%` }} /></div>
                  <small>{ok}/{list.length} acertos</small>
                </div>
                <button type="button" className="btn small" onClick={() => go('conceitos', { concept: list[0].concepts[0] })}>Revisar</button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Correção completa</h2><p>Abra cada questão para ver a justificativa de todas as alternativas.</p></div></div>
        <div className="review-list">
          {items.map((q, i) => {
            const ok = answers[q.id] === q.answer;
            return (
              <details key={q.id} id={`r-${q.id}`} className={`review-item ${ok ? 'ok' : 'bad'}`} open={!ok && !exam}>
                <summary>
                  <span className={`dot ${ok ? 'ok' : 'bad'}`}>{ok ? <Check size={14} /> : <X size={14} />}</span>
                  <span>Questão {i + 1}</span>
                  <small>{topicById[q.topic].short}</small>
                </summary>
                <QuestionSheet q={q} number={i + 1} order={orders[q.id]} chosen={answers[q.id]} reveal />
                <Correction q={q} order={orders[q.id]} chosen={answers[q.id]} onConcept={id => go('conceitos', { concept: id })} />
              </details>
            );
          })}
        </div>
      </section>
    </>
  );
}
