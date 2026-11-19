const router=require('express').Router();
const pool=require('../config/db');
const {httpError,validId}=require('../utils/helpers');
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
router.get('/',asyncRoute(async(req,res)=>{
 const [rows]=await pool.query(`SELECT p.id,p.nome,p.sku,p.estoque,p.estoque_minimo,p.ativo,c.nome AS categoria_nome FROM produtos p JOIN categorias c ON c.id=p.categoria_id ORDER BY (p.estoque<=p.estoque_minimo) DESC,p.nome LIMIT 500`);res.json(rows);
}));
router.get('/movimentacoes',asyncRoute(async(req,res)=>{
 const id=validId(req.query.produto_id)?Number(req.query.produto_id):null;
 const [rows]=await pool.query(`SELECT m.*,p.nome AS produto_nome,u.nome AS operador_nome FROM movimentacoes_estoque m JOIN produtos p ON p.id=m.produto_id LEFT JOIN usuarios u ON u.id=m.usuario_id ${id?'WHERE m.produto_id=?':''} ORDER BY m.criada_em DESC,m.id DESC LIMIT 300`,id?[id]:[]);res.json(rows);
}));
router.post('/ajuste',asyncRoute(async(req,res)=>{
 const {produto_id,tipo,quantidade,observacao=''}=req.body||{};
 if(!validId(produto_id)||!['entrada','ajuste'].includes(tipo)||!Number.isInteger(Number(quantidade))||Math.abs(Number(quantidade))>1000000)throw httpError(400,'Informe produto, tipo e quantidade válida.');
 if(tipo==='entrada'&&Number(quantidade)<1)throw httpError(400,'Entrada deve ser positiva.');
 if(tipo==='ajuste'&&Number(quantidade)<0)throw httpError(400,'O saldo final não pode ser negativo.');
 const cn=await pool.getConnection();
 try{
  await cn.beginTransaction();
  const [[p]]=await cn.query('SELECT id,estoque FROM produtos WHERE id=? FOR UPDATE',[produto_id]);if(!p)throw httpError(404,'Produto não encontrado.');
  const next=tipo==='entrada'?p.estoque+Number(quantidade):Number(quantidade);
  if(next>100000000)throw httpError(400,'Quantidade excessiva.');
  await cn.query('UPDATE produtos SET estoque=? WHERE id=?',[next,p.id]);
  await cn.query('INSERT INTO movimentacoes_estoque(produto_id,usuario_id,tipo,quantidade,estoque_anterior,estoque_posterior,observacao) VALUES(?,?,?,?,?,?,?)',[p.id,req.user.id,tipo,next-p.estoque,p.estoque,next,String(observacao).slice(0,255)]);
  await cn.commit();res.json({mensagem:'Estoque atualizado.',anterior:p.estoque,atual:next});
 }catch(err){await cn.rollback();throw err;}finally{cn.release();}
}));
module.exports=router;
