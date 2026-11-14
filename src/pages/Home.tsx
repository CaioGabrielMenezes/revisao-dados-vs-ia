import { ArrowRight, ClipboardCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Go } from '../App';
import { topics } from '../data/concepts';
import { questions } from '../data/questions';
import { pct, styleName } from '../lib';
import { lastAttempts, wrongIds } from '../store';
import type { Progress, Style } from '../types';

/** Termo clicável do quadro. */
function T({ id, go, children, cls = '' }: { id?: string; go: Go; children: ReactNode; cls?: string }) {
  if (!id) return <span className={`ink muted ${cls}`}>{children}</span>;
  return <button type="button" className={`ink ${cls}`} onClick={() => go('conceitos', { concept: id })}>{children}</button>;
}

export function Board({ go }: { go: Go }) {
  return (
    <div className="board" role="group" aria-label="Reprodução do quadro da aula">
      <div className="board-panel">
        <div className="board-row"><T id="mlflow" go={go} cls="red boxed">MLflow</T><T id="drift" go={go} cls="red under">Drift</T></div>
        <div className="board-row"><T go={go}>Data Science Academy</T></div>
        <div className="board-row"><T go={go} cls="under">Kaggle</T><span className="arrow">←</span><T go={go} cls="boxed">Braga</T><span className="arrow">→</span><T go={go}>Fitness</T></div>
        <div className="board-row"><T id="dados-vs-ia" go={go} cls="boxed">Dados</T><span className="ink plain">vs</span><T id="dados-vs-ia" go={go} cls="boxed">IA</T></div>
        <div className="board-split">
          <div className="board-brace">
            <T id="db" go={go} cls="red under">— DB</T>
            <span><T id="bi" go={go} cls="red under">— BI</T> / <T id="ad" go={go} cls="red under">A.D</T></span>
            <span><T id="cd" go={go} cls="red circled">C.D</T> / <T id="ml" go={go} cls="red under">M.L</T></span>
            <T id="ed" go={go} cls="red">— E.D</T>
          </div>
          <div className="board-pipe">
            <span className="arrow">↙</span>
            <T id="pipeline" go={go} cls="under">Pipeline</T>
            <T id="etl" go={go} cls="red etl">ETL</T>
          </div>
        </div>
      </div>
      <div className="board-panel">
        <div className="board-row center"><T id="warehouse" go={go} cls="under">Data Warehouse</T></div>
        <div className="board-row center"><T id="datamart" go={go} cls="red">Data Marts</T></div>
        <div className="board-row"><T go={go}>Ester —</T><T id="spec" go={go} cls="red boxed">Spec Driven</T><span className="arrow">→</span><T id="spec-drift" go={go} cls="under">Drift</T></div>
        <div className="board-row center"><T id="backlog" go={go}>Backlog</T></div>
        <div className="board-row center"><T id="tasks" go={go}>Tasks</T></div>
        <div className="board-row"><T id="claude" go={go}>Modelos de IA</T><span className="arrow">→</span><T id="claude" go={go}>Anthropic</T><span className="arrow">→</span><T id="claude" go={go}>Claude</T></div>
        <div className="board-row center"><T id="claude" go={go}>Sonnet · Opus · Fable</T></div>
      </div>
    </div>
  );
}

const STYLE_INFO: { style: Style; text: string }[] = [
  { style: 'cenario', text: 'Situação de empresa e “a abordagem mais adequada é”.' },
  { style: 'respectivamente', text: 'Duas ou mais situações para associar, na ordem.' },
  { style: 'afirmativas', text: 'Julgar I, II e III e marcar a combinação correta.' },
  { style: 'assercao', text: 'Duas asserções ligadas por PORQUE: verdade e justificativa.' }
];

export default function Home({ progress, go }: { progress: Progress; go: Go }) {
  const last = lastAttempts(progress);
  const answered = last.size;
  const correct = [...last.values()].filter(a => a.ok).length;
  const pending = wrongIds(progress).length;
  const lastExam = progress.sessions.find(s => s.mode === 'simulado');

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">Revisão para a prova</span>
          <h1>Treine o que foi escrito no quadro.</h1>
          <p>Os assuntos vêm do quadro da aula; as explicações se apoiam no slide; e as questões seguem o formato da prova anterior: cinco alternativas, cenários, afirmativas e asserção–razão.</p>
          <div className="hero-actions">
            <button type="button" className="btn primary" onClick={() => go('simulado')}><ClipboardCheck size={18} /> Fazer simulado</button>
            <button type="button" className="btn ghost" onClick={() => go('conceitos')}>Estudar conceitos <ArrowRight size={16} /></button>
          </div>
        </div>
        <dl className="hero-stats">
          <div><dt>Respondidas</dt><dd>{answered}<small>/{questions.length}</small></dd></div>
          <div><dt>Acertos</dt><dd>{pct(correct, answered)}<small>%</small></dd></div>
          <div><dt>Erros a revisar</dt><dd>{pending}</dd></div>
          <div><dt>Último simulado</dt><dd>{lastExam ? <>{lastExam.score * 5}<small>/80</small></> : '—'}</dd></div>
        </dl>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h2>O quadro da aula</h2><p>Toque em um termo para abrir a explicação.</p></div>
        </div>
        <Board go={go} />
        <p className="board-caption">Reprodução do quadro da aula. Termos em cinza (Kaggle, Data Science Academy, Braga → Fitness, Ester) foram exemplos citados em aula, não assunto de prova.</p>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h2>Desempenho por assunto</h2><p>Com base na última resposta de cada questão.</p></div>
        </div>
        <div className="topic-list">
          {topics.map(t => {
            const ids = questions.filter(q => q.topic === t.id).map(q => q.id);
            const done = ids.filter(id => last.has(id));
            const ok = done.filter(id => last.get(id)!.ok).length;
            return (
              <div key={t.id} className="topic-row">
                <div className="topic-info">
                  <strong>{t.name}</strong>
                  <small className="board-label">{t.board}</small>
                </div>
                <div className="topic-meter">
                  <div className="bar"><i style={{ width: `${pct(done.length, ids.length)}%` }} /></div>
                  <small>{done.length}/{ids.length} respondidas{done.length ? ` · ${pct(ok, done.length)}% de acerto` : ''}</small>
                </div>
                <button type="button" className="btn small" onClick={() => go('objetivas', { topic: t.id })}>Praticar</button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h2>Como o professor cobra</h2><p>Formatos tirados da prova anterior. Todos aparecem nas questões contextualizadas.</p></div>
        </div>
        <div className="style-grid">
          {STYLE_INFO.map(s => (
            <button key={s.style} type="button" className="style-card" onClick={() => go('contextualizadas')}>
              <strong>{styleName[s.style]}</strong>
              <span>{s.text}</span>
              <small>{questions.filter(q => q.style === s.style).length} questões</small>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
