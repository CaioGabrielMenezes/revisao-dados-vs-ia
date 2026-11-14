import type { Difficulty, Format, Option, Question, Style, TopicId } from '../types';

/*
 * Banco de questões.
 * - Assuntos: o quadro da aula (referencias/quadro).
 * - Base teórica: slide da Aula 02 (referencias/slides).
 * - Formato: prova anterior do professor (referencias/prova-anterior) — 5 alternativas,
 *   cenários, afirmativas I/II/III, asserção–razão (PORQUE) e “respectivamente”.
 *
 * Cada alternativa errada tem a sua própria justificativa.
 */

type Base = {
  id: string;
  topic: TopicId;
  concepts: string[];
  difficulty: Difficulty;
  format: Format;
  context?: string[];
  items?: { label: string; text: string }[];
  hint: string;
  explanation: string;
};

/** [texto da alternativa, por que está errada] */
type Wrong = [string, string];

function direta(b: Base & { style?: Exclude<Style, 'afirmativas' | 'assercao'>; command: string; correct: string; wrong: [Wrong, Wrong, Wrong, Wrong] }): Question {
  const options: Option[] = [{ text: b.correct, why: '' }, ...b.wrong.map(([text, why]) => ({ text, why }))];
  return {
    id: b.id, topic: b.topic, concepts: b.concepts, format: b.format, style: b.style ?? (b.format === 'objetiva' ? 'direta' : 'cenario'),
    difficulty: b.difficulty, context: b.context ?? [], items: b.items, command: b.command, options, answer: 0, hint: b.hint, explanation: b.explanation
  };
}

const ROMAN = ['I', 'II', 'III', 'IV'];
/** Minúscula após dois-pontos, preservando siglas (LLM, MLflow...). */
const lc = (s: string) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç ]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
const COMBOS: number[][] = [[0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]];
const comboLabel = (c: number[]) => {
  const r = c.map(i => ROMAN[i]);
  if (r.length === 1) return `${r[0]}, apenas.`;
  if (r.length === 3) return `${r[0]}, ${r[1]} e ${r[2]}.`;
  return `${r[0]} e ${r[1]}, apenas.`;
};

/** Afirmativas I, II, III — “É correto o que se afirma em:” */
function afirmativas(b: Base & { lead?: string; statements: [string, boolean, string][]; command?: string }): Question {
  const truth = b.statements.map(s => s[1]);
  const key = COMBOS.findIndex(c => truth.every((t, i) => t === c.includes(i)));
  if (key < 0) throw new Error(`${b.id}: combinação sem alternativa`);
  const distance = (c: number[]) => truth.filter((t, i) => t !== c.includes(i)).length;
  const chosen = COMBOS.map((c, i) => ({ c, i }))
    .filter(x => x.i !== key)
    .sort((x, y) => distance(x.c) - distance(y.c) || x.i - y.i)
    .slice(0, 4)
    .concat({ c: COMBOS[key], i: key })
    .sort((x, y) => x.i - y.i);
  const options: Option[] = chosen.map(({ c, i }) => {
    if (i === key) return { text: comboLabel(c), why: '' };
    const issues: string[] = [];
    b.statements.forEach(([, ok, why], s) => {
      if (c.includes(s) && !ok) issues.push(`A afirmação ${ROMAN[s]} é falsa: ${lc(why)}`);
      if (!c.includes(s) && ok) issues.push(`Deixa de fora a afirmação ${ROMAN[s]}, que é verdadeira.`);
    });
    return { text: comboLabel(c), why: issues.join(' ') };
  });
  return {
    id: b.id, topic: b.topic, concepts: b.concepts, format: b.format, style: 'afirmativas', difficulty: b.difficulty,
    context: b.context ?? [], lead: b.lead ?? 'Avalie as afirmações a seguir.',
    items: b.statements.map(([text], i) => ({ label: `${ROMAN[i]}.`, text })),
    command: b.command ?? 'É correto o que se afirma em:', options, answer: chosen.findIndex(x => x.i === key), fixedOrder: true,
    hint: b.hint, explanation: b.explanation
  };
}

const ASSERCAO = [
  'As asserções I e II são proposições verdadeiras, e a II é uma justificativa correta da I.',
  'As asserções I e II são proposições verdadeiras, mas a II não é uma justificativa correta da I.',
  'A asserção I é uma proposição verdadeira, e a II é uma proposição falsa.',
  'A asserção I é uma proposição falsa, e a II é uma proposição verdadeira.',
  'As asserções I e II são proposições falsas.'
];
const ASSERCAO_TRUTH: [boolean, boolean, boolean | null][] = [[true, true, true], [true, true, false], [true, false, null], [false, true, null], [false, false, null]];

/** Asserção–razão: “I ... PORQUE II ...” */
function assercao(b: Base & { i: [string, boolean, string]; ii: [string, boolean, string]; justifies?: boolean; relation?: string }): Question {
  const [iText, iOk, iWhy] = b.i;
  const [iiText, iiOk, iiWhy] = b.ii;
  const justifies = iOk && iiOk ? !!b.justifies : null;
  const answer = ASSERCAO_TRUTH.findIndex(([a, c, j]) => a === iOk && c === iiOk && j === justifies);
  const options: Option[] = ASSERCAO.map((text, idx) => {
    if (idx === answer) return { text, why: '' };
    const [a, c, j] = ASSERCAO_TRUTH[idx];
    const issues: string[] = [];
    if (a !== iOk) issues.push(`A asserção I é ${iOk ? 'verdadeira' : 'falsa'}: ${lc(iWhy)}`);
    if (c !== iiOk) issues.push(`A asserção II é ${iiOk ? 'verdadeira' : 'falsa'}: ${lc(iiWhy)}`);
    if (!issues.length && j !== justifies) issues.push(`${justifies ? 'A II justifica, sim, a I' : 'A II não justifica a I'}: ${b.relation ?? ''}`);
    return { text, why: issues.join(' ') };
  });
  return {
    id: b.id, topic: b.topic, concepts: b.concepts, format: b.format, style: 'assercao', difficulty: b.difficulty,
    context: b.context ?? [], lead: 'Avalie as asserções a seguir e a relação proposta entre elas.', assertion: [iText, iiText],
    command: 'A respeito dessas asserções, assinale a opção correta:', options, answer, fixedOrder: true, hint: b.hint, explanation: b.explanation
  };
}

// ════════════════════════════════════════════════════════════════════
// QUESTÕES OBJETIVAS — conceitos do quadro
// ════════════════════════════════════════════════════════════════════
const o = { format: 'objetiva' as const };

