# Plano de testes — NEXA STORE

Os resultados de um ambiente sem MySQL ou npm disponível **não devem ser apresentados como se fossem testes de integração bem-sucedidos**.

## Verificações de código executáveis sem MySQL

```bash
npm run check
```

Verifica sintaxe dos arquivos JavaScript do backend com `node --check`. Para validar o React, primeiro instale as dependências e execute `npm run build`.

## Testes manuais após instalar no Windows

| Ação | Resultado esperado |
|---|---|
| Executar `banco.sql` | Criação de 9 tabelas sem erros no MySQL 8 |
| `npm run setup` | Administrador e dados de demo são criados; script pode ser reexecutado sem duplicar SKUs/vendas seed |
| `npm run build` | Compilação Vite e criação de `frontend/dist` |
| `npm start` | Express ouvindo na porta 3000 |
| GET `/api/health` | `status: ok`, `database: online` |
| Login com senha errada | HTTP 401 |
| Login com senha demo | Retorna JWT e identifica usuário |
| GET `/api/produtos` sem JWT | HTTP 401 |
| Cadastrar cliente / fornecedor / produto | Registros persistidos nas tabelas |
| Selecionar categoria no cadastro | ID gravado como FK em `produtos` |
| Finalizar venda com estoque suficiente | Venda, itens, pagamento, saída e total registrados |
| Repetir a mesma `chave_idempotencia` | Não cria a segunda venda |
| Tentar vender além do estoque | HTTP 409, nenhuma venda confirmada |
| Cancelar venda | `status=cancelada`, saldo restaurado, pagamento `estornado` |
| Abrir relatórios | GROUP BY por dia, categoria e produto com dados de vendas concluídas |
| Usuário operador no cadastro de usuários | HTTP 403 |

## Consultas úteis no Workbench

```sql
USE nexa_store;
SHOW TABLES;
SELECT COUNT(*) AS usuarios FROM usuarios;
SELECT COUNT(*) AS vendas FROM vendas;
SELECT COUNT(*) AS produtos FROM produtos;
SELECT * FROM movimentacoes_estoque ORDER BY id DESC LIMIT 10;
SELECT v.codigo, c.nome, p.metodo, v.total
FROM vendas v LEFT JOIN clientes c ON c.id=v.cliente_id
JOIN pagamentos p ON p.venda_id=v.id ORDER BY v.id DESC LIMIT 10;
```

**Limitações esperadas:** sem MySQL ativo não é possível confirmar transações, constraints, login com banco, consultas JOIN/GROUP BY nem fluxo completo. Sem acesso ao registro npm não é possível compilar frontend ou executar Express com os pacotes externos.

## Resultado observado no ambiente de criação

- **Checagem estática `npm run verify`: PASSOU**, com 29 arquivos essenciais e as 9 tabelas obrigatórias verificadas.
- **Checagem sintática do backend `npm run check`: PASSOU.**
- **Análise sintática React/JSX por TypeScript 5.8: PASSOU**, 14 arquivos `.js/.jsx`, zero erros sintáticos.
- **Validação do DER.svg como XML: PASSOU.**
- **Build Vite: NÃO EXECUTADO COM SUCESSO**: a instalação npm não foi possível (registro indisponível), então `vite` não está instalado no ambiente de criação.
- **MySQL: NÃO TESTADO**: cliente/servidor MySQL não disponíveis no ambiente de criação.

Os arquivos `package-lock.json` presentes são **registros iniciais de dependências diretas**, não lockfiles de resolução completa. Ao executar **`npm install`** e **`npm --prefix frontend install`** no Windows com Internet, o npm preencherá versões transitivas e integridades. **Não use `npm ci` na primeira instalação.**
