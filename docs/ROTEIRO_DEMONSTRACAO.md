# Roteiro para demonstrar no seminário

**Antes de apresentar:** importe o banco, execute `npm run setup`, `npm run build`, `npm start` e abra `http://localhost:3000`. Confirme o MySQL no Workbench. Treine com os dados fictícios.

1. **Login (30s):** entre com o usuário demo. Explique que senha não é comparada em texto puro: bcrypt verifica o hash e JWT protege a API.
2. **Dashboard (40s):** mostre total, mês, ticket médio, vendas por dia e estoque baixo. Os números vêm do MySQL.
3. **Clientes (25s):** cadastre `Cliente Apresentação`, com e-mail fictício único. Explique INSERT.
4. **Produtos (40s):** cadastre `Produto Demo` com SKU `DEMO-APRESENTACAO-01`, escolha uma categoria e fornecedor no SELECT; dê estoque inicial de 12 e mínimo 3. Mostre FK.
5. **PDV (60s):** encontre `Produto Demo`, adicione 2 unidades, selecione `Cliente Apresentação`, pagamento PIX, clique Finalizar. Mostre o código da venda.
6. **Estoque (25s):** mostre o saldo passando de 12 para 10 e a saída de -2 no histórico de movimentações.
7. **Vendas (30s):** abra a venda criada, veja cliente, operador, forma de pagamento e itens.
8. **Relatórios (30s):** mostre o faturamento e explique `GROUP BY` (soma as vendas por dia).
9. **JOIN (25s):** Workbench: abra `docs/ROTAS.md`, execute o SQL com JOIN, explique como cliente e produto surgem relacionados a uma venda.
10. **DER (20s):** mostre `docs/DER.svg`; explique a tabela `itens_venda`, que une as duas entidades N:N.

**Plano B:** se o navegador não conectar, execute `npm run check` no projeto, abra `banco.sql` e `docs/DER.svg`; explique modelo e códigos. Um print não substitui demonstrar a API funcionando, então configure tudo antes da aula.

## Perguntas prováveis do professor

- **Onde está a PK?** Na coluna `id` de cada tabela.
- **Onde há uma FK?** `produtos.categoria_id` referencia `categorias.id`.
- **Onde está a relação N:N?** Em `itens_venda`, com `venda_id` e `produto_id`.
- **Como a API evita SQL injection?** Placeholders `?` do mysql2 e whitelist de campos.
- **Por que transação?** Impede venda criada sem pagamento ou sem baixa do estoque.
- **O que acontece se faltar estoque?** A API rejeita e executa ROLLBACK.
- **Por que GROUP BY?** Agrupa linhas para contar e somar vendas por dia/produto.
- **Quando cancelamos?** Estado `cancelada`, registro de estorno e devolução das unidades.
