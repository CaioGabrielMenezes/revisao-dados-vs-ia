import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Send } from 'lucide-react';
import type { Go, Save } from '../App';
import { QuestionSheet } from '../components/Question';
import Results from '../components/Results';
import { topics } from '../data/concepts';
import { questions } from '../data/questions';
import { LETTERS, formatTime, shuffle } from '../lib';
import type { Progress, Question } from '../types';
import { makeRun } from './Practice';

type Run = ReturnType<typeof makeRun>;
type Mix = 'prova' | 'misto';
const TOTAL = 16;

/** Sorteia questões garantindo ao menos uma de cada assunto, quando possível. */
function draw(pool: Question[], n: number): Question[] {
  const picked: Question[] = [];
  for (const t of shuffle(topics)) {
    const q = shuffle(pool.filter(x => x.topic === t.id))[0];
    if (q && picked.length < n) picked.push(q);
  }
  const rest = shuffle(pool.filter(q => !picked.includes(q)));
  return shuffle([...picked, ...rest.slice(0, n - picked.length)]);
}

function build(mix: Mix): Question[] {
  const ctx = questions.filter(q => q.format === 'contextualizada');
  if (mix === 'prova') return draw(ctx, TOTAL);
  const obj = questions.filter(q => q.format === 'objetiva');
  return shuffle([...draw(ctx, 12), ...draw(obj, 4)]);
}

export default function Exam({ save, go }: { progress: Progress; save: Save; go: Go }) {
  const [mix, setMix] = useState<Mix>('prova');
  const [run, setRun] = useState<Run | null>(null);
  const [done, setDone] = useState<{ run: Run; seconds: number } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [run]);

  function start(items?: Question[]) {
    setDone(null);
    setRun(makeRun(items ?? build(mix), true));
    window.scrollTo(0, 0);
  }

  function submit() {
    if (!run) return;
    const blank = run.items.filter(q => run.answers[q.id] === undefined).length;
    if (blank && !confirm(`Há ${blank} questão(ões) sem resposta. Entregar mesmo assim?`)) return;
    const seconds = Math.round((Date.now() - run.started) / 1000);
    const score = run.items.filter(q => run.answers[q.id] === q.answer).length;
    const at = Date.now();
    save(
      run.items.filter(q => run.answers[q.id] !== undefined).map(q => ({ q: q.id, ok: run.answers[q.id] === q.answer, at, mode: 'simulado' as const })),
      { id: run.id, date: at, mode: 'simulado', format: mix === 'prova' ? 'contextualizada' : 'misto', ids: run.items.map(q => q.id), answers: run.answers, seconds, score }
    );
    setDone({ run, seconds });
    setRun(null);
    window.scrollTo(0, 0);
  }

  if (done) {
    const { run: r, seconds } = done;
    return <Results exam items={r.items} orders={r.orders} answers={r.answers} seconds={seconds} go={go}
      onRetry={() => start(r.items)} onRetryWrong={() => start(r.items.filter(q => r.answers[q.id] !== q.answer))} onBack={() => { setDone(null); window.scrollTo(0, 0); }} />;
  }

  if (!run) {
    return (
      <>
        <div className="page-head">
          <span className="eyebrow">Praticar · simulado</span>
          <h1>Simulado da prova</h1>
          <p>Mesmo formato da prova anterior: 16 questões de múltipla escolha, cinco alternativas cada, sem dicas e com a correção apenas no final.</p>
        </div>
        <section className="exam-cover">
          <header>
            <strong>Sistema Avaliativo — Simulado</strong>
            <span>Dados vs IA · conteúdo do quadro</span>
          </header>
          <ol className="exam-rules">
            <li>16 questões; cada uma vale 5 pontos (total de 0 a 80).</li>
            <li>Será considerado apenas o gabarito: marque uma alternativa por questão.</li>
            <li>Você pode riscar alternativas e voltar a qualquer questão antes de entregar.</li>
            <li>O cronômetro é só para referência; não há limite de tempo.</li>
          </ol>
          <fieldset className="field">
            <legend>Composição</legend>
            <div className="segmented">
              <button type="button" className={mix === 'prova' ? 'on' : ''} aria-pressed={mix === 'prova'} onClick={() => setMix('prova')}>Como a prova · 16 contextualizadas</button>
              <button type="button" className={mix === 'misto' ? 'on' : ''} aria-pressed={mix === 'misto'} onClick={() => setMix('misto')}>Misto · 12 contextualizadas + 4 objetivas</button>
            </div>
          </fieldset>
          <button type="button" className="btn primary big" onClick={() => start()}>Iniciar simulado</button>
        </section>
      </>
    );
  }

  const q = run.items[run.index];
  const order = run.orders[q.id];
  const answered = Object.keys(run.answers).length;
  const setIndex = (index: number) => { setRun({ ...run, index }); window.scrollTo(0, 0); };

  return (
    <div className="player exam">
      <div className="exam-bar">
        <div className="exam-bar-top">
          <span className="exam-timer"><Clock size={15} /> {formatTime(Math.round((now - run.started) / 1000))}</span>
          <span className="muted">{answered}/{run.items.length} marcadas</span>
          <button type="button" className="btn primary small" onClick={submit}><Send size={15} /> Entregar</button>
        </div>
        <div className="gabarito" role="tablist" aria-label="Folha de gabarito">
          {run.items.map((it, i) => {
            const a = run.answers[it.id];
            return (
              <button key={it.id} type="button" role="tab" aria-selected={i === run.index} className={`gab-cell ${i === run.index ? 'cur' : ''} ${a !== undefined ? 'filled' : ''}`} onClick={() => setIndex(i)}>
                <span className="gab-n">{i + 1}</span>
                <span className="gab-mark">{a !== undefined ? LETTERS[run.orders[it.id].indexOf(a)] : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      <QuestionSheet q={q} number={run.index + 1} order={order} chosen={run.answers[q.id]} reveal={false} showMeta={false}
        struck={run.struck[q.id]}
        onChoose={original => setRun({ ...run, answers: { ...run.answers, [q.id]: original } })}
        onStrike={original => {
          const cur = run.struck[q.id] ?? [];
          setRun({ ...run, struck: { ...run.struck, [q.id]: cur.includes(original) ? cur.filter(i => i !== original) : [...cur, original] } });
        }} />

      <div className="player-nav">
        <button type="button" className="btn ghost" disabled={run.index === 0} onClick={() => setIndex(run.index - 1)}><ArrowLeft size={16} /> Anterior</button>
        <button type="button" className="btn ghost small" onClick={() => { if (confirm('Abandonar o simulado? Nada será salvo.')) setRun(null); }}>Abandonar</button>
        {run.index < run.items.length - 1
          ? <button type="button" className="btn primary" onClick={() => setIndex(run.index + 1)}>Próxima <ArrowRight size={16} /></button>
          : <button type="button" className="btn primary" onClick={submit}><Send size={16} /> Entregar</button>}
      </div>
    </div>
  );
}