const objetivas: Question[] = [
  // ── Dados vs IA ──
  direta({ ...o, id: 'O01', topic: 'areas', concepts: ['dados-vs-ia'], difficulty: 'facil',
    command: 'Considerando a distinção entre a área de Dados e a área de IA apresentada em aula, assinale a alternativa correta:',
    correct: 'Dados analisa informações para apoiar decisões; a IA usa dados para construir sistemas que aprendem.',
    wrong: [
      ['As áreas são independentes, pois modelos de IA funcionam bem mesmo quando os dados são de baixa qualidade.', 'Modelos de IA aprendem a partir dos dados: dado ruim gera modelo ruim. As áreas são dependentes.'],
      ['A IA substitui a área de dados, já que modelos de linguagem dispensam bancos, pipelines e análises.', 'LLMs não substituem bancos, pipelines e análises; dependem deles para trabalhar com informação confiável.'],
      ['A área de dados trabalha apenas com tabelas numéricas, e a IA trabalha apenas com textos e imagens.', 'A divisão não é pelo tipo de dado: as duas áreas lidam com dados estruturados e não estruturados.'],
      ['A diferença é só de ferramenta: dados usa planilhas e IA usa Python, mas o objetivo das duas é o mesmo.', 'A diferença está no objetivo (analisar e decidir × aprender e automatizar), não na ferramenta.']
    ],
    hint: 'Pense no que cada área entrega e se uma consegue existir sem a outra.',
    explanation: 'Dados e IA são complementares: a área de dados prepara e analisa a informação; a IA aprende com ela. Sem dados de qualidade, não há modelo confiável.' }),

  direta({ ...o, id: 'O02', topic: 'areas', concepts: ['bi'], difficulty: 'facil',
    context: ['Uma rede de academias quer acompanhar, em um painel atualizado diariamente, o número de matrículas, de cancelamentos e a receita de cada unidade.'],
    command: 'Qual área do quadro atende diretamente a essa necessidade?',
    correct: 'BI / Análise de Dados',
    wrong: [
      ['Machine Learning', 'Não há previsão nem aprendizado: o pedido é acompanhar indicadores do que já aconteceu.'],
      ['Engenharia de Dados (E.D)', 'A engenharia pode alimentar o painel, mas a entrega pedida — indicadores em um painel — é de BI.'],
      ['IA generativa', 'Não se pede criação de conteúdo novo, e sim monitoramento de números.'],
      ['MLflow', 'MLflow rastreia experimentos e modelos de ML; não é ferramenta de painel de negócio.']
    ],
    hint: '“Painel”, “acompanhar” e “indicadores” são palavras-chave de qual área?',
    explanation: 'BI transforma dados em indicadores e painéis para acompanhar o negócio — análise descritiva.' }),

  direta({ ...o, id: 'O03', topic: 'areas', concepts: ['cd'], difficulty: 'medio',
    command: 'Qual atividade caracteriza mais diretamente o trabalho do cientista de dados (C.D no quadro)?',
    correct: 'Formular hipóteses, treinar modelos e avaliá-los em dados não usados no treino',
    wrong: [
      ['Garantir que a carga noturna do data warehouse execute no horário e sem perda de registros', 'Manter cargas e pipelines é atribuição da engenharia de dados (E.D).'],
      ['Administrar backups, permissões e desempenho do banco de dados transacional da empresa', 'Essa é a função do administrador de banco de dados (DBA), ligada a DB no quadro.'],
      ['Montar o painel mensal de faturamento com os indicadores definidos pela diretoria', 'Painéis de indicadores são entregas de BI e análise de dados (BI/A.D).'],
      ['Priorizar o backlog do produto e quebrar cada item em tasks para o time de desenvolvimento', 'Organizar backlog e tasks é gestão do trabalho de desenvolvimento, não ciência de dados.']
    ],
    hint: 'No quadro, C.D aparece junto de M.L.',
    explanation: 'O cientista de dados usa estatística e machine learning para construir e avaliar modelos que explicam ou preveem comportamentos.' }),

  direta({ ...o, id: 'O04', topic: 'areas', concepts: ['ed'], difficulty: 'facil',
    command: 'O profissional responsável por construir e manter os pipelines que levam dados das fontes até o data warehouse é o:',
    correct: 'engenheiro de dados.',
    wrong: [
      ['analista de dados.', 'O analista consome os dados já disponíveis para analisar e comunicar; não mantém a infraestrutura.'],
      ['cientista de dados.', 'O cientista usa os dados para criar modelos; não é o responsável pelo fluxo entre sistemas.'],
      ['analista de BI.', 'O analista de BI constrói painéis sobre dados já tratados.'],
      ['administrador de banco de dados (DBA).', 'O DBA mantém o banco funcionando (backup, desempenho, acesso); integrar sistemas via pipeline é da engenharia de dados.']
    ],
    hint: 'Quem garante que o dado chegue tratado e no prazo?',
    explanation: 'A engenharia de dados (E.D) projeta e mantém pipelines, ETL e o data warehouse.' }),

  direta({ ...o, id: 'O05', topic: 'areas', concepts: ['ad'], difficulty: 'medio',
    command: 'Em relação ao analista de dados (A.D no quadro), assinale a alternativa correta:',
    correct: 'Explora e interpreta dados já disponíveis para responder perguntas do negócio e comunicar conclusões.',
    wrong: [
      ['É o principal responsável por manter a infraestrutura de ingestão e o agendamento dos pipelines.', 'Infraestrutura de ingestão e pipelines são responsabilidade da engenharia de dados.'],
      ['Tem como entrega principal modelos preditivos implantados e monitorados em produção.', 'Modelos preditivos em produção são o foco da ciência de dados e de ML.'],
      ['Atua apenas na criação de bancos de dados, sem contato com as áreas de negócio.', 'O analista trabalha justamente próximo ao negócio, traduzindo dados em respostas.'],
      ['Torna o engenheiro de dados desnecessário quando a empresa adota ferramentas de BI.', 'Ferramentas de BI dependem de dados entregues pela engenharia; uma função não substitui a outra.']
    ],
    hint: 'No quadro, A.D aparece junto de BI.',
    explanation: 'O analista de dados explora, interpreta e comunica — perguntas do tipo “o que aconteceu e por quê?”.' }),

  direta({ ...o, id: 'O06', topic: 'areas', concepts: ['ml'], difficulty: 'medio',
    command: 'O que distingue um sistema de machine learning de uma automação baseada em regras?',
    correct: 'No ML, o critério é inferido de exemplos; na regra, é escrito por uma pessoa.',
    wrong: [
      ['O ML nunca erra, pois aprende com os dados, enquanto a regra erra porque depende de pessoas.', 'Modelos de ML erram e por isso precisam ser avaliados; aprender com dados não garante acerto.'],
      ['A regra exige dados de treinamento rotulados, enquanto o ML funciona sem nenhum dado.', 'É o contrário: o ML precisa de dados para aprender; a regra é escrita diretamente.'],
      ['Os dois são ML, pois qualquer programa que classifica texto de forma automática aprende.', 'Automatizar não é aprender: uma regra fixa só executa o critério que alguém escreveu.'],
      ['O ML é usado apenas com imagens, enquanto regras são a única opção para textos.', 'ML é aplicado a textos, números, imagens e outros dados.']
    ],
    hint: 'Pergunte onde está o critério de decisão: no código escrito por alguém ou nos exemplos?',
    explanation: 'Regras executam um critério definido por pessoas; ML infere o critério a partir dos dados e pode errar sem avisar.' }),

  direta({ ...o, id: 'O07', topic: 'areas', concepts: ['db', 'warehouse'], difficulty: 'medio', style: 'respectivamente',
    context: ['Um e-commerce precisa registrar cada compra no momento em que ela acontece, respondendo rapidamente ao cliente. A diretoria, por sua vez, quer analisar cinco anos de vendas integrados aos dados de estoque e financeiro.'],
    command: 'As estruturas mais adequadas para essas duas necessidades são, respectivamente:',
    correct: 'banco de dados operacional e data warehouse.',
    wrong: [
      ['data warehouse e banco de dados operacional.', 'A ordem está invertida: registrar compras em tempo real é papel do banco operacional.'],
      ['data mart e banco de dados operacional.', 'Data mart é recorte analítico, não registra compras em tempo real; e o histórico integrado é papel do warehouse.'],
      ['data warehouse nas duas, pois ele substitui o banco operacional.', 'O warehouse é otimizado para análise histórica, não para registrar transações do sistema.'],
      ['banco operacional nas duas, pois análises não exigem integração de fontes.', 'A análise pedida integra várias fontes e anos de histórico — função do warehouse.']
    ],
    hint: 'Uma necessidade é operar o sistema agora; a outra é analisar o passado.',
    explanation: 'O banco operacional registra as transações do dia a dia; o data warehouse integra o histórico de várias fontes para análise.' }),

  direta({ ...o, id: 'O08', topic: 'areas', concepts: ['bi', 'cd', 'ed', 'db'], difficulty: 'dificil', style: 'respectivamente',
    context: ['No quadro, as áreas de dados foram listadas como DB, BI/A.D, C.D/M.L e E.D. Considere as entregas de uma academia:'],
    items: [
      { label: '1)', text: 'painel com a meta de matrículas de cada unidade;' },
      { label: '2)', text: 'modelo que prevê quais alunos vão cancelar o plano;' },
      { label: '3)', text: 'rotina diária que integra o sistema de catracas ao data warehouse;' },
      { label: '4)', text: 'política de backup e controle de acesso ao banco de matrículas.' }
    ],
    command: 'As áreas responsáveis por 1, 2, 3 e 4 são, respectivamente:',
    correct: 'BI/A.D, C.D/M.L, E.D e DB.',
    wrong: [
      ['C.D/M.L, BI/A.D, E.D e DB.', 'O painel (1) é BI/A.D, e a previsão de cancelamento (2) é C.D/M.L — os dois primeiros estão trocados.'],
      ['BI/A.D, E.D, C.D/M.L e DB.', 'O modelo preditivo (2) é C.D/M.L e a rotina de integração (3) é E.D — estão trocados.'],
      ['E.D, C.D/M.L, BI/A.D e DB.', 'O painel (1) é BI/A.D e a integração das catracas (3) é E.D.'],
      ['BI/A.D, C.D/M.L, DB e E.D.', 'Integrar sistemas (3) é engenharia de dados; backup e acesso ao banco (4) é DB/DBA.']
    ],
    hint: 'Resolva uma de cada vez: painel, previsão, integração, backup.',
    explanation: 'Painel → BI/A.D; previsão → C.D/M.L; integração de fontes → E.D; backup e acesso ao banco → DB.' }),

  direta({ ...o, id: 'O09', topic: 'areas', concepts: ['cd', 'ml'], difficulty: 'facil',
    command: 'No quadro, C.D aparece ao lado de M.L. A relação mais adequada entre os dois é:',
    correct: 'o cientista de dados usa machine learning para criar seus modelos.',
    wrong: [
      ['machine learning é uma área de dados sem relação com inteligência artificial.', 'ML é uma subárea da IA.'],
      ['ciência de dados e machine learning são o mesmo profissional com dois nomes.', 'C.D é uma área de atuação; ML é um conjunto de técnicas que ela utiliza.'],
      ['machine learning torna desnecessário o uso de estatística pelo cientista.', 'Estatística é base para treinar e, sobretudo, avaliar modelos.'],
      ['todo cientista de dados é responsável por manter os pipelines da empresa.', 'Manter pipelines é atribuição da engenharia de dados.']
    ],
    hint: 'Um é a área de atuação; o outro, uma técnica.',
    explanation: 'Ciência de dados usa estatística, programação e ML para construir e avaliar modelos.' }),

  direta({ ...o, id: 'O10', topic: 'areas', concepts: ['dados-vs-ia', 'ia'], difficulty: 'medio',
    command: 'Segundo a aula, o avanço recente da IA resultou da convergência de três pilares. São eles:',
    correct: 'dados em grande escala, GPUs acessíveis e novos algoritmos.',
    wrong: [
      ['regras manuais, planilhas e bancos de dados relacionais.', 'Regras manuais marcam a fase inicial, cujas limitações levaram ao “inverno da IA”.'],
      ['apenas novos algoritmos, sem relação com dados ou hardware.', 'O slide destaca justamente a combinação: algoritmos sozinhos não bastaram.'],
      ['data marts, MLflow e backlogs bem priorizados.', 'São conceitos do quadro, mas não os pilares da “tempestade perfeita” da IA.'],
      ['sistemas especialistas, CPUs mais rápidas e tradução automática.', 'Sistemas especialistas são regras manuais; o salto veio de dados massivos + GPUs + deep learning/Transformers.']
    ],
    hint: 'A aula chama isso de “tempestade perfeita”. Um dos pilares liga Dados a IA.',
    explanation: 'Dados massivos (internet), poder computacional (GPUs) e novos algoritmos (deep learning, Transformers) convergiram a partir dos anos 2010.' }),

  // ── Pipeline, ETL, Warehouse, Marts ──
  direta({ ...o, id: 'O11', topic: 'arquitetura', concepts: ['pipeline'], difficulty: 'facil',
    command: 'Qual definição melhor descreve um pipeline de dados?',
    correct: 'Sequência automatizada de etapas que leva e trata dados da origem ao destino.',
    wrong: [
      ['Repositório central que guarda o histórico integrado de todas as áreas da empresa.', 'Essa é a definição de data warehouse.'],
      ['Subconjunto de dados analíticos preparado para um único departamento.', 'Essa é a definição de data mart.'],
      ['Painel interativo com os principais indicadores do negócio para a diretoria.', 'Essa é uma entrega de BI.'],
      ['Plataforma que registra parâmetros e métricas de experimentos de machine learning.', 'Essa é a função do MLflow.']
    ],
    hint: 'Todas as alternativas são termos do quadro. Qual deles é um fluxo?',
    explanation: 'Pipeline é o fluxo automatizado e repetível que move e trata dados da origem ao destino.' }),

  direta({ ...o, id: 'O12', topic: 'arquitetura', concepts: ['etl'], difficulty: 'facil',
    command: 'Na sigla ETL, as etapas ocorrem na seguinte ordem:',
    correct: 'extrair das fontes, transformar os dados e carregar no destino.',
    wrong: [
      ['extrair das fontes, carregar no destino e transformar lá dentro.', 'Essa é a ordem do ELT, em que a transformação acontece depois da carga.'],
      ['transformar os dados, extrair das fontes e carregar no destino.', 'Não é possível transformar antes de extrair os dados das fontes.'],
      ['carregar no destino, transformar os dados e extrair os resultados.', 'A ordem está invertida em relação ao significado da sigla.'],
      ['extrair das fontes, testar o modelo e liberar para produção.', 'Isso descreve um ciclo de modelo, não as letras Transform e Load.']
    ],
    hint: 'E–T–L: Extract, Transform, Load.',
    explanation: 'ETL = Extract (extrair), Transform (transformar) e Load (carregar), nessa ordem.' }),

  direta({ ...o, id: 'O13', topic: 'arquitetura', concepts: ['etl'], difficulty: 'medio',
    context: ['Durante um ETL, datas registradas em três formatos diferentes são convertidas para um único padrão, e registros duplicados são removidos.'],
    command: 'Essas ações pertencem à etapa de:',
    correct: 'transformação.',
    wrong: [
      ['extração.', 'A extração apenas lê os dados das fontes, sem alterá-los.'],
      ['carga.', 'A carga grava no destino os dados já tratados.'],
      ['modelagem preditiva.', 'Padronizar datas e remover duplicados é preparação de dados, não treino de modelo.'],
      ['visualização.', 'Visualização é a apresentação em painéis, depois que os dados já foram tratados e carregados.']
    ],
    hint: 'Os dados estão sendo alterados. Em qual letra isso acontece?',
    explanation: 'Limpar, padronizar, integrar e calcular são ações de transformação (o T do ETL).' }),

  direta({ ...o, id: 'O14', topic: 'arquitetura', concepts: ['warehouse'], difficulty: 'medio',
    command: 'Sobre o Data Warehouse, é correto afirmar:',
    correct: 'integra dados históricos de várias fontes e é organizado para consultas analíticas.',
    wrong: [
      ['é o banco usado pelo sistema de vendas para registrar cada compra em tempo real.', 'Registrar transações em tempo real é papel do banco operacional.'],
      ['atende exclusivamente um departamento, com um recorte reduzido dos dados.', 'Essa é a definição de data mart; o warehouse atende a organização.'],
      ['é um modelo de IA que aprende padrões a partir dos dados armazenados.', 'O warehouse é um repositório de dados, não um modelo.'],
      ['dispensa pipelines, pois as fontes gravam nele os dados já tratados.', 'O warehouse é alimentado por pipelines/ETL que extraem e tratam os dados das fontes.']
    ],
    hint: 'Histórico + várias fontes + análise.',
    explanation: 'O data warehouse é o repositório central, integrado e histórico, voltado à análise.' }),

  direta({ ...o, id: 'O15', topic: 'arquitetura', concepts: ['datamart', 'warehouse'], difficulty: 'facil',
    command: 'A relação entre Data Warehouse e Data Mart é melhor descrita por:',
    correct: 'o data mart é um recorte do warehouse voltado a uma área ou assunto específico.',
    wrong: [
      ['o data warehouse é um recorte do data mart voltado ao setor financeiro.', 'A relação está invertida: o mart é que é um recorte do warehouse.'],
      ['são sinônimos: os dois nomes designam exatamente a mesma estrutura.', 'Diferem em escopo: organização inteira × uma área.'],
      ['o data mart guarda dados operacionais em tempo real, e o warehouse, históricos.', 'Os dois são estruturas analíticas; dados operacionais ficam no banco transacional.'],
      ['o data mart substitui o warehouse nas empresas que utilizam BI.', 'O data mart normalmente é derivado do warehouse; não o substitui.']
    ],
    hint: 'No quadro, DATA MARTS aparece logo abaixo de DATA WAREHOUSE.',
    explanation: 'Data marts são subconjuntos do warehouse organizados por área (vendas, marketing, financeiro).' }),

  direta({ ...o, id: 'O16', topic: 'arquitetura', concepts: ['pipeline', 'bi'], difficulty: 'medio',
    command: 'No quadro, PIPELINE aparece com uma seta apontando para BI/A.D. Qual interpretação é coerente com essa relação?',
    correct: 'O pipeline entrega dados tratados que alimentam relatórios, painéis e análises.',
    wrong: [
      ['O analista de BI é quem constrói e opera todos os pipelines da empresa.', 'Construir e operar pipelines é atribuição da engenharia de dados.'],
      ['O pipeline substitui a análise, pois já entrega as conclusões prontas.', 'O pipeline entrega dados; interpretar e concluir é trabalho de análise.'],
      ['BI e pipeline são o mesmo processo descrito com nomes diferentes.', 'Um é o fluxo de dados; o outro, o uso desses dados em indicadores.'],
      ['A seta indica que o BI devolve os dados tratados às fontes operacionais.', 'O fluxo vai das fontes para a análise, não o contrário.']
    ],
    hint: 'Uma seta indica para onde o dado vai.',
    explanation: 'O pipeline (com ETL) prepara os dados que chegam ao BI e à análise de dados.' }),

  // ── MLflow e Drift ──
  direta({ ...o, id: 'O17', topic: 'mlops', concepts: ['mlflow'], difficulty: 'facil',
    command: 'O MLflow é utilizado principalmente para:',
    correct: 'registrar experimentos e versionar modelos de machine learning.',
    wrong: [
      ['armazenar o histórico de vendas integrado da empresa para relatórios.', 'Isso descreve um data warehouse.'],
      ['construir painéis de indicadores de negócio para a diretoria.', 'Isso descreve ferramentas de BI.'],
      ['gerar textos a partir de instruções escritas em linguagem natural.', 'Isso descreve um LLM / IA generativa.'],
      ['escolher sozinho o melhor algoritmo, dispensando dados de treino.', 'O MLflow registra e organiza o trabalho; não treina sem dados nem decide sozinho.']
    ],
    hint: 'ML + flow: o fluxo de vida de um modelo.',
    explanation: 'MLflow gerencia o ciclo de vida de modelos: rastreamento de experimentos, registro e versionamento de modelos.' }),

  direta({ ...o, id: 'O18', topic: 'mlops', concepts: ['mlflow'], difficulty: 'medio',
    context: ['Um time treinou dezenas de versões de um modelo e já não sabe quais parâmetros nem qual conjunto de dados geraram a versão que está em produção.'],
    command: 'Qual recurso resolve diretamente esse problema?',
    correct: 'Rastreamento de experimentos e registro de modelos, como no MLflow.',
    wrong: [
      ['Criação de um data mart exclusivo para o time de ciência de dados.', 'Data mart organiza dados de negócio para consulta; não registra versões nem parâmetros de modelos.'],
      ['Aumento da temperatura do modelo que está em produção.', 'Temperatura é parâmetro de geração de LLMs e não tem relação com rastreabilidade.'],
      ['Substituição do banco de dados transacional por outro mais rápido.', 'O problema é de rastreabilidade dos experimentos, não de desempenho do banco.'],
      ['Reorganização do backlog do produto por ordem de prioridade.', 'Backlog organiza o trabalho a fazer; não registra o histórico dos modelos.']
    ],
    hint: 'O problema é “não sabemos de onde veio este modelo”.',
    explanation: 'O MLflow registra parâmetros, métricas, dados e artefatos de cada execução e versiona os modelos.' }),

  direta({ ...o, id: 'O19', topic: 'mlops', concepts: ['drift'], difficulty: 'facil',
    context: ['Um modelo de previsão aprovado com bom desempenho passa a errar cada vez mais nos meses seguintes, sem nenhuma alteração no código.'],
    command: 'O fenômeno mais provável é:',
    correct: 'drift: os dados ou a relação entre dados e resultado mudaram com o tempo.',
    wrong: [
      ['alucinação: o modelo passou a inventar fatos e apresentá-los com confiança.', 'Alucinação é um fenômeno de modelos generativos que inventam conteúdo, não de queda gradual de um modelo preditivo.'],
      ['estouro da janela de contexto, que apagou parte do que o modelo aprendeu.', 'Janela de contexto é um limite de LLMs por interação; não apaga o aprendizado de um modelo preditivo.'],
      ['vazamento de dados no treinamento, que só aparece meses depois do deploy.', 'Vazamento costuma inflar o resultado na validação e falhar logo no início em produção, não degradar aos poucos.'],
      ['corte de conhecimento, que afeta qualquer modelo depois de um ano de uso.', 'Corte de conhecimento é a data limite dos dados de um LLM; a queda gradual de um modelo preditivo é drift.']
    ],
    hint: 'Nada mudou no código. O que pode ter mudado?',
    explanation: 'Drift é a mudança no mundo (dados de entrada ou relação com o resultado) que degrada o modelo em produção.' }),

  direta({ ...o, id: 'O20', topic: 'mlops', concepts: ['drift'], difficulty: 'medio',
    command: 'Em relação aos tipos de drift, assinale a alternativa correta:',
    correct: 'No data drift muda a distribuição das entradas; no concept drift muda a relação entre entradas e resultado.',
    wrong: [
      ['No data drift muda a relação entre entradas e resultado; no concept drift muda a distribuição das entradas.', 'As definições estão invertidas.'],
      ['Os dois tipos só ocorrem quando o código do modelo é alterado pela equipe de desenvolvimento.', 'Drift ocorre justamente sem mudança no código: é o mundo que muda.'],
      ['Os dois tipos são resolvidos de forma definitiva com um único retreinamento do modelo.', 'O mundo continua mudando; é preciso monitorar e retreinar sempre que necessário.'],
      ['Os dois tipos afetam apenas modelos de linguagem, e nunca modelos preditivos tabulares.', 'Drift afeta qualquer modelo em produção, especialmente os preditivos.']
    ],
    hint: 'Data = os dados que entram. Concept = o significado deles para o resultado.',
    explanation: 'Data drift: mudam as entradas (ex.: perfil dos clientes). Concept drift: as mesmas entradas passam a levar a outro resultado (ex.: nova estratégia de fraude).' }),

  direta({ ...o, id: 'O21', topic: 'mlops', concepts: ['drift', 'mlflow'], difficulty: 'medio',
    command: 'Qual prática é a mais adequada para lidar com drift em um modelo em produção?',
    correct: 'Monitorar métricas e dados e retreinar o modelo quando houver degradação.',
    wrong: [
      ['Desligar o monitoramento após a implantação, pois o modelo já foi validado antes do deploy.', 'A validação vale para os dados da época; sem monitoramento a degradação passa despercebida.'],
      ['Aumentar o número de painéis de BI sobre as vendas, mantendo o modelo exatamente como está.', 'Painéis de negócio não medem nem corrigem a degradação do modelo.'],
      ['Congelar o conjunto de treino original e nunca mais atualizá-lo, para garantir estabilidade.', 'Congelar os dados impede o modelo de acompanhar a mudança que causou o drift.'],
      ['Trocar o modelo pelo de maior número de parâmetros, que é imune a mudanças nos dados.', 'Nenhum modelo é imune a drift, por maior que seja.']
    ],
    hint: 'Primeiro perceber, depois corrigir.',
    explanation: 'Drift exige monitoramento contínuo e retreinamento; ferramentas como o MLflow ajudam a comparar a versão nova com a anterior.' }),

  // ── Modelos de IA ──
  direta({ ...o, id: 'O22', topic: 'ia', concepts: ['ia'], difficulty: 'facil',
    command: 'Considerando a relação entre IA, Machine Learning, Deep Learning e LLMs, é correto afirmar:',
    correct: 'LLMs são modelos de deep learning, que é parte do ML, que por sua vez é subárea da IA.',
    wrong: [
      ['IA é uma subárea do machine learning, que é uma das aplicações dos LLMs.', 'A hierarquia está invertida: a IA é o campo mais amplo.'],
      ['Deep learning e machine learning são áreas separadas, sem relação com IA.', 'Deep learning é parte do ML, que é parte da IA.'],
      ['Todo sistema de IA é um LLM, pois todos trabalham com linguagem natural.', 'LLM é só um tipo de modelo; um classificador de churn é IA e não é LLM.'],
      ['LLMs não usam aprendizado de máquina, apenas regras gramaticais escritas à mão.', 'LLMs aprendem com enormes volumes de texto; regras manuais são do PLN clássico.']
    ],
    hint: 'Do mais amplo para o mais específico.',
    explanation: 'IA ⊃ ML ⊃ Deep Learning ⊃ LLM.' }),

  direta({ ...o, id: 'O23', topic: 'ia', concepts: ['claude'], difficulty: 'facil',
    command: 'No quadro foi escrito: MODELOS DE IA → ANTHROPIC → CLAUDE → SONNET, OPUS, FABLE. Essa cadeia representa, respectivamente:',
    correct: 'a empresa desenvolvedora, a família de modelos e modelos específicos dessa família.',
    wrong: [
      ['a família de modelos, a empresa desenvolvedora e versões registradas no MLflow.', 'Anthropic é a empresa e Claude é a família; Sonnet, Opus e Fable não são registros do MLflow.'],
      ['três empresas concorrentes que desenvolvem, juntas, o mesmo modelo de IA.', 'Sonnet, Opus e Fable são modelos da família Claude, todos da Anthropic.'],
      ['a linguagem de programação, a biblioteca e as funções usadas no treinamento.', 'São empresa, família e modelos, não ferramentas de programação.'],
      ['a empresa, o data warehouse e os data marts que alimentam o modelo.', 'Claude é uma família de modelos, não um data warehouse.']
    ],
    hint: 'Quem fabrica → qual produto → quais versões.',
    explanation: 'Anthropic (empresa) → Claude (família de modelos) → Sonnet, Opus, Fable (modelos da família).' }),

  direta({ ...o, id: 'O24', topic: 'ia', concepts: ['claude', 'llm'], difficulty: 'medio',
    command: 'Assinale a alternativa que relaciona corretamente empresa e família de modelos de linguagem:',
    correct: 'Anthropic → Claude; OpenAI → GPT; Google → Gemini.',
    wrong: [
      ['Anthropic → GPT; OpenAI → Claude; Google → Gemini.', 'Claude é da Anthropic e GPT é da OpenAI — estão trocados.'],
      ['Anthropic → Gemini; OpenAI → GPT; Google → Claude.', 'Gemini é do Google e Claude é da Anthropic.'],
      ['Anthropic → Claude; OpenAI → Gemini; Google → GPT.', 'GPT é da OpenAI e Gemini é do Google.'],
      ['Anthropic → Llama; OpenAI → Claude; Google → GPT.', 'Llama é da Meta; nenhuma das associações está correta.']
    ],
    hint: 'O slide lista: ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), Llama (Meta).',
    explanation: 'Anthropic → Claude; OpenAI → GPT/ChatGPT; Google → Gemini; Meta → Llama.' }),

  direta({ ...o, id: 'O25', topic: 'ia', concepts: ['escolha-modelo', 'claude'], difficulty: 'medio',
    context: ['Uma equipe vai usar modelos da família Claude em dois projetos: classificar milhares de mensagens curtas por dia e analisar contratos longos e complexos.'],
    command: 'Qual critério de escolha de modelo é o mais adequado?',
    correct: 'Escolher por projeto, pesando qualidade, custo e latência, e validar com testes.',
    wrong: [
      ['Usar sempre o modelo de maior capacidade, pois ele é a melhor escolha em qualquer cenário.', 'O maior modelo pode ser caro e lento demais para alto volume de tarefas simples.'],
      ['Usar sempre o modelo mais barato, pois todos os modelos da família produzem o mesmo resultado.', 'Os modelos diferem em capacidade; tarefas complexas podem exigir um mais capaz.'],
      ['Escolher o modelo de nome mais recente, sem necessidade de avaliar os resultados obtidos.', 'A escolha deve ser confirmada com testes na tarefa real, não pelo nome.'],
      ['Treinar um modelo do zero para cada projeto, já que modelos prontos não se adaptam a tarefas.', 'Modelos prontos atendem a muitas tarefas; treinar do zero é caro e raramente necessário.']
    ],
    hint: 'As duas tarefas têm volume e complexidade muito diferentes.',
    explanation: 'A escolha do modelo equilibra qualidade, custo por token e tempo de resposta — e é confirmada com testes.' }),

  direta({ ...o, id: 'O26', topic: 'ia', concepts: ['llm'], difficulty: 'medio',
    command: 'Sobre o funcionamento de um LLM, é correto afirmar que ele:',
    correct: 'gera texto prevendo o próximo token mais provável, com base no que aprendeu no treinamento.',
    wrong: [
      ['consulta um banco de dados a cada resposta para garantir que a informação esteja correta.', 'O LLM gera texto a partir do que aprendeu; não consulta uma base de fatos por padrão.'],
      ['executa operações aritméticas de forma exata, como uma calculadora embutida.', 'Ele prevê texto provável; por isso números precisam ser conferidos.'],
      ['segue regras gramaticais escritas manualmente por linguistas para cada idioma.', 'Isso descreve o PLN clássico baseado em regras, não um LLM.'],
      ['aprende de forma permanente com cada conversa, alterando seus pesos em tempo real.', 'Os pesos são fixados no treinamento; a conversa só ocupa a janela de contexto.']
    ],
    hint: 'Slide: “o modelo lê trilhões de palavras e aprende a prever qual palavra vem a seguir”.',
    explanation: 'O LLM prevê o próximo token mais provável. Isso explica a fluência — e também a alucinação e os erros de conta.' }),

  direta({ ...o, id: 'O27', topic: 'ia', concepts: ['token'], difficulty: 'facil',
    command: 'Na cobrança de LLMs em nuvem e no limite da janela de contexto, a unidade de medida utilizada é:',
    correct: 'o token, que pode ser uma palavra, parte de uma palavra ou um sinal.',
    wrong: [
      ['a frase completa enviada pelo usuário, independentemente do tamanho dela.', 'Frases longas custam mais: a contagem é feita em tokens.'],
      ['o número de parâmetros do modelo utilizado naquela requisição.', 'Parâmetros são os valores internos do modelo, não a medida de uso.'],
      ['o tempo de processamento da requisição, medido em segundos.', 'A cobrança típica é por tokens de entrada e de saída.'],
      ['a quantidade de arquivos anexados à conversa, de qualquer tamanho.', 'O que conta é quantos tokens os arquivos ocupam, não quantos arquivos são.']
    ],
    hint: 'Slide: “≈ 4 caracteres ou ≈ 0,75 palavra”.',
    explanation: 'Tokens são a unidade de processamento, de cobrança e de limite de contexto.' }),

  direta({ ...o, id: 'O28', topic: 'ia', concepts: ['contexto'], difficulty: 'medio',
    command: 'A janela de contexto de um LLM corresponde à:',
    correct: 'quantidade máxima de tokens considerada em uma interação.',
    wrong: [
      ['quantidade total de textos que foram usados no treinamento do modelo.', 'Isso é o corpus de treino, não a janela de contexto.'],
      ['quantidade de parâmetros aprendidos durante o treinamento do modelo.', 'Parâmetros são os pesos internos; contexto é o que cabe na conversa.'],
      ['data limite dos dados com que o modelo foi treinado pela empresa.', 'Isso é o corte de conhecimento.'],
      ['quantidade de usuários que conseguem usar o modelo ao mesmo tempo.', 'Isso é capacidade de atendimento, não contexto.']
    ],
    hint: 'É a “memória” da conversa atual.',
    explanation: 'Janela de contexto = limite de tokens que o modelo considera de uma vez (instruções, histórico, documentos e resposta).' }),

  direta({ ...o, id: 'O29', topic: 'ia', concepts: ['temperatura'], difficulty: 'facil',
    command: 'Ao reduzir a temperatura de um LLM, espera-se que as respostas:',
    correct: 'fiquem mais previsíveis e repetíveis entre execuções.',
    wrong: [
      ['passem a ser garantidamente corretas e livres de erros.', 'Temperatura baixa aumenta a consistência, não a correção.'],
      ['fiquem mais criativas e variadas a cada execução.', 'Esse é o efeito de aumentar a temperatura.'],
      ['passem a considerar documentos mais longos na conversa.', 'O tamanho do que é considerado depende da janela de contexto.'],
      ['deixem de consumir tokens de entrada e de saída.', 'A temperatura não altera a contagem de tokens.']
    ],
    hint: 'Temperatura controla aleatoriedade.',
    explanation: 'Temperatura baixa → saídas mais determinísticas; alta → mais variadas. Nenhuma das duas garante correção.' }),

  direta({ ...o, id: 'O30', topic: 'ia', concepts: ['alucinacao'], difficulty: 'facil',
    context: ['Um assistente cita, com detalhes e segurança, uma função de biblioteca que não existe em nenhuma versão da documentação.'],
    command: 'Esse fenômeno é chamado de:',
    correct: 'alucinação.',
    wrong: [
      ['corte de conhecimento.', 'Corte de conhecimento seria não saber de algo recente; aqui o modelo inventou algo que nunca existiu.'],
      ['drift de dados.', 'Drift é a mudança nos dados de um modelo em produção ao longo do tempo.'],
      ['estouro da janela de contexto.', 'Estouro faz o modelo “esquecer” partes da conversa, não inventar funções.'],
      ['injeção de prompt.', 'Injeção de prompt é um ataque com instruções maliciosas escondidas no conteúdo.']
    ],
    hint: 'Inventar × não saber.',
    explanation: 'Alucinação: conteúdo inventado apresentado com confiança.' }),

  direta({ ...o, id: 'O31', topic: 'ia', concepts: ['generativa'], difficulty: 'facil', style: 'respectivamente',
    command: 'Assinale a alternativa que apresenta, respectivamente, um uso de IA generativa e um uso de IA preditiva (analítica):',
    correct: 'redigir a descrição de um novo plano da academia; estimar a chance de um aluno cancelar.',
    wrong: [
      ['estimar a chance de um aluno cancelar; redigir a descrição de um novo plano da academia.', 'A ordem está invertida.'],
      ['estimar a demanda da próxima semana; classificar o risco de inadimplência de um aluno.', 'As duas tarefas são preditivas: estimam valores ou classes.'],
      ['redigir a descrição de um plano; resumir automaticamente as avaliações dos alunos.', 'As duas tarefas são generativas: produzem texto novo.'],
      ['montar um painel de frequência; carregar os dados das catracas no warehouse.', 'Nenhuma das tarefas é IA: são entregas de BI e de engenharia de dados.']
    ],
    hint: 'Generativa produz conteúdo; preditiva produz estimativa.',
    explanation: 'Redigir texto é generativo; estimar probabilidade é preditivo.' }),

  direta({ ...o, id: 'O32', topic: 'ia', concepts: ['local-nuvem'], difficulty: 'medio',
    command: 'Comparando LLM local e LLM em nuvem, conforme a aula, é correto afirmar:',
    correct: 'O local mantém os dados na própria máquina; a nuvem dispensa hardware potente, mas cobra por uso.',
    wrong: [
      ['A nuvem garante que nenhum dado sai da empresa, pois o processamento é feito pelo fornecedor.', 'Na nuvem os dados são enviados aos servidores do fornecedor.'],
      ['O local cobra por token e depende de conexão com a internet para funcionar.', 'Essas são características da nuvem; o local funciona offline e sem custo por uso.'],
      ['Os dois têm sempre a mesma capacidade, pois usam a mesma arquitetura Transformer.', 'Modelos locais são limitados pelo hardware e costumam ser menores.'],
      ['O local dispensa hardware dedicado, já que o modelo roda dentro do navegador.', 'O local exige hardware compatível com o tamanho do modelo (GPU e memória).']
    ],
    hint: 'Onde o modelo roda? Para onde vão os dados? Quem paga o hardware?',
    explanation: 'Local: privacidade, sem custo por uso, limitado ao hardware. Nuvem: modelos maiores sem hardware próprio, mas dados enviados a terceiros e custo por token.' }),

  direta({ ...o, id: 'O33', topic: 'ia', concepts: ['prompt'], difficulty: 'medio',
    command: 'Qual pedido a um assistente de IA tende a produzir a resposta mais aproveitável?',
    correct: 'Um pedido que explicita papel, contexto, tarefa e formato esperado da resposta.',
    wrong: [
      ['Um pedido curto e genérico, para dar ao modelo liberdade total de escolha.', 'Pedidos vagos geram respostas genéricas (prova anterior, Q7).'],
      ['O mesmo pedido reenviado várias vezes até que a resposta mude sozinha.', 'Repetir o mesmo prompt não fornece informação nova ao modelo (prova anterior, Q8).'],
      ['Um pedido com todo o repositório anexado, sem indicar a tarefa desejada.', 'Conteúdo irrelevante dilui o contexto e aumenta o custo.'],
      ['Um pedido cheio de termos técnicos, para acionar um modelo mais capaz.', 'Jargão não troca o modelo; o que ajuda é clareza de tarefa e critério.']
    ],
    hint: 'O que reduz a ambiguidade do pedido?',
    explanation: 'Papel, contexto, tarefa e formato reduzem a ambiguidade e definem o critério de qualidade da resposta.' }),

  direta({ ...o, id: 'O34', topic: 'ia', concepts: ['llm'], difficulty: 'medio',
    command: 'Sobre a relação entre PLN e LLM apresentada no slide, é correto afirmar:',
    correct: 'todo LLM faz PLN, mas nem toda solução de PLN usa um LLM.',
    wrong: [
      ['todo PLN usa um LLM, pois não existe PLN sem modelos de grande escala.', 'Um filtro de spam simples, com regras ou estatística, também é PLN.'],
      ['LLM e PLN são sinônimos e podem ser usados um no lugar do outro.', 'PLN é o campo; LLM é uma tecnologia dentro dele.'],
      ['o LLM surgiu antes do PLN e deu origem a ele na década de 1950.', 'O PLN existe desde os anos 1950; os LLMs ganharam força a partir de 2017.'],
      ['PLN é o nome do modelo da Anthropic, e LLM o do modelo da OpenAI.', 'PLN é um campo de estudo; LLM é uma categoria de modelo.']
    ],
    hint: 'Slide: PLN é como a “medicina”; LLM, um “transplante de órgãos”.',
    explanation: 'PLN é o campo amplo; o LLM é uma das técnicas — a mais avançada hoje — dentro dele.' }),

  // ── Spec-driven, Backlog, Tasks ──
  direta({ ...o, id: 'O35', topic: 'spec', concepts: ['spec'], difficulty: 'facil',
    command: 'No desenvolvimento orientado a especificação (spec-driven), a ordem de trabalho recomendada é:',
    correct: 'especificar requisitos e critérios, planejar, dividir em tasks e implementar validando cada uma.',
    wrong: [
      ['implementar tudo de uma vez e escrever a especificação ao final, para documentar o resultado.', 'Na abordagem spec-driven a especificação vem antes e orienta a implementação.'],
      ['pedir o sistema completo à IA e corrigir os erros conforme forem aparecendo nos testes.', 'Esse é o Time A da prova anterior (Q13), que precisou refazer boa parte do trabalho.'],
      ['dividir o trabalho em tasks antes de saber quais são os requisitos do sistema.', 'Sem requisitos não há como definir tasks com resultado verificável.'],
      ['testar o sistema somente após a entrega final ao cliente, para ganhar tempo.', 'A validação acontece ao final de cada fase/task, não apenas no fim.']
    ],
    hint: 'O nome já diz: dirigido pela especificação.',
    explanation: 'Spec → plano → tasks pequenas e verificáveis → implementação com validação humana a cada fase.' }),

  direta({ ...o, id: 'O36', topic: 'spec', concepts: ['backlog', 'tasks'], difficulty: 'facil',
    command: 'Em relação a backlog e tasks, assinale a alternativa correta:',
    correct: 'Backlog é a lista priorizada do que fazer; tasks são unidades pequenas e verificáveis.',
    wrong: [
      ['Tasks são a lista priorizada do que precisa ser feito; o backlog é uma unidade pequena de execução.', 'As definições estão invertidas.'],
      ['Backlog e tasks são sinônimos usados para descrever o mesmo nível de planejamento do produto.', 'São níveis diferentes: produto (backlog) e execução (task).'],
      ['O backlog é o histórico do que já foi entregue, e as tasks são as reclamações abertas por clientes.', 'O backlog reúne o que ainda falta fazer, não o que foi entregue.'],
      ['Tasks são grandes funcionalidades que levam meses, e o backlog lista apenas correções de erros.', 'Tasks são pequenas; o backlog inclui funcionalidades, correções e melhorias.']
    ],
    hint: 'No quadro, TASKS aparece abaixo de BACKLOG.',
    explanation: 'Backlog = o que falta fazer, priorizado. Task = parte pequena, executável e com critério de pronto.' }),

  direta({ ...o, id: 'O37', topic: 'spec', concepts: ['tasks'], difficulty: 'medio',
    command: 'Qual das opções descreve uma task bem definida, derivada de um item do backlog “agendamento de aulas”?',
    correct: 'Criar a reserva com limite de vagas e testá-la com uma aula lotada.',
    wrong: [
      ['Melhorar o sistema de agendamento da academia como um todo.', 'Escopo vago e sem critério de verificação: não é uma task.'],
      ['Fazer tudo o que os alunos pedirem para o agendamento no semestre.', 'Não é pequena nem verificável; parece mais um item de backlog mal definido.'],
      ['Usar inteligência artificial em todas as telas de agendamento.', 'Descreve uma intenção, não uma unidade de trabalho com resultado verificável.'],
      ['Deixar o agendamento mais moderno, bonito e rápido para todos.', 'Critérios subjetivos (“moderno”, “bonito”) não permitem verificar se a task foi concluída.']
    ],
    hint: 'Dá para dizer, objetivamente, se ela foi concluída?',
    explanation: 'Uma boa task é pequena, executável e tem resultado verificável (critério de pronto).' }),

  direta({ ...o, id: 'O38', topic: 'spec', concepts: ['spec-drift', 'spec'], difficulty: 'medio',
    command: 'Em projetos com assistentes de IA, fala-se em drift quando o código gerado vai se afastando do que foi combinado. A abordagem spec-driven reduz esse problema porque:',
    correct: 'a especificação funciona como fonte da verdade, contra a qual cada task é conferida.',
    wrong: [
      ['elimina a necessidade de revisão humana, já que o assistente segue a spec sozinho.', 'A abordagem prevê validação humana ao final de cada fase.'],
      ['faz o modelo memorizar o projeto em seus pesos, tornando a spec dispensável depois.', 'Os pesos não mudam durante o uso; a spec precisa continuar disponível.'],
      ['aumenta a temperatura do modelo, gerando mais alternativas para escolher.', 'Temperatura não tem relação com aderência à especificação.'],
      ['dispensa a divisão do trabalho em tarefas, que passa a ser feita de uma só vez.', 'Ao contrário: a spec é quebrada em tasks pequenas e verificáveis.']
    ],
    hint: 'No quadro: SPEC DRIVEN → DRIFT.',
    explanation: 'Com a spec como referência aprovada, cada entrega pode ser comparada ao que foi combinado, e o desvio é percebido cedo.' })
];

