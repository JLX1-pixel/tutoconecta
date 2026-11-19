import { database as db } from './database.js';
import { randomUUID } from 'node:crypto';
import type { Identity } from './auth.js';
import { z } from 'zod';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const active="('pending','accepted','completed')";
const uid=()=>randomUUID();
const now=()=>new Date().toISOString();
const profileSchema=z.object({name:z.string().trim().min(2).max(80),role:z.enum(['student','tutor','both']),subject:z.string().trim().max(80),level:z.enum(['Primaria','Secundaria','Universitario','Todos los niveles']),city:z.string().trim().max(80),bio:z.string().trim().max(1200)}).refine(x=>x.role==='student'||(x.subject.length>1&&x.bio.length>9),{message:'Completa la materia y una descripción de al menos 10 caracteres.'});
export async function handle(req:Request,user:Identity|null){
 try{
 const raw=req.method==='POST'?await req.text():'';
 if(raw.length>10000)return reply({error:'Solicitud demasiado grande.'},413);

 const url=new URL(req.url);const path=url.pathname.replace('/api/','');

 const one=async(q:string,...v:any[])=>db.prepare(q).bind(...v).first<any>();
 const all=async(q:string,...v:any[])=>(await db.prepare(q).bind(...v).all()).results;
 const profile=user?await one('SELECT * FROM profiles WHERE id=?',user.userId):null;
 if(req.method==='GET'){
  if(path==='me')return reply({identity:user?{name:user.displayName,email:user.email}:null,profile});
  if(path==='tutors'){
   const tutors=await all(`SELECT p.id,p.name,p.subject,p.level,p.city,p.bio, (SELECT ROUND(AVG(r.score),1) FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN slots s ON s.id=b.slot_id WHERE s.tutor_id=p.id) rating,(SELECT COUNT(*) FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN slots s ON s.id=b.slot_id WHERE s.tutor_id=p.id) review_count FROM profiles p WHERE p.role IN ('tutor','both') ORDER BY p.name`);
   const available=await all(`SELECT s.id,s.tutor_id,s.start,s.mode FROM slots s WHERE s.start>? AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status IN ${active}) ORDER BY s.start`,now());
   return reply({tutors,slots:available});
  }
  if(!profile)return reply({error:'Inicia sesión y completa tu perfil.'},401);
  if(path==='bookings')return reply({bookings:await all(`SELECT b.*,s.tutor_id,s.mode,CASE WHEN b.status IN ('accepted','completed') THEN s.location ELSE '' END location,p.name tutor_name,p.subject,u.name student_name,r.score,r.comment FROM bookings b JOIN slots s ON s.id=b.slot_id JOIN profiles p ON p.id=s.tutor_id JOIN profiles u ON u.id=b.student_id LEFT JOIN reviews r ON r.booking_id=b.id WHERE b.student_id=? OR s.tutor_id=? ORDER BY b.start DESC`,profile.id,profile.id)});
  if(path==='slots')return reply({slots:await all(`SELECT s.*,b.status FROM slots s LEFT JOIN bookings b ON b.slot_id=s.id AND b.status IN ${active} WHERE s.tutor_id=? ORDER BY s.start`,profile.id)});
  if(path==='notifications')return reply({notifications:await all('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100',profile.id)});
  return reply({error:'Ruta no encontrada.'},404);
 }
 if(req.method!=='POST')return reply({error:'Método no permitido.'},405);
 if(!user)return reply({error:'Inicia sesión para continuar.'},401);
 if(req.headers.get('origin')!==url.origin)return reply({error:'Origen de solicitud no permitido.'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Se requiere JSON.'},415);
 
 const body=JSON.parse(raw);
 const note=(id:string,message:string)=>db.prepare('INSERT INTO notifications(id,user_id,message,created_at) VALUES(?,?,?,?)').bind(uid(),id,message,now());
 if(path==='profile'){
  const p=profileSchema.parse(body);
  await db.prepare(`INSERT INTO profiles(id,name,email,role,subject,level,city,bio,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,role=excluded.role,subject=excluded.subject,level=excluded.level,city=excluded.city,bio=excluded.bio`).bind(user.userId,p.name,user.email,p.role,p.subject,p.level,p.city,p.bio,now()).run();
  return reply({ok:true});
 }
 if(!profile)return reply({error:'Completa primero tu perfil.'},403);
 if(path==='slots'){
  if(!['tutor','both'].includes(profile.role))return reply({error:'Necesitas un perfil de tutor.'},403);
  const p=z.object({start:z.string().datetime(),mode:z.enum(['Virtual','Presencial']),location:z.string().trim().max(200)}).parse(body);
  const d=new Date(p.start);if(d.getTime()<=Date.now()||d.getTime()>Date.now()+366*86400000||d.getUTCMinutes()!==0||d.getUTCSeconds()!==0||d.getUTCMilliseconds()!==0)return reply({error:'Elige una hora futura en punto, dentro del próximo año.'},400);
  if(p.mode==='Presencial'&&p.location.length<5)return reply({error:'Indica un punto de encuentro para la sesión presencial.'},400);
  await db.prepare('INSERT INTO slots(id,tutor_id,start,mode,location) VALUES(?,?,?,?,?)').bind(uid(),profile.id,d.toISOString(),p.mode,p.mode==='Presencial'?p.location:'').run();return reply({ok:true});
 }
 if(path==='slots/delete'){
  const p=z.object({id:z.string().uuid()}).parse(body);
  const result=await db.prepare('DELETE FROM slots WHERE id=? AND tutor_id=? AND NOT EXISTS(SELECT 1 FROM bookings WHERE slot_id=slots.id)').bind(p.id,profile.id).run();
  if(!result.meta.changes)return reply({error:'No se puede eliminar: el horario tiene historial de reservas o no te pertenece.'},409);return reply({ok:true});
 }
 if(path==='bookings'){
  if(!['student','both'].includes(profile.role))return reply({error:'Activa el rol de estudiante en tu perfil.'},403);
  const p=z.object({slotId:z.string().uuid(),topic:z.string().trim().min(3).max(600)}).parse(body);
  const s=await one("SELECT s.*,p.role FROM slots s JOIN profiles p ON p.id=s.tutor_id WHERE s.id=?",p.slotId);
  if(!s||!['tutor','both'].includes(s.role)||s.start<=now())return reply({error:'Este horario ya no está disponible.'},409);
  if(s.tutor_id===profile.id)return reply({error:'Elige un tutor diferente a tu propio perfil.'},400);
  await db.batch([db.prepare('INSERT INTO bookings(id,slot_id,student_id,start,topic,room,created_at) VALUES(?,?,?,?,?,?,?)').bind(uid(),s.id,profile.id,s.start,p.topic,'TutoConecta-'+uid(),now()),note(s.tutor_id,`${profile.name} solicitó una tutoría. Revisa tus solicitudes.`),note(profile.id,'Solicitud enviada. La reserva está pendiente de la aceptación del tutor.')]);
  return reply({ok:true});
 }
 if(path==='bookings/status'){
  const p=z.object({id:z.string().uuid(),status:z.enum(['accepted','rejected','cancelled','completed'])}).parse(body);
  const b=await one('SELECT b.*,s.tutor_id FROM bookings b JOIN slots s ON s.id=b.slot_id WHERE b.id=?',p.id);
  if(!b)return reply({error:'Reserva no encontrada.'},404);
  const tutor=b.tutor_id===profile.id,student=b.student_id===profile.id;
  const allowed=(p.status==='cancelled'&&(tutor||student)&&['pending','accepted'].includes(b.status)&&b.start>now())||(['accepted','rejected'].includes(p.status)&&tutor&&b.status==='pending'&&b.start>now())||(p.status==='completed'&&tutor&&b.status==='accepted'&&Date.parse(b.start)+3600000<=Date.now());
  if(!allowed)return reply({error:'Esta acción no está permitida para el estado o la hora de la reserva.'},403);
  const updated=await db.prepare('UPDATE bookings SET status=? WHERE id=? AND status=?').bind(p.status,p.id,b.status).run();
  if(!updated.meta.changes)return reply({error:'La reserva cambió. Actualiza la página.'},409);
  const labels:Record<string,string>={accepted:'confirmada',rejected:'rechazada',cancelled:'cancelada',completed:'finalizada'};
  await db.batch([note(b.student_id,`Tu tutoría fue ${labels[p.status]}. Consulta los detalles en Mis tutorías.`),note(b.tutor_id,`Tutoría ${labels[p.status]}. Tu agenda está actualizada.`)]);
  return reply({ok:true});
 }
 if(path==='reviews'){
  const p=z.object({bookingId:z.string().uuid(),score:z.number().int().min(1).max(5),comment:z.string().trim().max(600)}).parse(body);
  const b=await one("SELECT * FROM bookings WHERE id=? AND student_id=? AND status='completed'",p.bookingId,profile.id);
  if(!b)return reply({error:'Solo puedes valorar tus tutorías finalizadas.'},403);
  await db.prepare('INSERT INTO reviews(id,booking_id,score,comment,created_at) VALUES(?,?,?,?,?)').bind(uid(),p.bookingId,p.score,p.comment,now()).run();return reply({ok:true});
 }
 if(path==='notifications/read'){await db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').bind(profile.id).run();return reply({ok:true});}
 return reply({error:'Ruta no encontrada.'},404);
 }catch(error:any){
  if(error instanceof z.ZodError)return reply({error:error.issues[0]?.message||'Revisa los datos ingresados.'},400);
  if(error instanceof SyntaxError)return reply({error:'JSON inválido.'},400);
  if(error?.code==='23505')return reply({error:'El horario ya está ocupado o este registro ya existe. Actualiza e intenta con otro horario.'},409);
  console.error('API failure',error?.code||error?.name);return reply({error:'No fue posible completar la operación. Intenta nuevamente.'},500);
 }
}
