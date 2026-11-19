/** Dados fictícios, idempotentes por e-mail, SKU e nome. Não use em produção. */
require('dotenv').config();
const pool=require('../src/config/db');
const bcrypt=require('bcryptjs');
const {createSale}=require('../src/routes/sales');
const categories=['Eletrônicos','Informática','Casa & Escritório','Acessórios','Áudio & Games'];
const suppliers=['NovaTech Distribuidora','Orbit Comercial','Delta Suprimentos','Prime Importadora','Vertex Eletrônicos'];
const products=[
 ['Mouse sem fio Pulse','NEX-001',2,1,32,79.9,80,10],['Teclado mecânico Nova','NEX-002',2,2,149,329.9,45,8],
 ['Monitor 24” Vision','NEX-003',1,4,520,899.9,25,5],['Webcam Full HD','NEX-004',1,1,99,219.9,38,6],
 ['Hub USB-C 7 portas','NEX-005',4,3,78,169.9,24,6],['Headset Studio X','NEX-006',5,5,144,299.9,32,7],
 ['Caixa de som Mini','NEX-007',5,5,58,139.9,49,10],['Mousepad XL Pro','NEX-008',4,2,18,49.9,90,12],
 ['Cabo HDMI 2m','NEX-009',4,3,17,39.9,100,12],['SSD 512GB Swift','NEX-010',2,1,180,359.9,22,6],
 ['Suporte notebook Alum','NEX-011',3,4,49,119.9,44,10],['Luminária LED Arc','NEX-012',3,4,38,89.9,30,8],
 ['Carregador 30W','NEX-013',1,1,42,99.9,60,8],['Pendrive USB 64GB','NEX-014',2,3,19,54.9,75,12],
 ['Controle sem fio Axis','NEX-015',5,5,94,229.9,30,6],['Adaptador Wi-Fi AX','NEX-016',2,2,62,149.9,18,5],
 ['Organizador de mesa','NEX-017',3,3,16,44.9,55,8],['Power Bank 10000mAh','NEX-018',1,4,72,179.9,35,7],
 ['Microfone USB Cast','NEX-019',5,5,175,389.9,7,10],['Câmera Wi-Fi Home','NEX-020',1,1,105,249.9,6,9]
];
const clients=['Ana Martins','Bruno Almeida','Camila Ribeiro','Diego Oliveira','Eduarda Souza','Felipe Costa','Gabriela Lima','Henrique Castro','Isabela Ferreira','João Pereira'];
async function run(){
 await pool.query('SELECT 1');
 const email=(process.env.SEED_ADMIN_EMAIL||'admin@nexastore.com').toLowerCase();
 const password=process.env.SEED_ADMIN_PASSWORD||'Nexa@2026!';
 if(password.length<8)throw new Error('SEED_ADMIN_PASSWORD precisa ter no mínimo 8 caracteres.');
 let [[admin]]=await pool.query('SELECT id FROM usuarios WHERE email=?',[email]);
 if(!admin){const hash=await bcrypt.hash(password,12);const [r]=await pool.query('INSERT INTO usuarios(nome,email,senha_hash,perfil) VALUES(?,?,?,"admin")',['Administrador NEXA',email,hash]);admin={id:r.insertId};console.log('Administrador criado:',email);}
 for(const name of categories)await pool.query('INSERT INTO categorias(nome,descricao) VALUES(?,?) ON DUPLICATE KEY UPDATE nome=VALUES(nome)',[name,`Categoria ${name}`]);
 for(const [i,name] of suppliers.entries()){
  const em=`contato${i+1}@fornecedor.exemplo`;
  const [[f]]=await pool.query('SELECT id FROM fornecedores WHERE email=?',[em]);
  if(!f)await pool.query('INSERT INTO fornecedores(nome,email,telefone,cidade) VALUES(?,?,?,?)',[name,em,`(41) 3000-${String(1111+i).padStart(4,'0')}`,'Paranaguá - PR']);
 }
 const [catRows]=await pool.query('SELECT id,nome FROM categorias');const catMap=new Map(catRows.map(r=>[r.nome,r.id]));
 const [supRows]=await pool.query('SELECT id,nome FROM fornecedores');const supMap=new Map(supRows.map(r=>[r.nome,r.id]));
 for(const [i,p] of products.entries()){
  const [name,sku,cat,sup,cost,price,stock,min]=p;
  const [[existing]]=await pool.query('SELECT id FROM produtos WHERE sku=?',[sku]);
  if(!existing){
   const [r]=await pool.query('INSERT INTO produtos(nome,sku,descricao,categoria_id,fornecedor_id,custo,preco,estoque,estoque_minimo) VALUES(?,?,?,?,?,?,?,?,?)',[name,sku,'Item de demonstração NEXA STORE',catMap.get(categories[cat-1]),supMap.get(suppliers[sup-1]),cost,price,stock,min]);
   await pool.query('INSERT INTO movimentacoes_estoque(produto_id,usuario_id,tipo,quantidade,estoque_anterior,estoque_posterior,observacao) VALUES(?, ?,"entrada",?,0,?,"Carga inicial de demonstração")',[r.insertId,admin.id,stock,stock]);
  }
 }
 for(const [i,nome] of clients.entries()){
  const mail=`cliente${i+1}@exemplo.com`;
  await pool.query('INSERT INTO clientes(nome,email,telefone,endereco) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE nome=VALUES(nome)',[nome,mail,`(41) 99999-${String(1000+i)}`,'Paranaguá, Paraná']);
 }
 const [[count]]=await pool.query('SELECT COUNT(*) total FROM vendas');
 if(Number(count.total)===0){
  const [productRows]=await pool.query('SELECT id,sku FROM produtos');const bySku=new Map(productRows.map(r=>[r.sku,r.id]));
  const [clientRows]=await pool.query('SELECT id,email FROM clientes');const byMail=new Map(clientRows.map(r=>[r.email,r.id]));
  for(let i=0;i<24;i++){
   const k1=(i*7)%18+1,k2=(i*11+4)%18+1;
   const sku1=`NEX-${String(k1).padStart(3,'0')}`;const sku2=`NEX-${String(k2===k1?(k2%18+1):k2).padStart(3,'0')}`;
   const date=new Date(Date.now()-((23-i)*24*60*60*1000));
   const d=date.toISOString().slice(0,19).replace('T',' ');
   await createSale({itens:[{produto_id:bySku.get(sku1),quantidade:1+i%3},{produto_id:bySku.get(sku2),quantidade:1+(i%2)}],cliente_id:byMail.get(`cliente${(i%10)+1}@exemplo.com`),metodo:['pix','dinheiro','debito','credito'][i%4],desconto:i%6===0?10:0,chave_idempotencia:`nexa-seed-2026-${i}`,usuario_id:admin.id,criada_em:d});
  }
  console.log('24 vendas fictícias e movimentos registrados com transação.');
 }
 console.log('Dados de demonstração prontos. Login:',email,'| Senha configurada em SEED_ADMIN_PASSWORD.');
}
run().catch(e=>{console.error('Falha ao preparar dados:',e.message);process.exitCode=1;}).finally(()=>pool.end());
