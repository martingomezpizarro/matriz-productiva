// Recorrido guiado del mapa. Se abre con el botón «?», con mapa.html?tour=1,
// o desde el aviso que aparece la primera vez que alguien entra.
(function () {
  const KEY = "mp-tour";
  const store = { get: () => { try { return localStorage.getItem(KEY); } catch (e) { return "x"; } },
                  set: v => { try { localStorage.setItem(KEY, v); } catch (e) {} } };
  const mob = () => window.innerWidth <= 860;
  const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const pick = sels => (sels || []).map(s => document.querySelector(s)).find(vis) || null;
  const call = (fn, ...a) => { try { if (typeof window[fn] === "function") window[fn](...a); } catch (e) {} };
  const demo = "og-lc"; // Loma Campana: ficha completa, buen ejemplo

  const STEPS = [
    { t: "Bienvenido a la Matriz Productiva",
      b: () => "Un recorrido de un minuto por lo que podés hacer acá: capas, fichas, búsqueda y vistas. Podés salir cuando quieras con Esc.",
      before: () => { call("setView", "map"); call("closeDrawer"); } },
    { el: ["#side .tree", "#btnLayers"], t: "Capas por cadena productiva",
      b: () => mob()
        ? "Tocá Capas para abrir el panel: ahí prendés y apagás cada eslabón de las tres cadenas (pozos, refinerías, minas por mineral, plantas de molienda, puertos) y filtrás por estado."
        : "Prendé y apagá cada eslabón de las tres cadenas: pozos, refinerías, minas por mineral, plantas de molienda, puertos. El número a la derecha dice cuántos activos hay en cada capa." },
    { el: ["#estados"], skip: true, t: "Filtrá por estado",
      b: () => "En operación, en construcción, proyecto avanzado o exploración. La exploración arranca apagada para no saturar el mapa." },
    { el: ["#stage"], t: "El mapa",
      b: () => "Arrastrá para moverte y usá + y − para acercarte. Tocá una provincia para ver todo lo que hay en ella, o un punto o ducto para abrir su ficha.",
      before: () => { call("setView", "map"); call("closeDrawer"); } },
    { el: ["#drawer"], wait: 750, t: "La ficha de cada activo",
      b: () => "Operador y socios, producción, RIGI y la fuente de cada dato. Con las flechas de arriba pasás al activo siguiente, de norte a sur.",
      before: () => { call("setView", "map"); call("select", demo); },
      after: () => call("closeDrawer") },
    { el: ["#q"], t: "Buscador",
      b: () => "Escribí un activo, una empresa o una provincia y el mapa se filtra al instante." },
    { el: [".top .seg"], t: "Otras vistas",
      b: () => "Tabla para ordenar y comparar todos los activos. Empresas para la ficha de cada compañía, con cotización y proyectos. Estadísticas para las cifras de cada sector y sus series." },
    { el: ["#btnTour"], t: "Listo",
      b: () => "Podés volver a ver este recorrido desde este botón. En el pie están los términos de uso y cómo colaborar con el proyecto." }
  ];

  let i = -1, ui = null, cur = null;

  function build() {
    ui = document.createElement("div");
    ui.className = "tour";
    ui.innerHTML = `<div class="tour-veil"></div><div class="tour-spot"></div>
      <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourT">
        <p class="tour-n"></p><h3 id="tourT"></h3><p class="tour-b"></p>
        <div class="tour-ctl"><button type="button" class="tour-skip">Saltar</button>
          <span class="tour-dots" aria-hidden="true"></span>
          <button type="button" class="tour-prev">Anterior</button><button type="button" class="tour-next">Siguiente</button></div>
      </div>`;
    document.body.appendChild(ui);
    ui.querySelector(".tour-skip").onclick = end;
    ui.querySelector(".tour-prev").onclick = () => go(-1);
    ui.querySelector(".tour-next").onclick = () => go(+1);
    ui.querySelector(".tour-veil").onclick = e => e.stopPropagation();
    document.addEventListener("keydown", key, true);
    window.addEventListener("resize", place);
  }

  function key(e) {
    if (!ui) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); end(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); go(+1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); go(-1); }
  }

  // Avanza o retrocede, salteando los pasos cuyo objetivo no se ve (p. ej. en el celular).
  function go(d) {
    if (cur && cur.after) cur.after();
    let j = i + d;
    while (j >= 0 && j < STEPS.length) {
      const s = STEPS[j];
      if (s.before) s.before();
      if (!(s.skip && !pick(s.el))) break;
      j += d;
    }
    if (j >= STEPS.length) return end();
    if (j < 0) j = 0;
    i = j; cur = STEPS[i];
    const card = ui.querySelector(".tour-card");
    card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");
    const act = STEPS.filter(s => !(s.skip && !pick(s.el))), pos = act.indexOf(cur);
    ui.querySelector(".tour-n").textContent = `Paso ${pos + 1} de ${act.length}`;
    ui.querySelector("#tourT").textContent = cur.t;
    ui.querySelector(".tour-b").textContent = cur.b();
    ui.querySelector(".tour-dots").innerHTML = act.map((_, k) => `<i class="${k === pos ? "on" : ""}"></i>`).join("");
    ui.querySelector(".tour-prev").hidden = i === 0;
    ui.querySelector(".tour-next").textContent = i === STEPS.length - 1 ? "Terminar" : (i === 0 ? "Empezar" : "Siguiente");
    place();
    if (cur.wait) setTimeout(place, cur.wait);
    ui.querySelector(".tour-next").focus({ preventScroll: true });
  }

  // Ubica el foco sobre el objetivo y la tarjeta en el lado con más lugar.
  function place() {
    if (!ui || !cur) return;
    const spot = ui.querySelector(".tour-spot"), card = ui.querySelector(".tour-card");
    const el = pick(cur.el), W = window.innerWidth, H = window.innerHeight, m = 12, pad = 6;
    const cw = Math.min(340, W - 2 * m); card.style.width = cw + "px";
    const ch = card.offsetHeight;
    let x, y;
    if (!el) {
      Object.assign(spot.style, { left: W / 2 + "px", top: H / 2 + "px", width: "0px", height: "0px", opacity: "0" });
      x = (W - cw) / 2; y = (H - ch) / 2;
    } else {
      const r = el.getBoundingClientRect();
      const L = Math.max(r.left - pad, 4), T = Math.max(r.top - pad, 4);
      const R = Math.min(r.right + pad, W - 4), B = Math.min(r.bottom + pad, H - 4);
      Object.assign(spot.style, { left: L + "px", top: T + "px", width: (R - L) + "px", height: (B - T) + "px", opacity: "1" });
      const room = { below: H - B, above: T, right: W - R, left: L };
      if (room.below >= ch + m) { x = L; y = B + m; }
      else if (room.above >= ch + m) { x = L; y = T - ch - m; }
      else if (room.right >= cw + m) { x = R + m; y = T; }
      else if (room.left >= cw + m) { x = L - cw - m; y = T; }
      else { x = L + (R - L - cw) / 2; y = B - ch - 2 * m; } // objetivo grande: la tarjeta va adentro, abajo
    }
    card.style.left = Math.round(Math.min(Math.max(x, m), W - cw - m)) + "px";
    card.style.top = Math.round(Math.min(Math.max(y, m), H - ch - m)) + "px";
  }

  function start() {
    hideToast();
    if (ui) return;
    build(); i = -1; cur = null; go(+1);
  }
  function end() {
    if (cur && cur.after) cur.after();
    store.set("visto");
    document.removeEventListener("keydown", key, true);
    window.removeEventListener("resize", place);
    if (ui) ui.remove();
    ui = null; cur = null; i = -1;
    const b = document.getElementById("btnTour"); if (b) b.focus({ preventScroll: true });
  }

  // Aviso discreto la primera vez.
  let toast = null;
  function showToast() {
    toast = document.createElement("div");
    toast.className = "tour-toast"; toast.setAttribute("role", "status");
    toast.innerHTML = `<span>¿Primera vez acá? Hacé el recorrido guiado: un minuto.</span>
      <button type="button" class="tour-go">Empezar</button><button type="button" class="tour-no">Ahora no</button>`;
    document.body.appendChild(toast);
    toast.querySelector(".tour-go").onclick = start;
    toast.querySelector(".tour-no").onclick = () => { store.set("visto"); hideToast(); };
  }
  function hideToast() { if (toast) { toast.remove(); toast = null; } }

  window.mpTour = start;
  const btn = document.getElementById("btnTour");
  if (btn) btn.addEventListener("click", start);
  const q = new URLSearchParams(location.search);
  if (q.get("tour") === "1") setTimeout(start, 600);
  else if (!store.get() && !q.get("activo")) setTimeout(showToast, 1400);
})();
