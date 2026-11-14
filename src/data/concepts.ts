import type { Concept, Topic, TopicId } from '../types';

/**
 * Assuntos na ordem do quadro (referencias/quadro).
 * O slide da Aula 02 é usado como base para as definições; a prova anterior, como modelo de cobrança.
 */
export const topics: Topic[] = [
  { id: 'areas', name: 'Dados vs IA: áreas e profissionais', short: 'Dados vs IA', board: 'DADOS vs IA · DB · BI / A.D · C.D / M.L · E.D', summary: 'O que cada área de dados entrega, quem faz o quê e onde a IA entra.' },
  { id: 'arquitetura', name: 'Pipeline, ETL, Warehouse e Marts', short: 'Pipeline e DW', board: 'PIPELINE (ETL) · DATA WAREHOUSE · DATA MARTS', summary: 'Como o dado sai das fontes, é tratado e chega organizado para análise.' },
  { id: 'mlops', name: 'MLflow e Drift', short: 'MLflow e Drift', board: 'MLFLOW · DRIFT', summary: 'Modelos em produção: rastrear experimentos e perceber quando o mundo muda.' },
  { id: 'ia', name: 'Modelos de IA', short: 'Modelos de IA', board: 'MODELOS DE IA → ANTHROPIC → CLAUDE → SONNET · OPUS · FABLE', summary: 'Empresas, famílias de modelos, LLMs e os conceitos para usá-los bem.' },
  { id: 'spec', name: 'Spec-driven, Backlog e Tasks', short: 'Spec-driven', board: 'SPEC DRIVEN → DRIFT · BACKLOG · TASKS', summary: 'Especificar antes de construir e dividir o trabalho em partes verificáveis.' }
];

export const topicById = Object.fromEntries(topics.map(t => [t.id, t])) as Record<TopicId, Topic>;

