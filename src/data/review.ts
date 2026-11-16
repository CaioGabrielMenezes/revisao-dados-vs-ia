/** Revisão rápida: cola com recordação ativa + rodada de “Quem faz? / Onde fica?”. */

import type { TopicId } from '../types';

export const CHOICES = {
  quem: ['Analista', 'Cientista', 'Engenheiro'],
  onde: ['Banco operacional', 'Data Warehouse', 'Data Mart'],
  drift: ['Data drift', 'Concept drift', 'Bug no código'],
  mlops: ['MLflow', 'Monitorar e retreinar', 'Data Warehouse'],
  fenomeno: ['Alucinação', 'Corte de conhecimento', 'Estouro de contexto'],
  tipo: ['IA generativa', 'IA preditiva', 'Regra fixa'],
  param: ['Temperatura', 'Janela de contexto', 'Token'],
  uso: ['LLM local', 'LLM na nuvem', 'RAG'],
  marca: ['Empresa', 'Família de modelos', 'Modelo da família'],
  trabalho: ['Backlog', 'Task', 'Especificação (spec)']
} as const;

/** Assunto de cada conjunto de botões (usado para montar as rodadas por assunto). */
export const SET_TOPIC: Record<keyof typeof CHOICES, TopicId> = {
  quem: 'areas', onde: 'arquitetura', drift: 'mlops', mlops: 'mlops',
  fenomeno: 'ia', tipo: 'ia', param: 'ia', uso: 'ia', marca: 'ia', trabalho: 'spec'
};

/** Tarefas por rodada: curto de propósito, para não cansar. */
export const ROUND = 15;

export type Drill = { set: keyof typeof CHOICES; q: string; a: string; why: string };

/** Cartões da cola: a pergunta-chave aparece; o resto, só ao tocar (recordação ativa).
 *  `concepts`: fichas de concepts.ts cuja definição completa aparece no cartão. */
export const cheats = [
  { board: 'DADOS vs IA', concepts: ['dados-vs-ia'], name: 'Dados vs IA', key: 'Dados prepara e analisa; IA aprende com o dado', trap: 'Uma não substitui a outra: sem dado de qualidade, não há modelo bom.' },
  { board: 'BI / A.D', concepts: ['bi', 'ad'], name: 'Analista de dados', key: 'O que aconteceu e por quê?', verb: 'Descreve e explica o passado', delivers: 'Painéis, relatórios, indicadores (KPIs), consultas SQL', trap: 'Não constrói pipeline nem treina modelo preditivo.' },
  { board: 'C.D / M.L', concepts: ['cd', 'ml'], name: 'Cientista de dados', key: 'O que vai acontecer?', verb: 'Prevê com modelos (estatística e ML)', delivers: 'Modelos treinados e avaliados em dados novos', trap: 'Não é quem mantém a carga noturna nem monta o painel do mês.' },
  { board: 'E.D', concepts: ['ed'], name: 'Engenheiro de dados', key: 'O dado chega certo e no prazo?', verb: 'Constrói a estrada por onde o dado passa', delivers: 'Pipelines, ETL, data warehouse', trap: 'Não interpreta os números para a diretoria.' },
  { board: 'DB', concepts: ['db'], name: 'Banco operacional', key: 'Registrar agora', verb: 'Grava cada transação no momento em que acontece', delivers: 'Cadastro, pedidos, matrículas — o sistema do dia a dia', trap: 'Consulta analítica pesada aqui deixa o sistema lento.' },
  { board: 'DATA WAREHOUSE', concepts: ['warehouse'], name: 'Data Warehouse', key: 'A empresa inteira, com histórico', verb: 'Integra várias fontes para análise', delivers: 'Base histórica que alimenta o BI', trap: 'Não registra a venda em tempo real.' },
  { board: 'DATA MARTS', concepts: ['datamart'], name: 'Data Mart', key: 'Só o que um time usa', verb: 'Recorte do warehouse para uma área', delivers: 'Base menor e simples para marketing, financeiro, RH…', trap: 'É um pedaço do warehouse, não o contrário.' },
  { board: 'PIPELINE · ETL', concepts: ['pipeline', 'etl'], name: 'Pipeline e ETL', key: 'O caminho do dado: extrair, transformar, carregar', trap: 'No ETL transforma antes de carregar; no ELT, depois.' },
  { board: 'MLFLOW', concepts: ['mlflow'], name: 'MLflow', key: 'Qual versão, com quais parâmetros e dados?', trap: 'Não é banco de dados de negócio nem algoritmo de ML.' },
  { board: 'DRIFT', concepts: ['drift'], name: 'Drift', key: 'O mundo mudou, o código não', trap: 'Data drift: mudam as entradas. Concept drift: muda o que elas significam.' },
  { board: 'IA ⊃ ML ⊃ DL ⊃ LLM', concepts: ['ia', 'llm'], name: 'IA, ML, Deep Learning e LLM', key: 'Do mais amplo ao mais específico', trap: 'Nem toda IA é LLM; o LLM prevê o próximo token, não consulta fatos.' },
  { board: 'ANTHROPIC → CLAUDE', concepts: ['claude', 'escolha-modelo'], name: 'Empresa, família e modelo', key: 'Anthropic fabrica; Claude é a família; Sonnet, Opus e Fable são modelos', trap: 'O maior modelo não é sempre a melhor escolha.' },
  { board: 'TOKEN · CONTEXTO', concepts: ['token', 'contexto'], name: 'Token e janela de contexto', key: 'Unidade de cobrança e limite da “memória” da conversa', trap: 'Janela de contexto não é corte de conhecimento.' },
  { board: 'TEMPERATURA', concepts: ['temperatura'], name: 'Temperatura', key: 'Baixa = repetível; alta = criativa', trap: 'Temperatura baixa não garante resposta correta.' },
  { board: 'ALUCINAÇÃO', concepts: ['alucinacao'], name: 'Alucinação', key: 'Inventa, com confiança', trap: 'Não saber de algo recente é corte de conhecimento, não alucinação.' },
  { board: 'GENERATIVA × PREDITIVA', concepts: ['generativa'], name: 'IA generativa vs preditiva', key: 'Cria conteúdo × estima um resultado', trap: 'Olhe o tipo de saída, não o tipo de entrada.' },
  { board: 'LOCAL × NUVEM', concepts: ['local-nuvem'], name: 'LLM local vs na nuvem', key: 'Privacidade e hardware próprio × capacidade e custo por token', trap: 'Nenhuma das opções elimina custo e risco.' },
  { board: 'PROMPT · RAG', concepts: ['prompt', 'rag'], name: 'Prompt e RAG', key: 'Pedir bem e buscar a fonte certa', trap: 'Fine-tuning não resolve documentos que mudam toda semana.' },
  { board: 'SPEC DRIVEN → DRIFT', concepts: ['spec', 'spec-drift'], name: 'Spec-driven', key: 'Especificar antes de construir', trap: 'Sem spec aprovada, o resultado vai se afastando do combinado.' },
  { board: 'BACKLOG · TASKS', concepts: ['backlog', 'tasks'], name: 'Backlog e tasks', key: 'O que falta fazer × a próxima parte verificável', trap: '“Melhorar o sistema” não é task.' }
];

