function httpError(status, message) { const err = new Error(message); err.status=status; return err; }
const money = n => Math.round((Number(n) + Number.EPSILON)*100)/100;
function validId(v) { return Number.isInteger(Number(v)) && Number(v)>0; }
function fail(res, fn) { return Promise.resolve().then(fn).catch(e=>res.status(e.status||500).json({erro:e.status?e.message:'Erro interno no servidor.'})); }
module.exports={httpError,money,validId,fail};
