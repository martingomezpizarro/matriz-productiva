// Pie de página institucional. Lee todo de window.SITIO (js/sitio.config.js).
// Uso: <footer id="pie" data-modo="compacto"></footer>  → barra fina + ventana «Acerca de»
//      <footer id="pie" data-modo="completo"></footer>  → pie completo en línea (páginas con scroll)
(function () {
  const S = window.SITIO;
  const el = document.getElementById("pie");
  if (!S || !el) return;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pend = v => !v || String(v).startsWith("[COMPLETAR");
  const ext = (url, txt, cls) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"${cls ? ` class="${cls}"` : ""}>${txt}</a>`;
  const marca = v => `<span class="pie-pend" title="Falta completar en js/sitio.config.js">${esc(v)}</span>`;
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const fecha = iso => { const [y, m, d] = String(iso).split("-"); return `${+d}-${MES[+m - 1]}-${y}`; };
  // META la genera scripts/actualizar.py (const global, no cuelga de window).
  const actualizado = (typeof META !== "undefined" && META.actualizado) || S.terminosVigencia;
  const web = S.web.replace(/^https?:\/\//, "");
  const ter = esc(S.terminos);

  const derechos = S.licencia
    ? `Contenido bajo ${S.licencia.contenidoUrl ? ext(S.licencia.contenidoUrl, esc(S.licencia.contenido)) : esc(S.licencia.contenido)}; código bajo ${S.licencia.codigoUrl ? ext(S.licencia.codigoUrl, esc(S.licencia.codigo)) : esc(S.licencia.codigo)}.`
    : `© ${S.anio} ${esc(S.autor)}. Todos los derechos reservados.`;

  const botones = () => {
    const c = S.colaborar;
    const b1 = !c.cafecito ? "" : pend(c.cafecito) ? marca(c.cafecito) : ext(c.cafecito, "☕ Invitame un cafecito", "pie-btn pie-btn-pri");
    const b2 = pend(c.otra && c.otra.url) ? marca(c.otra ? c.otra.url : "[COMPLETAR: segunda opción]")
      : (/^https?:/.test(c.otra.url) ? ext(c.otra.url, esc(c.otra.etiqueta), "pie-btn")
        : `<button type="button" class="pie-btn pie-alias" data-copiar="${esc(c.otra.url)}" title="Tocá para copiar">${esc(c.otra.etiqueta)}: <b>${esc(c.otra.url)}</b><small aria-live="polite"></small></button>`);
    return `<div class="pie-btns">${b1}${b2}</div>`;
  };

  // Bloque completo: autoría → colaboración → descargos (en ese orden).
  const completo = () => `
    <div class="pie-grid">
      <section class="pie-col">
        <h3 class="pie-eye">Autoría</h3>
        <p>Desarrollado por <b>${esc(S.autor)}</b></p>
        <p class="pie-links">
          <a href="mailto:${esc(S.email)}">${esc(S.email)}</a>
          ${ext(S.web, esc(web))}
        </p>
      </section>
      <section class="pie-col" id="pie-colaborar">
        <h3 class="pie-eye">Colaborar</h3>
        <p>${esc(S.colaborar.texto)}</p>
        ${botones()}
        <p class="pie-fine">${esc(S.colaborar.aclaracion)}</p>
      </section>
      <section class="pie-col pie-wide">
        <h3 class="pie-eye">Aviso</h3>
        <p class="pie-fine">Contenido informativo y educativo, ofrecido «tal cual», sin garantías de exactitud, integridad ni actualización. <b>No constituye asesoramiento, recomendación ni oferta de compra o venta de valores negociables</b> (Ley 26.831 y normativa de la CNV). Invertir implica riesgos, incluida la pérdida del capital.</p>
        <p class="pie-fine">Los datos provienen de organismos públicos (Secretaría de Energía, Secretaría de Minería, INDEC, MAGyP, datos.gob.ar), de Yahoo Finance y de la prensa; pueden tener rezagos, revisiones o transformaciones propias. No es una publicación oficial de esos organismos. Parte de los textos se elaboró con asistencia de inteligencia artificial y puede contener errores.</p>
        <p class="pie-fine pie-meta">
          <a href="${ter}">Términos y condiciones de uso</a>
          <span>${derechos}</span>
          <span>Datos actualizados al ${fecha(actualizado)}</span>
          <span>Jurisdicción: ${esc(S.jurisdiccion)}</span>
        </p>
      </section>
    </div>`;

  // Copiar el alias al portapapeles (funciona en el pie en línea y en la ventana).
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-copiar]"); if (!b) return;
    const ok = () => { const m = b.querySelector("small"); if (m) { m.textContent = "Copiado"; setTimeout(() => m.textContent = "", 1800); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(b.dataset.copiar).then(ok, () => {});
  });

  if (el.dataset.modo === "completo") {
    el.className = "pie pie-completo";
    el.innerHTML = completo();
    return;
  }

  // Modo compacto: una barra que no le quita alto al tablero y abre el bloque completo.
  el.className = "pie pie-compacto";
  el.innerHTML = `
    <span class="pie-autor"><span class="pie-pre">Desarrollado por </span>${ext(S.web, esc(S.autor))}</span>
    <a class="pie-ico" href="mailto:${esc(S.email)}" aria-label="Escribir a ${esc(S.email)}" title="${esc(S.email)}">✉</a>
    <span class="pie-aviso">Información, no asesoramiento de inversión.</span>
    <span class="pie-acc">
      <button type="button" data-pie="colaborar">Colaborar</button>
      <a href="${ter}">Términos</a>
      <button type="button" data-pie="info">Acerca de</button>
    </span>
    <span class="pie-fecha">Datos al ${fecha(actualizado)} · © ${S.anio}</span>`;

  const dlg = document.createElement("dialog");
  dlg.className = "pie-dlg";
  dlg.setAttribute("aria-label", `Acerca de ${S.proyecto}`);
  dlg.innerHTML = `<div class="pie-dlg-h"><h2>${esc(S.proyecto)}</h2><button type="button" class="pie-x" aria-label="Cerrar">×</button></div>
    <div class="pie pie-completo">${completo()}</div>`;
  document.body.appendChild(dlg);

  const abrir = foco => {
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    const t = foco === "colaborar" ? dlg.querySelector("#pie-colaborar") : null;
    if (t) t.scrollIntoView({ block: "nearest" });
  };
  const cerrar = () => { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); };
  el.addEventListener("click", e => { const b = e.target.closest("[data-pie]"); if (b) abrir(b.dataset.pie); });
  dlg.querySelector(".pie-x").addEventListener("click", cerrar);
  dlg.addEventListener("click", e => { if (e.target === dlg) cerrar(); });
})();
