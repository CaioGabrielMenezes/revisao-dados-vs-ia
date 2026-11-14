# Revisão da prova · Dados vs IA

**Site:** https://caiogabrielmenezes.github.io/revisao-dados-vs-ia/ — publicado automaticamente pelo GitHub Actions a cada push na `main` (`.github/workflows/deploy.yml`).

Site local de treino para a prova, com React, Vite e TypeScript. Não há backend. Cada acesso começa zerado, como um treino novo: as respostas valem só enquanto a página está aberta (recarregar também zera). Apenas o tema claro/escuro fica salvo.

## Executar

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run validate   # confere o banco de questões
npm run build && npm run preview
```

## De onde vem o conteúdo

| Fonte | Papel |
|---|---|
| `referencias/quadro/` | **Define os assuntos.** Só entra o que o professor escreveu no quadro: Dados vs IA (DB, BI/A.D, C.D/M.L, E.D), Pipeline/ETL, Data Warehouse e Marts, MLflow e Drift, Modelos de IA (Anthropic → Claude → Sonnet/Opus/Fable) e Spec-driven/Backlog/Tasks. Kaggle, Data Science Academy, “Braga → Fitness” e “Ester” foram exemplos citados em aula e não viram questão. |
| `referencias/slides/AULA02-legivel.pdf` | Base para as definições e explicações (a outra cópia renderiza em branco). |
| `referencias/prova-anterior/` | Modelo de **formato**: 5 alternativas, cenário, “respectivamente”, afirmativas I/II/III e asserção–razão (PORQUE). |

A leitura de “SPEC DRIVEN → DRIFT” como desvio em relação à especificação é uma interpretação e está sinalizada no site.

## Estrutura

- `src/data/concepts.ts` — assuntos (na ordem do quadro) e fichas de conceito.
- `src/data/questions.ts` — questões. Os construtores `direta`, `afirmativas` e `assercao` geram as alternativas; nas afirmativas e asserções, basta dizer quais afirmações são verdadeiras e por quê — as alternativas e as justificativas de erro são montadas automaticamente.
- `src/pages/` — Início (quadro clicável e desempenho), Conceitos, Objetivas/Contextualizadas/Revisar erros (`Practice.tsx`) e Simulado (`Exam.tsx`).
- `scripts/validate-content.mjs` — falha se uma questão não tiver 5 alternativas com justificativa, se a correta for a mais longa com frequência, se houver distratores repetidos ou gabaritos de afirmativas/asserções pouco variados.

## Funcionalidades

- **Questões objetivas**: um conceito do quadro por questão, com correção imediata.
- **Questões contextualizadas**: cenários no formato da prova, com filtro por formato.
- **Simulado**: 16 questões, folha de gabarito, cronômetro, nota de 0 a 80 e correção só no final.
- **Revisar erros**: questões cuja última resposta foi errada.
- Dica opcional, riscar alternativas, atalhos de teclado (A–E, Enter), modo escuro.
