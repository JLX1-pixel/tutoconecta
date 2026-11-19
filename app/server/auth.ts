import {randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash} from 'node:crypto';
import {promisify} from 'node:util';
import type {Request,Response} from 'express';
import {z} from 'zod';
import {pool} from './database.js';
const scrypt=promisify(scryptCallback);
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
const cookieName=process.env.NODE_ENV==='production'?'__Host-tutoconecta':'tutoconecta';
const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
export type Identity={userId:string;email:string;displayName:string};
const credentials=z.object({email:z.string().trim().email().max(254).transform(x=>x.toLowerCase()),password:z.string().min(12,'La contraseña necesita al menos 12 caracteres.').max(128)});
async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64) as Buffer;return salt+':'+key.toString('hex');}
async function matches(password:string,hash:string){const [salt,key]=hash.split(':');const result=await scrypt(password,salt,64) as Buffer;return timingSafeEqual(result,Buffer.from(key,'hex'));}
const fakeHash=await hashPassword(randomBytes(32).toString('hex'));
function token(req:Request){return req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';}
async function createSession(res:Response,id:string){
 const value=randomBytes(32).toString('base64url');
 await pool.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'7 days\')',[digest(value),id]);
 res.cookie(cookieName,value,{...cookieOptions,maxAge:7*86400000});
}
export async function identity(req:Request):Promise<Identity|null>{
 const value=token(req);if(!value||value.length>100)return null;
 const result=await pool.query('SELECT a.id,a.email,a.name FROM sessions s JOIN accounts a ON a.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[digest(value)]);
 const a=result.rows[0];return a?{userId:a.id,email:a.email,displayName:a.name}:null;
}
export async function auth(req:Request,res:Response){
 try{
  const action=req.path.split('/').pop();
  if(action==='logout'){await pool.query('DELETE FROM sessions WHERE token_hash=$1',[digest(token(req))]);res.clearCookie(cookieName,cookieOptions);res.json({ok:true});return;}
  const data=credentials.parse(req.body);
  if(action==='register'){
   const name=z.string().trim().min(2).max(80).parse(req.body.name);
   const recoveryCode=randomBytes(24).toString('base64url');const id=randomUUID();
   const passwordHash=await hashPassword(data.password);
   await pool.query('INSERT INTO accounts(id,email,name,password_hash,recovery_hash) VALUES($1,$2,$3,$4,$5)',[id,data.email,name,passwordHash,digest(recoveryCode)]);
   await createSession(res,id);res.status(201).json({ok:true,recoveryCode});return;
  }
  if(action==='login'){
   const account=(await pool.query('SELECT * FROM accounts WHERE email=$1',[data.email])).rows[0];
   const valid=await matches(data.password,account?.password_hash||fakeHash);
   if(!account||!valid){res.status(401).json({error:'Correo o contraseña incorrectos.'});return;}
   await createSession(res,account.id);res.json({ok:true});return;
  }
  if(action==='reset'){
   const code=z.string().min(20).max(100).parse(req.body.recoveryCode);
   const recoveryCode=randomBytes(24).toString('base64url');const passwordHash=await hashPassword(data.password);
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    const result=await client.query('UPDATE accounts SET password_hash=$1,recovery_hash=$2 WHERE email=$3 AND recovery_hash=$4 RETURNING id',[passwordHash,digest(recoveryCode),data.email,digest(code)]);
    if(!result.rowCount){await client.query('ROLLBACK');res.status(401).json({error:'El correo o el código de recuperación no coinciden.'});return;}
    await client.query('DELETE FROM sessions WHERE user_id=$1',[result.rows[0].id]);await client.query('COMMIT');
    await createSession(res,result.rows[0].id);res.json({ok:true,recoveryCode});return;
   }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
  res.status(404).json({error:'Ruta no encontrada.'});
 }catch(error:any){
  if(error instanceof z.ZodError){res.status(400).json({error:error.issues[0].message});return;}
  if(error.code==='23505'){res.status(409).json({error:'No se pudo crear la cuenta con ese correo. Si ya tienes una cuenta, inicia sesión.'});return;}
  console.error('Authentication error',error.code||error.name);res.status(500).json({error:'No fue posible completar la operación.'});
 }
}
