// Portada: mapa animado del hero, cifras y tarjetas de sector.
// Todo sale de los mismos datos que usa el mapa (data/), así que se actualiza solo cada mes.
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = s => document.querySelector(s);
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const fecha = iso => { const [y, m, d] = String(iso).split("-"); return `${+d}-${MES[+m - 1]}-${y}`; };
  const nf = n => n.toLocaleString("es-AR");

  // Mismos activos que el mapa: lo no minero cargado a mano + la cartera oficial SIACAM completa.
  const pts = [
    ...PTS.filter(p => p.s !== "mi").map(p => ({ id: p.id, s: p.s, n: p.n, ll: p.ll, st: p.st })),
    ...SIACAM.map(o => ({ id: o.id, s: "mi", n: o.n, ll: o.ll, st: o.est === "Producción" ? "op" : o.est === "Construcción" ? "con" : "pro" }))
  ];
  const total = pts.length + LNS.length;
  const porSec = s => pts.filter(p => p.s === s).length + LNS.filter(l => l.s === s).length;
  const actualizado = (typeof META !== "undefined" && META.actualizado) || null;

  // ---- Textos con datos ----
  const set = (sel, v) => document.querySelectorAll(sel).forEach(e => e.textContent = v);
  if (actualizado) set("[data-p=fecha]", fecha(actualizado));
  const k0 = STATS.og.kpis[0];
  const cifras = [
    { n: total, l: "activos en el mapa", p: "pozos, ductos, minas, plantas y puertos" },
    { n: SIACAM.length, l: "proyectos mineros", p: "la cartera oficial completa (SIACAM)" },
    { n: Object.keys(EMP).length, l: "empresas con ficha propia", p: "operadores, socios y controlantes" },
    { v: k0.v, l: `${k0.u} de petróleo`, p: k0.p.split("·")[0].trim() + " · Secretaría de Energía" }
  ];
  $("#cifras").innerHTML = cifras.map(c => `<div class="cifra">
      <b data-n="${c.n != null ? c.n : ""}">${c.n != null ? nf(c.n) : c.v}</b>
      <span>${c.l}</span><small>${c.p}</small></div>`).join("");

  const SEC = {
    og: { t: "Oil & Gas", d: "Vaca Muerta y las cuencas convencionales: áreas de producción, plantas de gas, refinerías, ductos y terminales de exportación." },
    mi: { t: "Minería", d: "La cartera oficial de proyectos metalíferos y de litio, de la prospección a la producción, con sus controlantes y coordenadas." },
    ag: { t: "Agro y ganadería", d: "Plantas de molienda, puertos del Gran Rosario, frigoríficos y la producción agrícola por departamento." }
  };
  $("#sectores").innerHTML = Object.entries(SEC).map(([k, s]) => `<article class="sec" data-s="${k}" style="--c:var(--${k})">
      <header><i></i><h3>${s.t}</h3><span class="ct">${nf(porSec(k))} activos</span></header>
      <p>${s.d}</p>
      <dl>${STATS[k].kpis.slice(0, 2).map(x => `<div><dt>${x.l}</dt><dd><b>${x.v}</b> ${x.u}</dd><dd class="per">${x.p.split("·")[0].trim()}</dd></div>`).join("")}</dl>
      <footer><a href="mapa.html">Ver en el mapa →</a><a href="mapa.html?vista=estadisticas">Estadísticas</a></footer>
    </article>`).join("");

  // ---- Contadores que suben al entrar en pantalla ----
  const contar = el => {
    const to = +el.dataset.n; if (!to || reduce) return;
    const t0 = performance.now(), dur = 1200;
    const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = nf(Math.round(to * e)); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.querySelectorAll("[data-n]").forEach(contar); e.target.classList.add("visto"); io.unobserve(e.target); }
  }), { threshold: .25 }) : null;
  document.querySelectorAll(".reveal").forEach(el => io ? io.observe(el) : el.classList.add("visto"));

  // ---- Mapa del hero ----
  if (typeof d3 === "undefined" || typeof GEO === "undefined") return;
  const W = 520, H = 800;
  const svg = d3.select("#heroMap").attr("viewBox", `0 0 ${W} ${H}`);
  const proj = d3.geoMercator().fitExtent([[16, 16], [W - 16, H - 16]], GEO.prov);
  const path = d3.geoPath(proj);
  svg.append("g").attr("class", "h-nb").selectAll("path").data(GEO.nb.features).join("path").attr("d", path);
  svg.append("g").attr("class", "h-prov").selectAll("path").data(GEO.prov.features).join("path").attr("d", path);
  svg.append("g").attr("class", "h-riv").selectAll("path").data(GEO.rivers.features).join("path").attr("d", path);

  const line = d3.line().curve(d3.curveCatmullRom.alpha(.5));
  const gl = svg.append("g").attr("class", "h-ln");
  const lns = gl.selectAll("path").data(LNS).join("path")
    .attr("d", l => line(l.path.map(([la, lo]) => proj([lo, la]))))
    .attr("class", l => `s-${l.s} st-${l.st}`)
    .each(function () { const L = this.getTotalLength(); this.style.strokeDasharray = `${L} ${L}`; this.style.strokeDashoffset = reduce ? 0 : L; });

  // Aparecen de norte a sur, como un barrido.
  const data = pts.map(p => { const [x, y] = proj([p.ll[1], p.ll[0]]); return { ...p, x, y }; }).sort((a, b) => a.y - b.y);
  const gp = svg.append("g").attr("class", "h-pt");
  const dots = gp.selectAll("a").data(data).join("a")
    .attr("href", d => `mapa.html?activo=${encodeURIComponent(d.id)}`)
    .attr("aria-label", d => d.n)
    .attr("class", d => `s-${d.s} st-${d.st}`);
  dots.append("title").text(d => d.n);
  dots.append("circle").attr("cx", d => d.x).attr("cy", d => d.y)
    .attr("r", d => d.st === "op" ? 4 : 3.2)
    .style("animation-delay", (d, i) => reduce ? "0s" : `${400 + i * 7}ms`);

  if (!reduce) {
    requestAnimationFrame(() => setTimeout(() => lns.each(function (d, i) {
      this.style.transition = `stroke-dashoffset 1.6s cubic-bezier(.65,0,.35,1) ${300 + i * 120}ms`; this.style.strokeDashoffset = 0;
    }), 50));
    // Pulsos sobre activos en operación, de a uno.
    const ops = data.filter(d => d.st === "op");
    const gr = svg.append("g").attr("class", "h-pulse");
    setTimeout(function pulso() {
      if (!document.hidden) {
        const d = ops[Math.floor(Math.random() * ops.length)];
        gr.append("circle").attr("cx", d.x).attr("cy", d.y).attr("r", 4).attr("class", `s-${d.s}`)
          .on("animationend", function () { this.remove(); });
      }
      setTimeout(pulso, 900);
    }, 2800);
  }

  // Leyenda/filtro del hero y tarjetas de sector resaltan su capa.
  const foco = s => svg.attr("data-foco", s || null);
  document.querySelectorAll("[data-foco-s]").forEach(b => {
    b.addEventListener("mouseenter", () => foco(b.dataset.focoS));
    b.addEventListener("focus", () => foco(b.dataset.focoS));
    b.addEventListener("mouseleave", () => foco(null));
    b.addEventListener("blur", () => foco(null));
  });
  document.querySelectorAll(".sec").forEach(c => {
    c.addEventListener("mouseenter", () => foco(c.dataset.s));
    c.addEventListener("mouseleave", () => foco(null));
  });
  document.querySelectorAll("[data-ct]").forEach(e => e.textContent = nf(porSec(e.dataset.ct)));
})();
