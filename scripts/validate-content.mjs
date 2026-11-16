import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function load(path) {
  const out = await build({ entryPoints: [path], bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent' });
  const mod = { exports: {} };
  new Function('module', 'exports', out.outputFiles[0].text)(mod, mod.exports);
  return mod.exports;
}

const { concepts, conceptById, topics } = await load('src/data/concepts.ts');
const { questions } = await load('src/data/questions.ts');
const { drills, CHOICES, cheats } = await load('src/data/review.ts');
const { recordAttempts, recordSession, wrongIds, emptyProgress } = await load('src/store.ts');

const fail = [];
const check = (cond, msg) => { if (!cond) fail.push(msg); };
for (const c of concepts) check(cheats.some(ch => ch.concepts.includes(c.id)), `revisão rápida: conceito “${c.id}” sem cartão de memória`);
for (const c of cheats) check(c.concepts.every(id => conceptById[id]), `revisão rápida: cartão “${c.name}” aponta para conceito inexistente`);
for (const d of drills) check(CHOICES[d.set].includes(d.a), `revisão rápida: “${d.q}” tem resposta fora das opções`);

// Estrutura
assert.equal(new Set(concepts.map(c => c.id)).size, concepts.length, 'conceitos duplicados');
assert.equal(new Set(questions.map(q => q.id)).size, questions.length, 'questões duplicadas');
for (const t of topics) {
  check(concepts.some(c => c.topic === t.id), `${t.id}: assunto sem conceito`);
  check(questions.some(q => q.topic === t.id && q.format === 'objetiva'), `${t.id}: assunto sem questão objetiva`);
}
for (const c of concepts) check(questions.some(q => q.concepts.includes(c.id)), `${c.id}: conceito sem nenhuma questão`);

for (const q of questions) {
  check(q.options.length === 5, `${q.id}: precisa de 5 alternativas (A–E), como na prova`);
  check(new Set(q.options.map(o => o.text)).size === q.options.length, `${q.id}: alternativas repetidas`);
  check(q.answer >= 0 && q.answer < q.options.length, `${q.id}: gabarito inválido`);
  q.options.forEach((o, i) => { if (i !== q.answer) check(o.why.length > 15, `${q.id}: alternativa ${i} sem justificativa`); });
  check(q.concepts.every(id => conceptById[id]), `${q.id}: conceito inexistente`);
  check(q.hint.length > 10 && q.explanation.length > 20, `${q.id}: dica ou explicação curta`);
  check(q.command.trim().length > 5, `${q.id}: comando vazio`);
  if (q.format === 'contextualizada') {
    const text = [...q.context, ...(q.items ?? []).map(i => i.text), ...(q.assertion ?? [])].join(' ');
    check(text.length >= 220, `${q.id}: texto-base curto para uma contextualizada (${text.length})`);
    check(q.style !== 'direta', `${q.id}: contextualizada com estilo de questão direta`);
  }
  if (q.style === 'assercao') check(q.assertion?.length === 2, `${q.id}: asserção–razão sem as duas asserções`);
  if (q.style === 'afirmativas') check((q.items?.length ?? 0) >= 3, `${q.id}: afirmativas sem I, II e III`);
}

// Vieses que facilitam o “chute”
const shuffled = questions.filter(q => !q.fixedOrder);
const longest = shuffled.filter(q => {
  const max = Math.max(...q.options.map(o => o.text.length));
  return q.options[q.answer].text.length === max && q.options.filter(o => o.text.length === max).length === 1;
}).length;
const longestRate = longest / shuffled.length;
check(longestRate <= 0.45, `a correta é a mais longa em ${(longestRate * 100).toFixed(0)}% das questões (limite 45%)`);

const distractors = questions.flatMap(q => q.options.filter((_, i) => i !== q.answer).map(o => o.text));
const repeated = distractors.filter((t, i) => distractors.indexOf(t) !== i && !/^(I|II|III|As asserções|A asserção)/.test(t));
check(repeated.length === 0, `distratores repetidos entre questões: ${[...new Set(repeated)].slice(0, 3).join(' | ')}`);

const keyOf = q => q.options[q.answer].text;
const afirm = questions.filter(q => q.style === 'afirmativas');
check(new Set(afirm.map(keyOf)).size >= Math.min(4, afirm.length), 'gabaritos das afirmativas pouco variados');
const asser = questions.filter(q => q.style === 'assercao');
check(new Set(asser.map(q => q.answer)).size >= Math.min(4, asser.length), 'gabaritos das asserções pouco variados');

for (const f of ['objetiva', 'contextualizada']) check(questions.filter(q => q.format === f).length >= 16, `${f}: menos de 16 questões`);
for (const d of ['facil', 'medio', 'dificil']) check(questions.some(q => q.difficulty === d), `sem questões ${d}`);
for (const s of ['cenario', 'respectivamente', 'afirmativas', 'assercao']) check(questions.some(q => q.format === 'contextualizada' && q.style === s), `contextualizadas sem o formato ${s}`);

// Progresso
let p = recordAttempts(emptyProgress, [{ q: questions[0].id, ok: false, at: 1, mode: 'treino' }]);
assert.deepEqual(wrongIds(p), [questions[0].id]);
p = recordAttempts(p, [{ q: questions[0].id, ok: true, at: 2, mode: 'treino' }]);
assert.deepEqual(wrongIds(p), []);
p = recordSession(p, { id: 's', date: 1, mode: 'simulado', format: 'contextualizada', ids: [], answers: {}, seconds: 1, score: 0 });
assert.equal(p.sessions.length, 1);

if (fail.length) {
  console.error(`Validação falhou (${fail.length}):\n- ${fail.join('\n- ')}`);
  process.exit(1);
}

const count = (f) => questions.filter(f).length;
console.log(`Validação concluída: ${concepts.length} conceitos em ${topics.length} assuntos do quadro; ${count(q => q.format === 'objetiva')} objetivas e ${count(q => q.format === 'contextualizada')} contextualizadas.`);
console.log(`Formatos: ${['direta', 'cenario', 'respectivamente', 'afirmativas', 'assercao'].map(s => `${s} ${count(q => q.style === s)}`).join(' · ')}`);
console.log(`Correta é a mais longa em ${(longestRate * 100).toFixed(0)}% das questões embaralhadas.`);
