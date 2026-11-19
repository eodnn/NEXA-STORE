# Rotas REST — NEXA STORE

Base URL: `http://localhost:3000/api`. Todas as rotas exceto `/auth/login` e `/health` exigem header `Authorization: Bearer SEU_TOKEN`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Valida email/senha com bcrypt e retorna JWT |
| GET | `/auth/me` | Usuário da sessão |
| PUT | `/auth/senha` | Troca senha após validar senha atual |
| GET | `/health` | Diagnóstico da conexão MySQL |
| GET, POST | `/produtos` | Listar com JOIN / cadastrar |
| GET, PUT, DELETE | `/produtos/:id` | Detalhar / editar / desativar |
| GET, POST | `/clientes`, `/fornecedores`, `/categorias` | Listar / cadastrar |
| GET, PUT, DELETE | `/clientes/:id`, `/fornecedores/:id`, `/categorias/:id` | Detalhar / editar / desativar |
| GET | `/clientes/:id/historico` | Vendas do cliente |
| GET, POST | `/usuarios` | Listar / cadastrar (admin) |
| GET, PUT, DELETE | `/usuarios/:id` | Detalhar / editar / desativar (admin) |
| GET | `/vendas` | Histórico por JOIN, filtro `?status=concluida` |
| GET | `/vendas/:id` | Dados e itens por JOIN |
| POST | `/vendas` | Nova venda em transação |
| POST | `/vendas/:id/cancelar` | Estornar estoque em transação |
| GET | `/estoque` | Quantidades atuais |
| GET | `/estoque/movimentacoes` | Log completo (filtro opcional por produto_id) |
| POST | `/estoque/ajuste` | Entrada ou ajuste de saldo em transação |
| GET | `/dashboard` | KPIs e gráficos calculados no banco |
| GET | `/relatorios?dias=30` | GROUP BY: vendas por dia/produto/categoria |

## Exemplos rápidos

Login:

```json
POST /api/auth/login
{"email":"admin@nexastore.com","senha":"Nexa@2026!"}
```

Nova venda (token obrigatório):

```json
POST /api/vendas
{
  "itens": [{"produto_id":1,"quantidade":2},{"produto_id":2,"quantidade":1}],
  "cliente_id":1,
  "metodo":"pix",
  "desconto":5.00,
  "chave_idempotencia":"demonstra-001-uuid"
}
```

A API **ignora preços enviados pelo cliente**: os valores são lidos no MySQL e os produtos são bloqueados com `SELECT ... FOR UPDATE`. `chave_idempotencia` identifica a tentativa; repetir o mesmo payload com a mesma chave devolve a venda existente. Se faltar estoque, a venda não é confirmada.

Movimentação (entrada):

```json
POST /api/estoque/ajuste
{"produto_id":1,"tipo":"entrada","quantidade":10,"observacao":"Recebimento do fornecedor"}
```

Movimentação (definir saldo):

```json
POST /api/estoque/ajuste
{"produto_id":1,"tipo":"ajuste","quantidade":15,"observacao":"Inventário físico"}
```

Erro usual: `{ "erro": "Mensagem explicativa" }` com HTTP 400, 401, 403, 404, 409 ou 500. Não se retorna `senha_hash` nos endpoints de usuários.

## SQL para mostrar na apresentação

```sql
-- JOIN: vendedor, cliente e produtos da venda
SELECT v.codigo, c.nome AS cliente, u.nome AS operador,
       p.nome AS produto, iv.quantidade, iv.preco_unitario
FROM vendas v
LEFT JOIN clientes c ON c.id = v.cliente_id
JOIN usuarios u ON u.id = v.usuario_id
JOIN itens_venda iv ON iv.venda_id = v.id
JOIN produtos p ON p.id = iv.produto_id
ORDER BY v.id DESC;

-- GROUP BY: faturamento agrupado por dia
SELECT DATE(v.criada_em) AS dia, COUNT(*) AS vendas,
       SUM(v.total) AS faturamento
FROM vendas v
WHERE v.status = 'concluida'
GROUP BY DATE(v.criada_em)
ORDER BY dia DESC;
```
