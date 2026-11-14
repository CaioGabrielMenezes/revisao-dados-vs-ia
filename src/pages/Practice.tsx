import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Lightbulb, Play } from 'lucide-react';
import type { Go, Save } from '../App';
import { Correction, QuestionSheet } from '../components/Question';
import Results from '../components/Results';
import { topics } from '../data/concepts';
import { questionById, questions } from '../data/questions';
import { difficultyName, optionOrder, shuffle, styleName } from '../lib';
import { wrongIds } from '../store';
import type { Difficulty, Progress, Question, Style, TopicId } from '../types';

type Mode = 'objetiva' | 'contextualizada' | 'erros';
type Run = {
  id: string;
  items: Question[];
  orders: Record<string, number[]>;
  answers: Record<string, number>;
  struck: Record<string, number[]>;
  index: number;
  started: number;
};

export function makeRun(items: Question[], keepOrder = false): Run {
  const list = keepOrder ? items : shuffle(items);
  return { id: `s-${Date.now()}`, items: list, orders: Object.fromEntries(list.map(q => [q.id, optionOrder(q)])), answers: {}, struck: {}, index: 0, started: Date.now() };
}

const HEAD: Record<Mode, { eyebrow: string; title: string; text: string }> = {
  objetiva: { eyebrow: 'Praticar · conceitos', title: 'Questões objetivas', text: 'Perguntas diretas sobre cada conceito do quadro, com cinco alternativas. A correção aparece logo após a resposta.' },
  contextualizada: { eyebrow: 'Praticar · estilo da prova', title: 'Questões contextualizadas', text: 'Cenários no formato da prova anterior: situação-problema, afirmativas I/II/III, asserção–razão e “respectivamente”.' },
  erros: { eyebrow: 'Praticar', title: 'Revisar erros', text: 'Questões cuja última resposta foi errada. Quando você acerta, ela sai da lista.' }
};

const STYLES: Style[] = ['cenario', 'respectivamente', 'afirmativas', 'assercao'];

