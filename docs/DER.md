# DER — Diagrama Entidade-Relacionamento

Abra este arquivo no GitHub ou num editor compatível com Mermaid. Existe também a imagem vetorial **DER.svg** para mostrar sem Internet na apresentação.

```mermaid
erDiagram
 USUARIOS ||--o{ VENDAS : registra
 USUARIOS ||--o{ MOVIMENTACOES_ESTOQUE : executa
 CATEGORIAS ||--o{ PRODUTOS : classifica
 FORNECEDORES |o--o{ PRODUTOS : fornece
 CLIENTES |o--o{ VENDAS : realiza
 VENDAS ||--|{ ITENS_VENDA : contem
 PRODUTOS ||--o{ ITENS_VENDA : aparece_em
 VENDAS ||--|| PAGAMENTOS : possui
 VENDAS |o--o{ MOVIMENTACOES_ESTOQUE : gera
 PRODUTOS ||--o{ MOVIMENTACOES_ESTOQUE : movimenta
 USUARIOS {
  int id PK
  varchar nome
  varchar email UK
  varchar senha_hash
  enum perfil
 }
 CATEGORIAS {
  int id PK
  varchar nome UK
 }
 FORNECEDORES {
  int id PK
  varchar nome
  varchar email UK
 }
 CLIENTES {
  int id PK
  varchar nome
  varchar email UK
 }
 PRODUTOS {
  int id PK
  varchar sku UK
  int categoria_id FK
  int fornecedor_id FK
  decimal preco
  int estoque
 }
 VENDAS {
  int id PK
  varchar codigo UK
  int cliente_id FK
  int usuario_id FK
  decimal total
  enum status
 }
 ITENS_VENDA {
  int id PK
  int venda_id FK
  int produto_id FK
  int quantidade
  decimal preco_unitario
 }
 PAGAMENTOS {
  int id PK
  int venda_id FK,UK
  enum metodo
  decimal valor
 }
 MOVIMENTACOES_ESTOQUE {
  int id PK
  int produto_id FK
  int usuario_id FK
  int venda_id FK
  int quantidade
 }
```

## Relação muitos-para-muitos

Uma venda pode incluir vários produtos e um produto pode participar de várias vendas. Em bancos relacionais, representamos essa ligação com **`itens_venda`**, uma tabela intermediária que também guarda quantidade, preço unitário no momento da venda e total por item. A combinação `(venda_id, produto_id)` é UNIQUE e impede repetições do mesmo produto na mesma venda.

## Integridade

`produtos.categoria_id` aponta para `categorias.id`; `vendas.usuario_id` aponta para quem atendeu; `itens_venda.venda_id` para a venda e `itens_venda.produto_id` para o produto. Em tabelas históricas não fazemos exclusão física das entidades: `ativo=0` preserva vínculos e dados auditáveis. `pagamentos.venda_id UNIQUE` garante apenas um registro de pagamento por venda nesta versão simplificada.
