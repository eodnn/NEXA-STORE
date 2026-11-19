# NEXA STORE — Retail Management

**Controle inteligente. Vendas sem limites.**

Sistema full-stack de gestão de comércio desenvolvido para o projeto final de Banco de Dados do 3º ano de Técnico em Desenvolvimento de Sistemas. Design próprio inspirado em produtos SaaS modernos, com autenticação real e dados persistidos no MySQL.

## Inicie em 5 comandos

1. Instale Node.js 20+, MySQL 8 e MySQL Workbench.
2. Importe **`banco.sql`** no Workbench.
3. Copie `.env.example` para `.env` e configure banco e JWT_SECRET.
4. No terminal:

```bash
npm install
npm --prefix frontend install
npm run setup
npm run build
npm start
```

5. Abra **http://localhost:3000**.

**Credenciais demo** (se usar o `.env.example`): `admin@nexastore.com` / `Nexa@2026!`. O seed produz a senha bcrypt do usuário inicial e somente o `.env` contém a senha configurada. Altere antes de qualquer publicação. Consulte **[INSTALAR_WINDOWS.md](INSTALAR_WINDOWS.md)** para instruções completas.

## Funcionalidades

- **Login protegido:** hash bcrypt (12 rounds), JWT, acesso autenticado à API, perfis admin e operador.
- **Dashboard:** receita total/mensal, total de vendas, ticket, catálogo e alerta de estoque; gráficos que consultam o MySQL.
- **PDV:** catálogo, filtro por categoria, carrinho, cliente opcional, desconto, PIX/dinheiro/débito/crédito (registro **sem cobrança real**), comprovante simples para impressão.
- **Venda transacional:** bloqueia linhas de produtos com `FOR UPDATE`, calcula preços no servidor, grava itens e pagamento, baixa estoque, registra movimentações, `COMMIT`/`ROLLBACK` e chave de idempotência para evitar duplicação por reenvio.
- **Vendas:** consulta com `JOIN`, detalhes, cancelamento transacional que devolve o estoque e marca pagamento como estornado (registro contábil, sem operação bancária).
- **Cadastros:** CRUD de categorias, fornecedores, clientes, produtos e usuários (administradores); desativação lógica preserva vendas históricas.
- **Inventário:** entrada ou ajuste de saldo com log completo de quem, quanto, quando e por quê.
- **Relatórios:** faturamento por dia, categorias, itens mais vendidos, ticket médio, produtos abaixo do mínimo; `JOIN`, `GROUP BY`, filtros de 7/30/90/365 dias e exportação CSV.
- **Configurações:** perfil atual, alteração segura da senha, logout.

## Arquitetura

```text
NEXA_STORE/
├─ server.js                      # API Express, middlewares e entrega de frontend/dist
├─ banco.sql                      # MySQL 8: 9 tabelas, constraints e relações
├─ src/
│  ├─ config/db.js                # Pool mysql2/promise
│  ├─ middleware/auth.js          # JWT e permissão admin
│  ├─ routes/auth.js              # Login, identidade e senha
│  ├─ routes/crud.js              # SQL manual para cadastros
│  ├─ routes/sales.js             # PDV, detalhes e cancelamento
│  ├─ routes/stock.js             # Ajuste e histórico de estoque
│  └─ routes/reports.js           # Dashboard e agrupamentos
├─ scripts/seed.js                # 5 categorias, 5 fornecedores, 20 produtos,
│                                # 10 clientes e 24 vendas fictícias
├─ frontend/
│  ├─ src/pages/                  # 8 componentes de páginas + EntityPage
│  ├─ src/components/             # Componentes reutilizáveis
│  ├─ src/contexts/               # Estado de autenticação
│  ├─ src/services/               # Cliente Axios
│  ├─ src/layouts/                # Sidebar e barra superior
│  └─ src/styles/                 # Tailwind + estilos originais
├─ docs/                          # DER, rotas, apresentação e explicação
├─ INSTALAR_WINDOWS.md
└─ INICIAR_NEXA_STORE.bat
```

Frontend: React, Vite, Tailwind CSS, Lucide React, Recharts, React Router, Axios, Sonner. Backend: Node.js, Express, mysql2/promise, bcryptjs, JWT, helmet, CORS, rate limit. Não há ORM nem banco substituto. A API atende `/api` e usa placeholders `?`.

## Diagrama e requisitos acadêmicos

- **9 tabelas**: `usuarios`, `categorias`, `fornecedores`, `clientes`, `produtos`, `vendas`, `itens_venda`, `pagamentos`, `movimentacoes_estoque`.
- A relação **N:N** é `vendas (1) — (N) itens_venda (N) — (1) produtos`.
- PK, FK, UNIQUE, NOT NULL, ENUM, DECIMAL, índices, CHECK, InnoDB.
- Exemplo de **JOIN**: GET `/api/vendas/:id` combina vendas, clientes, usuários, pagamentos e itens ligados a produtos.
- Exemplo de **GROUP BY**: GET `/api/relatorios?dias=30` agrupa faturamento por dia, itens e categorias.
- DER em [docs/DER.md](docs/DER.md) e [docs/DER.svg](docs/DER.svg).
- Guia das rotas em [docs/ROTAS.md](docs/ROTAS.md).

## Demonstração ao professor

Siga [docs/ROTEIRO_DEMONSTRACAO.md](docs/ROTEIRO_DEMONSTRACAO.md) e [docs/APRESENTACAO.md](docs/APRESENTACAO.md). Se precisar explicar as tecnologias, consulte [docs/EXPLICACAO_DO_CODIGO.md](docs/EXPLICACAO_DO_CODIGO.md). Os participantes devem preencher seus nomes e explicar contribuições reais; não há histórico de commits fabricado.

## GitHub

```bash
git init
git add .
git commit -m "Implementa base do NEXA STORE"
# crie um repositório vazio em github.com e siga as instruções de push mostradas lá
```

Arquivos `.env`, `node_modules`, `frontend/dist` e logs são ignorados. Cada integrante deve criar seus próprios commits sobre tarefas que realmente implementou.

## Limitações e observações

Protótipo de gestão com pagamentos apenas **registrados**, sem emissão fiscal ou integração bancária. Não usar dados reais de clientes no seed. O estoque inicial dos produtos cadastrados no formulário é gravado com movimento de entrada. Os usuários admin existentes não têm sua senha sobrescrita ao executar `npm run setup` novamente. O seed é planejado para banco novo; ele não cria as 24 vendas se já houver alguma venda registrada.

**Testes:** veja [docs/TESTES.md](docs/TESTES.md). Testes completos de integração exigem MySQL e instalações npm funcionando no seu computador.

**Nota de empacotamento:** não foi possível baixar pacotes npm no ambiente de criação. Os `package-lock.json` incluídos são arquivos iniciais e serão completados pelo próprio `npm install` no seu Windows. Por isso, use `npm install` (não `npm ci`) na primeira execução; detalhes em `docs/TESTES.md`.
