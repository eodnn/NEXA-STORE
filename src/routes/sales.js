const router=require('express').Router();
const pool=require('../config/db');
const {httpError,money,validId}=require('../utils/helpers');
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const methods=['pix','dinheiro','debito','credito'];

// Uma operação indivisível: se algo falha, ROLLBACK desfaz venda e estoque.
async function createSale({itens,cliente_id,metodo,desconto=0,chave_idempotencia,usuario_id,criada_em=null}){
 if(!Array.isArray(itens)||!itens.length||itens.length>50)throw httpError(400,'Adicione de 1 a 50 produtos.');
 if(!methods.includes(metodo))throw httpError(400,'Forma de pagamento inválida.');
 if(typeof chave_idempotencia!=='string'||chave_idempotencia.length<8||chave_idempotencia.length>80)throw httpError(400,'Identificador da operação inválido.');
 if(cliente_id!==null&&cliente_id!==undefined&&cliente_id!==''&&!validId(cliente_id))throw httpError(400,'Cliente inválido.');
 if(!Number.isFinite(Number(desconto))||Number(desconto)<0)throw httpError(400,'Desconto inválido.');
 const items=itens.map(i=>({id:Number(i.produto_id),q:Number(i.quantidade)}));
 if(items.some(i=>!validId(i.id)||!Number.isInteger(i.q)||i.q<1||i.q>10000))throw httpError(400,'Produto ou quantidade inválida.');
 if(new Set(items.map(i=>i.id)).size!==items.length)throw httpError(400,'Não repita um produto na mesma venda.');
 const cn=await pool.getConnection();
 try{
  await cn.beginTransaction();
  const [[previous]]=await cn.query('SELECT id,codigo,total FROM vendas WHERE chave_idempotencia=?',[chave_idempotencia]);
  if(previous){await cn.rollback();return {...previous,repetida:true};}
  if(cliente_id){const [[c]]=await cn.query('SELECT id FROM clientes WHERE id=? AND ativo=1',[cliente_id]);if(!c)throw httpError(400,'Cliente inativo ou inexistente.');}
  // Ordem fixa impede deadlocks para compras concorrentes; FOR UPDATE trava o estoque.
  const quantities=new Map(items.map(i=>[i.id,i.q]));
  const placeholders=items.map(()=>'?').join(',');
  const [products]=await cn.query(`SELECT id,nome,preco,estoque,ativo FROM produtos WHERE id IN (${placeholders}) ORDER BY id FOR UPDATE`,items.map(i=>i.id));
  if(products.length!==items.length)throw httpError(400,'Um ou mais produtos não foram encontrados.');
  let subtotalCent=0;
  for(const p of products){if(!p.ativo)throw httpError(400,`${p.nome} está inativo.`);if(p.estoque<quantities.get(p.id))throw httpError(409,`Estoque insuficiente: ${p.nome} (disponível: ${p.estoque}).`);subtotalCent+=Math.round(Number(p.preco)*100)*quantities.get(p.id);}
  const descontoCent=Math.round(Number(desconto)*100);
  if(descontoCent>subtotalCent||descontoCent>100000000)throw httpError(400,'Desconto excede o valor da venda.');
  const subtotal=subtotalCent/100,total=(subtotalCent-descontoCent)/100;
  if(total<=0)throw httpError(400,'Total deve ser maior que zero.');
  const code=`NX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const [r]=await cn.query('INSERT INTO vendas (codigo,chave_idempotencia,cliente_id,usuario_id,subtotal,desconto,total,criada_em) VALUES (?,?,?,?,?,?,?,COALESCE(?,NOW()))',[code,chave_idempotencia,cliente_id||null,usuario_id,subtotal,descontoCent/100,total,criada_em]);
  for(const p of products){
   const q=quantities.get(p.id),prev=p.estoque,next=prev-q,unit=money(p.preco);
   await cn.query('INSERT INTO itens_venda(venda_id,produto_id,quantidade,preco_unitario,total) VALUES(?,?,?,?,?)',[r.insertId,p.id,q,unit,money(unit*q)]);
   await cn.query('UPDATE produtos SET estoque=? WHERE id=?',[next,p.id]);
   await cn.query('INSERT INTO movimentacoes_estoque(produto_id,usuario_id,venda_id,tipo,quantidade,estoque_anterior,estoque_posterior,observacao,criada_em) VALUES(?,?,?,"saida",?,?,?,?,COALESCE(?,NOW()))',[p.id,usuario_id,r.insertId,-q,prev,next,'Venda '+code,criada_em]);
  }
  await cn.query('INSERT INTO pagamentos(venda_id,metodo,valor) VALUES(?,?,?)',[r.insertId,metodo,total]);
  await cn.commit();return {id:r.insertId,codigo:code,total,repetida:false};
 }catch(err){await cn.rollback();if(err.code==='ER_DUP_ENTRY'&&String(err.sqlMessage||'').includes('chave_idempotencia')){const [[existing]]=await pool.query('SELECT id,codigo,total FROM vendas WHERE chave_idempotencia=?',[chave_idempotencia]);if(existing)return {...existing,repetida:true};}throw err;}finally{cn.release();}
}
router.get('/',asyncRoute(async(req,res)=>{
 const status=['concluida','cancelada'].includes(req.query.status)?req.query.status:null;
 const [rows]=await pool.query(`SELECT v.id,v.codigo,v.criada_em,v.subtotal,v.desconto,v.total,v.status,
 COALESCE(c.nome,'Consumidor final') AS cliente_nome,u.nome AS operador_nome,p.metodo
 FROM vendas v LEFT JOIN clientes c ON c.id=v.cliente_id JOIN usuarios u ON u.id=v.usuario_id LEFT JOIN pagamentos p ON p.venda_id=v.id
 ${status?'WHERE v.status=?':''} ORDER BY v.criada_em DESC,v.id DESC LIMIT 300`,status?[status]:[]);res.json(rows);
}));
router.get('/:id',asyncRoute(async(req,res)=>{
 if(!validId(req.params.id))throw httpError(400,'ID inválido.');
 const [[sale]]=await pool.query(`SELECT v.*,COALESCE(c.nome,'Consumidor final') AS cliente_nome,u.nome AS operador_nome,p.metodo,p.status AS pagamento_status FROM vendas v LEFT JOIN clientes c ON c.id=v.cliente_id JOIN usuarios u ON u.id=v.usuario_id LEFT JOIN pagamentos p ON p.venda_id=v.id WHERE v.id=?`,[req.params.id]);
 if(!sale)throw httpError(404,'Venda não encontrada.');
 const [itens]=await pool.query('SELECT iv.*,p.nome AS produto_nome,p.sku FROM itens_venda iv JOIN produtos p ON p.id=iv.produto_id WHERE iv.venda_id=?',[req.params.id]);
 res.json({...sale,itens});
}));
router.post('/',asyncRoute(async(req,res)=>{
 const sale=await createSale({...req.body,usuario_id:req.user.id});res.status(sale.repetida?200:201).json(sale);
}));
router.post('/:id/cancelar',asyncRoute(async(req,res)=>{
 if(!validId(req.params.id))throw httpError(400,'ID inválido.');
 const cn=await pool.getConnection();
 try{
  await cn.beginTransaction();
  const [[sale]]=await cn.query('SELECT id,codigo,status FROM vendas WHERE id=? FOR UPDATE',[req.params.id]);
  if(!sale)throw httpError(404,'Venda não encontrada.');if(sale.status==='cancelada')throw httpError(409,'Venda já está cancelada.');
  const [items]=await cn.query('SELECT produto_id,quantidade FROM itens_venda WHERE venda_id=? ORDER BY produto_id',[sale.id]);
  for(const item of items){
   const [[prod]]=await cn.query('SELECT estoque FROM produtos WHERE id=? FOR UPDATE',[item.produto_id]);
   const next=prod.estoque+item.quantidade;
   await cn.query('UPDATE produtos SET estoque=? WHERE id=?',[next,item.produto_id]);
   await cn.query('INSERT INTO movimentacoes_estoque(produto_id,usuario_id,venda_id,tipo,quantidade,estoque_anterior,estoque_posterior,observacao) VALUES(?,?,?,"estorno",?,?,?,?)',[item.produto_id,req.user.id,sale.id,item.quantidade,prod.estoque,next,'Cancelamento '+sale.codigo]);
  }
  await cn.query('UPDATE vendas SET status="cancelada",cancelada_em=NOW() WHERE id=?',[sale.id]);
  await cn.query('UPDATE pagamentos SET status="estornado" WHERE venda_id=?',[sale.id]);
  await cn.commit();res.json({mensagem:'Venda cancelada e estoque restituído.'});
 }catch(err){await cn.rollback();throw err;}finally{cn.release();}
}));
module.exports=router;
module.exports.createSale=createSale;
