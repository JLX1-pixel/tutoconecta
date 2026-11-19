import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
const base=process.env.TEST_URL||'http://127.0.0.1:5180';
if(new URL(base).hostname!=='127.0.0.1'||!process.env.DATABASE_URL?.includes('127.0.0.1'))throw new Error('Estas pruebas solo se ejecutan sobre una base local aislada.');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const suffix=randomUUID(),password='Prueba-local-2026-'+suffix;
type Client={cookie:string;email:string};
const a={cookie:'',email:`tutor-${suffix}@example.test`},b={cookie:'',email:`student-${suffix}@example.test`},c={cookie:'',email:`other-${suffix}@example.test`},guest={cookie:'',email:''};
let checks=0;
async function call(client:Client,path:string,data?:unknown,expected=200,origin=base){
 const response=await fetch(base+'/api/'+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json',Origin:origin}),Cookie:client.cookie},body:data===undefined?undefined:JSON.stringify(data)});
 const body=await response.json();assert.equal(response.status,expected,`${path}: ${JSON.stringify(body)}`);checks++;
 const cookie=response.headers.get('set-cookie');if(cookie){assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Lax/i);client.cookie=cookie.split(';')[0];}return body;
}
try{
 await call(guest,'health');await call(guest,'tutors');assert.equal((await call(guest,'me')).identity,null);
 await call(guest,'profile',{},403,'https://wrong.example');
 await call(guest,'profile',{},401);
 await call(guest,'auth/register',{email:a.email,password:'short',name:'Prueba'},400);
 const registration=await call(a,'auth/register',{email:a.email,password,name:'Tutor QA'},201);assert.ok(registration.recoveryCode);
 await call(b,'auth/register',{email:b.email,password,name:'Estudiante QA'},201);
 await call(c,'auth/register',{email:c.email,password,name:'Otro QA'},201);
 await call(guest,'auth/register',{email:a.email,password,name:'Duplicado'},409);
 await call(guest,'auth/login',{email:a.email,password:'Incorrecta-123456'},401);
 const profile={name:'Tutor QA',role:'tutor',subject:'Matemáticas',level:'Universitario',city:'Barranquilla',bio:'Acompañamiento para cálculo y álgebra.'};
 await call(a,'profile',profile);await call(b,'profile',{...profile,name:'Estudiante QA',role:'student'});await call(c,'profile',{...profile,name:'Otro QA',role:'student'});
 const me=(await call(a,'me')).profile;
 const start=new Date(Date.now()+3*86400000);start.setUTCMinutes(0,0,0);
 await call(b,'slots',{start:start.toISOString(),mode:'Virtual',location:''},403);
 await call(a,'slots',{start:'2020-01-01T10:00:00.000Z',mode:'Virtual',location:''},400);
 await call(a,'slots',{start:start.toISOString(),mode:'Presencial',location:'Biblioteca de pruebas'});
 await call(a,'slots',{start:start.toISOString(),mode:'Virtual',location:''},409);
 const slot=(await call(a,'slots')).slots[0];
 const publicSlot=(await call(guest,'tutors')).slots.find((s:any)=>s.id===slot.id);assert.equal(publicSlot.location,undefined);
 await call(b,'bookings',{slotId:slot.id,topic:'Practicar derivadas'});
 await call(c,'bookings',{slotId:slot.id,topic:'Reserva simultánea'},409);
 let booking=(await call(b,'bookings')).bookings[0];assert.equal(booking.location,'');
 await call(c,'bookings/status',{id:booking.id,status:'accepted'},403);
 await call(b,'bookings/status',{id:booking.id,status:'accepted'},403);
 await call(a,'bookings/status',{id:booking.id,status:'accepted'});
 booking=(await call(b,'bookings')).bookings[0];assert.equal(booking.location,'Biblioteca de pruebas');assert.equal(booking.status,'accepted');
 await call(a,'bookings/status',{id:booking.id,status:'completed'},403);
 await call(b,'reviews',{bookingId:booking.id,score:5,comment:'Prematuro'},403);
 await call(a,'slots/delete',{id:slot.id},409);
 await call(b,'bookings/status',{id:booking.id,status:'cancelled'});
 await call(c,'bookings',{slotId:slot.id,topic:'Segundo estudiante'});
 const second=(await call(c,'bookings')).bookings[0];await call(a,'bookings/status',{id:second.id,status:'rejected'});
 await call(b,'bookings',{slotId:slot.id,topic:'Nueva solicitud'});
 const third=(await call(b,'bookings')).bookings.find((x:any)=>x.status==='pending');await call(a,'bookings/status',{id:third.id,status:'accepted'});
 // Move only this isolated test fixture into the past to exercise completion rules.
 await pool.query('UPDATE bookings SET start=$1 WHERE id=$2',[new Date(Date.now()-7200000).toISOString(),third.id]);
 await call(a,'bookings/status',{id:third.id,status:'completed'});
 await call(c,'reviews',{bookingId:third.id,score:5,comment:'No soy el dueño'},403);
 await call(b,'reviews',{bookingId:third.id,score:5,comment:'Explicación clara.'});
 await call(b,'reviews',{bookingId:third.id,score:4,comment:'Duplicado'},409);
 assert.equal((await call(guest,'tutors')).tutors.find((x:any)=>x.id===me.id).rating,5);
 assert.ok((await call(b,'notifications')).notifications.length>0);await call(b,'notifications/read',{});
 assert.ok((await call(b,'notifications')).notifications.every((x:any)=>x.read===1));
 const oldCookie=a.cookie;
 await call(a,'auth/reset',{email:a.email,password:password+'new',recoveryCode:'wrong-recovery-code-123456'},401);
 const reset=await call(a,'auth/reset',{email:a.email,password:password+'new',recoveryCode:registration.recoveryCode});assert.notEqual(reset.recoveryCode,registration.recoveryCode);
 assert.equal((await call({cookie:oldCookie,email:a.email},'me')).identity,null);
 await call(guest,'auth/login',{email:a.email,password},401);
 await call(a,'auth/reset',{email:a.email,password,recoveryCode:registration.recoveryCode},401);
 await call(a,'auth/logout',{});assert.equal((await call(a,'me')).identity,null);
 await call(a,'auth/login',{email:a.email,password:password+'new'});
 assert.ok((await call(a,'me')).identity);
 console.log(`${checks} comprobaciones HTTP correctas: autenticación, recuperación, roles, privacidad, reservas, estados y valoraciones.`);
}finally{
 const ids=(await pool.query('SELECT id FROM accounts WHERE email=ANY($1::text[])',[[a.email,b.email,c.email]])).rows.map(r=>r.id);
 const connection=await pool.connect();
 try{await connection.query('BEGIN');await connection.query('DELETE FROM reviews WHERE booking_id IN (SELECT id FROM bookings WHERE student_id=ANY($1::text[]))',[ids]);await connection.query('DELETE FROM bookings WHERE student_id=ANY($1::text[])',[ids]);await connection.query('DELETE FROM slots WHERE tutor_id=ANY($1::text[])',[ids]);await connection.query('DELETE FROM notifications WHERE user_id=ANY($1::text[])',[ids]);await connection.query('DELETE FROM profiles WHERE id=ANY($1::text[])',[ids]);await connection.query('DELETE FROM accounts WHERE id=ANY($1::text[])',[ids]);await connection.query('COMMIT');}catch(error){await connection.query('ROLLBACK');throw error;}finally{connection.release();await pool.end();}
}
