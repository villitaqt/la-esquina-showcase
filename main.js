/* La Esquina POS · muestra. Sin dependencias. */
(() => {
  const raiz = document.documentElement;
  raiz.classList.add("js");
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dos = (n) => String(n).padStart(2, "0");

  /* ---------- Reloj de la barra: la hora real ---------- */
  const reloj = document.getElementById("reloj");
  const tic = () => { const d = new Date(); reloj.textContent = dos(d.getHours()) + ":" + dos(d.getMinutes()); };
  tic();
  setInterval(tic, 10000);

  /* ---------- Lámpara que sigue al puntero ---------- */
  if (!quieto && matchMedia("(pointer: fine)").matches) {
    let px = 0, py = 0, pendiente = false;
    addEventListener("pointermove", (e) => {
      px = e.clientX; py = e.clientY;
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        raiz.style.setProperty("--mx", px + "px");
        raiz.style.setProperty("--my", py + "px");
        pendiente = false;
      });
    }, { passive: true });
  }

  /* ---------- Ticket: cada renglón es un span para imprimirlo línea a línea ---------- */
  document.querySelectorAll("[data-ticket]").forEach((pre) => {
    const lineas = pre.textContent.split("\n");
    pre.textContent = "";
    lineas.forEach((l, i) => {
      const s = document.createElement("span");
      s.className = "renglon";
      s.style.setProperty("--i", i);
      s.textContent = l || " ";
      pre.appendChild(s);
    });
  });

  /* ---------- Contadores ---------- */
  const contar = (el) => {
    const fin = parseFloat(el.dataset.contar);
    const dec = parseInt(el.dataset.decimales || "0", 10);
    const pre = el.dataset.prefijo || "";
    const pinta = (v) => { el.textContent = pre + v.toFixed(dec); };
    if (quieto) return pinta(fin);
    const t0 = performance.now(), dur = 1600;
    const paso = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      pinta(fin * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };

  /* ---------- Revelar y encender pantallas al entrar en vista ---------- */
  const alVer = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      el.classList.add("visto");
      el.querySelectorAll(".encender").forEach((p, i) => setTimeout(() => p.classList.add("encendida"), 150 + i * 220));
      if (el.matches(".encender")) el.classList.add("encendida");
      if (el.querySelector(".impresora")) setTimeout(() => el.classList.add("imprimiendo"), 700);
      el.querySelectorAll("[data-contar]").forEach(contar);
      alVer.unobserve(el);
    }
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("[data-revelar], .hero__escena .encender").forEach((el) => alVer.observe(el));

  /* ---------- Scroll: inclinación del hero, flotantes y reloj del relato ---------- */
  const portatil = document.querySelector(".hero__portatil");
  const celular = document.querySelector(".hero__celular");
  const flotantes = [...document.querySelectorAll(".flotante, .telefonos")];
  const capitulos = [...document.querySelectorAll(".capitulo")];
  const relato = document.getElementById("relojRelato");
  const relleno = document.getElementById("rielRelleno");
  const noche = document.getElementById("noche");
  const aMin = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const horas = capitulos.map((c) => aMin(c.dataset.hora));
  let girando = false;

  const alDesplazar = () => {
    girando = false;
    const vh = innerHeight;

    if (!quieto && portatil) {
      const k = Math.min(1, scrollY / (vh * 0.7));
      portatil.style.setProperty("--tilt", (14 - 14 * k).toFixed(2) + "deg");
      portatil.style.setProperty("--giro", (-10 + 10 * k).toFixed(2) + "deg");
      celular.style.setProperty("--sube", (-k * 60).toFixed(1) + "px");
    }

    if (!quieto) {
      for (const f of flotantes) {
        const r = f.getBoundingClientRect();
        const k = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        f.style.setProperty("--desliza", (k * 50).toFixed(1) + "px");
      }
    }

    // Reloj del relato: interpola entre la hora de un capítulo y la del siguiente.
    const centro = vh * 0.5;
    const tops = capitulos.map((c) => c.getBoundingClientRect().top);
    let min = horas[0];
    for (let i = 0; i < tops.length; i++) {
      if (tops[i] > centro) break;
      const sig = i + 1 < tops.length ? tops[i + 1] : null;
      if (sig === null) { min = horas[i]; break; }
      const k = Math.max(0, Math.min(1, (centro - tops[i]) / (sig - tops[i])));
      min = horas[i] + (horas[i + 1] - horas[i]) * k;
    }
    min = Math.round(min);
    if (relato) relato.textContent = dos(Math.floor(min / 60) % 24) + ":" + dos(min % 60);

    // Relleno del riel: de 16:00 a 24:00
    if (relleno) relleno.style.height = (Math.max(0, Math.min(1, (min - 17 * 60) / (7 * 60))) * 100).toFixed(2) + "%";
  };
  addEventListener("scroll", () => { if (!girando) { girando = true; requestAnimationFrame(alDesplazar); } }, { passive: true });
  addEventListener("resize", alDesplazar);
  alDesplazar();

  /* ---------- Galería ---------- */
  const tira = document.getElementById("tira");
  document.querySelectorAll("[data-desplazar]").forEach((b) => {
    b.addEventListener("click", () => {
      const fig = tira.querySelector("figure");
      tira.scrollBy({ left: Number(b.dataset.desplazar) * (fig.offsetWidth + 24), behavior: quieto ? "auto" : "smooth" });
    });
  });

  /* ---------- Visor ---------- */
  const visor = document.getElementById("visor");
  const vImg = visor.querySelector("img");
  const vPie = visor.querySelector(".visor__pie");
  document.querySelectorAll("[data-ampliar]").forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    const abrir = () => {
      vImg.src = img.currentSrc || img.src;
      vImg.alt = img.alt;
      vPie.textContent = img.alt;
      visor.showModal();
    };
    img.addEventListener("click", abrir);
    img.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
  });
  visor.addEventListener("click", (e) => { if (e.target !== vImg) visor.close(); });
})();