// ════════════════════════════════════════════════════════════════════
// QUESTÕES CONTEXTUALIZADAS — padrão da prova anterior
// ════════════════════════════════════════════════════════════════════
const x = { format: 'contextualizada' as const };

const contextualizadas: Question[] = [
  direta({ ...x, id: 'X01', topic: 'areas', concepts: ['bi', 'ed', 'cd'], difficulty: 'medio', style: 'respectivamente',
    context: ['Uma rede de academias com doze unidades contratou uma consultoria de dados. A diretoria apresentou três demandas:'],
    items: [
      { label: '(a)', text: 'saber, toda segunda-feira, quantas matrículas e quantos cancelamentos cada unidade teve na semana anterior;' },
      { label: '(b)', text: 'unificar os dados do sistema de catracas, do aplicativo e do financeiro, que hoje estão em bases separadas e com formatos de data diferentes;' },
      { label: '(c)', text: 'identificar com antecedência os alunos com maior risco de cancelar o plano, para que a equipe ofereça um atendimento personalizado.' }
    ],
    command: 'Considerando as áreas de dados apresentadas em aula, a atribuição tecnicamente adequada para as demandas (a), (b) e (c) é, respectivamente:',
    correct: 'BI/análise de dados, engenharia de dados e ciência de dados/ML.',
    wrong: [
      ['engenharia de dados, BI/análise de dados e ciência de dados/ML.', 'Acompanhar números semanais (a) é BI; unificar fontes com formatos diferentes (b) é engenharia de dados.'],
      ['ciência de dados/ML nas três demandas, pois todas usam dados históricos.', 'Usar dados históricos não torna tudo modelagem: (a) é descritiva e (b) é infraestrutura.'],
      ['BI/análise de dados, ciência de dados/ML e engenharia de dados.', 'Integrar fontes (b) é engenharia; prever cancelamento (c) é ciência de dados/ML.'],
      ['banco de dados (DBA), BI/análise de dados e IA generativa.', 'Prever risco de cancelamento é IA preditiva, não generativa; e (a) é BI, não administração de banco.']
    ],
    hint: '(a) olha o passado, (b) mexe no fluxo dos dados, (c) olha o futuro.',
    explanation: 'Indicadores do que aconteceu → BI/A.D; integração e padronização de fontes → E.D; previsão de cancelamento → C.D/M.L.' }),

  afirmativas({ ...x, id: 'X02', topic: 'arquitetura', concepts: ['etl', 'pipeline', 'bi'], difficulty: 'medio',
    context: [
      'A engenharia de dados de uma rede varejista construiu uma rotina noturna que extrai as vendas do ERP e do e-commerce; converte as datas para um único formato, remove registros duplicados e calcula o valor líquido de cada venda; e, por fim, grava o resultado no data warehouse, de onde o time de BI alimenta seus painéis.',
      'Na última semana, o painel mostrou vendas em dobro em uma das lojas. A investigação revelou que a etapa de remoção de duplicados havia sido desativada por engano.'
    ],
    statements: [
      ['A rotina segue o padrão ETL, pois a transformação dos dados ocorre antes da carga no warehouse.', true, 'Extrai, transforma (datas, duplicados, valor líquido) e só então carrega.'],
      ['O erro no painel é responsabilidade exclusiva do analista de BI, já que foi ele quem apresentou o número.', false, 'A origem do erro está no pipeline; a correção cabe à engenharia de dados, ainda que o BI também deva conferir números atípicos.'],
      ['Validações automáticas no pipeline, como checar duplicidade antes da carga, ajudariam a detectar o problema antes que ele chegasse ao painel.', true, 'Verificações de qualidade no fluxo impedem que dados errados cheguem ao consumo.']
    ],
    hint: 'Onde o erro nasceu e onde ele apareceu?',
    explanation: 'A rotina é um ETL; o erro nasceu na transformação (pipeline), e validações no próprio fluxo o teriam barrado.' }),

  assercao({ ...x, id: 'X03', topic: 'arquitetura', concepts: ['datamart', 'warehouse'], difficulty: 'medio',
    context: ['Uma universidade mantém um data warehouse com dados acadêmicos, financeiros e de recursos humanos dos últimos dez anos. A pró-reitoria de graduação reclama que suas consultas são lentas e complexas, pois precisa navegar por centenas de tabelas que não utiliza. A equipe de dados propõe criar um data mart acadêmico, alimentado a partir do warehouse.'],
    i: ['A criação do data mart acadêmico tende a simplificar as consultas da pró-reitoria.', true, 'Ela passa a consultar apenas os dados de que precisa.'],
    ii: ['O data mart é um subconjunto do warehouse organizado para uma área específica, reunindo apenas os dados relevantes para ela.', true, 'Essa é a definição de data mart.'],
    justifies: true, relation: 'é exatamente por ser um recorte focado na área que o data mart simplifica as consultas.',
    hint: 'A II explica o motivo da I?',
    explanation: 'Ambas verdadeiras, e a II justifica a I: o recorte por área é o que torna as consultas mais simples.' }),

  assercao({ ...x, id: 'X04', topic: 'arquitetura', concepts: ['db', 'warehouse'], difficulty: 'dificil',
    context: ['Para gerar relatórios gerenciais, um analista passou a executar consultas pesadas diretamente no banco de dados transacional do sistema de vendas, em horário comercial. Nos dias de relatório, os clientes relatam lentidão para finalizar as compras.'],
    i: ['Mover as consultas analíticas para um data warehouse é uma medida adequada para o problema.', true, 'Separa a carga analítica da operação do sistema.'],
    ii: ['O data warehouse é um banco transacional otimizado para registrar as compras dos clientes em tempo real.', false, 'O warehouse é voltado à análise de dados históricos integrados; quem registra compras em tempo real é o banco operacional.'],
    hint: 'Avalie cada asserção isoladamente antes de pensar na relação.',
    explanation: 'A I é verdadeira (separar análise de operação), mas a II descreve o banco operacional, não o warehouse.' }),

  direta({ ...x, id: 'X05', topic: 'mlops', concepts: ['mlflow'], difficulty: 'dificil',
    context: [
      'Uma fintech mantém um modelo de concessão de crédito em produção. Durante uma auditoria, foi solicitado que a equipe informasse qual versão do modelo está em uso, com quais parâmetros ela foi treinada, qual conjunto de dados foi utilizado e quais métricas ela obteve na validação.',
      'Ao longo do ano, a equipe treinou dezenas de versões em notebooks individuais, sem registrar essas informações de forma centralizada, e não conseguiu responder à auditoria.'
    ],
    command: 'A providência tecnicamente mais adequada para que a equipe consiga responder a auditorias futuras é:',
    correct: 'adotar o MLflow para registrar parâmetros, métricas, dados e artefatos de cada execução e versionar os modelos.',
    wrong: [
      ['criar um data mart de crédito, que armazena automaticamente as versões de todos os modelos treinados pela equipe.', 'Data mart organiza dados de negócio para consulta; não versiona modelos nem registra experimentos.'],
      ['retreinar o modelo do zero sempre que houver auditoria, já que o resultado obtido será idêntico ao anterior.', 'Sem os parâmetros e dados originais não há garantia de reproduzir o mesmo modelo.'],
      ['manter um painel de BI preenchido manualmente pelos cientistas ao final de cada ano com as versões lembradas.', 'Registro manual e tardio é sujeito a esquecimento e erro; rastreabilidade precisa ser automática e por execução.'],
      ['pedir a um LLM que reconstrua, a partir do código, quais parâmetros provavelmente foram usados em cada versão.', 'O LLM daria um palpite plausível, sujeito a alucinação — não uma evidência auditável.']
    ],
    hint: 'A auditoria pede rastreabilidade: o que foi treinado, como e com quê.',
    explanation: 'O MLflow registra cada execução (parâmetros, métricas, dados, artefatos) e mantém um registro versionado dos modelos, garantindo rastreabilidade.' }),

  direta({ ...x, id: 'X06', topic: 'mlops', concepts: ['drift'], difficulty: 'dificil', style: 'respectivamente',
    context: ['Uma empresa de tecnologia mantém dois modelos em produção:'],
    items: [
      { label: 'Situação 1 —', text: 'O modelo que recomenda planos de uma academia foi treinado com dados de alunos que, em sua maioria, frequentavam aulas presenciais. Hoje, a maior parte dos novos alunos chega pelo aplicativo e prefere treinos online. A relação “quem treina com frequência tende a renovar” continua válida, mas o perfil de quem entra mudou bastante.' },
      { label: 'Situação 2 —', text: 'O modelo antifraude de um banco foi treinado quando compras noturnas de alto valor eram fortes indícios de fraude. Os fraudadores mudaram de estratégia, e transações com características que antes eram legítimas passaram a ser fraudulentas.' }
    ],
    command: 'As situações 1 e 2 correspondem, respectivamente, a:',
    correct: 'data drift e concept drift.',
    wrong: [
      ['concept drift e data drift.', 'A ordem está invertida: em 1 muda o perfil das entradas; em 2 muda o significado delas para o resultado.'],
      ['alucinação e data drift.', 'Alucinação é invenção de conteúdo por modelos generativos, e não explica a mudança de perfil da situação 1.'],
      ['data drift nas duas situações, pois em ambas os dados mudaram.', 'Na situação 2, o que mudou foi a relação entre as características e o resultado (fraude ou não): concept drift.'],
      ['corte de conhecimento e alucinação.', 'Esses são fenômenos de LLMs; os casos descrevem modelos preditivos degradando em produção.']
    ],
    hint: 'Na 1 a regra continua válida. Na 2, não.',
    explanation: 'Situação 1: muda a distribuição das entradas (data drift). Situação 2: muda a relação entrada → resultado (concept drift).' }),

  afirmativas({ ...x, id: 'X07', topic: 'mlops', concepts: ['drift', 'mlflow'], difficulty: 'dificil',
    context: ['Uma equipe percebeu queda gradual na precisão de um modelo de previsão de cancelamento implantado há um ano. Nenhuma linha de código foi alterada desde a implantação. A equipe registrou no MLflow todas as execuções de treino, incluindo os dados usados e as métricas de validação.'],
    statements: [
      ['Como o código não mudou, o modelo continua correto, e a queda deve ser atribuída a erro de medição.', false, 'O código pode estar intacto e, ainda assim, o modelo se degradar porque os dados mudaram (drift).'],
      ['A queda é compatível com drift, pois o comportamento dos alunos pode ter mudado ao longo do ano.', true, 'Mudança no mundo sem mudança no código é o cenário típico de drift.'],
      ['Os registros do MLflow permitem comparar o desempenho atual com o da versão validada e rastrear com quais dados ela foi treinada.', true, 'Rastrear experimentos, dados e métricas é a função do MLflow.']
    ],
    command: 'É correto apenas o que se afirma em:',
    hint: 'Código igual não significa mundo igual.',
    explanation: 'A queda gradual sem mudança de código indica drift; o histórico do MLflow ajuda a comparar e a retreinar com base sólida.' }),

  direta({ ...x, id: 'X08', topic: 'ia', concepts: ['generativa'], difficulty: 'medio', style: 'respectivamente',
    context: ['A equipe de produto de uma rede de academias precisa atender duas demandas no mesmo trimestre:'],
    items: [
      { label: 'I.', text: 'Escrever automaticamente uma mensagem personalizada de incentivo para cada aluno que está há mais de duas semanas sem treinar, a ser revisada pela recepção antes do envio.' },
      { label: 'II.', text: 'Atribuir a cada aluno uma pontuação de risco de cancelamento, para priorizar as ligações da equipe de retenção.' }
    ],
    command: 'Considerando a diferença entre IA generativa e IA preditiva (analítica), a escolha tecnicamente adequada para as demandas I e II é, respectivamente:',
    correct: 'IA generativa e IA preditiva, pois a primeira produz texto novo e a segunda estima e pontua o risco de cada caso.',
    wrong: [
      ['IA preditiva e IA generativa, pois a mensagem depende de prever o aluno e a pontuação exige redigir um parecer.', 'A ordem está invertida: escrever mensagem é gerar conteúdo; pontuar risco é estimar.'],
      ['IA generativa nas duas demandas, pois ambas partem de dados textuais existentes na academia.', 'A demanda II produz uma pontuação, não um conteúdo novo.'],
      ['IA preditiva nas duas demandas, pois ambas dependem do histórico de frequência dos alunos.', 'A demanda I produz texto novo — isso é geração.'],
      ['nenhuma das abordagens, pois as duas demandas exigiriam treinar um modelo próprio do zero.', 'Modelos prontos atendem bem às duas tarefas; treinar do zero não é necessário.']
    ],
    hint: 'Olhe para o tipo de saída de cada demanda.',
    explanation: 'Mensagem nova → IA generativa. Pontuação de risco → IA preditiva/analítica.' }),

  afirmativas({ ...x, id: 'X09', topic: 'ia', concepts: ['contexto', 'token', 'rag'], difficulty: 'dificil',
    context: [
      'Uma empresa integrou um modelo de linguagem ao seu sistema de suporte via API. Para “garantir que o modelo saiba tudo”, cada chamada envia o manual completo de 400 páginas, o histórico inteiro do cliente e todas as políticas internas.',
      'Após dois meses, o custo mensal triplicou, e as respostas passaram a misturar políticas de produtos diferentes.'
    ],
    statements: [
      ['Como a janela de contexto do modelo é grande, enviar todo o material garante que ele use a informação correta.', false, 'Caber na janela não garante uso correto: conteúdo irrelevante dilui o que importa e confunde o modelo.'],
      ['Como a cobrança é feita por token, o material irrelevante aumenta o custo e, ao ocupar o contexto, dilui a informação que importa.', true, 'É exatamente o que explica o custo maior e a piora das respostas.'],
      ['Aumentar a temperatura faria o modelo explorar melhor o material e separar as políticas de cada produto.', false, 'Temperatura só controla a variabilidade da saída; não melhora a seleção de informação.']
    ],
    command: 'É correto apenas o que se afirma em:',
    hint: 'Custo subiu e qualidade caiu ao mesmo tempo. Qual afirmação explica as duas coisas?',
    explanation: 'Mais tokens = mais custo; mais conteúdo irrelevante = contexto diluído. A solução é enviar só o necessário (por exemplo, com RAG).' }),

  afirmativas({ ...x, id: 'X10', topic: 'ia', concepts: ['temperatura', 'llm', 'alucinacao'], difficulty: 'medio',
    context: ['Uma academia automatizou, por meio de um script que consulta um LLM, a geração das consultas SQL usadas em seus relatórios. Observou-se que a mesma solicitação, executada em dias diferentes, produz consultas distintas. Além disso, um resumo gerado pelo modelo apresentou percentuais de frequência cuja soma não corresponde aos dados de origem.'],
    statements: [
      ['Reduzir a temperatura tende a tornar as consultas geradas mais previsíveis e repetíveis entre execuções.', true, 'Temperatura baixa reduz a aleatoriedade da geração.'],
      ['Como o modelo prevê o texto mais provável e não executa a conta, os percentuais devem ser conferidos contra os dados de origem.', true, 'O LLM gera números plausíveis, sem garantia aritmética.'],
      ['Testar as consultas geradas com casos de resultado conhecido antes de usá-las nos relatórios é uma prática adequada.', true, 'Comparar saídas com resultados esperados é a forma de verificar a correção.']
    ],
    hint: 'Avalie cada afirmação de forma independente.',
    explanation: 'Temperatura baixa → mais consistência; números de LLM precisam ser conferidos; testes com casos conhecidos validam as consultas.' }),

  direta({ ...x, id: 'X11', topic: 'ia', concepts: ['alucinacao', 'contexto'], difficulty: 'medio', style: 'respectivamente',
    context: ['Durante a preparação de um relatório, um analista observa dois comportamentos de um assistente de IA:'],
    items: [
      { label: 'Situação 1 —', text: 'Ao perguntar sobre uma regra de proteção de dados alterada no mês passado, o assistente descreve a versão anterior da regra e informa que seus dados vão até uma data anterior à mudança.' },
      { label: 'Situação 2 —', text: 'Ao pedir uma referência que sustente um dado, o assistente fornece um artigo com autores, revista e número de página que, após verificação, não existe.' }
    ],
    command: 'As situações 1 e 2 correspondem, respectivamente, aos fenômenos de:',
    correct: 'corte de conhecimento e alucinação.',
    wrong: [
      ['alucinação e corte de conhecimento.', 'A ordem está invertida: em 1 o modelo desconhece algo recente; em 2 ele inventa uma fonte.'],
      ['estouro da janela de contexto e alucinação.', 'Na situação 1 nada foi esquecido da conversa: a informação é posterior ao treinamento.'],
      ['drift de dados e injeção de prompt.', 'Drift é degradação de modelos em produção; não há instrução maliciosa em nenhuma das situações.'],
      ['corte de conhecimento nas duas situações.', 'Na situação 2 o modelo não desconhece algo: ele inventa uma referência inexistente.']
    ],
    hint: 'Não saber × inventar.',
    explanation: 'Situação 1: informação posterior ao treino → corte de conhecimento. Situação 2: referência inventada → alucinação.' }),

  direta({ ...x, id: 'X12', topic: 'ia', concepts: ['escolha-modelo', 'claude'], difficulty: 'dificil',
    context: [
      'Uma startup usa modelos da família Claude, da Anthropic, por meio de API. Ela tem duas cargas de trabalho: (1) a triagem de 50 mil mensagens curtas por dia, que precisa de resposta em menos de um segundo e custo baixo; e (2) a revisão semanal de contratos de 80 páginas, em que um erro pode gerar prejuízo jurídico.',
      'O diretor de tecnologia propõe usar o modelo de maior capacidade disponível nas duas cargas, “para garantir qualidade máxima”.'
    ],
    command: 'Considerando os critérios de escolha de modelos de IA, a avaliação mais adequada da proposta é:',
    correct: 'ela ignora custo e latência da carga 1; cada carga deve usar o modelo adequado à sua exigência, confirmado por testes.',
    wrong: [
      ['ela é a única adequada, pois modelos de maior capacidade também são sempre os mais baratos e rápidos por tarefa.', 'Em geral, modelos mais capazes custam mais por token e respondem mais devagar.'],
      ['ela é inadequada, pois modelos diferentes da mesma família não podem ser usados juntos na mesma empresa.', 'Nada impede usar modelos diferentes para tarefas diferentes — é prática comum.'],
      ['a carga 2 deveria usar o modelo mais barato, pois contratos longos consomem poucos tokens por requisição.', 'Contratos de 80 páginas consomem muitos tokens, e o risco do erro pede qualidade.'],
      ['as duas cargas exigem um modelo treinado do zero pela startup, pois a API não permite escolher entre modelos.', 'A API permite escolher o modelo; treinar do zero é caro e desnecessário aqui.']
    ],
    hint: 'As cargas têm exigências opostas de volume, tempo e risco.',
    explanation: 'Escolher modelo é equilibrar qualidade, custo e latência por tarefa; “o maior em tudo” desperdiça recursos onde a tarefa é simples e de alto volume.' }),

  assercao({ ...x, id: 'X13', topic: 'ia', concepts: ['claude'], difficulty: 'facil',
    context: ['Durante a aula, o professor escreveu no quadro: MODELOS DE IA → ANTHROPIC → CLAUDE → SONNET, OPUS, FABLE. Ao revisar o caderno, um aluno encontrou a seguinte anotação: “Claude é a empresa que criou o Sonnet e o Opus”.'],
    i: ['A anotação do aluno está incorreta.', true, 'Claude não é a empresa.'],
    ii: ['Anthropic é a empresa; Claude é a família de modelos, à qual pertencem Sonnet, Opus e Fable.', true, 'É a leitura correta da cadeia do quadro.'],
    justifies: true, relation: 'a anotação está errada justamente porque confunde a família (Claude) com a empresa (Anthropic).',
    hint: 'Leia a cadeia do quadro da esquerda para a direita.',
    explanation: 'A anotação confunde família de modelos com empresa; a II explica por quê.' }),

  afirmativas({ ...x, id: 'X14', topic: 'ia', concepts: ['local-nuvem'], difficulty: 'dificil',
    context: ['Um hospital quer usar um LLM para resumir prontuários de pacientes. A equipe de TI compara duas opções: contratar um modelo em nuvem de um grande fornecedor ou executar um modelo local em servidores próprios.'],
    statements: [
      ['Com um modelo local, os prontuários podem ser processados sem sair da infraestrutura do hospital.', true, 'No modelo local os dados não são enviados a terceiros.'],
      ['Com um modelo em nuvem, o hospital deixa de precisar anonimizar dados, pois o fornecedor passa a responder por eles.', false, 'Na nuvem os dados são enviados a terceiros; anonimizar continua necessário e a responsabilidade do hospital não desaparece.'],
      ['O modelo local é sempre mais capaz que os de nuvem, porque funciona sem depender da internet.', false, 'Funcionar offline não dá mais capacidade; modelos de nuvem costumam ser maiores e mais capazes.']
    ],
    command: 'É correto apenas o que se afirma em:',
    hint: 'Desconfie de “deixa de precisar” e de “sempre”.',
    explanation: 'Local mantém os dados em casa, mas é limitado ao hardware; nuvem não elimina a responsabilidade sobre dados sensíveis.' }),

  direta({ ...x, id: 'X15', topic: 'spec', concepts: ['spec', 'spec-drift', 'tasks'], difficulty: 'dificil', style: 'respectivamente',
    context: [
      'Dois times recebem a demanda de construir o módulo de agendamento de aulas de uma academia, com regras como limite de vagas por turma, cancelamento até duas horas antes e lista de espera.',
      'O Time A pede ao assistente de IA “um sistema de agendamento de aulas” e vai ajustando o código, conversa após conversa, conforme surgem problemas. Depois de três semanas, o gerente percebe que o limite de vagas e a lista de espera funcionam de forma diferente do que havia sido combinado.',
      'O Time B escreve primeiro uma especificação com as regras e os critérios de aceite, que é aprovada pelo gerente; depois divide o trabalho em tarefas pequenas e confere cada entrega contra a especificação.'
    ],
    command: 'O problema enfrentado pelo Time A e a forma como a abordagem do Time B o evita são, respectivamente:',
    correct: 'o desvio gradual entre o combinado e o implementado; a spec aprovada é a referência para validar cada tarefa.',
    wrong: [
      ['alucinação do banco de dados do sistema; o Time B usa uma temperatura maior para gerar mais alternativas.', 'Bancos de dados não alucinam, e temperatura não garante aderência a regras.'],
      ['data drift no sistema de catracas; o Time B retreina semanalmente o modelo preditivo da academia.', 'Não há modelo preditivo envolvido: o problema é de aderência à especificação.'],
      ['excesso de itens no backlog; o Time B elimina o backlog e implementa todas as regras de uma só vez.', 'O Time B faz o oposto: divide o trabalho em tarefas pequenas e verificáveis.'],
      ['ausência de MLflow no projeto; o Time B registra como experimentos de ML cada tela do agendamento.', 'MLflow rastreia modelos de ML; o problema aqui é de especificação de software.']
    ],
    hint: 'No quadro: SPEC DRIVEN → DRIFT.',
    explanation: 'Sem uma referência aprovada, o resultado se desvia aos poucos do combinado (drift). A spec como fonte da verdade permite conferir cada tarefa e detectar o desvio cedo.' }),

  afirmativas({ ...x, id: 'X16', topic: 'spec', concepts: ['backlog', 'tasks', 'spec'], difficulty: 'medio',
    context: [
      'O gerente de produto do aplicativo de uma academia mantém uma lista priorizada com os itens: “agendamento de aulas”, “pagamento por PIX”, “corrigir erro no login” e “relatório de frequência”.',
      'O time decide começar pelo agendamento e o divide em: criar a tabela de aulas; criar o endpoint de reserva com limite de vagas; enviar notificação de confirmação; testar a reserva em uma aula lotada.'
    ],
    statements: [
      ['A lista mantida pelo gerente corresponde ao backlog do produto.', true, 'É a lista priorizada do que precisa ser feito.'],
      ['Os quatro itens em que o agendamento foi dividido são tasks, pois são unidades menores e verificáveis.', true, 'Cada um tem escopo pequeno e resultado verificável.'],
      ['Como o backlog já existe, a especificação das regras do agendamento, como o limite de vagas, torna-se desnecessária.', false, 'O backlog diz o que fazer; a especificação define como deve funcionar e como verificar.']
    ],
    hint: 'Backlog, task e spec são coisas diferentes.',
    explanation: 'Lista priorizada = backlog; partes executáveis = tasks; regras e critérios de aceite = spec. Um não substitui o outro.' }),

  assercao({ ...x, id: 'X17', topic: 'spec', concepts: ['spec', 'spec-drift'], difficulty: 'dificil',
    context: ['Uma equipe passou a usar um agente de IA que implementa automaticamente as tarefas derivadas de uma especificação aprovada. Para ganhar velocidade, o líder propõe que a revisão humana seja feita apenas na entrega final, depois que todas as tarefas estiverem prontas.'],
    i: ['Manter a validação humana ao final de cada tarefa reduz o risco de o projeto se afastar da especificação.', true, 'Desvios são percebidos quando ainda são pequenos.'],
    ii: ['Assistentes de IA podem gerar código plausível que não atende aos requisitos, e erros não detectados se acumulam nas tarefas seguintes.', true, 'O código pode parecer correto e ainda violar a spec.'],
    justifies: true, relation: 'é por os erros serem plausíveis e cumulativos que a validação a cada tarefa reduz o desvio.',
    hint: 'A II dá o motivo da I?',
    explanation: 'Validação a cada fase (human-in-the-loop) evita que desvios plausíveis se acumulem — a II justifica a I.' }),

  assercao({ ...x, id: 'X18', topic: 'areas', concepts: ['ml'], difficulty: 'medio',
    context: ['Uma academia configurou seu sistema para enviar automaticamente uma mensagem de retorno a todo aluno que fica quinze dias seguidos sem registrar entrada na catraca. Em uma reunião, a gerente afirmou que a academia “já usa machine learning”.'],
    i: ['A regra de envio descrita é um exemplo de machine learning.', false, 'É uma regra fixa escrita por uma pessoa (“se 15 dias sem entrada, então envie”).'],
    ii: ['Em machine learning, o critério de decisão é inferido a partir de exemplos, em vez de ser escrito explicitamente por uma pessoa.', true, 'Essa é a característica central do ML.'],
    hint: 'Quem definiu o critério “15 dias”?',
    explanation: 'A automação é por regra (I falsa). A II está correta e é justamente o que mostra que a regra não é ML.' }),

  assercao({ ...x, id: 'X19', topic: 'mlops', concepts: ['mlflow', 'drift'], difficulty: 'dificil',
    context: ['Uma equipe registra no MLflow cada execução de treino do seu modelo de previsão de cancelamento. Meses após a implantação, o desempenho em produção começou a cair, e a equipe discute como explicar e tratar o problema.'],
    i: ['O MLflow permite comparar a versão em produção com versões anteriores, pois guarda parâmetros, métricas e dados de cada execução.', true, 'Rastrear e comparar execuções é a função do MLflow.'],
    ii: ['O drift ocorre quando os dados ou a relação entre dados e resultado mudam ao longo do tempo, degradando o modelo.', true, 'Essa é a definição de drift.'],
    justifies: false, relation: 'a II define drift, mas não explica por que o MLflow permite comparar versões — isso vem do registro das execuções.',
    hint: 'As duas podem ser verdadeiras sem que uma seja a causa da outra.',
    explanation: 'As duas asserções são verdadeiras, mas a II não justifica a I: a capacidade de comparar versões vem do registro de execuções do MLflow, não da definição de drift.' }),

  assercao({ ...x, id: 'X20', topic: 'areas', concepts: ['dados-vs-ia', 'ed', 'llm'], difficulty: 'dificil',
    context: ['Em uma reunião de orçamento, um gestor propôs encerrar o time de engenharia de dados: “Agora temos um LLM moderno; ele responde qualquer pergunta sobre a empresa”.'],
    i: ['LLMs eliminam a necessidade de pipelines e de data warehouses na empresa.', false, 'O LLM não substitui a infraestrutura que coleta, trata e organiza os dados da empresa.'],
    ii: ['LLMs consultam diretamente os bancos da empresa a cada resposta e garantem a exatidão dos números.', false, 'O LLM gera o texto mais provável; não consulta bancos por padrão nem garante exatidão numérica.'],
    hint: 'Avalie cada asserção isoladamente.',
    explanation: 'As duas são falsas: o LLM depende de dados bem organizados e não garante exatidão — Dados e IA são complementares.' }),

  assercao({ ...x, id: 'X21', topic: 'ia', concepts: ['temperatura', 'alucinacao'], difficulty: 'medio',
    context: ['Um time configura um assistente para gerar trechos de código e quer reduzir a variação entre execuções e o risco de respostas inventadas. Um integrante sugere ajustar a temperatura do modelo para zero.'],
    i: ['Reduzir a temperatura tende a tornar as respostas mais repetíveis entre execuções.', true, 'Temperatura baixa diminui a aleatoriedade.'],
    ii: ['Com temperatura zero, o modelo deixa de alucinar, pois passa a escolher sempre a resposta correta.', false, 'Ele passa a escolher a resposta mais provável, que pode estar errada; temperatura não elimina alucinação.'],
    hint: 'Mais provável não é o mesmo que correto.',
    explanation: 'Temperatura baixa traz consistência (I), mas não correção (II é falsa).' }),

  direta({ ...x, id: 'X22', topic: 'areas', concepts: ['dados-vs-ia', 'ed', 'cd', 'warehouse'], difficulty: 'dificil',
    context: [
      'A diretora de uma rede de academias declarou: “Queremos usar IA para prever a demanda de cada unidade no próximo mês”.',
      'Hoje, os dados de frequência estão espalhados em planilhas mantidas por cada unidade, com campos vazios, datas em formatos diferentes e nomes distintos para a mesma unidade.'
    ],
    command: 'A sequência de trabalho tecnicamente mais adequada é:',
    correct: 'organizar e tratar os dados (pipeline/ETL e warehouse) e só então treinar e avaliar o modelo preditivo.',
    wrong: [
      ['treinar o modelo diretamente nas planilhas, pois o machine learning corrige sozinho dados inconsistentes.', 'Modelos aprendem os erros dos dados; dados inconsistentes geram previsões ruins.'],
      ['contratar um LLM em nuvem, que dispensa dados históricos para prever a demanda de cada unidade.', 'Prever demanda exige histórico confiável; um LLM não cria esse dado.'],
      ['criar um painel de BI com as planilhas atuais e considerá-lo o modelo de previsão da empresa.', 'Painel descreve o passado; não é modelo preditivo — e os dados ainda estariam inconsistentes.'],
      ['registrar o projeto no MLflow, que integra e padroniza as planilhas das unidades automaticamente.', 'O MLflow rastreia experimentos de ML; não integra nem limpa fontes de dados.']
    ],
    hint: 'Dados vs IA: qual vem primeiro?',
    explanation: 'A IA depende de dados de qualidade: primeiro engenharia (integrar e tratar), depois ciência de dados (modelar e avaliar).' }),

  direta({ ...x, id: 'X23', topic: 'ia', concepts: ['rag', 'contexto'], difficulty: 'dificil',
    context: ['Uma franquia de academias mantém cerca de 200 documentos internos com normas de segurança, protocolos de atendimento e políticas comerciais. Os documentos são revisados com frequência, e a diretoria exige que o assistente interno indique de qual documento cada resposta foi extraída. O orçamento não comporta treinar um modelo próprio.'],
    command: 'A abordagem tecnicamente mais adequada é:',
    correct: 'indexar os documentos e usar RAG, buscando os trechos relevantes antes da geração e citando a fonte.',
    wrong: [
      ['treinar um modelo do zero com os documentos, para que todo o conhecimento fique incorporado aos parâmetros.', 'É caro, contraria o orçamento e não permite citar de qual documento veio cada resposta.'],
      ['fazer fine-tuning mensal do modelo, para que cada revisão dos documentos seja absorvida pelos pesos.', 'Fine-tuning repetido é caro, fica desatualizado entre ciclos e não indica a fonte.'],
      ['anexar os 200 documentos ao contexto de todas as requisições, para que nada fique de fora da resposta.', 'Aumenta muito o custo por token e dilui a informação relevante na janela de contexto.'],
      ['resumir todos os documentos em uma única página e usá-la como instrução fixa do assistente.', 'O resumo perde detalhes, fica desatualizado a cada revisão e não permite citar a fonte.']
    ],
    hint: 'Documentos mudam com frequência + é preciso citar a fonte.',
    explanation: 'RAG recupera os trechos relevantes a cada pergunta, acompanha as revisões sem retreino e permite citar o documento de origem.' }),

  afirmativas({ ...x, id: 'X24', topic: 'areas', concepts: ['ed', 'ad', 'cd'], difficulty: 'medio',
    context: ['Na reunião de kickoff de um projeto de dados de uma academia, o coordenador descreveu as responsabilidades do time:'],
    statements: [
      ['O engenheiro de dados garante que os dados das catracas e do financeiro cheguem tratados e no prazo ao data warehouse.', true, 'Integração e entrega confiável são atribuições da engenharia de dados.'],
      ['O analista de dados é o principal responsável por treinar e implantar o modelo de previsão de cancelamento.', false, 'Treinar e implantar modelos preditivos é foco da ciência de dados/ML; o analista explora e comunica.'],
      ['O cientista de dados avalia o modelo de cancelamento em dados que não foram usados no treinamento.', true, 'Avaliar a generalização do modelo é parte central do trabalho do cientista.']
    ],
    hint: 'Associe cada profissional à sua entrega principal.',
    explanation: 'E.D entrega os dados; A.D analisa e comunica; C.D/M.L modela e avalia.' }),

  direta({ ...x, id: 'X25', topic: 'ia', concepts: ['prompt'], difficulty: 'medio',
    context: [
      'Dois analistas pedem ajuda ao mesmo assistente de IA para investigar a queda de matrículas de uma academia.',
      'Pedido 1: “Analise as matrículas.”',
      'Pedido 2: “Aja como analista de dados. Contexto: tabela com matrículas mensais de 12 unidades nos últimos 24 meses. Tarefa: identificar as unidades com queda acima de 10% no último trimestre e levantar hipóteses. Formato: tabela com unidade, variação e hipótese.”',
      'O segundo pedido gerou uma análise diretamente aproveitável; o primeiro, um texto genérico.'
    ],
    command: 'A superioridade do Pedido 2 decorre, principalmente, de ele:',
    correct: 'explicitar papel, contexto, tarefa e formato, reduzindo a ambiguidade e definindo o critério da resposta.',
    wrong: [
      ['ser mais extenso, o que aumenta estatisticamente a probabilidade de o modelo acertar a análise pedida.', 'O tamanho, por si só, não melhora a resposta; o que ajuda é o conteúdo do pedido.'],
      ['usar termos técnicos de dados, o que faz a ferramenta acionar automaticamente um modelo de maior capacidade.', 'Vocabulário técnico não troca o modelo usado.'],
      ['mencionar a quantidade de unidades, informação que isoladamente determina a qualidade da análise.', 'Um único dado não explica a melhora; é a combinação de papel, contexto, tarefa e formato.'],
      ['consumir menos tokens de entrada, liberando mais capacidade do modelo para gerar a resposta final.', 'O Pedido 2 consome mais tokens, não menos.']
    ],
    hint: 'Compare o que cada pedido diz ao modelo sobre o que se espera dele.',
    explanation: 'Papel, contexto, tarefa e formato tornam o pedido específico e verificável — mesmo princípio da Q7 da prova anterior.' })
];

export const questions: Question[] = [...objetivas, ...contextualizadas];
export const questionById = Object.fromEntries(questions.map(q => [q.id, q])) as Record<string, Question>;
