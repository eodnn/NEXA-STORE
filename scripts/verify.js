/** Checagem estática executável sem dependências externas e sem MySQL. */
const fs=require('fs');const path=require('path');const assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const required=['server.js','banco.sql','package.json','package-lock.json','.env.example','.gitignore','README.md','INICIAR_NEXA_STORE.bat','INSTALAR_WINDOWS.md','frontend/index.html','frontend/package.json','frontend/package-lock.json','frontend/vite.config.js','frontend/src/main.jsx','frontend/src/App.jsx','frontend/src/styles/main.css','docs/DER.md','docs/DER.svg','docs/ROTAS.md','docs/APRESENTACAO.md','docs/ROTEIRO_DEMONSTRACAO.md','docs/EXPLICACAO_DO_CODIGO.md','src/config/db.js','src/middleware/auth.js','src/routes/crud.js','src/routes/sales.js','src/routes/stock.js','src/routes/reports.js','scripts/seed.js'];
for(const file of required)assert.ok(fs.statSync(path.join(root,file)).isFile(),`Arquivo ausente: ${file}`);
const sql=fs.readFileSync(path.join(root,'banco.sql'),'utf8');const tables=['usuarios','categorias','fornecedores','clientes','produtos','vendas','itens_venda','pagamentos','movimentacoes_estoque'];
for(const t of tables)assert.match(sql,new RegExp(`CREATE TABLE IF NOT EXISTS ${t} \\(`,'i'),`Tabela ausente: ${t}`);
for(const p of ['PRIMARY KEY','FOREIGN KEY','UNIQUE','NOT NULL','ENUM','DECIMAL','ENGINE=InnoDB'])assert.ok(sql.includes(p),`Requisito SQL ausente: ${p}`);
const sales=fs.readFileSync(path.join(root,'src/routes/sales.js'),'utf8');
for(const p of ['beginTransaction','FOR UPDATE','commit()','rollback()','chave_idempotencia','UPDATE produtos','INSERT INTO pagamentos'])assert.ok(sales.includes(p),`Venda: ${p}`);
const reports=fs.readFileSync(path.join(root,'src/routes/reports.js'),'utf8');assert.ok(reports.includes('GROUP BY')&&reports.includes('JOIN'),'Relatórios devem usar JOIN/GROUP BY');
const auth=fs.readFileSync(path.join(root,'src/routes/auth.js'),'utf8');assert.ok(auth.includes('bcrypt.compare')&&auth.includes('jwt.sign'),'Login precisa de bcrypt e JWT');
for(const file of ['package.json','frontend/package.json','package-lock.json','frontend/package-lock.json'])JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
console.log(`OK: ${required.length} arquivos, ${tables.length} tabelas, integridade, transações, autenticação, JOIN/GROUP BY e JSON.`);
console.log('NOTA: esta é uma verificação estática; não substitui MySQL e build do Vite.');
