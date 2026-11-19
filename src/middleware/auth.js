const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const SECRET = () => process.env.JWT_SECRET;
async function auth(req, res, next) {
  try {
    const token = /^Bearer (.+)$/i.exec(req.get('authorization') || '')?.[1];
    if (!token || !SECRET()) return res.status(401).json({erro:'Faça login para continuar.'});
    const decoded = jwt.verify(token, SECRET(), { algorithms:['HS256'] });
    const [[user]] = await pool.query('SELECT id, nome, email, perfil, ativo FROM usuarios WHERE id = ?', [decoded.sub]);
    if (!user?.ativo) return res.status(401).json({erro:'Usuário não autorizado.'});
    req.user = user;
    next();
  } catch (err) { if (err.name?.startsWith('Token') || err.name === 'JsonWebTokenError') return res.status(401).json({erro:'Sessão expirada ou inválida.'}); next(err); }
}
function admin(req, res, next) { return req.user?.perfil === 'admin' ? next() : res.status(403).json({erro:'Apenas administradores podem realizar esta ação.'}); }
module.exports = {auth, admin};
