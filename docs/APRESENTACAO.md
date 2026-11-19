# Seminário de encerramento — NEXA STORE (7 slides)

> **Integrantes:** [Nome 1], [Nome 2], [Nome 3], [Nome 4]. Preencher apenas quem realmente participou. **Turma:** [informar]. **Curso:** Técnico em Desenvolvimento de Sistemas.

## Slide 1 — Projeto e objetivo
**NEXA STORE — Retail Management**  
*Controle inteligente. Vendas sem limites.*  
Um sistema full-stack para administrar vendas, produtos, estoque, clientes e relatórios em pequenas lojas.

**Fala:** "Criamos uma aplicação em que o funcionário consegue registrar uma venda e acompanhar tudo o que aconteceu no banco de dados."

## Slide 2 — Problema resolvido
Pequenos comércios precisam controlar o estoque e as vendas sem planilhas soltas. Sem sistema, é fácil vender um item sem disponibilidade, perder o histórico ou não saber qual produto teve maior saída.

**Fala:** "O nosso sistema reúne cadastro, operação de caixa e análise em um único painel."

## Slide 3 — Tecnologias e arquitetura
**MySQL 8** (dados e integridade); **Node.js + Express** (API REST); **mysql2** (SQL sem ORM); **bcrypt + JWT** (autenticação); **React + Vite + Tailwind** (interface); **Recharts** (gráficos).

**Fluxo:** React → chamada HTTP com Axios → Express → SQL parametrizado → MySQL → resposta JSON → interface.

## Slide 4 — Banco e DER
**9 tabelas** e relações PK/FK: usuários, categorias, fornecedores, clientes, produtos, vendas, itens_venda, pagamentos e movimentacoes_estoque.

**Destaque:** relação N:N `vendas ↔ produtos`, resolvida por `itens_venda`. Mostrar `docs/DER.svg` no projetor.

## Slide 5 — Funcionalidades
Login real, cadastro, PDV/carrinho, cálculo no servidor, registro de pagamentos (não cobrança real), baixa automática e estorno de estoque, dashboard e relatórios.

**Fala:** "Ao finalizar uma compra usamos uma transação. Se algum passo falha, o banco desfaz a operação e evita dados incompletos."

## Slide 6 — SQL na prática
**JOIN:** combina venda, cliente, usuário, itens e produtos. **GROUP BY:** calcula faturamento por dia e ranking de itens. Mostrar SQL em `docs/ROTAS.md` e resultados na tela de Relatórios.

## Slide 7 — Aprendizados e conclusão
Modelagem relacional, integridade, chaves estrangeiras, autenticação, SQL parametrizado, APIs REST, transações e frontend integrado.

**Conclusão:** "O trabalho demonstra como os conceitos vistos no curso podem se tornar um sistema único, com informações relacionadas de verdade."

### Divisão das contribuições reais

| Integrante | Implementou / documentou / testou |
|---|---|
| [Nome 1] | [Preencher atividades reais] |
| [Nome 2] | [Preencher atividades reais] |
| [Nome 3] | [Preencher atividades reais] |
| [Nome 4] | [Preencher atividades reais] |

Não apresente esta tabela como fato antes de preenchê-la. Cada integrante deve conhecer a sua parte.
