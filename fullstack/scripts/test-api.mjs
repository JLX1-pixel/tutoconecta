import assert from 'node:assert/strict';
// Run ONLY against a local built Worker. Identity headers simulate the trusted Sites gateway.
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8787';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Local testing only');
let count=0;
async function request(path,user,data,status=200,origin=base){
 const headers={};if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test';}
 if(data!==undefined){headers['Content-Type']='application/json';headers.Origin=origin;}

 const r=await fetch(base+'/api/'+path,{method:data===undefined?'GET':'POST',headers,body:data===undefined?undefined:JSON.stringify(data)});
 const v=await r.json();assert.equal(r.status,status,`${path}: ${JSON.stringify(v)}`);count++;return v;
}
const stamp=Date.now();
const t='tutor-'+stamp,s='student-'+stamp,other='other-'+stamp;
const p=(name,role,subject='')=>({name,role,subject,level:'Universitario',city:'Barranquilla',bio:role==='student'?'':'Tutor de prueba: explicaciones claras y ejercicios prácticos.'});
await request('bookings',null,undefined,401);
await request('profile',null,p('Sin acceso','student'),401);
await request('profile',t,p('Tutor de prueba','tutor','Matemáticas'),403,'https://example.invalid');
await request('profile',t,p('Tutor de prueba','tutor','Matemáticas'));
await request('profile',s,p('Estudiante de prueba','student'));
await request('profile',other,p('Otro estudiante','student'));
const future=new Date(Date.now()+3*86400000);future.setUTCMinutes(0,0,0);
const start=future.toISOString();
await request('slots',s,{start,mode:'Virtual',location:''},403);
await request('slots',t,{start:new Date(Date.now()-86400000).toISOString(),mode:'Virtual',location:''},400);
await request('slots',t,{start,mode:'Presencial',location:''},400);
await request('slots',t,{start,mode:'Presencial',location:'Biblioteca de prueba, sala 2'});
await request('slots',t,{start,mode:'Virtual',location:''},409);
const {slots}=await request('slots',t);const slot=slots.find(x=>x.start===start);
const catalog=await request('tutors',null);assert(catalog.slots.some(x=>x.id===slot.id));assert(!catalog.tutors.some(x=>'email' in x));assert(!catalog.slots.some(x=>'location' in x));
await request('bookings',s,{slotId:slot.id,topic:'Practicar límites y derivadas'});
await request('bookings',other,{slotId:slot.id,topic:'Intento de doble reserva'},409);
const b=(await request('bookings',s)).bookings[0];assert.equal(b.location,'');
assert.equal((await request('bookings',other)).bookings.length,0);
await request('bookings/status',other,{id:b.id,status:'accepted'},403);
await request('bookings/status',s,{id:b.id,status:'accepted'},403);
await request('reviews',s,{bookingId:b.id,score:5,comment:'No finalizada'},403);
await request('slots/delete',t,{id:slot.id},409);
await request('bookings/status',t,{id:b.id,status:'accepted'});
const accepted=(await request('bookings',s)).bookings[0];assert.equal(accepted.location,'Biblioteca de prueba, sala 2');
await request('bookings/status',t,{id:b.id,status:'completed'},403);
await request('bookings/status',s,{id:b.id,status:'cancelled'});
await request('bookings',other,{slotId:slot.id,topic:'Nueva solicitud después de cancelación'});
const b2=(await request('bookings',other)).bookings[0];
await request('bookings/status',t,{id:b2.id,status:'rejected'});
const n=await request('notifications',s);assert(n.notifications.length>=3);
await request('notifications/read',s,{});
assert((await request('notifications',s)).notifications.every(x=>x.read===1));
console.log(JSON.stringify({passed:true,requests:count,checks:['auth','origin','role permissions','future dates','private location','unique slot reservation','ownership','cancel/rebook','reject','notifications','early completion blocked','early review blocked']},null,2));



