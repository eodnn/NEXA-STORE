const router=require('express').Router();
const pool=require('../config/db');
const bcrypt=require('bcryptjs');
const {admin}=require('../middleware/auth');
const {httpError,validId}=require('../utils/helpers');
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

// Whitelist de tabelas e colunas: jamais interpolar nomes enviados pelo visitante.
const entities={
 categorias:{table:'categorias',fields:['nome','descricao','ativo'],required:['nome'],select:'c.*'},
 fornecedores:{table:'fornecedores',fields:['nome','email','telefone','cnpj','cidade','ativo'],required:['nome']},
 clientes:{table:'clientes',fields:['nome','email','telefone','cpf','endereco','ativo'],required:['nome']},
 produtos:{table:'produtos',fields:['nome','sku','descricao','categoria_id','fornecedor_id','custo','preco','estoque_minimo','ativo'],required:['nome','sku','categoria_id','preco'],extra:'SELECT p.*, c.nome AS categoria_nome, f.nome AS fornecedor_nome FROM produtos p JOIN categorias c ON c.id=p.categoria_id LEFT JOIN fornecedores f ON f.id=p.fornecedor_id'},
 usuarios:{table:'usuarios',fields:['nome','email','perfil','ativo'],required:['nome','email','perfil']}
};
const clean = (key,v)=>{
 if(['nome','sku','email','cpf','cnpj','telefone','cidade','endereco','descricao'].includes(key)){
  if(v===null||v==='') return null;
  if(typeof v!=='string'||v.length>255) throw httpError(400,`Campo ${key} inválido.`);
  const value=v.trim();
  if(['nome','sku'].includes(key)&&!value) throw httpError(400,`${key} não pode ficar vazio.`);
  if(key==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw httpError(400,'E-mail inválido.');
  return key==='email'?value.toLowerCase():value;
 }
 if(key==='ativo') return v===true||v===1||v==='1'?1:0;
 if(key==='perfil'){if(!['admin','operador'].includes(v)) throw httpError(400,'Perfil inválido.');return v;}
 if(['categoria_id','fornecedor_id'].includes(key)){if(v===null||v==='') return null;if(!validId(v))throw httpError(400,`${key} inválido.`);return Number(v);}
 if(['custo','preco'].includes(key)){if(!Number.isFinite(Number(v))||Number(v)<0||Number(v)>9999999 || (key==='preco'&&Number(v)<=0))throw httpError(400,`${key} inválido.`);return Math.round(Number(v)*100)/100;}
 if(key==='estoque_minimo'){if(!Number.isInteger(Number(v))||Number(v)<0||Number(v)>1000000)throw httpError(400,'Estoque mínimo inválido.');return Number(v);}
 return v;
};
router.get('/clientes/:id/historico',asyncRoute(async(req,res)=>{
 if(!validId(req.params.id)) throw httpError(400,'ID inválido.');
 const [rows]=await pool.query(`SELECT v.id,v.codigo,v.total,v.status,v.criada_em,p.metodo FROM vendas v LEFT JOIN pagamentos p ON p.venda_id=v.id WHERE v.cliente_id=? ORDER BY v.criada_em DESC`,[req.params.id]);res.json(rows);
}));
router.get('/:entity',asyncRoute(async(req,res)=>{
 const spec=entities[req.params.entity];if(!spec)throw httpError(404,'Recurso não encontrado.');
 if(req.params.entity==='usuarios'&&req.user.perfil!=='admin')throw httpError(403,'Acesso restrito.');
 const sql=spec.extra||`SELECT ${req.params.entity==='usuarios'?'id,nome,email,perfil,ativo,criado_em':'*'} FROM ${spec.table}`;
 const search=String(req.query.q||'').trim();
 const clauses=[],params=[];
 if(search){const alias=spec.extra?'p.':'';clauses.push(`(${alias}nome LIKE ? ${req.params.entity==='produtos'?'OR p.sku LIKE ?':''})`);params.push('%'+search+'%');if(req.params.entity==='produtos')params.push('%'+search+'%');}
 if(req.params.entity==='produtos'&&validId(req.query.categoria_id)){clauses.push('p.categoria_id=?');params.push(Number(req.query.categoria_id));}
 const order=spec.extra?'p.id': 'id';
 const [rows]=await pool.query(`${sql}${clauses.length?' WHERE '+clauses.join(' AND '):''} ORDER BY ${order} DESC LIMIT 500`,params);res.json(rows);
}));
router.get('/:entity/:id',asyncRoute(async(req,res)=>{
 const spec=entities[req.params.entity];if(!spec||!validId(req.params.id))throw httpError(404,'Recurso não encontrado.');
 if(req.params.entity==='usuarios'&&req.user.perfil!=='admin')throw httpError(403,'Acesso restrito.');
 const sql=spec.extra ? `${spec.extra} WHERE p.id=?`: `SELECT ${req.params.entity==='usuarios'?'id,nome,email,perfil,ativo':'*'} FROM ${spec.table} WHERE id=?`;
 const [[row]]=await pool.query(sql,[req.params.id]);if(!row)throw httpError(404,'Registro não encontrado.');res.json(row);
}));
router.post('/:entity',asyncRoute(async(req,res)=>{
 const spec=entities[req.params.entity];if(!spec)throw httpError(404,'Recurso não encontrado.');
 if(req.params.entity==='usuarios'&&req.user.perfil!=='admin')throw httpError(403,'Acesso restrito.');
 const input=req.body||{};
 for(const k of spec.required)if(input[k]===undefined||input[k]===null||input[k]==='')throw httpError(400,`Campo obrigatório: ${k}.`);
 const keys=spec.fields.filter(k=>Object.prototype.hasOwnProperty.call(input,k));
 if(req.params.entity==='usuarios'){
  if(typeof input.senha!=='string'||input.senha.length<8||input.senha.length>72)throw httpError(400,'Senha com pelo menos 8 caracteres é obrigatória.');
  keys.push('senha_hash');
 }
 if(req.params.entity==='produtos'){
  if(!Number.isInteger(Number(input.estoque||0))||Number(input.estoque||0)<0||Number(input.estoque||0)>1000000)throw httpError(400,'Estoque inicial inválido.');
  keys.push('estoque');
 }
 const vals=keys.map(k=>k==='senha_hash'?null:k==='estoque'?Number(input.estoque||0):clean(k,input[k]));
 if(req.params.entity==='usuarios')vals[keys.indexOf('senha_hash')]=await bcrypt.hash(input.senha,12);
 // Gravação do produto e seu estoque inicial na mesma transação.
 const cn=await pool.getConnection();let id;
 try{
  await cn.beginTransaction();
  const [r]=await cn.query(`INSERT INTO ${spec.table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,vals);
  id=r.insertId;
  if(req.params.entity==='produtos'&&Number(input.estoque||0)>0){
   await cn.query('INSERT INTO movimentacoes_estoque (produto_id,usuario_id,tipo,quantidade,estoque_anterior,estoque_posterior,observacao) VALUES (?, ?, "entrada", ?,0,?,"Estoque inicial")',[id,req.user.id,Number(input.estoque),Number(input.estoque)]);
  }
  await cn.commit();
 }catch(e){await cn.rollback();throw e;}finally{cn.release();}
 res.status(201).json({id,mensagem:'Cadastro realizado.'});
}));
router.put('/:entity/:id',asyncRoute(async(req,res)=>{
 const spec=entities[req.params.entity];if(!spec||!validId(req.params.id))throw httpError(404,'Recurso não encontrado.');
 if(req.params.entity==='usuarios'&&req.user.perfil!=='admin')throw httpError(403,'Acesso restrito.');
 if(req.params.entity==='usuarios'&&Number(req.params.id)===req.user.id&&req.body?.ativo===false)throw httpError(400,'Você não pode desativar sua própria conta.');
 const input=req.body||{};const keys=spec.fields.filter(k=>Object.prototype.hasOwnProperty.call(input,k));
 if(!keys.length)throw httpError(400,'Nenhum campo para atualizar.');
 for(const k of spec.required)if(keys.includes(k)&&(input[k]===null||input[k]===''))throw httpError(400,`${k} não pode estar vazio.`);
 const vals=keys.map(k=>clean(k,input[k]));
 const [r]=await pool.query(`UPDATE ${spec.table} SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=?`,[...vals,req.params.id]);
 if(!r.affectedRows)throw httpError(404,'Registro não encontrado.');res.json({mensagem:'Registro atualizado.'});
}));
router.delete('/:entity/:id',asyncRoute(async(req,res)=>{
 const spec=entities[req.params.entity];if(!spec||!validId(req.params.id))throw httpError(404,'Recurso não encontrado.');
 if(req.params.entity==='usuarios'&&req.user.perfil!=='admin')throw httpError(403,'Acesso restrito.');
 if(req.params.entity==='usuarios'&&Number(req.params.id)===req.user.id)throw httpError(400,'Não é possível desativar sua própria conta.');
 // Exclusão lógica preserva históricos e FKs, inclusive vendas.
 const [r]=await pool.query(`UPDATE ${spec.table} SET ativo=0 WHERE id=?`,[req.params.id]);
 if(!r.affectedRows)throw httpError(404,'Registro não encontrado.');res.json({mensagem:'Registro desativado, histórico preservado.'});
}));
module.exports=router;
