# Entenda o código: respostas simples para o professor

**API**: é uma interface de comunicação entre programas. O navegador faz requisições HTTP para `/api` e recebe respostas em JSON.

**Express**: biblioteca que organiza rotas no Node.js, como `GET /api/produtos` para listar e `POST /api/produtos` para cadastrar.

**MySQL**: sistema que armazena dados em tabelas com regras, chaves e relações; não é substituído por JSON, SQLite ou localStorage.

**CRUD**: Create, Read, Update, Delete — cadastrar, consultar, atualizar e excluir. Aqui `DELETE` desativa (`ativo=0`) para preservar registros vinculados.

**JOIN**: reúne dados de duas ou mais tabelas usando suas chaves relacionadas. Na venda, associamos cliente, operador, pagamento e produtos.

**GROUP BY**: agrupa linhas para calcular contagens e somas. Ex.: `GROUP BY DATE(criada_em)` soma faturamento do dia.

**Chave primária (PK)**: identificação única de cada linha. Exemplo: `produtos.id`.

**Chave estrangeira (FK)**: coluna que aponta para uma PK de outra tabela. Exemplo: `produtos.categoria_id` aponta para `categorias.id`.

**Relação N:N**: quando vários registros de um lado se relacionam a vários do outro. Uma venda tem muitos produtos e o mesmo produto pode aparecer em muitas vendas. A tabela `itens_venda` resolve a relação.

**bcrypt**: função própria para senhas; gera hashes lentos e com salt. A API compara o hash, não guarda a senha original.

**JWT**: token assinado emitido no login. A interface envia o token no header `Authorization` e o backend confirma se ele é válido.

**Transação SQL**: bloco de comandos que deve funcionar inteiro. `BEGIN` inicia, `COMMIT` confirma e `ROLLBACK` desfaz quando há erro. Na venda, o banco registra venda, itens, pagamento e estoque tudo junto.

**React e backend**: o React chama a API pelo Axios. O Express recebe o pedido, executa SQL usando mysql2/promise e devolve JSON, que o React exibe.

## Onde está cada conceito no projeto?

- **Banco e chaves:** `banco.sql`.
- **Conexão MySQL:** `src/config/db.js`.
- **Express e middlewares:** `server.js`.
- **JWT:** `src/middleware/auth.js`.
- **bcrypt:** `src/routes/auth.js` e `scripts/seed.js`.
- **CRUD:** `src/routes/crud.js`.
- **Transações de vendas:** `src/routes/sales.js`.
- **Transações de estoque:** `src/routes/stock.js`.
- **JOIN e GROUP BY:** `src/routes/reports.js`, `src/routes/sales.js`.
- **Interface:** `frontend/src/pages` e `frontend/src/components`.
- **Banco com dados demo:** `scripts/seed.js`.

## Pergunta difícil: por que o estoque não fica negativo?

Na venda, usamos `SELECT ... FOR UPDATE` para bloquear os produtos durante a transação, verificamos se `estoque >= quantidade`, atualizamos o saldo e executamos COMMIT. Duas vendas simultâneas não conseguem gastar livremente o mesmo saldo.

## Pergunta difícil: por que não confiamos nos preços do navegador?

O cliente poderia modificar a requisição. Por isso a API ignora preços informados pela interface e calcula tudo novamente com o preço atual que está no banco, sob bloqueio.
