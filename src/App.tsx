import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, ClipboardCheck, FileText, Home as HomeIcon, ListChecks, Menu, Moon, RotateCcw, Sun, X } from 'lucide-react';
import { questions } from './data/questions';
import { loadProgress, recordAttempts, recordSession, saveProgress, wrongIds } from './store';
import type { Attempt, Progress, SessionRecord, TopicId } from './types';
import Home from './pages/Home';
import Concepts from './pages/Concepts';
import Practice from './pages/Practice';
import Exam from './pages/Exam';

export type Page = 'inicio' | 'conceitos' | 'objetivas' | 'contextualizadas' | 'simulado' | 'erros';
/** `from`: página de origem ao abrir um conceito (para o botão “Voltar”). */
export type Nav = { page: Page; concept?: string; topic?: TopicId; from?: Page };
export type Go = (page: Page, extra?: Omit<Nav, 'page'>) => void;
export type Save = (attempts: Attempt[], session?: SessionRecord) => void;

const NAV: { id: Page; name: string; icon: typeof HomeIcon; group: string }[] = [
  { id: 'inicio', name: 'Início', icon: HomeIcon, group: 'Estudar' },
  { id: 'conceitos', name: 'Conceitos do quadro', icon: BookOpen, group: 'Estudar' },
  { id: 'objetivas', name: 'Questões objetivas', icon: ListChecks, group: 'Praticar' },
  { id: 'contextualizadas', name: 'Questões contextualizadas', icon: FileText, group: 'Praticar' },
  { id: 'simulado', name: 'Simulado da prova', icon: ClipboardCheck, group: 'Praticar' },
  { id: 'erros', name: 'Revisar erros', icon: RotateCcw, group: 'Praticar' }
];

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [nav, setNav] = useState<Nav>({ page: 'inicio' });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => {
    document.documentElement.dataset.theme = progress.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', progress.theme === 'dark' ? '#14161c' : '#f6f5f1');
  }, [progress.theme]);

  const go: Go = (page, extra) => {
    setNav(cur => ({ page, ...extra, from: page === 'conceitos' && cur.page !== 'conceitos' ? cur.page : undefined }));
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };
  const save: Save = (attempts, session) => setProgress(p => {
    const next = recordAttempts(p, attempts);
    return session ? recordSession(next, session) : next;
  });

  const pending = wrongIds(progress).length;
  const answered = new Set(progress.attempts.map(a => a.q)).size;
  const current = NAV.find(n => n.id === nav.page)!;
  const back = nav.page === 'conceitos' && nav.from !== 'inicio' ? NAV.find(n => n.id === nav.from) : undefined;
  // Páginas com sessão em andamento ficam montadas (só ocultas) para não perder o progresso ao navegar.
  const keep = (page: Page, el: ReactNode) => <div hidden={nav.page !== page}>{el}</div>;
  const practice = (page: Page, mode: 'objetiva' | 'contextualizada' | 'erros') => keep(page,
    <Practice mode={mode} active={nav.page === page} preset={nav.page === page ? nav.topic : undefined} progress={progress} save={save} go={go} />);

  return (
    <div className="shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Menu">
        <div className="brand">
          <button type="button" className="brand-link" onClick={() => go('inicio')}>
            <span className="brand-mark" aria-hidden>D<i>vs</i>IA</span>
            <span><strong>Revisão da prova</strong><small>Dados vs IA · quadro da aula</small></span>
          </button>
          <button type="button" className="icon-btn only-mobile" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>

        {['Estudar', 'Praticar'].map(group => (
          <nav key={group} className="nav-group" aria-label={group}>
            <span className="nav-label">{group}</span>
            {NAV.filter(n => n.group === group).map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" className={`nav-item ${nav.page === item.id ? 'active' : ''}`} onClick={() => go(item.id)} aria-current={nav.page === item.id ? 'page' : undefined}>
                  <Icon size={18} />
                  <span>{item.name}</span>
                  {item.id === 'erros' && pending > 0 && <em>{pending}</em>}
                </button>
              );
            })}
          </nav>
        ))}

        <div className="sidebar-foot">
          <div className="mini-progress">
            <div><span>Banco respondido</span><strong>{Math.round((answered / questions.length) * 100)}%</strong></div>
            <div className="bar"><i style={{ width: `${(answered / questions.length) * 100}%` }} /></div>
            <small>{answered} de {questions.length} questões</small>
          </div>
          <button type="button" className="theme-btn" onClick={() => setProgress(p => ({ ...p, theme: p.theme === 'light' ? 'dark' : 'light' }))}>
            {progress.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {progress.theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          </button>
        </div>
      </aside>
      {menuOpen && <div className="shade" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button type="button" className="icon-btn only-mobile" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={22} /></button>
          <span className="crumb">{current.group} <span aria-hidden>/</span> <b>{current.name}</b></span>
          {/* Na barra fixa, o “Voltar” fica visível mesmo com a página rolada até a ficha do conceito. */}
          {back && <button type="button" className="btn primary small back-btn" onClick={() => go(back.id)}><ArrowLeft size={15} /> Voltar para {back.name}</button>}
        </header>
        <div className="content">
          {nav.page === 'inicio' && <Home progress={progress} go={go} />}
          {nav.page === 'conceitos' && <Concepts focus={nav.concept} go={go} />}
          {practice('objetivas', 'objetiva')}
          {practice('contextualizadas', 'contextualizada')}
          {practice('erros', 'erros')}
          {keep('simulado', <Exam progress={progress} save={save} go={go} />)}
        </div>
      </main>
    </div>
  );
}
