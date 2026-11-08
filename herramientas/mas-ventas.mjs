const B="http://127.0.0.1:8080/api/v1";
const api=async(m,r,t,c)=>{const x=await fetch(B+r,{method:m,headers:{"Content-Type":"application/json",...(t?{Authorization:"Bearer "+t}:{})},body:c?JSON.stringify(c):undefined});const j=await x.json();if(x.status>=400)console.log(r,JSON.stringify(j).slice(0,150));return j;};
const caja=(await api("POST","/sesion",null,{pin:"1111"})).token;
const libres=["mesa-1","mesa-5","mesa-7","barra-1"];
const prods=["m01","m02","m03","m04","m05","m10","m11","m12","m15","m16","m17","m18","m19","m20"];
const met=["efectivo","yape","yape","plin","tarjeta","efectivo","yape"];
let s=7;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};
for(let i=0;i<20;i++){
  const items=[];const n=1+Math.floor(rnd()*3);
  for(let j=0;j<n;j++)items.push({producto_id:prods[Math.floor(rnd()*prods.length)],cantidad:1+Math.floor(rnd()*2)});
  const r=await api("POST","/pedidos",caja,{mesa_id:libres[i%4],comensales:2,items,idempotency_key:"mv-"+i});
  if(r.comanda_id){await api("POST","/comandas/"+r.comanda_id+"/aceptar",caja);await api("POST","/comandas/"+r.comanda_id+"/servir",caja);}
  const m=met[Math.floor(rnd()*met.length)];const p={metodo:m,monto_centavos:r.pedido.total_centavos};
  if(m==="efectivo")p.recibido_centavos=Math.ceil(r.pedido.total_centavos/5000)*5000;
  await api("POST","/pedidos/"+r.pedido.id+"/cobro",caja,{pagos:[p],idempotency_key:"mvc-"+i});
}
// Repartir en la tarde-noche
const {DatabaseSync}=await import("node:sqlite");const db=new DatabaseSync(process.env.POS_DATA_DIR + "/pos.db");
const pagados=db.prepare("select id from pedidos where estado='pagado' order by id").all();
const horas=[17,18,18,19,19,19,20,20,20,20,20,21,21,21,21,22,22,22,23,23,23,17,19,20,21,22];
pagados.forEach((p,i)=>{
  const h=horas[i%horas.length];const mi=String(Math.floor(rnd()*55)).padStart(2,"0");
  const fin=`2026-11-07T${h}:${mi}:00-05:00`;const ini=`2026-11-07T${h}:${String(Math.max(0,+mi-4)).padStart(2,"0")}:00-05:00`;
  db.prepare("update pedidos set abierto_en=?, cerrado_en=? where id=?").run(ini,fin,p.id);
  db.prepare("update pagos set creado_en=? where pedido_id=?").run(fin,p.id);
  db.prepare("update cobros set creado_en=? where pedido_id=?").run(fin,p.id);
});
db.prepare("update cajas set abierta_en='2026-11-07T16:52:00-05:00' where estado='abierta'").run();
console.log("pagados",pagados.length);
