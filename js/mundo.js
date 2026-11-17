// ============================================================
// MUNDO (beta): petróleo y gas, minería y agro en todo el mundo.
// Datos: data/auto/mundo.js (MUNDO_DATA, lo arma scripts/mundo/mundo.py) · Mapa: data/geo/mundo.js (MUNDO)
// Activo = [tipo, nombre, iso3, lat, lon, estado, tamaño, eficiencia, operador(idx emp), dueños [[idx emp, %]], año, wiki, fuente]
// ============================================================
(function(){
const D = typeof MUNDO_DATA!=="undefined" ? MUNDO_DATA : null;
const side = document.getElementById("side");
if(!D){ side.innerHTML = `<h2>Sin datos todavía</h2><p class="note">Falta generar <code>data/auto/mundo.js</code> (scripts/mundo/mundo.py).</p>`; return; }

const AR = "ARG";
const T = D.tipos, EMP = D.emp||[], PA = D.paises||{};
const SEC = { og:{n:"Petróleo y gas", c:"--og"}, mi:{n:"Minería", c:"--mi"}, ag:{n:"Agro", c:"--ag"} };
const ESTADOS = [["op","En operación"],["dev","En desarrollo"],["pro","Proyecto o descubierto"],["par","Parado"],["otro","Otro / sin dato"]];
const ORDEN_T = ["campo","refi","cu","fe","al","coal"];
const A = D.act.map((a,i)=>({ i, t:a[0], n:a[1], c:a[2], lat:a[3], lon:a[4], st:a[5], v:a[6], ef:a[7], op:a[8], own:a[9]||[], y:a[10], w:a[11], src:a[12] }));
const S = { vista:"act", tipos:new Set(["campo","refi","cu","fe","al"]), est:new Set(["op","dev"]), foco:"campo", lista:"act", agro:"soja", agroMet:"prod", sel:null };

const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const nf = (x,d=1)=> x==null||isNaN(x) ? "s/d" : x.toLocaleString("es-AR",{minimumFractionDigits:0,maximumFractionDigits:d});
const nfa = x => x==null ? "s/d" : x>=100 ? nf(x,0) : x>=10 ? nf(x,1) : nf(x,2);
const pct = (x,d)=> x==null||isNaN(x) ? "s/d" : nf(x*100, d!=null?d:(x<0.01?2:1))+"%";
const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pais = c => c==="EU" ? "Unión Europea" : (PA[c]&&PA[c][0]) || c;
const empN = i => typeof i==="number" ? (EMP[i]||"?") : (i||"?");
const secOf = t => (T[t]||{}).s || "og";
const col = t => css(SEC[secOf(t)].c);

// ---------- cálculos ----------
// participaciones: si la fuente no da %, se reparte en partes iguales lo que falta (se marca como aproximado)
function shares(a){
  const o=a.own||[]; if(!o.length) return [];
  const known=o.filter(x=>x[1]!=null).reduce((s,x)=>s+x[1],0), nul=o.filter(x=>x[1]==null).length;
  const rest=Math.max(0,100-known);
  return o.map(([e,p])=>({e, p:p!=null?p:(nul?rest/nul:0), aprox:p==null}));
}
const cacheT = {};
function stats(t){
  if(cacheT[t]) return cacheT[t];
  const op = A.filter(a=>a.t===t && a.st==="op" && a.v>0).sort((x,y)=>y.v-x.v);
  const tot = d3.sum(op,a=>a.v);
  op.forEach((a,k)=>{ a.rank=k+1; a.sh=a.v/tot; });
  const nOp=op.length;
  // eficiencia
  const menor = (T[t]||{}).efMenor;
  const ef = A.filter(a=>a.t===t && a.st==="op" && a.ef!=null && a.ef>0).sort((x,y)=> menor ? x.ef-y.ef : y.ef-x.ef);
  ef.forEach((a,k)=>{ a.erank=k+1; a.epct=1-(k/(Math.max(1,ef.length-1))); });
  // países
  const pm = d3.rollup(op, v=>({v:d3.sum(v,a=>a.v), n:v.length}), a=>a.c);
  const paises = [...pm].map(([c,o])=>({c, v:o.v, n:o.n, sh:o.v/tot})).sort((x,y)=>y.v-x.v);
  paises.forEach((p,k)=>p.rank=k+1);
  // empresas (producción o capacidad atribuible según participación)
  const em = new Map();
  op.forEach(a=> shares(a).forEach(s=>{
    if(typeof s.e!=="number") return;
    const r = em.get(s.e) || {e:s.e, v:0, ar:0, n:0, aprox:false};
    const x=a.v*s.p/100; r.v+=x; if(a.c===AR) r.ar+=x; r.n++; r.aprox = r.aprox||s.aprox; em.set(s.e,r);
  }));
  const emps = [...em.values()].filter(r=>r.v>0).sort((x,y)=>y.v-x.v);
  emps.forEach((r,k)=>{ r.rank=k+1; r.sh=r.v/tot; });
  return cacheT[t] = {op, tot, nOp, ef, paises, emps};
}

// ---------- mapa ----------
const box = document.getElementById("mapbox"), cv = document.getElementById("cv"), ctx = cv.getContext("2d");
const land = topojson.feature(MUNDO, MUNDO.objects.countries);
const byNum = new Map(land.features.map(f=>[String(f.id).padStart(3,"0"), f]));
const numOf = c => PA[c]&&PA[c][1];
let W=0, Hh=0, dpr=1, proj, path, tf=d3.zoomIdentity, qt=null, drawn=[];
const zoom = d3.zoom().scaleExtent([1,40]).on("zoom", ev=>{ tf=ev.transform; draw(); });
d3.select(cv).call(zoom).on("dblclick.zoom", null);

function size(){
  const r=box.getBoundingClientRect(); W=Math.max(300,r.width); Hh=Math.max(300,r.height); dpr=window.devicePixelRatio||1;
  cv.width=W*dpr; cv.height=Hh*dpr; cv.style.height=Hh+"px";
  // sin la Antártida: el recuadro va de 58° S a 84° N para aprovechar el alto del mapa
  proj=d3.geoNaturalEarth1().fitExtent([[8,8],[W-8,Hh-8]], {type:"Feature",geometry:{type:"Polygon",coordinates:[[[-180,-58],[180,-58],[180,84],[-180,84],[-180,-58]].reverse()]}});
  path=d3.geoPath(proj, ctx);
  zoom.translateExtent([[-W*0.2,-Hh*0.2],[W*1.2,Hh*1.2]]).extent([[0,0],[W,Hh]]);
  draw();
}
const SYM = { og:d3.symbolCircle, mi:d3.symbolTriangle, ag:d3.symbolSquare };
function shape(sec, x, y, r){
  ctx.save(); ctx.translate(x,y); ctx.beginPath();
  d3.symbol(SYM[sec], Math.PI*r*r).context(ctx)(); ctx.restore();
}
function choroVals(){
  const k=S.agro, ds=D.agro[k]; if(!ds) return null;
  const m=new Map();
  if(k.startsWith("x_")) ds.p.forEach(p=>m.set(p[0], p[1]));
  else if(S.agroMet==="yield") ds.p.forEach(p=>{ if(p[3]) m.set(p[0], p[3]); });
  else ds.p.forEach(p=>m.set(p[0], p[1]));
  return m;
}
function draw(){
  if(!proj) return;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle=css("--sea"); ctx.fillRect(0,0,W,Hh);
  ctx.save(); ctx.translate(tf.x,tf.y); ctx.scale(tf.k,tf.k);
  ctx.beginPath(); path({type:"Sphere"}); ctx.fillStyle=css("--sea"); ctx.fill();
  const landC=css("--land"), bord=css("--border"), arC=css("--ar");
  let cmap=null, cscale=null;
  if(S.vista==="agro"){ cmap=choroVals(); if(cmap){ const mx=d3.max([...cmap.values()]); cscale = S.agroMet==="yield"&&!S.agro.startsWith("x_") ? d3.scaleLinear().domain([d3.min([...cmap.values()]),mx]).range([0.12,1]) : d3.scaleSqrt().domain([0,mx]).range([0.08,1]); } }
  const agC=css("--ag");
  for(const f of land.features){
    ctx.beginPath(); path(f);
    let fill=landC;
    if(cmap){ const a3=a3ByNum.get(String(f.id).padStart(3,"0")); const v=a3&&cmap.get(a3); if(v) fill=mix(agC, landC, cscale(v)); }
    ctx.fillStyle=fill; ctx.fill();
    ctx.lineWidth=0.5/tf.k; ctx.strokeStyle=bord; ctx.stroke();
    if(String(f.id).padStart(3,"0")==="032"){ ctx.lineWidth=1.6/tf.k; ctx.strokeStyle=arC; ctx.stroke(); }
  }
  ctx.restore();
  drawn=[];
  if(S.vista==="act"){
    const vis=A.filter(a=>S.tipos.has(a.t) && S.est.has(a.st) && a.lat!=null);
    const mx={}; ORDEN_T.forEach(t=>mx[t]=d3.max(A.filter(a=>a.t===t),a=>a.v)||1);
    const zk=1+Math.log2(tf.k)*0.35;
    vis.sort((x,y)=> (x.c===AR)-(y.c===AR) || (y.v||0)-(x.v||0));
    for(const a of vis){
      const p=proj([a.lon,a.lat]); if(!p) continue;
      const x=tf.x+tf.k*p[0], y=tf.y+tf.k*p[1];
      if(x<-20||y<-20||x>W+20||y>Hh+20) continue;
      const r=(1.4+9*Math.sqrt((a.v||0)/mx[a.t]))*zk;
      const sec=secOf(a.t);
      shape(sec,x,y,r);
      ctx.globalAlpha = a.st==="op" ? 0.78 : 0.45;
      ctx.fillStyle = a.st==="op" ? col(a.t) : css("--panel");
      ctx.fill(); ctx.globalAlpha=1;
      ctx.lineWidth = a.c===AR ? 1.8 : (a.st==="op"?0.6:1.2);
      ctx.strokeStyle = a.c===AR ? arC : (a.st==="op" ? css("--panel") : col(a.t));
      ctx.stroke();
      if(S.sel && S.sel.k==="a" && S.sel.a===a){ ctx.beginPath(); ctx.arc(x,y,r+5,0,7); ctx.lineWidth=2; ctx.strokeStyle=css("--ink"); ctx.stroke(); }
      drawn.push({x,y,r,a});
    }
  }
  qt=d3.quadtree().x(d=>d.x).y(d=>d.y).addAll(drawn);
  legend();
}
const a3ByNum = new Map(Object.entries(PA).filter(([,v])=>v[1]).map(([k,v])=>[String(v[1]).padStart(3,"0"),k]));
function mix(c1,c2,t){ const a=d3.color(c1), b=d3.color(c2); if(!a||!b) return c1; return d3.interpolateRgb(b,a)(t); }

function legend(){
  const el=document.getElementById("leg");
  if(S.vista==="act"){
    el.innerHTML = Object.entries(SEC).filter(([k])=>k!=="ag").map(([k,s])=>`<span>${symSvg(k,css(s.c))}${s.n}</span>`).join("")
      + `<span><svg width="12" height="12" viewBox="-6 -6 12 12"><circle r="4" fill="none" stroke="${css("--ar")}" stroke-width="1.8"/></svg>Argentina</span>`
      + `<span><svg width="12" height="12" viewBox="-6 -6 12 12"><circle r="4" fill="${css("--panel")}" stroke="${css("--muted")}" stroke-width="1.2"/></svg>No operativo</span>`;
  } else {
    const ds=D.agro[S.agro];
    el.innerHTML = ds ? `<span><i class="ramp" style="background:linear-gradient(90deg,${mix(css("--ag"),css("--land"),.1)},${css("--ag")})"></i>${S.agroMet==="yield"&&!S.agro.startsWith("x_")?"Rendimiento (kg/ha)":esc(ds.u)} · ${ds.anio}</span>` : "";
  }
}
function symSvg(sec,c,s=12){ return `<svg class="sym" width="${s}" height="${s}" viewBox="-6 -6 12 12"><path d="${d3.symbol(SYM[sec],38)()}" fill="${c}"/></svg>`; }

// tooltip + clic
const tip=document.getElementById("tip");
function hit(ev){
  const r=cv.getBoundingClientRect(), x=ev.clientX-r.left, y=ev.clientY-r.top;
  if(S.vista==="act" && qt){ const d=qt.find(x,y,14); if(d && Math.hypot(d.x-x,d.y-y)<=Math.max(6,d.r+3)) return {a:d.a}; }
  const p=proj.invert([(x-tf.x)/tf.k,(y-tf.y)/tf.k]);
  if(p){ const f=land.features.find(f=>d3.geoContains(f,p)); if(f){ const a3=a3ByNum.get(String(f.id).padStart(3,"0")); if(a3) return {c:a3, f}; } }
  return null;
}
cv.addEventListener("pointermove", ev=>{
  if(ev.pointerType==="touch") return;
  const h=hit(ev);
  if(!h){ tip.hidden=true; cv.style.cursor="grab"; return; }
  cv.style.cursor="pointer";
  tip.innerHTML = h.a ? tipA(h.a) : tipC(h.c);
  tip.hidden=false;
  const tw=tip.offsetWidth, th=tip.offsetHeight;
  tip.style.left=Math.min(window.innerWidth-tw-8, ev.clientX+14)+"px"; tip.style.top=Math.min(window.innerHeight-th-8, ev.clientY+14)+"px";
});
cv.addEventListener("pointerleave", ()=>tip.hidden=true);
let down=null;
cv.addEventListener("pointerdown", ev=>down=[ev.clientX,ev.clientY]);
cv.addEventListener("click", ev=>{
  if(down && Math.hypot(ev.clientX-down[0],ev.clientY-down[1])>5) return;
  const h=hit(ev); tip.hidden=true;
  if(h&&h.a) selA(h.a); else if(h&&h.c) selC(h.c);
});
function tipA(a){
  const t=T[a.t], s=stats(a.t);
  const own=shares(a).slice(0,4).map(o=>`${esc(empN(o.e))}${o.p?` ${nf(o.p,1)}%`:""}`).join(" · ");
  return `<b>${esc(a.n)}</b><div style="color:var(--muted)">${esc(t.n)} · ${esc(pais(a.c))}</div>
    <div>${esc(t.tam)}: <b>${nfa(a.v)}</b> ${esc(t.u)}${a.rank?` · puesto ${a.rank} de ${s.nOp}`:""}</div>
    ${own?`<div style="margin-top:3px">${own}</div>`:""}<div style="color:var(--muted);margin-top:3px">Tocá para ver la ficha</div>`;
}
function tipC(c){
  if(S.vista==="agro"){ const ds=D.agro[S.agro]; const p=ds&&ds.p.find(p=>p[0]===c); const k=ds?ds.p.findIndex(p=>p[0]===c):-1;
    return `<b>${esc(pais(c))}</b>${p?`<div>${esc(ds.n)}: <b>${nfa(p[1])}</b> ${esc(ds.u)} · puesto ${k+1}</div>${p[3]&&!S.agro.startsWith("x_")?`<div>Rendimiento: ${nf(p[3],0)} kg/ha</div>`:""}`:`<div style="color:var(--muted)">Sin dato</div>`}`; }
  const s=stats(S.foco), p=s.paises.find(p=>p.c===c);
  return `<b>${esc(pais(c))}</b><div>${esc(T[S.foco].n)}: ${p?`<b>${pct(p.sh)}</b> del mundo · puesto ${p.rank}`:"sin activos operativos"}</div>`;
}

// ---------- panel lateral ----------
function rkRow(pos, nm, sub, val, w, isAr, attrs, c){
  return `<button class="rk${isAr?" ar":""}" ${attrs} style="--c:${c}"><span class="pos">${pos}</span><span class="nm">${nm}${sub?` <small>${sub}</small>`:""}</span><span class="v">${val}</span><span></span><span class="bar" style="width:${Math.max(1.5,w*100)}%"></span></button>`;
}
function topConAr(list, isAr, n=15){
  const top=list.slice(0,n), extra=list.slice(n).filter(isAr).slice(0,8);
  return {top, extra};
}
function renderTipo(){
  const t=S.foco, ti=T[t], s=stats(t), c=col(t);
  const arP=s.paises.find(p=>p.c===AR), arA=s.op.filter(a=>a.c===AR);
  const src=D.fuentes[ti.src]||{};
  let h=`<p class="eyebrow">${esc(SEC[ti.s].n)} · ranking mundial</p><h2>${esc(ti.n)}</h2>
  <div class="kpis"><div><b>${arP?pct(arP.sh):"–"}</b><span>de la Argentina en el total mundial</span></div>
  <div><b>${arP?arP.rank+"°":"–"}</b><span>puesto de la Argentina entre ${s.paises.length} países</span></div>
  <div><b>${arA.length}</b><span>activos argentinos en operación con dato (de ${s.nOp})</span></div></div>
  <div class="tabs" role="group" aria-label="Lista">${[["act","Activos"],["pais","Países"],["emp","Empresas"],["ef","Eficiencia"]].map(([k,n])=>`<button data-l="${k}" aria-pressed="${S.lista===k}">${n}</button>`).join("")}</div>`;
  const mxv = l => d3.max(l, x=>x.v)||1;
  if(S.lista==="act"){
    h+=`<h3>${esc(ti.tam)} · ${esc(ti.u)}</h3>`;
    const {top,extra}=topConAr(s.op, a=>a.c===AR); const m=mxv(s.op);
    h+=top.map(a=>rkRow(a.rank, esc(a.n), esc(pais(a.c)), `<b>${nfa(a.v)}</b> · ${pct(a.sh)}`, a.v/m, a.c===AR, `data-a="${a.i}"`, c)).join("");
    if(extra.length) h+=`<div class="gap">· · ·</div>`+extra.map(a=>rkRow(a.rank, esc(a.n), esc(pais(a.c)), `<b>${nfa(a.v)}</b> · ${pct(a.sh)}`, a.v/m, true, `data-a="${a.i}"`, c)).join("");
  } else if(S.lista==="pais"){
    h+=`<h3>Suma de los activos en operación · ${esc(ti.u)}</h3>`;
    const {top,extra}=topConAr(s.paises, p=>p.c===AR); const m=mxv(s.paises);
    h+=[...top, ...(extra.length?[null]:[]), ...extra].map(p=> p===null?`<div class="gap">· · ·</div>` : rkRow(p.rank, esc(pais(p.c)), `${p.n} activos`, `<b>${nfa(p.v)}</b> · ${pct(p.sh)}`, p.v/m, p.c===AR, `data-c="${p.c}"`, c)).join("");
  } else if(S.lista==="emp"){
    h+=`<h3>Atribuible según participación · ${esc(ti.u)}</h3>`;
    const arE=s.emps.filter(r=>r.ar>0);
    const {top}=topConAr(s.emps, ()=>false); const m=mxv(s.emps);
    h+=top.map(r=>rkRow(r.rank, esc(empN(r.e)), r.ar>0?`Argentina ${pct(r.ar/r.v)}`:"", `<b>${nfa(r.v)}</b> · ${pct(r.sh)}`, r.v/m, r.ar>0, `data-e="${r.e}"`, c)).join("");
    if(arE.length){ h+=`<h3>Empresas con activos en la Argentina · peso de la Argentina en cada una</h3>`;
      h+=arE.slice(0,20).map(r=>rkRow(r.rank, esc(empN(r.e)), `${nfa(r.ar)} de ${nfa(r.v)}`, `<b>${pct(r.ar/r.v)}</b>`, r.ar/r.v, true, `data-e="${r.e}"`, c)).join(""); }
    if(s.emps.some(r=>r.aprox)) h+=`<p class="note">≈ Cuando la fuente nombra dueños sin porcentaje, se reparte en partes iguales.</p>`;
  } else {
    if(!ti.ef){ h+=`<h3>Eficiencia</h3><p class="note">No hay una medida abierta y comparable de eficiencia por yacimiento: la intensidad de emisiones y los costos de extracción por activo son datos con licencia (Rystad, Wood Mackenzie, S&P). Ver el informe de fuentes para cómo completarlo.</p>`; }
    else {
      h+=`<h3>${esc(ti.ef)} · ${ti.efMenor?"menos es mejor":"más es mejor"}</h3>`;
      const {top,extra}=topConAr(s.ef, a=>a.c===AR); const m=d3.max(s.ef,a=>a.ef)||1;
      const row=a=>rkRow(a.erank, esc(a.n), esc(pais(a.c)), `<b>${efTxt(t,a.ef)}</b>`, a.ef/m, a.c===AR, `data-a="${a.i}"`, c);
      h+=top.map(row).join("")+(extra.length?`<div class="gap">· · ·</div>`+extra.map(row).join(""):"");
      h+=`<p class="note">${efNota(t)}</p>`;
    }
  }
  h+=`<p class="src" style="margin-top:12px">Fuente: <a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.t)}</a> (${esc(src.lic)}). Datos al ${esc(D.meta.actualizado)}.</p>`;
  side.innerHTML=h;
}
const efTxt=(t,v)=> v==null?"s/d": t==="fe" ? pct(v,0) : t==="coal" ? nf(v,0)+" t" : nf(v,1);
const efNota=t=>({
  refi:"Emisiones de CO2e por barril procesado (Climate TRACE). Depende de la complejidad de la refinería: una refinería de conversión profunda emite más por barril pero saca más productos livianos.",
  cu:"Emisiones por tonelada de mineral movido (Climate TRACE). No corrige por ley del mineral: una mina de alta ley produce más cobre por tonelada.",
  al:"Emisiones por tonelada de bauxita extraída (Climate TRACE).",
  fe:"Producción 2023 sobre capacidad de diseño (Global Energy Monitor). Mide qué tanto se usa la mina, no su costo.",
  coal:"Toneladas producidas por trabajador y por año (Global Energy Monitor). Las minas a cielo abierto mecanizadas tienen mucha más productividad que las subterráneas."
}[t]||"");

function owners(a){
  const sh=shares(a); if(!sh.length) return `<p class="note">La fuente no informa dueños.</p>`;
  return `<div class="own" style="--c:${col(a.t)}">${sh.map(o=>`<button data-e="${typeof o.e==="number"?o.e:""}">${esc(empN(o.e))}</button><span class="p">${o.p?(o.aprox?"≈":"")+nf(o.p,1)+"%":"s/d"}</span><span class="b"><i style="width:${o.p||0}%"></i></span>`).join("")}</div>`;
}
function selA(a){
  S.sel={k:"a",a}; draw();
  const t=T[a.t], s=stats(a.t), src=D.fuentes[a.src]||{};
  const pP=s.paises.find(p=>p.c===a.c);
  const link = a.w ? `<a href="https://www.gem.wiki/${esc(a.w)}" target="_blank" rel="noopener">Ficha en GEM.wiki</a> · ` : "";
  side.innerHTML=`<div><button class="btnl" data-back>← ${esc(t.n)}</button></div>
  <p class="eyebrow">${esc(t.n)} · ${esc(pais(a.c))}</p><h2>${esc(a.n)}</h2>
  <div class="kpis"><div><b>${nfa(a.v)}</b><span>${esc(t.u)}${a.y?` (${a.y})`:""}</span></div>
  <div><b>${a.sh?pct(a.sh):"–"}</b><span>del total mundial${a.rank?` · puesto ${a.rank} de ${s.nOp}`:""}</span></div>
  <div><b>${a.ef!=null&&t.ef?efTxt(a.t,a.ef):"–"}</b><span>${t.ef?esc(t.ef)+(a.erank?` · puesto ${a.erank} de ${s.ef.length}`:""):"eficiencia sin dato abierto"}</span></div></div>
  <dl class="dl"><dt>Estado</dt><dd>${esc((ESTADOS.find(e=>e[0]===a.st)||[,a.st])[1])}</dd>
  ${a.op!=null?`<dt>Operador</dt><dd>${esc(empN(a.op))}</dd>`:""}
  ${pP?`<dt>${esc(pais(a.c))}</dt><dd>${pct(pP.sh)} del mundo · puesto ${pP.rank}</dd>`:""}</dl>
  <h3>Dueños y participación</h3>${owners(a)}
  <p class="src" style="margin-top:12px">${link}Fuente: <a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.t)}</a> (${esc(src.lic)}).</p>`;
}
function selE(e){
  S.sel={k:"e",e};
  const mine=A.filter(a=>a.own.some(o=>o[0]===e));
  const porT=d3.groups(mine, a=>a.t);
  let h=`<div><button class="btnl" data-back>← Volver</button></div><p class="eyebrow">Empresa</p><h2>${esc(empN(e))}</h2>`;
  porT.sort((x,y)=>ORDEN_T.indexOf(x[0])-ORDEN_T.indexOf(y[0])).forEach(([t,l])=>{
    const s=stats(t), r=s.emps.find(r=>r.e===e), c=col(t);
    h+=`<h3>${esc(T[t].n)}${r?` · puesto ${r.rank} de ${s.emps.length}`:""}</h3>`;
    if(r) h+=`<div class="kpis"><div><b>${nfa(r.v)}</b><span>${esc(T[t].u)} atribuibles</span></div><div><b>${pct(r.sh)}</b><span>del total mundial</span></div><div><b>${pct(r.ar/r.v)}</b><span>en la Argentina</span></div></div>`;
    const m=d3.max(l,a=>a.v)||1;
    h+=l.sort((x,y)=>(y.v||0)-(x.v||0)).slice(0,25).map(a=>{ const p=shares(a).find(o=>o.e===e); return rkRow(a.rank||"–", esc(a.n), esc(pais(a.c)), `<b>${p?nf(p.p,1)+"%":"s/d"}</b>`, (a.v||0)/m, a.c===AR, `data-a="${a.i}"`, c); }).join("");
    if(l.length>25) h+=`<p class="note">y ${l.length-25} activos más.</p>`;
  });
  h+=`<p class="note">Porcentaje = participación de la empresa en cada activo (incluye participaciones indirectas a través de controladas, según la fuente).</p>`;
  side.innerHTML=h; draw();
}
function selC(c){
  if(S.vista==="agro"){ renderAgro(c); return; }
  S.sel={k:"c",c};
  const t=S.foco, s=stats(t), l=s.op.filter(a=>a.c===c), p=s.paises.find(p=>p.c===c), m=d3.max(l,a=>a.v)||1;
  side.innerHTML=`<div><button class="btnl" data-back>← ${esc(T[t].n)}</button></div><p class="eyebrow">${esc(T[t].n)}</p><h2>${esc(pais(c))}</h2>
  <div class="kpis"><div><b>${p?pct(p.sh):"–"}</b><span>del total mundial</span></div><div><b>${p?p.rank+"°":"–"}</b><span>puesto entre ${s.paises.length} países</span></div><div><b>${l.length}</b><span>activos en operación con dato</span></div></div>
  ${l.slice(0,40).map(a=>rkRow(a.rank, esc(a.n), "", `<b>${nfa(a.v)}</b> · ${pct(a.sh)}`, a.v/m, c===AR, `data-a="${a.i}"`, col(t))).join("")||`<p class="note">Sin activos operativos de este tipo.</p>`}`;
  focusCountry(c);
}

// ---------- agro ----------
function renderAgro(cSel){
  const k=S.agro, ds=D.agro[k]; if(!ds){ side.innerHTML=`<h2>Sin datos de agro</h2>`; return; }
  const exp=k.startsWith("x_"), c=css("--ag");
  const tot = ds.mundo || d3.sum(ds.p,p=>p[1]);
  const prodRank = ds.p.map((p,i)=>({c:p[0], v:p[1], area:p[2], y:p[3], rank:i+1, sh:p[1]/tot}));
  const ar=prodRank.find(p=>p.c===AR);
  // rendimiento: entre los países que hacen al menos el 0,5% del total (evita productores mínimos)
  const yl = exp?[]:prodRank.filter(p=>p.y && p.sh>=0.005).sort((x,y)=>y.y-x.y); yl.forEach((p,i)=>p.yrank=i+1);
  const arY=yl.find(p=>p.c===AR);
  const src=D.fuentes[ds.src]||{};
  let h=`<p class="eyebrow">Agro · ranking mundial por país</p><h2>${esc(ds.n)}</h2>
  <div class="kpis"><div><b>${ar?pct(ar.sh):"–"}</b><span>de la Argentina en el total mundial</span></div>
  <div><b>${ar?ar.rank+"°":"–"}</b><span>puesto de la Argentina entre ${prodRank.length} países</span></div>
  <div><b>${exp?(ar?nfa(ar.v):"–"):(arY?arY.yrank+"°":"–")}</b><span>${exp?esc(ds.u)+" exportadas":"puesto en rendimiento entre "+yl.length+" productores relevantes"}</span></div></div>`;
  if(!exp) h+=`<div class="tabs" role="group" aria-label="Medida">${[["prod","Producción"],["yield","Rendimiento"]].map(([m,n])=>`<button data-am="${m}" aria-pressed="${S.agroMet===m}">${n}</button>`).join("")}</div>`;
  if(cSel){ const p=prodRank.find(p=>p.c===cSel); h+=`<h3>${esc(pais(cSel))}</h3><p>${p?`${nfa(p.v)} ${esc(ds.u)} · ${pct(p.sh)} del mundo · puesto ${p.rank}${p.y&&!exp?` · rinde ${nf(p.y,0)} kg/ha`+(p.yrank?` (puesto ${p.yrank})`:""):""}`:"Sin dato."}</p>`; }
  if(exp || S.agroMet==="prod"){
    const m=d3.max(prodRank,p=>p.v)||1, {top,extra}=topConAr(prodRank, p=>p.c===AR);
    h+=`<h3>${exp?"Exportaciones":"Producción"} ${ds.anio} · ${esc(ds.u)}</h3>`+[...top,...(extra.length?[null]:[]),...extra].map(p=>p===null?`<div class="gap">· · ·</div>`:rkRow(p.rank, esc(pais(p.c)), "", `<b>${nfa(p.v)}</b> · ${pct(p.sh)}`, p.v/m, p.c===AR, `data-c="${p.c}"`, c)).join("");
  } else {
    const m=d3.max(yl,p=>p.y)||1, {top,extra}=topConAr(yl, p=>p.c===AR);
    h+=`<h3>Rendimiento ${ds.anio} · kg por hectárea cosechada</h3>`+[...top,...(extra.length?[null]:[]),...extra].map(p=>p===null?`<div class="gap">· · ·</div>`:rkRow(p.yrank, esc(pais(p.c)), `${pct(p.sh)} de la producción`, `<b>${nf(p.y,0)}</b>`, p.y/m, p.c===AR, `data-c="${p.c}"`, c)).join("");
    h+=`<p class="note">Sólo países con al menos 0,5% de la producción mundial. El rendimiento depende del clima, el suelo y si el cultivo es de secano o con riego: no mide por sí solo la eficiencia económica.</p>`;
  }
  h+=`<p class="src" style="margin-top:12px">Fuente: <a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.t)}</a> (${esc(src.lic)}).</p>`;
  side.innerHTML=h;
}

// ---------- controles ----------
function counts(t){ return A.filter(a=>a.t===t && S.est.has(a.st)).length; }
function renderCtl(){
  let h="";
  ["og","mi"].forEach(sec=>{
    h+=`<div class="sec" style="--c:var(${SEC[sec].c})"><i></i>${SEC[sec].n}</div>`;
    ORDEN_T.filter(t=>T[t]&&T[t].s===sec).forEach(t=>{
      h+=`<label class="tipo">${symSvg(sec,css(SEC[sec].c))}<input type="checkbox" data-t="${t}" ${S.tipos.has(t)?"checked":""}><span class="n">${esc(T[t].n)}</span><span class="c">${nf(counts(t),0)}</span></label>`;
    });
  });
  document.getElementById("tipos").innerHTML=h;
  document.getElementById("estados").innerHTML=ESTADOS.map(([k,n])=>`<button data-st="${k}" aria-pressed="${S.est.has(k)}">${n}</button>`).join("");
  const f=document.getElementById("foco");
  f.innerHTML=ORDEN_T.filter(t=>T[t]).map(t=>`<option value="${t}" ${S.foco===t?"selected":""}>${esc(T[t].n)}</option>`).join("");
  const ag=Object.entries(D.agro||{});
  document.getElementById("agroSel").innerHTML = `<p class="note" style="margin:0 0 4px">Producción (FAOSTAT)</p><div class="chips">${ag.filter(([k])=>!k.startsWith("x_")).map(([k,v])=>`<button data-ag="${k}" aria-pressed="${S.agro===k}">${esc(v.n)}</button>`).join("")}</div>
   <p class="note" style="margin:12px 0 4px">Exportaciones (USDA)</p><div class="chips">${ag.filter(([k])=>k.startsWith("x_")).map(([k,v])=>`<button data-ag="${k}" aria-pressed="${S.agro===k}">${esc(v.n.replace("Exportaciones de ",""))}</button>`).join("")}</div>`;
}
document.addEventListener("change", ev=>{
  const t=ev.target.dataset&&ev.target.dataset.t;
  if(t){ ev.target.checked?S.tipos.add(t):S.tipos.delete(t); if(ev.target.checked){ S.foco=t; renderCtl(); renderTipo(); } draw(); }
  if(ev.target.id==="foco"){ S.foco=ev.target.value; S.tipos.add(S.foco); renderCtl(); renderTipo(); draw(); }
});
document.addEventListener("click", ev=>{
  const b=ev.target.closest("button"); if(!b) return;
  const d=b.dataset;
  if(d.st){ S.est.has(d.st)?S.est.delete(d.st):S.est.add(d.st); renderCtl(); draw(); }
  else if(d.l){ S.lista=d.l; renderTipo(); }
  else if(d.a!=null && d.a!==""){ const a=A[+d.a]; if(S.vista!=="act") setVista("act"); if(!S.tipos.has(a.t)){ S.tipos.add(a.t); renderCtl(); } selA(a); focusAsset(a); }
  else if(d.e!=null && d.e!==""){ selE(+d.e); }
  else if(d.c){ selC(d.c); }
  else if(d.back!=null){ S.sel=null; S.vista==="act"?renderTipo():renderAgro(); draw(); }
  else if(d.ag){ S.agro=d.ag; renderCtl(); renderAgro(); draw(); }
  else if(d.am){ S.agroMet=d.am; renderAgro(); draw(); }
});
function setVista(v){
  S.vista=v; document.getElementById("tAct").setAttribute("aria-pressed",v==="act"); document.getElementById("tAgro").setAttribute("aria-pressed",v==="agro");
  document.getElementById("ctlAct").hidden=v!=="act"; document.getElementById("ctlAgro").hidden=v!=="agro";
  S.sel=null; v==="act"?renderTipo():renderAgro(); draw();
}
document.getElementById("tAct").onclick=()=>setVista("act");
document.getElementById("tAgro").onclick=()=>setVista("agro");

// zoom
const sel=d3.select(cv);
document.getElementById("zIn").onclick=()=>sel.transition().duration(300).call(zoom.scaleBy,1.6);
document.getElementById("zOut").onclick=()=>sel.transition().duration(300).call(zoom.scaleBy,1/1.6);
document.getElementById("zW").onclick=()=>sel.transition().duration(500).call(zoom.transform,d3.zoomIdentity);
document.getElementById("zAr").onclick=()=>focusCountry(AR);
function focusBounds(b, maxK=12){
  const [[x0,y0],[x1,y1]]=b, k=Math.min(maxK, 0.85/Math.max((x1-x0)/W,(y1-y0)/Hh));
  sel.transition().duration(700).call(zoom.transform, d3.zoomIdentity.translate(W/2,Hh/2).scale(k).translate(-(x0+x1)/2,-(y0+y1)/2));
}
function focusCountry(c){
  const f=byNum.get(String(numOf(c)||"").padStart(3,"0")); if(!f) return;
  // la Argentina sin la Antártida ni islas lejanas: se usa el polígono más grande
  let g=f; if(f.geometry.type==="MultiPolygon"){ const big=f.geometry.coordinates.map(p=>({type:"Polygon",coordinates:p})).sort((a,b)=>d3.geoArea(b)-d3.geoArea(a))[0]; g={type:"Feature",geometry:big}; }
  focusBounds(path.bounds(g), 8);
}
function focusAsset(a){ const p=proj([a.lon,a.lat]); if(!p) return; const k=Math.max(tf.k,5); sel.transition().duration(700).call(zoom.transform, d3.zoomIdentity.translate(W/2,Hh/2).scale(k).translate(-p[0],-p[1])); }

// búsqueda
const q=document.getElementById("q"), qr=document.getElementById("qres");
const nrm=s=>String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const empIdx=EMP.map((n,i)=>({i,n,k:nrm(n)})), actIdx=A.map(a=>({a,k:nrm(a.n)}));
q.addEventListener("input", ()=>{
  const v=nrm(q.value.trim()); if(v.length<2){ qr.hidden=true; return; }
  const ps=Object.entries(PA).filter(([c,p])=>nrm(p[0]).includes(v)).slice(0,4);
  const es=empIdx.filter(e=>e.k.includes(v)).slice(0,6);
  const as=actIdx.filter(x=>x.k.includes(v)).sort((x,y)=>(y.a.v||0)-(x.a.v||0)).slice(0,8);
  qr.innerHTML = ps.map(([c,p])=>`<button data-c="${c}">${esc(p[0])} <small>país</small></button>`).join("")
    + es.map(e=>`<button data-e="${e.i}">${esc(e.n)} <small>empresa</small></button>`).join("")
    + as.map(x=>`<button data-a="${x.a.i}">${esc(x.a.n)} <small>${esc(T[x.a.t].n)} · ${esc(pais(x.a.c))}</small></button>`).join("") || `<button disabled>Sin resultados</button>`;
  qr.hidden=false;
});
qr.addEventListener("click", ()=>{ qr.hidden=true; q.value=""; });
document.addEventListener("keydown", ev=>{ if(ev.key==="Escape"){ qr.hidden=true; tip.hidden=true; } });

window.addEventListener("resize", ()=>{ clearTimeout(window.__mr); window.__mr=setTimeout(size,120); });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
renderCtl(); renderTipo(); size();
})();
