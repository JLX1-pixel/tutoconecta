import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {migrate,pool} from './database.js';
import {auth,identity} from './auth.js';
import {handle} from './domain.js';
const app=express();
if(process.env.NODE_ENV==='production')app.set('trust proxy',1);
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{'frame-src':["'self'",'https://meet.jit.si'],'script-src':["'self'"],'upgrade-insecure-requests':process.env.NODE_ENV==='production'?[]:null}},crossOriginEmbedderPolicy:false}));
app.use('/api',(_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
app.get('/api/health',async(_req,res)=>{try{await pool.query('SELECT 1');res.json({status:'ok',database:'connected'});}catch{res.status(503).json({status:'unavailable'});}});
app.use('/api',(req,res,next)=>{
 if(req.method==='POST'){
  if(req.headers.origin!==`${req.protocol}://${req.get('host')}`){res.status(403).json({error:'Origen de solicitud no permitido.'});return;}
  if(!req.is('application/json')){res.status(415).json({error:'Se requiere JSON.'});return;}
 }next();
});
app.use(express.json({limit:'10kb'}));
const authLimiter=rateLimit({windowMs:15*60000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Demasiados intentos. Espera 15 minutos antes de intentarlo de nuevo.'}});
app.post('/api/auth/:action',authLimiter,auth);
app.use('/api',async(req,res,next)=>{
 try{
  const headers=new Headers();for(const key of ['origin','content-type']){const v=req.get(key);if(v)headers.set(key,v);}
  const request=new Request(`${req.protocol}://${req.get('host')}${req.originalUrl}`,{method:req.method,headers,...(req.method==='POST'?{body:JSON.stringify(req.body)}:{})});
  const response=await handle(request,await identity(req));res.status(response.status).type('json').send(await response.text());
 }catch(error){next(error);}
});
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
app.use(express.static(path.join(root,'dist')));
app.get('/{*path}',(_req,res)=>res.sendFile(path.join(root,'dist/index.html')));
app.use((error:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{const code=error.type==='entity.too.large'?413:error instanceof SyntaxError?400:500;console.error('Request failed',error.type||error.name);res.status(code).json({error:code===413?'Solicitud demasiado grande.':code===400?'JSON inválido.':'No fue posible procesar la solicitud.'});});
await migrate();
await pool.query('DELETE FROM sessions WHERE expires_at<now()');
const server=app.listen(Number(process.env.PORT)||5180,'0.0.0.0',()=>console.log('TutoConecta listo en puerto '+(process.env.PORT||5180)));
process.on('SIGTERM',()=>server.close(()=>{pool.end().then(()=>process.exit(0));}));
