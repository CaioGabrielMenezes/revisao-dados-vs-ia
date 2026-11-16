import { useState } from 'react';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { CHOICES, MNEMONIC, cheats, drills, type Drill } from '../data/review';
import { conceptById } from '../data/concepts';
import { shuffle } from '../lib';

export default function Review() {
  const [deck, setDeck] = useState(() => shuffle(drills));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string>();
  const [missed, setMissed] = useState<Drill[]>([]);
  const card: Drill | undefined = deck[i];

  const restart = (cards: Drill[]) => { setDeck(shuffle(cards)); setI(0); setPicked(undefined); setMissed([]); };
  function pick(choice: string) {
    if (picked || !card) return;
    setPicked(choice);
    if (choice !== card.a) setMissed(m => [...m, card]);
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Estudar</span>
        <h1>Revisão rápida</h1>
        <p>Primeiro, tente lembrar: toque em cada cartão só depois de responder mentalmente à pergunta. Depois, teste-se em rodadas curtas.</p>
      </div>

      <section className="section">
        <div className="section-head"><div><h2>Cola de 30 segundos</h2><p>{MNEMONIC}</p></div></div>
        <div className="concept-grid">
          {cheats.map(c => (
            <details key={c.name} className="concept cheat">
              <summary>
                <span className="board-label">{c.board}</span>
                <h3>{c.name}</h3>
                <p className="cheat-key">“{c.key}”</p>
                <small className="muted">Toque para conferir</small>
              </summary>
              <dl>
                {c.concepts.map(id => <div key={id}><dt>{conceptById[id].name}</dt><dd>{conceptById[id].definition}</dd></div>)}
                <div><dt>O que faz</dt><dd>{c.verb}</dd></div>
                <div><dt>Entrega</dt><dd>{c.delivers}</dd></div>
                <div><dt>Pegadinha</dt><dd>{c.trap}</dd></div>
              </dl>
            </details>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h2>Quem faz? Onde fica?</h2><p>Uma tarefa por vez, três botões. Rápido de propósito.</p></div>
          {card && <span className="player-count">{i + 1} / {deck.length}</span>}
        </div>

        {card ? (
          <div className="player">
            <article className="sheet">
              <p className="drill-q">{card.q}</p>
              <div className="drill-choices">
                {CHOICES[card.set].map(choice => (
                  <button key={choice} type="button" disabled={!!picked} onClick={() => pick(choice)}
                    className={`btn ${picked && choice === card.a ? 'primary' : picked === choice ? 'wrong' : ''}`}>{choice}</button>
                ))}
              </div>
            </article>
            {picked && (
              <section className={`correction ${picked === card.a ? 'good' : 'bad'}`} aria-live="polite">
                <div className="correction-verdict">
                  {picked === card.a ? <Check size={20} /> : <X size={20} />}
                  <strong>{picked === card.a ? 'Isso!' : `É ${card.a}.`}</strong>
                </div>
                <p>{card.why}</p>
                <button type="button" className="btn primary" onClick={() => { setPicked(undefined); setI(i + 1); }}>
                  {i === deck.length - 1 ? 'Ver resultado' : 'Próxima'} <ArrowRight size={16} />
                </button>
              </section>
            )}
          </div>
        ) : (
          <div className="empty-card">
            <strong>{deck.length - missed.length} de {deck.length} certas.</strong>
            <p>{missed.length ? 'Repita os que errou até zerar: é a repetição que fixa.' : 'Rodada perfeita. Faça outra em ordem diferente para confirmar.'}</p>
            <div className="result-actions">
              {missed.length > 0 && <button type="button" className="btn primary" onClick={() => restart(missed)}><RotateCcw size={16} /> Repetir só os {missed.length} que errei</button>}
              <button type="button" className={`btn ${missed.length ? 'ghost' : 'primary'}`} onClick={() => restart(drills)}>Nova rodada completa</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