export const MNEMONIC = 'O analista olha para trás, o cientista olha para frente e o engenheiro constrói a estrada. O banco é o caixa registrando cada compra; o warehouse, o supermercado inteiro; o data mart, a seção que o seu time usa.';

export const drills: Drill[] = [
  { set: 'quem', q: 'Montar um painel com as vendas do mês por loja.', a: 'Analista', why: 'Descrever o que aconteceu, em painel, é BI/análise.' },
  { set: 'quem', q: 'Prever quais clientes vão cancelar no próximo mês.', a: 'Cientista', why: 'Prever o futuro com modelo é ciência de dados/ML.' },
  { set: 'quem', q: 'Criar a rotina que leva os dados do ERP para o warehouse toda noite.', a: 'Engenheiro', why: 'Mover e carregar dados entre sistemas é pipeline: engenharia.' },
  { set: 'quem', q: 'Explicar à diretoria por que a receita caiu em março.', a: 'Analista', why: 'Interpretar o passado e comunicar é papel do analista.' },
  { set: 'quem', q: 'Treinar três modelos e comparar as métricas.', a: 'Cientista', why: 'Experimentar e avaliar modelos é ciência de dados.' },
  { set: 'quem', q: 'Corrigir a carga que falhou e deixou a tabela desatualizada.', a: 'Engenheiro', why: 'Carga quebrada é problema de pipeline.' },
  { set: 'quem', q: 'Padronizar datas que chegam em três formatos diferentes.', a: 'Engenheiro', why: 'Transformar e integrar fontes é o T do ETL.' },
  { set: 'quem', q: 'Testar se o modelo acerta em dados que ele nunca viu.', a: 'Cientista', why: 'Avaliar generalização do modelo é do cientista.' },
  { set: 'quem', q: 'Escrever uma consulta SQL comparando dois trimestres.', a: 'Analista', why: 'Comparar períodos para responder ao negócio é análise.' },
  { set: 'quem', q: 'Agrupar clientes por comportamento, sem grupos prontos.', a: 'Cientista', why: 'Agrupamento é técnica de ML (não supervisionado).' },
  { set: 'quem', q: 'Garantir que o pipeline termine antes das 6h.', a: 'Engenheiro', why: 'Confiabilidade e prazo da entrega de dados é engenharia.' },
  { set: 'quem', q: 'Definir os indicadores (KPIs) que a diretoria vai acompanhar.', a: 'Analista', why: 'Indicadores e painéis são entregas de BI/análise.' },
  { set: 'onde', q: 'Registrar cada venda no momento em que ela acontece.', a: 'Banco operacional', why: 'Transação em tempo real fica no banco do sistema.' },
  { set: 'onde', q: 'Reunir 5 anos de vendas, estoque e financeiro para análise.', a: 'Data Warehouse', why: 'Histórico integrado de várias fontes = warehouse.' },
  { set: 'onde', q: 'Dar ao marketing só os dados de campanhas, prontos para consultar.', a: 'Data Mart', why: 'Recorte para uma área = data mart.' },
  { set: 'onde', q: 'Destino onde o ETL carrega os dados tratados de várias fontes.', a: 'Data Warehouse', why: 'O ETL alimenta o warehouse.' },
  { set: 'onde', q: 'Base do time financeiro, derivada da base corporativa.', a: 'Data Mart', why: 'Derivado do warehouse para um departamento = data mart.' },
  { set: 'onde', q: 'Salvar o cadastro do aluno na hora da matrícula.', a: 'Banco operacional', why: 'Operação do dia a dia = banco transacional.' },
  { set: 'onde', q: 'O RH reclama de navegar por centenas de tabelas que não usa. O que criar?', a: 'Data Mart', why: 'Um recorte só com o que o RH usa simplifica as consultas.' },
  { set: 'onde', q: 'Relatórios pesados estão deixando o caixa lento. Para onde levar as consultas?', a: 'Data Warehouse', why: 'Análise sai do banco operacional e vai para o warehouse.' },

  { set: 'drift', q: 'Os alunos novos chegam pelo app e têm outro perfil; a regra do modelo continua válida.', a: 'Data drift', why: 'Mudou a distribuição das entradas, não o significado delas.' },
  { set: 'drift', q: 'Fraudadores mudaram de estratégia: o mesmo padrão de compra agora é fraude.', a: 'Concept drift', why: 'As mesmas entradas passaram a levar a outro resultado.' },
  { set: 'drift', q: 'O modelo erra desde o primeiro dia porque uma coluna foi lida invertida.', a: 'Bug no código', why: 'Erro desde o início é defeito; drift é degradação ao longo do tempo.' },
  { set: 'drift', q: 'A faixa de idade dos clientes mudou muito desde o treino do modelo.', a: 'Data drift', why: 'O perfil de quem entra mudou: data drift.' },
  { set: 'drift', q: 'O que antes indicava cliente fiel agora indica cliente prestes a cancelar.', a: 'Concept drift', why: 'Mudou a relação entre o comportamento e o resultado.' },
  { set: 'mlops', q: 'Descobrir quais parâmetros e dados geraram o modelo em produção.', a: 'MLflow', why: 'Rastrear execuções e versões é a função do MLflow.' },
  { set: 'mlops', q: 'Comparar as métricas de 20 versões treinadas do modelo.', a: 'MLflow', why: 'O MLflow registra as métricas de cada execução para comparar.' },
  { set: 'mlops', q: 'A precisão cai mês a mês, sem nenhuma mudança no código.', a: 'Monitorar e retreinar', why: 'Queda gradual é drift: monitore e retreine com dados recentes.' },
  { set: 'mlops', q: 'A auditoria pede o histórico de versões do modelo.', a: 'MLflow', why: 'O registro de modelos do MLflow guarda as versões.' },
  { set: 'mlops', q: 'Guardar 5 anos de vendas para os relatórios do BI.', a: 'Data Warehouse', why: 'Dado de negócio para análise é warehouse; MLflow cuida de modelos.' },

  { set: 'fenomeno', q: 'O assistente cita, com detalhes, uma função que não existe na biblioteca.', a: 'Alucinação', why: 'Inventou algo que nunca existiu.' },
  { set: 'fenomeno', q: 'Pergunto sobre uma lei alterada mês passado e ele descreve a versão antiga.', a: 'Corte de conhecimento', why: 'A mudança é posterior aos dados de treino.' },
  { set: 'fenomeno', q: 'Depois de horas de conversa, ele ignora as regras da primeira mensagem.', a: 'Estouro de contexto', why: 'O início da conversa saiu da janela de contexto.' },
  { set: 'fenomeno', q: 'Ele inventa um artigo, com autores e revista, que não existe.', a: 'Alucinação', why: 'Referência inventada apresentada com confiança.' },
  { set: 'fenomeno', q: 'Não conhece uma versão da biblioteca lançada depois do treino.', a: 'Corte de conhecimento', why: 'Não saber de algo recente é corte, não invenção.' },
  { set: 'tipo', q: 'Redigir a mensagem de boas-vindas de cada aluno novo.', a: 'IA generativa', why: 'Produz conteúdo novo.' },
  { set: 'tipo', q: 'Estimar a chance de cada aluno cancelar o plano.', a: 'IA preditiva', why: 'Produz uma estimativa (probabilidade).' },
  { set: 'tipo', q: 'Se o aluno faltar 15 dias seguidos, enviar mensagem de retorno.', a: 'Regra fixa', why: 'O critério foi escrito por uma pessoa: não há aprendizado.' },
  { set: 'tipo', q: 'Gerar as notas de versão a partir das mensagens de commit.', a: 'IA generativa', why: 'Cria texto novo a partir de uma entrada.' },
  { set: 'tipo', q: 'Classificar o risco de crédito de cada pedido.', a: 'IA preditiva', why: 'Atribui uma classe/pontuação a cada caso.' },
  { set: 'param', q: 'Unidade usada para cobrar o uso de LLMs na nuvem.', a: 'Token', why: 'A cobrança é por tokens de entrada e saída.' },
  { set: 'param', q: 'Reduzir para que execuções iguais deem respostas parecidas.', a: 'Temperatura', why: 'Temperatura baixa = saída mais repetível.' },
  { set: 'param', q: 'Limite de quanto da conversa o modelo consegue considerar.', a: 'Janela de contexto', why: 'É a “memória” da interação, medida em tokens.' },
  { set: 'param', q: 'Aumentar para respostas mais variadas e criativas.', a: 'Temperatura', why: 'Temperatura alta = mais variedade.' },
  { set: 'param', q: 'Cerca de 4 caracteres; pode ser só um pedaço de palavra.', a: 'Token', why: 'Definição de token segundo o slide.' },
  { set: 'param', q: 'Anexar o manual inteiro em cada chamada enche e dilui isso.', a: 'Janela de contexto', why: 'Conteúdo irrelevante ocupa o contexto e dilui o que importa.' },
  { set: 'uso', q: 'Os prontuários não podem sair da infraestrutura do hospital.', a: 'LLM local', why: 'No local, o dado não vai para terceiros.' },
  { set: 'uso', q: 'Startup sem GPU quer o modelo mais capaz, pagando pelo uso.', a: 'LLM na nuvem', why: 'A nuvem dispensa hardware e oferece modelos maiores.' },
  { set: 'uso', q: 'Responder com base em 200 documentos que mudam toda semana e citar a fonte.', a: 'RAG', why: 'Busca os trechos certos antes de gerar e permite citar o documento.' },
  { set: 'uso', q: 'Funciona offline e sem custo por token.', a: 'LLM local', why: 'Roda na própria máquina.' },
  { set: 'uso', q: 'Cobra por token e envia o texto a servidores de terceiros.', a: 'LLM na nuvem', why: 'Esse é o modelo de uso da nuvem.' },
  { set: 'marca', q: 'Anthropic é…', a: 'Empresa', why: 'A Anthropic desenvolve a família Claude.' },
  { set: 'marca', q: 'Claude é…', a: 'Família de modelos', why: 'Claude é a família de modelos da Anthropic.' },
  { set: 'marca', q: 'Opus é…', a: 'Modelo da família', why: 'Opus é um modelo da família Claude.' },
  { set: 'marca', q: 'Sonnet é…', a: 'Modelo da família', why: 'Sonnet é um modelo da família Claude.' },
  { set: 'marca', q: 'Fable é…', a: 'Modelo da família', why: 'Fable é um modelo da família Claude, como no quadro.' },
  { set: 'marca', q: 'OpenAI é…', a: 'Empresa', why: 'A OpenAI desenvolve a família GPT.' },
  { set: 'marca', q: 'Gemini é…', a: 'Família de modelos', why: 'Gemini é a família de modelos do Google.' },

  { set: 'trabalho', q: 'Lista priorizada com “agendamento”, “PIX” e “corrigir login”.', a: 'Backlog', why: 'Tudo o que falta fazer, em ordem de prioridade.' },
  { set: 'trabalho', q: 'Criar o endpoint de reserva e testá-lo com uma aula lotada.', a: 'Task', why: 'Unidade pequena com resultado verificável.' },
  { set: 'trabalho', q: 'Regras e critérios de aceite, aprovados antes de escrever código.', a: 'Especificação (spec)', why: 'É a spec: a fonte da verdade do que deve ser feito.' },
  { set: 'trabalho', q: 'O código foi se afastando do combinado. Contra o que conferir cada entrega?', a: 'Especificação (spec)', why: 'A spec aprovada é a referência contra o drift.' },
  { set: 'trabalho', q: 'Unidade pequena, executável, com critério de pronto.', a: 'Task', why: 'Definição de task.' },
  { set: 'trabalho', q: 'É reordenada toda semana conforme a prioridade do negócio.', a: 'Backlog', why: 'O backlog é dinâmico e priorizado.' }
];
