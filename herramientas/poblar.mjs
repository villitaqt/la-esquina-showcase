// Llena el backend de demostración (puerto 8080, base temporal) con un servicio en marcha.
const BASE = "http://127.0.0.1:8080/api/v1";
async function api(m, ruta, token, cuerpo, cab = {}) {
  const r = await fetch(BASE + ruta, {
    method: m,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...cab },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (r.status >= 400) console.log("!!", m, ruta, r.status, JSON.stringify(j).slice(0, 200));
  return j;
}
const caja = (await api("POST", "/sesion", null, { pin: "1111" })).token;
const salon = (await api("POST", "/sesion", null, { pin: "2222" })).token;
console.log("operacion", JSON.stringify(await api("GET", "/operacion", caja)));
await api("POST", "/caja/abrir", caja, { turno: "dia", monto_apertura_centavos: 15000 });

const cat = await api("GET", "/catalogo", salon);
const waffle = cat.productos.find((p) => p.id === "m13");
const ag = (n) => waffle.agregados.find((a) => a.nombre === n).id;

let k = 0;
const abrir = (mesa, comensales, items) =>
  api("POST", "/pedidos", salon, { mesa_id: mesa, comensales, items, idempotency_key: "demo-" + ++k });

// Ventas ya cobradas en la jornada
const cobradas = [
  ["mesa-1", [{ producto_id: "m03", cantidad: 2 }, { producto_id: "m10", cantidad: 2 }]],
  ["mesa-2", [{ producto_id: "m15", cantidad: 2 }, { producto_id: "m18", cantidad: 2 }]],
  ["mesa-3", [{ producto_id: "m04", cantidad: 1 }, { producto_id: "m12", cantidad: 1 }]],
  ["mesa-5", [{ producto_id: "m02", cantidad: 3 }, { producto_id: "m11", cantidad: 2 }]],
  ["barra-1", [{ producto_id: "m01", cantidad: 1 }]],
  ["mesa-7", [{ producto_id: "m16", cantidad: 3 }, { producto_id: "m17", cantidad: 3 }]],
];
const metodos = ["efectivo", "yape", "tarjeta", "plin", "efectivo", "yape"];
for (const [i, [mesa, items]] of cobradas.entries()) {
  const r = await abrir(mesa, 2, items);
  const p = r.pedido;
  if (r.comanda_id) { await api("POST", "/comandas/" + r.comanda_id + "/aceptar", salon); await api("POST", "/comandas/" + r.comanda_id + "/servir", salon); }
  const m = metodos[i];
  const pago = { metodo: m, monto_centavos: p.total_centavos };
  if (m === "efectivo") pago.recibido_centavos = Math.ceil(p.total_centavos / 5000) * 5000;
  await api("POST", "/pedidos/" + p.id + "/cobro", caja, { pagos: [pago], idempotency_key: "demo-cobro-" + i });
}

// Servicio en curso
// Mesa 2: cocinando (aceptada)
let r = await abrir("mesa-2", 4, [
  { producto_id: "m15", cantidad: 2, nota: "una sin ají" },
  { producto_id: "m13", cantidad: 1, agregados: [ag("Fresa"), ag("Nutella")] },
  { producto_id: "m18", cantidad: 2 },
  { producto_id: "m19", cantidad: 1 },
]);
if (r.comanda_id) await api("POST", "/comandas/" + r.comanda_id + "/aceptar", salon);
// Mesa 4: en cola de cocina
r = await abrir("mesa-4", 2, [{ producto_id: "m03", cantidad: 2 }, { producto_id: "m14", cantidad: 1, agregados: [] }]);
// Mesa 6: servida
r = await abrir("mesa-6", 3, [{ producto_id: "m10", cantidad: 3 }, { producto_id: "m17", cantidad: 3 }]);
if (r.comanda_id) { await api("POST", "/comandas/" + r.comanda_id + "/aceptar", salon); await api("POST", "/comandas/" + r.comanda_id + "/servir", salon); }
// Mesa 3: lista en cocina
r = await abrir("mesa-3", 2, [{ producto_id: "m12", cantidad: 2 }, { producto_id: "m05", cantidad: 2 }]);
if (r.comanda_id) { await api("POST", "/comandas/" + r.comanda_id + "/aceptar", salon); await api("POST", "/comandas/" + r.comanda_id + "/listo", salon); }
// Mesa 8: cobrando (precuenta)
r = await abrir("mesa-8", 2, [{ producto_id: "m16", cantidad: 2 }, { producto_id: "m20", cantidad: 2 }]);
if (r.comanda_id) { await api("POST", "/comandas/" + r.comanda_id + "/aceptar", salon); await api("POST", "/comandas/" + r.comanda_id + "/servir", salon); }
await api("POST", "/pedidos/" + r.pedido.id + "/precuenta/imprimir", caja);
// Barra 2: cocinando
r = await abrir("barra-2", 1, [{ producto_id: "m01", cantidad: 1 }, { producto_id: "m13", cantidad: 1, agregados: [ag("Helado"), ag("Manjar")] }]);
if (r.comanda_id) await api("POST", "/comandas/" + r.comanda_id + "/aceptar", salon);
// Para llevar
r = await api("POST", "/pedidos", salon, { tipo: "llevar", items: [{ producto_id: "m15", cantidad: 1 }, { producto_id: "m19", cantidad: 2 }], idempotency_key: "demo-llevar" });

const mesas = await api("GET", "/mesas", salon);
console.log(mesas.mesas.map((m) => m.nombre + ":" + m.estado).join("  "));