function Segmented<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="segmented">
        {options.map(o => (
          <button key={String(o.value)} type="button" className={value === o.value ? 'on' : ''} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Practice({ mode, active, preset, progress, save, go }: { mode: Mode; active: boolean; preset?: TopicId; progress: Progress; save: Save; go: Go }) {
  const [topic, setTopic] = useState<TopicId | 'todos'>(preset ?? 'todos');
  const [difficulty, setDifficulty] = useState<Difficulty | 'todas'>('todas');
  const [style, setStyle] = useState<Style | 'todos'>('todos');
  const [count, setCount] = useState(10);
  const [run, setRun] = useState<Run | null>(null);
  const [done, setDone] = useState<{ run: Run; seconds: number } | null>(null);

  // A lista de erros é fixada ao exibir a configuração, não a cada resposta.
  const [errorIds, setErrorIds] = useState(() => wrongIds(progress));
  useEffect(() => {
    if (active && mode === 'erros' && !run && !done) setErrorIds(wrongIds(progress));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, run, done]);
  // “Praticar” em um assunto pré-seleciona o filtro, sem interromper uma sessão em andamento.
  useEffect(() => { if (active && preset && !run) setTopic(preset); }, [active, preset]); // eslint-disable-line react-hooks/exhaustive-deps
  const base = useMemo(
    () => mode === 'erros' ? errorIds.map(id => questionById[id]).filter(Boolean) : questions.filter(q => q.format === mode),
    [mode, errorIds]
  );

  const pool = base.filter(q =>
    (topic === 'todos' || q.topic === topic) &&
    (difficulty === 'todas' || q.difficulty === difficulty) &&
    (style === 'todos' || q.style === style));
  const size = mode === 'erros' ? pool.length : Math.min(count, pool.length);
  const head = HEAD[mode];

  function start(items: Question[]) {
    setDone(null);
    setRun(makeRun(items));
    window.scrollTo(0, 0);
  }

  function finish(r: Run) {
    const seconds = Math.round((Date.now() - r.started) / 1000);
    const score = r.items.filter(q => r.answers[q.id] === q.answer).length;
    save([], { id: r.id, date: Date.now(), mode: 'treino', format: mode === 'erros' ? 'misto' : mode, ids: r.items.map(q => q.id), answers: r.answers, seconds, score });
    setRun(null);
    setDone({ run: r, seconds });
    window.scrollTo(0, 0);
  }

  if (done) {
    const { run: r, seconds } = done;
    return (
      <Results items={r.items} orders={r.orders} answers={r.answers} seconds={seconds} go={go}
        onRetry={() => start(r.items)}
        onRetryWrong={() => start(r.items.filter(q => r.answers[q.id] !== q.answer))}
        onBack={() => { setDone(null); window.scrollTo(0, 0); }} />
    );
  }

  if (run) {
    return <Player run={run} setRun={setRun} onFinish={finish} save={save} go={go} title={head.title} active={active} />;
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">{head.eyebrow}</span>
        <h1>{head.title}</h1>
        <p>{head.text}</p>
      </div>

      {mode === 'erros' && base.length === 0 ? (
        <div className="empty-card">
          <strong>Nenhum erro pendente.</strong>
          <p>Responda questões objetivas, contextualizadas ou um simulado; as que você errar aparecem aqui.</p>
          <div className="result-actions">
            <button type="button" className="btn primary" onClick={() => go('simulado')}>Fazer simulado</button>
            <button type="button" className="btn ghost" onClick={() => go('contextualizadas')}>Questões contextualizadas</button>
          </div>
        </div>
      ) : (
        <section className="setup">
          <fieldset className="field">
            <legend>Assunto do quadro</legend>
            <div className="chips">
              <button type="button" className={`chip ${topic === 'todos' ? 'on' : ''}`} onClick={() => setTopic('todos')}>Todos</button>
              {topics.map(t => {
                const n = base.filter(q => q.topic === t.id).length;
                return <button key={t.id} type="button" disabled={!n} className={`chip ${topic === t.id ? 'on' : ''}`} onClick={() => setTopic(t.id)}>{t.short} <small>{n}</small></button>;
              })}
            </div>
          </fieldset>

          <div className="setup-row">
            <Segmented label="Dificuldade" value={difficulty} onChange={setDifficulty}
              options={[{ value: 'todas', label: 'Todas' }, ...(['facil', 'medio', 'dificil'] as Difficulty[]).map(d => ({ value: d, label: difficultyName[d] }))]} />
            {mode !== 'erros' && (
              <Segmented label="Quantidade" value={count} onChange={setCount}
                options={[5, 10, 15, 20, 99].map(n => ({ value: n, label: n === 99 ? 'Todas' : String(n) }))} />
            )}
          </div>

          {mode === 'contextualizada' && (
            <Segmented label="Formato" value={style} onChange={setStyle}
              options={[{ value: 'todos', label: 'Todos' }, ...STYLES.map(s => ({ value: s, label: styleName[s] }))]} />
          )}

          <div className="setup-foot">
            <span>{pool.length} questões disponíveis{mode !== 'erros' ? ` · serão sorteadas ${size}` : ''}</span>
            <button type="button" className="btn primary" disabled={!size} onClick={() => start(shuffle(pool).slice(0, size))}><Play size={16} /> Começar</button>
          </div>
        </section>
      )}

      {mode === 'erros' && base.length > 0 && (
        <section className="section">
          <div className="section-head"><div><h2>Questões na lista</h2></div></div>
          <ul className="error-list">
            {base.map(q => <li key={q.id}><span className="tag">{topics.find(t => t.id === q.topic)!.short}</span> {q.context[0] ?? q.command}</li>)}
          </ul>
        </section>
      )}
    </>
  );
}

function Player({ run, setRun, onFinish, save, go, title, active }: { run: Run; setRun: (r: Run) => void; onFinish: (r: Run) => void; save: Save; go: Go; title: string; active: boolean }) {
  const q = run.items[run.index];
  const order = run.orders[q.id];
  const chosen = run.answers[q.id];
  const reveal = chosen !== undefined;
  const last = run.index === run.items.length - 1;
  const [hint, setHint] = useState(false);
  useEffect(() => setHint(false), [q.id]);

  function choose(original: number) {
    if (reveal) return;
    setRun({ ...run, answers: { ...run.answers, [q.id]: original } });
    save([{ q: q.id, ok: original === q.answer, at: Date.now(), mode: 'treino' }]);
  }
  function strike(original: number) {
    const cur = run.struck[q.id] ?? [];
    setRun({ ...run, struck: { ...run.struck, [q.id]: cur.includes(original) ? cur.filter(i => i !== original) : [...cur, original] } });
  }
  function next() {
    if (!reveal) return;
    if (last) onFinish(run);
    else { setRun({ ...run, index: run.index + 1 }); window.scrollTo(0, 0); }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!active || e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const idx = 'abcde'.indexOf(k) >= 0 ? 'abcde'.indexOf(k) : '12345'.indexOf(k);
      if (idx >= 0 && idx < order.length && !reveal) { e.preventDefault(); choose(order[idx]); }
      if (k === 'enter' && reveal) { e.preventDefault(); next(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const answered = Object.keys(run.answers).length;
  return (
    <div className="player">
      <div className="player-top">
        <button type="button" className="btn ghost small" onClick={() => { if (confirm('Encerrar a sessão? As respostas já dadas ficam salvas.')) onFinish(run); }}><ArrowLeft size={15} /> Encerrar</button>
        <span className="player-title">{title}</span>
        <span className="player-count">{run.index + 1} / {run.items.length}</span>
      </div>
      <div className="steps" aria-hidden>
        {run.items.map((it, i) => {
          const a = run.answers[it.id];
          return <i key={it.id} className={[i === run.index && 'cur', a !== undefined && (a === it.answer ? 'ok' : 'bad')].filter(Boolean).join(' ')} />;
        })}
      </div>

      <QuestionSheet q={q} number={run.index + 1} order={order} chosen={chosen} reveal={reveal} struck={run.struck[q.id]} onChoose={choose} onStrike={strike} />

      {!reveal && (
        <div className="hint">
          <button type="button" className="btn ghost small" onClick={() => setHint(!hint)} aria-expanded={hint}><Lightbulb size={15} /> {hint ? 'Esconder dica' : 'Ver dica'}</button>
          {hint && <p>{q.hint}</p>}
          <small className="kbd-tip">Atalhos: <kbd>A</kbd>–<kbd>E</kbd> para responder · <kbd>Enter</kbd> para avançar</small>
        </div>
      )}

      {reveal && <Correction q={q} order={order} chosen={chosen} onConcept={id => go('conceitos', { concept: id })} />}

      <div className="player-nav">
        <button type="button" className="btn ghost" disabled={run.index === 0} onClick={() => setRun({ ...run, index: run.index - 1 })}><ArrowLeft size={16} /> Anterior</button>
        <span className="muted">{answered} respondidas</span>
        <button type="button" className="btn primary" disabled={!reveal} onClick={next}>{last ? 'Ver resultado' : 'Próxima'} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}
