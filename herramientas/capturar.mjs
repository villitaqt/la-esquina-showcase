// Recorre el POS de demostración (vite 5173 + backend 8080) y guarda capturas.
import { Browser, sleep } from "file:///C:/Users/diego/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs";
import { fileURLToPath } from "node:url";
const OUT = fileURLToPath(new URL("../capturas/", import.meta.url));
const solo = process.argv.slice(2);
const quiero = (n) => !solo.length || solo.includes(n);

const b = await Browser.launch({ width: 1440, height: 810 });

async function clic(p, texto, { indice = 0, exacto = true } = {}) {
  const ok = await p.eval((a) => {
    const todos = [...document.querySelectorAll("button, a, [role=button], div, span, li")];
    const hits = todos.filter((el) => {
      const t = (el.innerText || "").trim().replace(/\s+/g, " ");
      return a.exacto ? t === a.texto : t.startsWith(a.texto);
    });
    // el más profundo primero
    const hondos = hits.filter((el) => !hits.some((o) => o !== el && el.contains(o)));
    const el = hondos[a.indice];
    if (!el) return false;
    const cl = el.closest("button, a, [role=button]") || el;
    cl.click();
    return true;
  }, { texto, indice, exacto });
  if (!ok) console.log("  no encontré:", texto);
  await sleep(700);
  return ok;
}
async function teclas(p, s) {
  for (const ch of s) {
    await p.send("Input.dispatchKeyEvent", { type: "keyDown", key: ch, text: ch });
    await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: ch });
    await sleep(60);
  }
  await p.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await sleep(1800);
}
import { writeFileSync } from "node:fs";
const foto = async (p, n) => {
  for (let i = 0; i < 3; i++) {
    try {
      await sleep(600);
      const { data } = await p.send("Page.captureScreenshot", { format: "jpeg", quality: 86, fromSurface: true, optimizeForSpeed: true }, 90000);
      writeFileSync(OUT + n + ".jpg", Buffer.from(data, "base64")); console.log("ok", n); return;
    } catch (e) { console.log("  reintento", n, e.message); await p.send("Emulation.setDeviceMetricsOverride", { ...p.viewport && { width: p.viewport.width, height: p.viewport.height, deviceScaleFactor: p.viewport.dsf, mobile: p.viewport.mobile } }).catch(()=>{}); }
  }
};

// ---------- Escritorio ----------
{
  const p = await b.newPage({ width: 1440, height: 810, dsf: 2 });
  await p.goto("http://localhost:5173/caja", { settleMs: 1500 });
  if (quiero("login")) await foto(p, "login");
  await p.eval(() => localStorage.setItem("esquina.novedades", "1.7.0"));
  await teclas(p, "1111");
  await clic(p, "×"); // por si salen novedades
  await clic(p, "Mesas");
  await sleep(800);
  if (quiero("mesas")) await foto(p, "mesas");
  await clic(p, "Gestión de órdenes");
  if (quiero("ordenes")) await foto(p, "ordenes");
  await clic(p, "Vista de mesas");

  await clic(p, "Tomar pedido");
  await clic(p, "Cappuccino", { exacto: false });
  await clic(p, "Sándwiches", { exacto: false });
  await clic(p, "Sándwich de pollo", { exacto: false });
  await clic(p, "Sándwich de pollo", { exacto: false });
  await clic(p, "Waffles", { exacto: false });
  if (quiero("pedido")) await foto(p, "pedido");
  await clic(p, "Waffle armable", { exacto: false });
  await clic(p, "Fresa", { exacto: false });
  await clic(p, "Manjar", { exacto: false });
  await clic(p, "Helado", { exacto: false });
  if (quiero("armador")) await foto(p, "armador");
  await p.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await sleep(500);

  await clic(p, "Cobrar", { exacto: false });
  await sleep(600);
  if (quiero("cobrar")) await foto(p, "cobrar");
  await clic(p, "Mesa 8", { exacto: false });
  await sleep(900);
  if (quiero("cobrar-detalle")) await foto(p, "cobrar-detalle");
  await clic(p, "Entregas", { exacto: false });
  if (quiero("entregas")) await foto(p, "entregas");
  await clic(p, "Cocina");
  if (quiero("cocina")) await foto(p, "cocina");
  await clic(p, "Ventas");
  await sleep(800);
  if (quiero("ventas")) await foto(p, "ventas");
  await clic(p, "Carta y precios");
  if (quiero("carta")) await foto(p, "carta");
  console.log("errores escritorio:", p.consoleErrors.slice(0, 3));
  await p.close();
}

// ---------- Celular ----------
{
  const p = await b.newPage({ width: 390, height: 844, dsf: 3, mobile: true });
  await p.goto("http://localhost:5173/movil", { settleMs: 800 });
  await p.eval(() => { localStorage.clear(); localStorage.setItem("esquina.novedades", "1.7.0"); });
  await p.goto("http://localhost:5173/movil", { settleMs: 1500 });
  if (quiero("movil-login")) await foto(p, "movil-login");
  await teclas(p, "2222");
  await sleep(800);
  if (quiero("movil-mesas")) await foto(p, "movil-mesas");
  await clic(p, "Mesa 1", { exacto: false });
  await sleep(800);
  await clic(p, "Cappuccino", { exacto: false });
  await clic(p, "Latte", { exacto: false });
  if (quiero("movil-pedido")) await foto(p, "movil-pedido");
  console.log("errores movil:", p.consoleErrors.slice(0, 3));
  await p.close();
}
await b.close();
process.exit(0);
