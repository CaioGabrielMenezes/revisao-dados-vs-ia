/** Revisão rápida: cola com recordação ativa + rodada de “Quem faz? / Onde fica?”. */

export const CHOICES = {
  quem: ['Analista', 'Cientista', 'Engenheiro'],
  onde: ['Banco operacional', 'Data Warehouse', 'Data Mart']
} as const;

export type Drill = { set: keyof typeof CHOICES; q: string; a: string; why: string };

/** Cartões da cola: a pergunta-chave aparece; o resto, só ao tocar (recordação ativa).
 *  `concepts`: fichas de concepts.ts cuja definição completa aparece no cartão. */
export const cheats = [
  { board: 'BI / A.D', concepts: ['bi', 'ad'], name: 'Analista de dados', key: 'O que aconteceu e por quê?', verb: 'Descreve e explica o passado', delivers: 'Painéis, relatórios, indicadores (KPIs), consultas SQL', trap: 'Não constrói pipeline nem treina modelo preditivo.' },
  { board: 'C.D / M.L', concepts: ['cd', 'ml'], name: 'Cientista de dados', key: 'O que vai acontecer?', verb: 'Prevê com modelos (estatística e ML)', delivers: 'Modelos treinados e avaliados em dados novos', trap: 'Não é quem mantém a carga noturna nem monta o painel do mês.' },
  { board: 'E.D', concepts: ['ed'], name: 'Engenheiro de dados', key: 'O dado chega certo e no prazo?', verb: 'Constrói a estrada por onde o dado passa', delivers: 'Pipelines, ETL, data warehouse', trap: 'Não interpreta os números para a diretoria.' },
  { board: 'DB', concepts: ['db'], name: 'Banco operacional', key: 'Registrar agora', verb: 'Grava cada transação no momento em que acontece', delivers: 'Cadastro, pedidos, matrículas — o sistema do dia a dia', trap: 'Consulta analítica pesada aqui deixa o sistema lento.' },
  { board: 'DATA WAREHOUSE', concepts: ['warehouse'], name: 'Data Warehouse', key: 'A empresa inteira, com histórico', verb: 'Integra várias fontes para análise', delivers: 'Base histórica que alimenta o BI', trap: 'Não registra a venda em tempo real.' },
  { board: 'DATA MARTS', concepts: ['datamart'], name: 'Data Mart', key: 'Só o que um time usa', verb: 'Recorte do warehouse para uma área', delivers: 'Base menor e simples para marketing, financeiro, RH…', trap: 'É um pedaço do warehouse, não o contrário.' }
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
  { set: 'onde', q: 'Relatórios pesados estão deixando o caixa lento. Para onde levar as consultas?', a: 'Data Warehouse', why: 'Análise sai do banco operacional e vai para o warehouse.' }
];
