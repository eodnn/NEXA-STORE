const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const {auth} = require('../middleware/auth');
const {httpError} = require('../utils/helpers');
const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
router.post('/login', asyncRoute(async(req,res)=>{
 const {email,senha}=req.body||{};
 if(typeof email!=='string'||typeof senha!=='string') throw httpError(400,'Informe e-mail e senha.');
 const [[u]]=await pool.query('SELECT * FROM usuarios WHERE email=? AND ativo=1 LIMIT 1',[email.trim().toLowerCase()]);
 // Tempo de comparação similar para contas inexistentes.
 const match=await bcrypt.compare(senha, u?.senha_hash || '$2a$10$2b2L7FX1yzctMpYBiIMoXOCtp3SwN2Lq/UJLRKZ2YRo2VGYtuB7Ne');
 if(!u||!match) throw httpError(401,'E-mail ou senha incorretos.');
 if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32) throw httpError(500,'JWT_SECRET precisa ter 32 caracteres ou mais no .env.');
 const token=jwt.sign({sub:u.id,perfil:u.perfil},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'8h',algorithm:'HS256'});
 res.json({token,usuario:{id:u.id,nome:u.nome,email:u.email,perfil:u.perfil}});
}));
router.get('/me',auth,(req,res)=>res.json(req.user));
router.put('/senha',auth,asyncRoute(async(req,res)=>{
 const {atual,nova}=req.body||{};
 if(typeof nova!=='string'||nova.length<8||nova.length>72) throw httpError(400,'A nova senha deve ter 8 a 72 caracteres.');
 const [[user]]=await pool.query('SELECT senha_hash FROM usuarios WHERE id=?',[req.user.id]);
 if(typeof atual!=='string'||!await bcrypt.compare(atual,user.senha_hash)) throw httpError(400,'Senha atual incorreta.');
 await pool.query('UPDATE usuarios SET senha_hash=? WHERE id=?',[await bcrypt.hash(nova,12),req.user.id]);
 res.json({mensagem:'Senha alterada com sucesso.'});
}));
module.exports=router;