export const concepts: Concept[] = [
  // ── Dados vs IA ────────────────────────────────────────────────
  {
    id: 'dados-vs-ia', topic: 'areas', name: 'Dados vs IA', board: 'DADOS vs IA',
    definition: 'A área de dados coleta, armazena, trata e analisa dados para responder perguntas e apoiar decisões. A área de IA usa esses dados para construir sistemas que aprendem padrões e executam tarefas como prever, classificar ou gerar conteúdo.',
    example: 'Um painel com as matrículas de cada unidade de uma academia é uma entrega de dados (BI). Um modelo que estima quais alunos vão cancelar é uma entrega de IA (ML).',
    contrast: 'As áreas não competem: a IA depende de dados de qualidade. A aula mostra que o avanço recente da IA veio da junção de dados em escala, GPUs e novos algoritmos.',
    exam: 'O cenário descreve uma necessidade e você decide se a entrega é de dados (relatório, indicador, pipeline) ou de IA (modelo que aprende, gera ou prevê).'
  },
  {
    id: 'db', topic: 'areas', name: 'DB — Banco de dados', board: 'DB',
    definition: 'Sistema que armazena dados de forma organizada e permite consultá-los e atualizá-los com integridade. É a base das operações do dia a dia (cadastros, pedidos, matrículas). O profissional associado é o DBA, que cuida de desempenho, backup, segurança e disponibilidade.',
    example: 'O banco do sistema da academia registra cada matrícula e cada pagamento no momento em que acontecem.',
    contrast: 'O banco operacional (transacional) atende o sistema em tempo real. O Data Warehouse reúne o histórico de várias fontes para análise.',
    exam: 'Cuidado com cenários em que consultas analíticas pesadas rodam no banco operacional e deixam o sistema lento.'
  },
  {
    id: 'bi', topic: 'areas', name: 'BI — Business Intelligence', board: 'BI',
    definition: 'Processos e ferramentas que transformam dados em indicadores, relatórios e painéis para apoiar decisões de negócio. Olha principalmente para o que aconteceu (análise descritiva).',
    example: 'Painel com faturamento mensal, ticket médio e metas por loja, atualizado diariamente.',
    contrast: 'BI descreve e monitora; ciência de dados/ML constrói modelos para prever. BI consome os dados que a engenharia de dados entrega.',
    exam: 'Palavras-chave no cenário: “painel”, “indicadores”, “acompanhar”, “relatório gerencial”.'
  },
  {
    id: 'ad', topic: 'areas', name: 'A.D — Análise de Dados (analista)', board: 'A.D',
    definition: 'Atividade de explorar, limpar e interpretar dados para responder perguntas do negócio e comunicar conclusões. O analista usa SQL, planilhas e ferramentas de BI — por isso aparece junto de BI no quadro.',
    example: 'Investigar por que as vendas caíram em uma região, comparando produtos e períodos, e apresentar as hipóteses à gestão.',
    contrast: 'O analista interpreta e comunica; o engenheiro constrói a infraestrutura que entrega os dados; o cientista cria modelos preditivos.',
    exam: 'Pergunta descritiva (“o que aconteceu?”, “por quê?”) aponta para o analista. Pergunta sobre o futuro aponta para o cientista.'
  },
  {
    id: 'cd', topic: 'areas', name: 'C.D — Ciência de Dados (cientista)', board: 'C.D',
    definition: 'Área que usa estatística, programação e machine learning para criar modelos que explicam ou preveem comportamentos. O cientista formula hipóteses, treina, avalia e comunica modelos — por isso aparece junto de M.L no quadro.',
    example: 'Modelo que estima a probabilidade de cada aluno da academia cancelar o plano nos próximos 30 dias.',
    contrast: 'Cientista modela e experimenta; analista descreve; engenheiro sustenta o fluxo de dados.',
    exam: 'Entrega com “prever”, “estimar probabilidade”, “treinar e avaliar modelo” aponta para C.D/M.L.'
  },
  {
    id: 'ml', topic: 'areas', name: 'M.L — Machine Learning', board: 'M.L',
    definition: 'Subárea da IA em que o sistema aprende padrões a partir de exemplos (dados), em vez de seguir regras escritas manualmente. O modelo resultante faz previsões para casos novos e pode errar.',
    example: 'Um classificador treinado com milhares de chamados já rotulados sugere a fila de cada novo chamado.',
    contrast: 'Regra fixa: o critério é escrito por uma pessoa e o programa só executa. ML: o critério é inferido dos dados e precisa ser avaliado.',
    exam: 'Questão 1 da prova anterior: distinguir automação por regra de sistema que aprende com exemplos.'
  },
  {
    id: 'ed', topic: 'areas', name: 'E.D — Engenharia de Dados (engenheiro)', board: 'E.D',
    definition: 'Área que projeta, constrói e mantém a infraestrutura que coleta, transporta, transforma e disponibiliza dados de forma confiável: pipelines, ETL e data warehouse.',
    example: 'Rotina noturna que extrai dados de três sistemas, padroniza formatos e carrega no data warehouse.',
    contrast: 'O engenheiro garante que o dado chegue correto e no prazo; analista e cientista consomem esse dado.',
    exam: 'Palavras-chave: “integrar fontes”, “carga diária”, “pipeline falhou”, “formatos diferentes”.'
  },

  // ── Pipeline, ETL, Warehouse, Marts ───────────────────────────
  {
    id: 'pipeline', topic: 'arquitetura', name: 'Pipeline de dados', board: 'PIPELINE',
    definition: 'Sequência automatizada de etapas que leva dados de uma origem até um destino (coleta → tratamento → armazenamento → consumo), executada de forma repetível e monitorada.',
    example: 'Todo dia às 2h o pipeline lê as catracas e o financeiro, trata os dados e atualiza o warehouse usado pelos painéis.',
    contrast: 'Pipeline é o fluxo inteiro; ETL é o padrão de etapas usado dentro dele. No quadro, o pipeline aponta para BI/A.D: ele alimenta a análise.',
    exam: 'Erros no painel que nascem no fluxo (duplicados, carga que falhou) são problemas de pipeline, não de visualização.'
  },
  {
    id: 'etl', topic: 'arquitetura', name: 'ETL — Extract, Transform, Load', board: 'E T L',
    definition: 'Extrair os dados das fontes, transformá-los (limpar, padronizar, integrar, calcular) e carregá-los no destino analítico, como um data warehouse.',
    example: 'Extrair vendas do ERP e do site, converter datas para um único formato, remover duplicados e carregar no DW.',
    contrast: 'No ETL a transformação ocorre antes da carga. No ELT, carrega-se primeiro e transforma-se dentro do destino.',
    exam: 'Saber a ordem das letras e em qual etapa cada ação acontece (padronizar data = transformação).'
  },
  {
    id: 'warehouse', topic: 'arquitetura', name: 'Data Warehouse', board: 'DATA WAREHOUSE',
    definition: 'Repositório central que integra dados históricos de várias fontes da organização, organizado para consulta e análise — não para a operação do dia a dia.',
    example: 'Um DW reúne cinco anos de vendas, estoque e financeiro para relatórios corporativos.',
    contrast: 'Banco operacional registra transações em tempo real; DW guarda histórico integrado para análise. DW atende a organização toda; Data Mart, uma área.',
    exam: 'Cenário com “integrar várias fontes”, “histórico”, “consultas analíticas” aponta para o warehouse.'
  },
  {
    id: 'datamart', topic: 'arquitetura', name: 'Data Mart', board: 'DATA MARTS',
    definition: 'Subconjunto do data warehouse voltado a uma área ou assunto específico (vendas, marketing, financeiro), menor e mais simples de consultar.',
    example: 'O marketing consulta seu data mart de campanhas e conversões, sem navegar pelas tabelas de RH e estoque.',
    contrast: 'Warehouse = visão integrada da organização; Data Mart = recorte para um departamento.',
    exam: 'Reclamação de que “as consultas são complexas porque a área só usa uma parte dos dados” pede um data mart.'
  },

  // ── MLflow e Drift ─────────────────────────────────────────────
  {
    id: 'mlflow', topic: 'mlops', name: 'MLflow', board: 'MLFLOW',
    definition: 'Plataforma open source para gerenciar o ciclo de vida de modelos de machine learning: registra experimentos (parâmetros, métricas e artefatos), versiona modelos em um registro e ajuda a empacotá-los e implantá-los.',
    example: 'O cientista treina 20 variações de um modelo; o MLflow guarda parâmetros e métricas de cada execução, permitindo comparar e saber qual versão foi para produção.',
    contrast: 'MLflow organiza e rastreia o ciclo de vida de modelos. Não é algoritmo de ML, nem banco de dados de negócio, nem ferramenta de BI.',
    exam: 'Cenário com “não sabemos qual versão/parâmetros/dados geraram o modelo” ou “auditoria pediu rastreabilidade” → MLflow.'
  },
  {
    id: 'drift', topic: 'mlops', name: 'Drift (de dados e de conceito)', board: 'DRIFT',
    definition: 'Mudança, ao longo do tempo, nos dados que chegam ao modelo em produção (data drift) ou na relação entre as entradas e o resultado (concept drift). O desempenho cai mesmo sem nenhuma alteração no código.',
    example: 'Um modelo de cancelamento treinado antes da mudança de preços passa a errar mais porque o perfil dos alunos mudou.',
    contrast: 'Drift não é bug de código nem alucinação: é o mundo mudando. Resposta: monitorar métricas e distribuições e retreinar com dados recentes.',
    exam: 'Data drift: mudam as entradas. Concept drift: as mesmas entradas passam a significar outro resultado.',
    note: 'No quadro, DRIFT aparece duas vezes: ao lado de MLflow (drift de modelos em produção) e depois de SPEC DRIVEN (ver “Drift na especificação”).'
  },

  // ── Modelos de IA ─────────────────────────────────────────────
  {
    id: 'ia', topic: 'ia', name: 'IA, ML, Deep Learning e LLM', board: 'IA',
    definition: 'IA é o campo amplo de sistemas que simulam capacidades humanas. Machine Learning é a subárea que aprende com dados. Deep Learning usa redes neurais com muitas camadas. LLMs são modelos de deep learning especializados em linguagem.',
    example: 'IA ⊃ ML ⊃ Deep Learning ⊃ LLM. O Claude é um LLM; um modelo de churn com árvore de decisão é ML, mas não é LLM.',
    contrast: 'Nem toda IA é LLM, e nem todo ML é deep learning.',
    exam: 'Alternativas que invertem a hierarquia (“IA é subárea do ML”) são distratores clássicos.'
  },
  {
    id: 'claude', topic: 'ia', name: 'Anthropic → Claude → modelos', board: 'ANTHROPIC → CLAUDE → SONNET · OPUS · FABLE',
    definition: 'Anthropic é a empresa. Claude é a família de modelos de linguagem (e o assistente) que ela desenvolve. Sonnet, Opus e Fable, como escritos no quadro, são nomes de modelos dentro da família Claude, com diferentes combinações de capacidade, velocidade e custo.',
    example: 'Uma equipe usa a API da Anthropic e escolhe qual modelo Claude chamar conforme a tarefa.',
    contrast: 'Empresa ≠ família ≠ modelo. Paralelos do slide: OpenAI → GPT/ChatGPT; Google → Gemini; Meta → Llama.',
    exam: 'Questões de associação: empresa, família e modelo; e critérios para escolher um modelo.'
  },
  {
    id: 'escolha-modelo', topic: 'ia', name: 'Escolha do modelo', board: 'MODELOS DE IA',
    definition: 'Selecionar o modelo considerando a tarefa, a qualidade exigida, o custo por token, a latência, a privacidade e o tamanho da janela de contexto. O maior modelo não é automaticamente a melhor escolha.',
    example: 'Triagem de milhares de mensagens curtas pede um modelo rápido e barato; revisão de contratos longos pede um modelo mais capaz. A escolha é confirmada com testes.',
    contrast: 'Trocar de modelo “por um maior” não resolve pedido mal especificado (prova anterior, Q8).',
    exam: 'Desconfie de alternativas com “sempre o maior” ou “qualquer modelo serve”.'
  },
  {
    id: 'llm', topic: 'ia', name: 'LLM — Grande Modelo de Linguagem', board: 'MODELOS DE IA',
    definition: 'Modelo de deep learning (arquitetura Transformer, 2017) treinado com enormes volumes de texto para prever o próximo token. Com isso, responde, resume, traduz e gera texto e código.',
    example: 'ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), Llama (Meta).',
    contrast: 'O LLM prevê o texto mais provável: não consulta banco de dados nem executa contas com garantia. Todo LLM faz PLN, mas nem todo PLN usa LLM.',
    exam: 'Base para explicar por que números gerados por LLM precisam ser conferidos.'
  },
  {
    id: 'token', topic: 'ia', name: 'Token', board: 'MODELOS DE IA',
    definition: 'Unidade de texto que o modelo processa: pode ser uma palavra, parte de uma palavra ou um sinal (≈ 4 caracteres, segundo o slide). A cobrança na nuvem e a janela de contexto são medidas em tokens.',
    example: '“inteligência” pode virar 3 tokens. Enviar um manual inteiro em cada chamada multiplica os tokens cobrados.',
    contrast: 'Token não é palavra nem parâmetro. Parâmetros são os valores internos aprendidos no treino.',
    exam: 'Cenário de custo que dispara depois de anexar muito conteúdo → tokens de entrada.'
  },
  {
    id: 'contexto', topic: 'ia', name: 'Janela de contexto', board: 'MODELOS DE IA',
    definition: 'Quantidade máxima de tokens que o modelo considera em uma interação (instruções, histórico, documentos e resposta). O que excede o limite deixa de ser considerado; conteúdo irrelevante dilui o que importa.',
    example: 'Em uma conversa de horas, o assistente volta a violar regras definidas na primeira mensagem.',
    contrast: 'Contexto é a “memória” da conversa atual. Corte de conhecimento é a data limite dos dados de treino.',
    exam: 'Prova anterior, Q3 e Q4: conversa longa e repositório inteiro anexado.'
  },
  {
    id: 'temperatura', topic: 'ia', name: 'Temperatura', board: 'MODELOS DE IA',
    definition: 'Parâmetro que controla a aleatoriedade da geração: valores baixos deixam as respostas mais previsíveis e repetíveis (bom para código); valores altos, mais variadas e criativas.',
    example: 'Um script que gera consultas SQL usa temperatura baixa para que execuções iguais produzam saídas parecidas.',
    contrast: 'Temperatura baixa aumenta a consistência, mas não garante correção nem elimina alucinação.',
    exam: 'Prova anterior, Q6: “elevar a temperatura reduziria alucinações” é falso.'
  },
  {
    id: 'alucinacao', topic: 'ia', name: 'Alucinação', board: 'MODELOS DE IA',
    definition: 'Resposta com conteúdo inventado ou incorreto apresentada com confiança — “como um aluno que chuta com tom de certeza” (slide).',
    example: 'O assistente descreve em detalhes um método de biblioteca que não existe.',
    contrast: 'Alucinação: inventa. Corte de conhecimento: não sabe de algo posterior ao treino e costuma descrever a versão antiga.',
    exam: 'Prova anterior, Q5: situações 1 e 2 → alucinação e corte de conhecimento.'
  },
  {
    id: 'generativa', topic: 'ia', name: 'IA generativa vs preditiva', board: 'IA',
    definition: 'IA generativa cria conteúdo novo (texto, imagem, código) a partir de uma entrada. IA preditiva (ou analítica) estima uma classe, um valor ou uma probabilidade sobre um caso.',
    example: 'Redigir a mensagem de boas-vindas de um aluno é generativo; estimar a chance de ele cancelar é preditivo.',
    contrast: 'O tipo de saída decide: conteúdo novo ou estimativa.',
    exam: 'Prova anterior, Q2: duas demandas, “respectivamente”.'
  },
  {
    id: 'local-nuvem', topic: 'ia', name: 'LLM local vs na nuvem', board: 'MODELOS DE IA',
    definition: 'Na nuvem, o modelo roda nos servidores do fornecedor: não exige hardware potente, mas os dados são enviados a terceiros e há custo por token. Local, o modelo roda na própria máquina: mais privacidade e sem custo por uso, mas limitado ao hardware (GPU/memória).',
    example: 'Um hospital que processa prontuários pode preferir um modelo local; uma startup sem GPUs, a nuvem.',
    contrast: 'Nenhuma das opções elimina custos e riscos: muda onde eles estão.',
    exam: 'Afirmativas com “elimina automaticamente” ou “sempre mais capaz” costumam ser falsas.'
  },
  {
    id: 'prompt', topic: 'ia', name: 'Prompt', board: 'MODELOS DE IA',
    definition: 'Texto de entrada que orienta o modelo. Prompts eficazes explicitam papel, contexto, tarefa e formato da resposta, reduzindo a ambiguidade.',
    example: '“Aja como analista de dados. Contexto: vendas de 12 academias. Tarefa: apontar unidades com queda. Formato: tabela com unidade, variação e hipótese.”',
    contrast: 'Prompt longo ou cheio de jargão não é sinônimo de prompt bom; o que importa é clareza de tarefa e critério.',
    exam: 'Prova anterior, Q7 e Q8: comparação de prompts e uso de exemplos de referência.'
  },
  {
    id: 'rag', topic: 'ia', name: 'RAG e fine-tuning', board: 'MODELOS DE IA',
    definition: 'RAG (geração aumentada por recuperação) busca trechos relevantes em documentos e os entrega ao modelo antes de gerar a resposta, permitindo citar a fonte. Fine-tuning ajusta os pesos do modelo com exemplos específicos.',
    example: 'Assistente interno que responde sobre normas atualizadas toda semana e indica de qual documento tirou a resposta → RAG.',
    contrast: 'Documentos que mudam com frequência pedem RAG; refazer fine-tuning a cada revisão é caro e não indica a fonte.',
    exam: 'Prova anterior, Q10.'
  },

  // ── Spec-driven, Backlog, Tasks ───────────────────────────────
  {
    id: 'spec', topic: 'spec', name: 'Spec-driven development', board: 'SPEC DRIVEN',
    definition: 'Abordagem em que primeiro se escreve uma especificação (requisitos, regras e critérios de aceite), que é aprovada; depois vem o plano, a divisão em tasks pequenas e verificáveis e a implementação uma a uma, com validação ao fim de cada fase. Com IA, a spec é a fonte da verdade que orienta o assistente.',
    example: 'Antes de pedir código ao assistente, o time escreve as regras do agendamento de aulas (limite de vagas, cancelamento até 2 h antes, lista de espera).',
    contrast: 'O oposto é pedir “faça o sistema” e ir corrigindo conforme os problemas aparecem.',
    exam: 'Prova anterior, Q13: Time A × Time B.'
  },
  {
    id: 'spec-drift', topic: 'spec', name: 'Drift na especificação', board: 'SPEC DRIVEN → DRIFT',
    definition: 'Afastamento gradual entre o que foi especificado e o que está sendo construído — ou o que o assistente de IA gera —, causado por pedidos vagos, mudanças não registradas ou contexto perdido.',
    example: 'Depois de semanas de ajustes por conversa, o limite de vagas implementado já não é o que o gerente pediu.',
    contrast: 'Diferente do drift de modelos (dados mudando em produção). A defesa é manter a spec atualizada e validar cada task contra ela.',
    exam: 'Cenário em que o resultado “foi se desviando” do combinado → spec como fonte da verdade.',
    note: 'Interpretação da seta SPEC DRIVEN → DRIFT do quadro. Se o professor quis dizer outra coisa, ajuste esta ficha.'
  },
  {
    id: 'backlog', topic: 'spec', name: 'Backlog', board: 'BACKLOG',
    definition: 'Lista priorizada de tudo o que precisa ser feito no produto (funcionalidades, correções, melhorias). É dinâmica: itens entram, saem e mudam de prioridade.',
    example: 'Backlog do app da academia: agendamento de aulas, pagamento por PIX, corrigir erro no login, relatório de frequência.',
    contrast: 'Backlog = o que falta fazer (nível de produto). Task = unidade pequena de execução.',
    exam: 'Saber diferenciar os dois níveis.'
  },
  {
    id: 'tasks', topic: 'spec', name: 'Tasks (tarefas)', board: 'TASKS',
    definition: 'Unidades pequenas e executáveis derivadas de um item do backlog ou da spec, cada uma com resultado verificável (critério de pronto).',
    example: '“Criar endpoint de reserva com limite de vagas e testar com aula lotada.”',
    contrast: '“Melhorar o sistema” não é task: não tem escopo nem critério de verificação.',
    exam: 'Prova anterior, Q13: “tarefas pequenas de resultado verificável”.'
  }
];

export const conceptById = Object.fromEntries(concepts.map(c => [c.id, c])) as Record<string, Concept>;
