const B="http://127.0.0.1:8080/api/v1";
const t=(await (await fetch(B+"/sesion",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin:"1111"})})).json()).token;
const h={"Content-Type":"application/json",Authorization:"Bearer "+t,"X-Pin-Admin":"2604"};
let r=await fetch(B+"/ajustes",{method:"PUT",headers:h,body:JSON.stringify({nombre:"LA ESQUINA"})});console.log(r.status,await r.text());
r=await fetch(B+"/apariencia",{method:"PUT",headers:h,body:JSON.stringify({tema:"oscuro"})});console.log(r.status,await r.text());
