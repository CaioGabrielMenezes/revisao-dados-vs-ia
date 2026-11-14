import { useEffect, useMemo, useState } from 'react';
import { Info, Search } from 'lucide-react';
import type { Go } from '../App';
import { concepts, topics } from '../data/concepts';
import { questions } from '../data/questions';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Concepts({ focus, go }: { focus?: string; go: Go }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`c-${focus}`);
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.classList.add('flash');
      const t = setTimeout(() => el.classList.remove('flash'), 1800);
      return () => clearTimeout(t);
    }
  }, [focus]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return concepts;
    return concepts.filter(c => norm([c.name, c.board, c.definition, c.example, c.contrast].join(' ')).includes(q));
  }, [query]);

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Estudar</span>
        <h1>Conceitos do quadro</h1>
        <p>Cada ficha traz a definição, um exemplo, o que não confundir e como o assunto costuma ser cobrado. A base é o slide da aula; os termos seguem o quadro.</p>
      </div>

      <label className="search">
        <Search size={18} aria-hidden />
        <input type="search" placeholder="Buscar termo (ex.: drift, ETL, Claude)" value={query} onChange={e => setQuery(e.target.value)} />
      </label>

      {topics.map(topic => {
        const list = filtered.filter(c => c.topic === topic.id);
        if (!list.length) return null;
        const count = questions.filter(q => q.topic === topic.id).length;
        return (
          <section key={topic.id} className="section">
            <div className="section-head">
              <div>
                <h2>{topic.name}</h2>
                <p><span className="board-label">{topic.board}</span></p>
              </div>
              <button type="button" className="btn small" onClick={() => go('objetivas', { topic: topic.id })}>Praticar {count} questões</button>
            </div>
            <div className="concept-grid">
              {list.map(c => (
                <article key={c.id} id={`c-${c.id}`} className="concept">
                  {c.board && <span className="board-label">{c.board}</span>}
                  <h3>{c.name}</h3>
                  <p>{c.definition}</p>
                  <dl>
                    <div><dt>Exemplo</dt><dd>{c.example}</dd></div>
                    <div><dt>Não confunda</dt><dd>{c.contrast}</dd></div>
                    <div><dt>Como cai</dt><dd>{c.exam}</dd></div>
                  </dl>
                  {c.note && <p className="concept-note"><Info size={15} aria-hidden /> {c.note}</p>}
                </article>
              ))}
            </div>
          </section>
        );
      })}
      {!filtered.length && <p className="empty">Nenhum conceito encontrado para “{query}”.</p>}
    </>
  );
}
