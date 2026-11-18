import {writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
// Explicit local-only fixtures. Never runs against the hosted database.
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
const now=new Date().toISOString();
const day=(delta,hour)=>{const d=new Date();d.setUTCDate(d.getUTCDate()+delta);d.setUTCHours(hour+5,0,0,0);return d.toISOString()};
const uuid=n=>`a0000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const profiles=[
 ['local_seedy','Louis Sleyth Acuña Mulford','seedy@sites.test','both','Desarrollo web','Universitario','Barranquilla','Aprendamos a crear aplicaciones web paso a paso. Perfil de demostración local.'],
 ['demo-carlos','Carlos Martínez','carlos@example.test','tutor','Matemáticas','Universitario','Barranquilla','Cálculo y álgebra con ejemplos claros. Trabajemos juntos en lo que más te cuesta. Perfil de demostración.'],
 ['demo-laura','Laura Pérez','laura@example.test','tutor','Inglés','Todos los niveles','Barranquilla','Practica conversación, amplía tu vocabulario y gana confianza al hablar. Perfil de demostración.'],
 ['demo-andres','Andrés Gómez','andres@example.test','tutor','Programación','Universitario','Bogotá','Aprende JavaScript y Python resolviendo proyectos y problemas prácticos. Perfil de demostración.'],
 ['demo-sofia','Sofía Rodríguez','sofia@example.test','student','','Universitario','Barranquilla','']
];
const sql=[];
for(const p of profiles)sql.push(`INSERT INTO profiles(id,name,email,role,subject,level,city,bio,created_at) VALUES(${[...p,now].map(q)}) ON CONFLICT(id) DO UPDATE SET name=excluded.name,role=excluded.role,subject=excluded.subject,level=excluded.level,city=excluded.city,bio=excluded.bio;`);
let n=10;
for(const id of ['demo-carlos','demo-laura','demo-andres','local_seedy'])for(let d=1;d<=3;d++)sql.push(`INSERT OR IGNORE INTO slots(id,tutor_id,start,mode,location) VALUES(${[uuid(n++),id,day(d,10+d),d===3?'Presencial':'Virtual',d===3?'Biblioteca de demostración, sala 2':''].map(q)});`);
const fixtures=[
 [100,'demo-carlos','local_seedy',day(1,14),'accepted','Derivadas y reglas de diferenciación'],
 [101,'local_seedy','demo-sofia',day(2,16),'pending','Crear mi primera página con HTML y CSS'],
 [102,'demo-laura','local_seedy',day(-2,10),'completed','Conversación y vocabulario cotidiano'],
 [103,'local_seedy','demo-sofia',day(-1,10),'accepted','Formularios y validaciones con JavaScript'],
 [104,'demo-andres','local_seedy',day(-3,16),'completed','Funciones y estructuras de datos']
];
for(const [i,t,s,date,status,topic] of fixtures){sql.push(`INSERT OR IGNORE INTO slots(id,tutor_id,start,mode,location) VALUES(${[uuid(i),t,date,'Virtual',''].map(q)});`);sql.push(`INSERT OR IGNORE INTO bookings(id,slot_id,student_id,start,status,topic,room,created_at) VALUES(${[uuid(i+1000),uuid(i),s,date,status,topic,'TutoConecta-demo-'+i,now].map(q)});`);}
sql.push(`INSERT OR IGNORE INTO reviews(id,booking_id,score,comment,created_at) VALUES(${q(uuid(2000))},${q(uuid(1104))},5,'Explicaciones claras y ejercicios muy útiles.',${q(now)});`);
for(const [i,message] of ['Tu tutoría de Matemáticas fue confirmada. Consulta los detalles en Mis tutorías.','Sofía Rodríguez solicitó una tutoría. Revisa tus solicitudes.','Tu sesión de Inglés finalizó. Ya puedes compartir tu valoración.'].entries())sql.push(`INSERT OR IGNORE INTO notifications(id,user_id,message,created_at) VALUES(${[uuid(3000+i),'local_seedy',message,now].map(q)});`);
mkdirSync('.sites-runtime',{recursive:true});writeFileSync('.sites-runtime/demo.sql',sql.join('\n'));
const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','.sites-runtime/demo.sql'],{stdio:'inherit'});process.exit(r.status??1);
