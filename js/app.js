// Matriz Productiva — lógica de la página. Los datos viven en /data.

// ---- Etiquetas de fecha que salen de los datos (se actualizan solas) ----
const MESL = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const MESF = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const ymTxt = ym => { const [y,m]=ym.split("-"); return `${MESL[+m-1]}-${y}`; };
const ymLargo = ym => { const [y,m]=ym.split("-"); return `${MESF[+m-1]} de ${y}`; };
const fmtN = n => Math.round(n).toLocaleString("es-AR");
const fmtG = n => n.toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2});

// ---- Producción oficial de Capítulo IV (data/auto/produccion.js) ----
// Cuando hay una corrida automática, reemplaza los números cargados a mano en
// indicadores, rankings y fichas de áreas y operadoras.
if (typeof PROD !== "undefined" && PROD) {
  const mes = ymTxt(PROD.mes), ord = ["1ª","2ª","3ª","4ª","5ª"];
  const nombreArea = a => {
    const pt = a.id && PTS.find(p=>p.id===a.id);
    const op = a.op && EMP[a.op] ? EMP[a.op].n.replace(/ \(.*\)$/,"").replace(" Energy","").replace("Pan American","PAE") : a.opn;
    return `${pt ? pt.n.replace(/ \(.*\)$/,"") : a.n}${op ? ` (${op})` : ""}`;
  };
  const og = STATS.og;
  og.kpis[0] = { v:fmtN(PROD.pet), u:"bbl/d", l:"Producción de petróleo", p:`${mes} · suma oficial pozo por pozo`, s:"cap4" };
  og.kpis[1] = { v:fmtN(PROD.nqnNC), u:"bbl/d", l:"No convencional en Neuquén", p:`${mes} · ${(PROD.nqnNC/PROD.pet*100).toLocaleString("es-AR",{maximumFractionDigits:1})}% del petróleo del país`, s:"cap4" };
  og.kpis[2] = { v:PROD.gas.toLocaleString("es-AR",{maximumFractionDigits:1}), u:"MMm³/d", l:"Producción de gas", p:mes, s:"cap4" };
  og.charts[0] = { ...og.charts[0], sub:`Barriles por día, ${PROD.mes.slice(0,4)} (suma oficial de todos los pozos)`, rows:PROD.mensual };
  og.charts[1] = { ...og.charts[1], sub:`Barriles por día, ${ymLargo(PROD.mes)}`, rows:PROD.areasPet.slice(0,11).map(a=>[nombreArea(a),a.pet,...(a.id?[a.id]:[])]) };
  og.charts[2] = { ...og.charts[2], sub:`Millones de m³ por día, ${ymLargo(PROD.mes)}`, rows:PROD.areasGas.slice(0,10).map(a=>[nombreArea(a),a.gas,...(a.id?[a.id]:[])]) };
  og.charts[3] = { ...og.charts[3], sub:`Barriles por día operados, ${ymLargo(PROD.mes)}`, rows:PROD.operadores.slice(0,10).map(o=>[o.k&&EMP[o.k]?EMP[o.k].n.replace(/ \(.*\)$/,""):o.n,o.pet]) };
  PROD.areasPet.forEach((a,i)=>{ const pt=a.id&&PTS.find(p=>p.id===a.id); if(!pt) return;
    const rg=PROD.areasGas.findIndex(x=>x.n===a.n);
    const extra = i<5 ? ` ${ord[i]} área petrolera del país.` : rg>=0&&rg<5 ? ` ${ord[rg]} área gasífera del país.` : "";
    pt.pq = { ...(pt.pq||{}), of:{ t:`${fmtN(a.pet)} bbl/d de petróleo y ${fmtG(a.gas)} MMm³/d de gas (${mes}).${extra}`, s:"cap4" } }; });
  PROD.operadores.forEach(o=>{ if(o.k&&EMP[o.k]) EMP[o.k].pqo = { t:`${fmtN(o.pet)} bbl/d de petróleo y ${fmtG(o.gas)} MMm³/d de gas operados (${mes}).`, s:"cap4" }; });
}
// Resuelve la ficha técnica de un activo: propia + proceso típico de su eslabón
function tecOf(a){
  const g = TEC_GEN[a.s+"-"+a.e] || null;
  const t = TEC[a.id] || null;
  if(!t && !g) return null;
  return { ...(g||{}), ...(t||{}), gen: !t || !t.met };
}


// ---- Minería: capa oficial SIACAM + lo cargado a mano (RIGI, producción, proyecciones) ----
(function(){
  const EST = {"Producción":"op","Construcción":"con","Reingeniería":"con","Factibilidad":"pro","Prefactibilidad":"pro","Evaluación Económica Preliminar":"pro"};
  const ETA = m => m==="Litio"?"li":m==="Cobre"?"cu":(m==="Oro"||m==="Plata")?"au":"ot";
  const manual = Object.fromEntries(PTS.filter(p=>p.s==="mi").map(p=>[p.id,p]));
  const resto = PTS.filter(p=>p.s!=="mi");
  const nuevos = SIACAM.map(o=>{
    const m = manual[o.id] || {};
    const emp = o.ctrl.map(([nom,pct,orig,key])=>{
      let k = key;
      if(!k){
        k = "x-"+nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
        if(!EMP[k]) EMP[k] = { n:nom, tipo:`Controlante según SIACAM${orig?" · origen "+orig:""}`, t:[], w:null };
      }
      return [k, pct!=null ? `Controlante ${String(pct).replace(".",",")}%` : "Controlante"];
    });
    return { ...m, id:o.id, s:"mi", e:ETA(o.min), n:m.n||o.n, prov:o.prov, ll:o.ll,
      st:EST[o.est]||"exp", estOf:o.est, emp:emp.length?emp:(m.emp||[]),
      prod:m.prod||`${o.min} (mineral principal)`,
      d:m.d||`Proyecto de ${o.min.toLowerCase()} en etapa de ${o.est.toLowerCase()}, según la cartera oficial.`,
      src:["siacam",...((m.src||[]).filter(x=>x!=="miCart"))],
      prec:"Coordenadas oficiales de la Secretaría de Minería", of:true };
  });
  PTS.length = 0; PTS.push(...resto, ...nuevos);
  const orden = ["Producción","Construcción","Reingeniería","Factibilidad","Prefactibilidad","Evaluación Económica Preliminar","Exploración avanzada","Exploración inicial","Prospección","Cese de operaciones"];
  const porEst = orden.map(e=>[e, SIACAM.filter(o=>o.est===e).length]).filter(r=>r[1]);
  const avanz = SIACAM.filter(o=>EST[o.est]);
  const mins = [...new Set(avanz.map(o=>o.min))].map(mn=>[mn, avanz.filter(o=>o.min===mn).length]).sort((a,b)=>b[1]-a[1]);
  STATS.mi.kpis.unshift({ v:String(SIACAM.length), u:"proyectos", l:"Cartera oficial de proyectos", p:`${porEst.find(r=>r[0]==="Producción")?.[1]||0} en producción · ${SIACAM.filter(o=>o.est==="Construcción").length} en construcción`, s:"siacam" });
  STATS.mi.charts.push(
    { t:"Cartera oficial por etapa", sub:"Cantidad de proyectos metalíferos y de litio", u:"proyectos", s:"siacam", rows:porEst },
    { t:"Proyectos avanzados por mineral", sub:"En producción, construcción, reingeniería o estudios de factibilidad", u:"proyectos", s:"siacam", rows:mins }
  );
})();

// ---- RIGI: registro oficial (data/manual/rigi.js, resoluciones del Boletín Oficial) ----
const RIGI_EST = { aprobado:"Aprobado", presentado:"Presentado", en_evaluacion:"En evaluación" };
const MESC = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const fechaC = f => { if(!f) return ""; const [y,m,d]=String(f).split("-"); return d?`${+d}-${MESC[m-1]}-${y}`:m?`${MESC[m-1]}-${y}`:y; };
const musd = n => "US$ "+Math.round(n).toLocaleString("es-AR")+" M";
(function(){
  Object.assign(SRC, RIGI_SRC);
  [...PTS,...LNS].forEach(a=>{
    delete a.rigi;
    let r = RIGI[a.id]; if(r && r.ref) r = RIGI[r.ref];
    if(!r) return;
    const st = RIGI_EST[r.st] + (r.res?` · Res. ME ${r.res}`:"") + (r.bo?` (B.O. ${fechaC(r.bo)})`:"");
    const inv = r.comp&&r.total ? `${musd(r.total)} totales · ${musd(r.comp)} en activos computables`
      : r.comp ? `${musd(r.comp)} en activos computables`
      : r.total ? `${musd(r.total)}${r.verif==="empresa"?" (declarado por la empresa)":""}` : "Monto a confirmar en el texto de la resolución";
    a.rigi = { st, inv, s:(r.src&&r.src[0])||"portalRIGI", det:r, v:r.total||r.comp||null, ok:r.st==="aprobado" };
    a.src = [...new Set([...(a.src||[]), ...(r.src||[])])];
  });
})();

const SECT = { og:{n:"Oil & Gas"}, mi:{n:"Minería"}, ag:{n:"Agro y ganadería"} };
const ETAPAS = {
  og:[{k:"up",n:"Yacimientos y áreas",sym:"circle"},{k:"proc",n:"Plantas de gas y petroquímica",sym:"square"},{k:"ref",n:"Refinerías",sym:"diamond"},{k:"duct",n:"Gasoductos y oleoductos",sym:"line"},{k:"exp",n:"Terminales de exportación y GNL",sym:"triangle"}],
  mi:[{k:"li",n:"Litio (salares)",sym:"circle"},{k:"cu",n:"Cobre",sym:"square"},{k:"au",n:"Oro y plata",sym:"diamond"},{k:"ot",n:"Uranio y otros minerales",sym:"triangle"}],
  ag:[{k:"crush",n:"Molienda de oleaginosas",sym:"square"},{k:"port",n:"Puertos agroexportadores",sym:"triangle"},{k:"carne",n:"Frigoríficos y hacienda",sym:"circle"},{k:"ins",n:"Insumos (fertilizantes)",sym:"diamond"},{k:"log",n:"Corredores logísticos",sym:"line"}]
};
const ESTADO = { op:"En operación", con:"En construcción", pro:"Proyecto avanzado", exp:"Exploración" };
const EX = { BYMA:["BYMA","BCBA"], NYSE:["NYSE","NYSE"], LON:["Londres","LON"], TSE:["Toronto","TSE"], EPA:["París","EPA"], ASX:["Australia","ASX"], SHE:["Shenzhen","SHE"], SHA:["Shanghái","SHA"], CVE:["TSX-V","CVE"], BVMF:["B3","BVMF"], NASDAQ:["NASDAQ","NASDAQ"] };
const SYM = { circle:d3.symbolCircle, square:d3.symbolSquare, diamond:d3.symbolDiamond, triangle:d3.symbolTriangle };
const etapaOf = (s,e)=>ETAPAS[s].find(x=>x.k===e);
const cvar = s=>`var(--${s})`;

const ALL = [...PTS.map(p=>({...p,kind:"pt"})), ...LNS.map(l=>({...l,kind:"ln",prov:l.prov||"Interprovincial"}))];
const byId = Object.fromEntries(ALL.map(a=>[a.id,a]));

// ---------- estado de la UI ----------
const st = {
  layers: Object.fromEntries(Object.entries(ETAPAS).flatMap(([s,es])=>es.map(e=>[s+"."+e.k,true]))),
  estados: {op:true,con:true,pro:true,exp:false},
  q:"", company:null, sel:null, view:"map", sort:{k:"s",dir:1}, coSect:"all", coListed:false, coSel:null
};
try{ const saved = JSON.parse(localStorage.getItem("mp-layers")||"null"); if(saved) Object.assign(st.layers, saved); }catch(e){}
const saveLayers = ()=>{ try{ localStorage.setItem("mp-layers", JSON.stringify(st.layers)); }catch(e){} };

const norm = s=>(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
function matchQ(a){
  if(!st.q) return true;
  const hay = norm([a.n,a.prov,a.prod,SECT[a.s].n,etapaOf(a.s,a.e).n,...a.emp.map(([k])=>EMP[k].n)].join(" "));
  return st.q.split(/\s+/).every(t=>hay.includes(t));
}
const visible = a => st.layers[a.s+"."+a.e] && st.estados[a.st] && (!st.company || a.emp.some(([k])=>k===st.company)) && matchQ(a);

// ---------- mapa ----------
const svg = d3.select("#map");
const W=800,H=1200;
const proj = d3.geoMercator().fitExtent([[40,30],[W-40,H-30]], GEO.prov);
const path = d3.geoPath(proj);
svg.append("rect").attr("x",-4000).attr("y",-4000).attr("width",9000).attr("height",9000).attr("fill","var(--sea)");
const g = svg.append("g");
const gNb=g.append("g"), gProv=g.append("g"), gRiv=g.append("g"), gLab=g.append("g"), gLn=g.append("g"), gPt=g.append("g");
gNb.selectAll("path").data(GEO.nb.features).join("path").attr("class","nb").attr("d",path);
const provSel = gProv.selectAll("path").data(GEO.prov.features).join("path").attr("class","prov").attr("d",path)
  .on("click",(ev,f)=>{ ev.stopPropagation(); openProvince(f); });
gRiv.selectAll("path").data(GEO.rivers.features).join("path").attr("class","river").attr("d",path);
const labs = gLab.selectAll("text").data(GEO.prov.features.filter(f=>f.properties.name!=="Ciudad de Buenos Aires")).join("text").attr("class","plab")
  .attr("x",f=>path.centroid(f)[0]).attr("y",f=>path.centroid(f)[1]).text(f=>f.properties.name);

ALL.forEach(a=>{ if(a.kind==="pt"){ const [x,y]=proj([a.ll[1],a.ll[0]]); a.x=x; a.y=y; } });
const lineGen = d3.line().curve(d3.curveCatmullRom.alpha(.5));
const lnSel = gLn.selectAll("g").data(ALL.filter(a=>a.kind==="ln")).join("g")
  .attr("class",a=>`ln st-${a.st}`).attr("style",a=>`--c:${cvar(a.s)}`);
lnSel.each(function(a){
  const d = lineGen(a.path.map(([la,lo])=>proj([lo,la])));
  const sel=d3.select(this);
  sel.append("path").attr("class","ln-base").attr("d",d);
  sel.append("path").attr("class","ln-flow").attr("d",d);
  sel.append("path").attr("class","ln-hit").attr("d",d);
});
const ptSel = gPt.selectAll("g").data(ALL.filter(a=>a.kind==="pt")).join("g")
  .attr("class",a=>`pt st-${a.st}`).attr("style",a=>`--c:${cvar(a.s)}`);
ptSel.append("path").attr("d",a=>d3.symbol(SYM[etapaOf(a.s,a.e).sym], a.st==="exp"?42:(a.s==="og"&&a.e==="up"?110:95))());
[ptSel, lnSel].forEach(sel=>sel
  .on("click",(ev,a)=>{ ev.stopPropagation(); select(a.id); })
  .on("mousemove",(ev,a)=>showTip(ev,a))
  .on("mouseleave",hideTip));

let K=1;
// Cámara 3D: inclinación (tilt) y giro (yaw) del plano del mapa. Los símbolos se
// estiran en vertical por 1/cos(tilt) para que sigan viéndose redondos al inclinarse.
const CAM = { tilt:0, yaw:0, uy:1, raf:0 };
const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cam3d = document.getElementById("cam3d");
function sizeMarks(){
  const s = 1/Math.pow(K,.75);
  ptSel.attr("transform",a=>`translate(${a.x},${a.y}) scale(${s},${s*CAM.uy})`);
  labs.attr("font-size", 13/Math.pow(K,.9)).attr("opacity", K>2.2?.9:.7);
}
function camApply(){
  cam3d.style.transform = CAM.tilt||CAM.yaw ? `rotateX(${CAM.tilt}deg) rotateZ(${CAM.yaw}deg)` : "";
  CAM.uy = 1/Math.cos(CAM.tilt*Math.PI/180);
  sizeMarks();
}
function camTo(tilt, yaw=0, dur=1000){
  cancelAnimationFrame(CAM.raf);
  if(window.innerWidth<=860) tilt*=.6;              // en el teléfono, más suave
  if(REDUCED){ CAM.tilt=tilt; CAM.yaw=yaw; camApply(); return; }
  const t0=performance.now(), a0=CAM.tilt, y0=CAM.yaw;
  const step = now=>{
    const u=Math.min(1,(now-t0)/dur), e=d3.easeCubicInOut(u);
    CAM.tilt=a0+(tilt-a0)*e; CAM.yaw=y0+(yaw-y0)*e; camApply();
    if(u<1) CAM.raf=requestAnimationFrame(step);
  };
  CAM.raf=requestAnimationFrame(step);
}
// Punto de giro de la cámara: el centro de la zona libre del mapa (fuera de la ficha).
function camOrigin(ox,oy){
  cam3d.style.setProperty("--ox", `calc(50% - ${ox}px)`);
  cam3d.style.setProperty("--oy", `calc(50% - ${oy}px)`);
}
const zoom = d3.zoom().scaleExtent([1,40]).translateExtent([[-400,-300],[W+400,H+300]])
  .on("zoom",ev=>{ g.attr("transform",ev.transform); K=ev.transform.k; sizeMarks(); hideTip();
    // Si la persona arrastra o usa la rueda, el mapa vuelve a plano para que el gesto sea preciso.
    if(ev.sourceEvent && (CAM.tilt>0.5||Math.abs(CAM.yaw)>0.3) && !CAM.flat){ CAM.flat=true; camTo(0,0,450); } });
svg.call(zoom).on("dblclick.zoom",null);
svg.on("click",()=>{ closeDrawer(); });
sizeMarks();
d3.select("#zIn").on("click",()=>svg.transition().duration(300).call(zoom.scaleBy,1.6));
d3.select("#zOut").on("click",()=>svg.transition().duration(300).call(zoom.scaleBy,1/1.6));
d3.select("#zReset").on("click",()=>svg.transition().duration(500).call(zoom.transform,d3.zoomIdentity));

function zoomToBox([[x0,y0],[x1,y1]], maxK=8){
  // Deja libre la zona que tapa la ficha: a la derecha en escritorio, abajo en el teléfono.
  const r = document.getElementById("stage").getBoundingClientRect();
  const s = Math.min(r.width/W, r.height/H);
  const phone = r.width < 700;
  const ox = phone ? 0 : Math.min(420, r.width*.45)/(2*s);
  const oy = phone ? (r.height*.34)/(2*s) : 0;
  const vw = (r.width/s) - 2*ox, vh = (r.height/s) - 2*oy;
  const k = Math.min(maxK, .8/Math.max((x1-x0)/vw,(y1-y0)/vh));
  const t = d3.zoomIdentity.translate(W/2-ox,H/2-oy).scale(k).translate(-(x0+x1)/2,-(y0+y1)/2);
  camOrigin(ox*s, oy*s);
  svg.transition().duration(REDUCED?0:1000).ease(d3.easeCubicInOut).call(zoom.transform,t);
}
// Vuelo con inclinación: el giro depende de dónde está el activo (oeste u este del país).
function camFor(xMid, tilt){ CAM.flat=false; camTo(tilt, ((xMid/W)-.5)*-14); }
function zoomToAsset(a){
  if(a.kind==="pt"){ zoomToBox([[a.x-30,a.y-30],[a.x+30,a.y+30]], Math.min(Math.max(K,3.5),6)); camFor(a.x, 46); }
  else { const pts=a.path.map(([la,lo])=>proj([lo,la])); const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
    zoomToBox([[d3.min(xs),d3.min(ys)],[d3.max(xs),d3.max(ys)]], 6); camFor((d3.min(xs)+d3.max(xs))/2, 36); }
}

const tip = document.getElementById("tip");
function showTip(ev,a){
  const r = document.getElementById("stage").getBoundingClientRect();
  tip.innerHTML = `<b>${a.n}</b><span>${etapaOf(a.s,a.e).n} · ${ESTADO[a.st]}</span><br><span>${a.emp.map(([k])=>EMP[k].n).join(", ")||a.prod}</span>`;
  tip.hidden=false;
  let x = ev.clientX-r.left+14, y = ev.clientY-r.top+14;
  if(x+250>r.width) x = ev.clientX-r.left-254;
  tip.style.left=x+"px"; tip.style.top=y+"px";
}
function hideTip(){ tip.hidden=true; }

// ---------- render general ----------
function render(){
  ptSel.attr("display",a=>visible(a)?null:"none");
  lnSel.attr("display",a=>visible(a)?null:"none");
  ptSel.classed("sel",a=>a.id===st.sel); lnSel.classed("sel",a=>a.id===st.sel);
  ptSel.selectAll(".ring,.pulse").remove();
  ptSel.filter(a=>a.id===st.sel).append("circle").attr("class","pulse").attr("r",9);
  ptSel.filter(a=>a.id===st.sel).append("circle").attr("class","ring").attr("r",11);
  ptSel.filter(a=>a.id===st.sel).raise();
  renderKpis(); renderTree(); renderCoFilter(); if(st.view==="table") renderTable();
}

function renderKpis(){
  const vis = ALL.filter(visible);
  document.getElementById("kpis").innerHTML = Object.keys(SECT).map(s=>{
    const xs = vis.filter(a=>a.s===s), n=xs.length||1;
    const seg = ["op","con","pro","exp"].map(e=>`<i style="width:${xs.filter(a=>a.st===e).length/n*100}%;background:var(--${e})"></i>`).join("");
    return `<div class="kpi" style="--c:${cvar(s)}"><b>${xs.length}</b><span>${SECT[s].n}</span><div class="bar" title="Operación / construcción / proyecto">${xs.length?seg:""}</div></div>`;
  }).join("");
}

function symSvg(sym,s,size=14){
  if(sym==="line") return `<svg class="sym" width="${size}" height="${size}" viewBox="0 0 14 14"><path d="M1 7h12" stroke="${cvar(s)}" stroke-width="2.6" stroke-linecap="round"/></svg>`;
  return `<svg class="sym" width="${size}" height="${size}" viewBox="-7 -7 14 14"><path d="${d3.symbol(SYM[sym],52)()}" fill="${cvar(s)}"/></svg>`;
}

function renderTree(){
  const base = a => st.estados[a.st] && (!st.company || a.emp.some(([k])=>k===st.company)) && matchQ(a);
  const el = document.getElementById("tree");
  el.innerHTML = Object.entries(ETAPAS).map(([s,es])=>{
    const on = es.filter(e=>st.layers[s+"."+e.k]).length;
    return `<div class="grp" style="--c:${cvar(s)}">
      <label class="row sec"><input type="checkbox" data-sec="${s}" ${on===es.length?"checked":""} ${on>0&&on<es.length?'data-ind="1"':""}><span class="sw"></span>${SECT[s].n}</label>
      ${es.map(e=>`<label class="row sub"><input type="checkbox" data-layer="${s}.${e.k}" ${st.layers[s+"."+e.k]?"checked":""}>${symSvg(e.sym,s)}<span>${e.n}</span><span class="ct">${ALL.filter(a=>a.s===s&&a.e===e.k&&base(a)).length}</span></label>`).join("")}
    </div>`;
  }).join("");
  el.querySelectorAll("[data-ind]").forEach(i=>i.indeterminate=true);
}
document.getElementById("tree").addEventListener("change",ev=>{
  const t=ev.target;
  if(t.dataset.sec){ ETAPAS[t.dataset.sec].forEach(e=>st.layers[t.dataset.sec+"."+e.k]=t.checked); }
  if(t.dataset.layer){ st.layers[t.dataset.layer]=t.checked; }
  saveLayers(); render();
});

const est = document.getElementById("estados");
est.innerHTML = Object.entries(ESTADO).map(([k,n])=>`<button class="chip" data-e="${k}" aria-pressed="${st.estados[k]}"><span class="dot ${k}"></span>${n}</button>`).join("");
est.addEventListener("click",ev=>{
  const b=ev.target.closest("[data-e]"); if(!b) return;
  st.estados[b.dataset.e]=!st.estados[b.dataset.e]; b.setAttribute("aria-pressed",st.estados[b.dataset.e]); render();
});

function renderCoFilter(){
  const el=document.getElementById("coFilter");
  if(!st.company){ el.innerHTML=""; return; }
  el.innerHTML=`<div class="filter-co">Sólo activos de <b>${EMP[st.company].n}</b><button id="clrCo">Quitar filtro</button></div>`;
  document.getElementById("clrCo").onclick=()=>{ st.company=null; render(); };
}

document.getElementById("q").addEventListener("input",ev=>{ st.q=norm(ev.target.value.trim()); render(); if(st.view==="co") renderCoList(); });

// ---------- ficha ----------
const drawer = document.getElementById("drawer");
let drOut=0;
// Cierra la ficha con su animación de salida y vuelve la cámara a plano.
function closeDrawer(){
  const was = !drawer.hidden;
  st.sel=null; provSel.classed("sel",false); render();
  if(CAM.tilt>0.5||Math.abs(CAM.yaw)>0.3) camTo(0,0,800);
  if(!was) return;
  if(REDUCED){ drawer.hidden=true; return; }
  clearTimeout(drOut); drawer.classList.add("out");
  drOut=setTimeout(()=>{ drawer.hidden=true; drawer.classList.remove("out"); },300);
}
// Muestra la ficha; dir indica hacia dónde entra el contenido (fwd = hacia adelante, back = volver).
function showDrawer(dir){
  clearTimeout(drOut); drawer.classList.remove("out");
  const reopen = !drawer.hidden;
  drawer.dataset.dir = reopen ? (dir||"fwd") : "";
  drawer.hidden=false;
}
function select(id, dir){
  st.sel=id; const a=byId[id]; provSel.classed("sel",false);
  render(); openAsset(a, "res", dir);
  if(st.view==="map") zoomToAsset(a);
}
// Orden para recorrer activos con las flechas de la ficha: los visibles, de norte a sur.
function navList(){ return ALL.filter(a=>visible(a)&&a.kind==="pt").sort((a,b)=>a.y-b.y||a.x-b.x); }
function stepAsset(d){
  const xs=navList(); if(!xs.length) return;
  const i=xs.findIndex(a=>a.id===st.sel);
  select(xs[(i<0?0:(i+d+xs.length)%xs.length)].id, d>0?"fwd":"back");
}
function srcList(a){
  const list = a.src.map(k=>SRC[k]);
  a.emp.forEach(([k])=>{ if(EMP[k].w) list.push({t:`${EMP[k].n} – sitio institucional`,u:EMP[k].w}); });
  return `<ul class="src">${list.map(s=>`<li><a href="${s.u}" target="_blank" rel="noopener">${s.t}</a></li>`).join("")}</ul>`;
}
function coLinks(k){
  const c=EMP[k], L=[];
  const nyse = c.t.find(t=>t[0]==="NYSE"||t[0]==="NASDAQ");
  if(nyse) L.push([`Balances (SEC)`,`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${nyse[1]}`]);
  else if(c.t.find(t=>t[0]==="BYMA")) L.push([`Balances (CNV)`,`https://www.cnv.gov.ar/SitioWeb/Empresas`]);
  if(c.t[0]) L.push([`Cotización`,`https://www.google.com/finance/quote/${c.t[0][1]}:${EX[c.t[0][0]][1]}`]);
  const us = c.t.find(t=>t[0]==="NYSE"||t[0]==="NASDAQ");
  if(us) L.push([`Yahoo Finance`,`https://finance.yahoo.com/quote/${us[1]}`]);
  L.push([`Noticias`,`https://news.google.com/search?q=${encodeURIComponent('"'+c.n.replace(/\s*\(.*\)/,"")+'" Argentina')}&hl=es-419&gl=AR&ceid=AR:es-419`]);
  if(c.w) L.push([`Sitio`,c.w]);
  return L.map(([t,u])=>`<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`).join("");
}
function coCard(k,role){
  const c=EMP[k]; const n=ALL.filter(a=>a.emp.some(([x])=>x===k)).length;
  return `<div class="co">
    <div class="co-h"><b>${c.n}</b>${role?`<span class="role">${role}</span>`:""}</div>
    <div class="co-h">${c.t.map(([e,t])=>`<span class="tick">${EX[e][0]}: ${t}</span>`).join("")}<span class="meta">${c.tipo}</span></div>
    ${c.ceo?`<div class="meta">CEO: <span style="color:var(--ink)">${c.ceo}</span> · dato a mediados de 2026, verificar</div>`:""}
    <div class="links">${coLinks(k)}<button data-co="${k}">Ver sus ${n} activo${n>1?"s":""} en el mapa</button><button data-prof="${k}">Perfil completo →</button></div>
  </div>`;
}
function openAsset(a, tab, dir){
  const e = etapaOf(a.s,a.e);
  const nl = a.kind==="pt" ? navList() : [], ni = nl.findIndex(x=>x.id===a.id);
  const coord = a.kind==="pt" ? `${a.ll[0].toFixed(2)}°, ${a.ll[1].toFixed(2)}°` : "Trazado esquemático";
  const T = tecOf(a);
  const tabs = T ? {res:"Resumen", tec:"Cómo funciona", emp:`Empresas (${a.emp.length})`, src:"Fuentes"} : {res:"Resumen", emp:`Empresas (${a.emp.length})`, src:"Fuentes"};
  let body="";
  if(tab==="res") body = `
    <p>${a.d}</p>
    <dl class="facts">
      <dt>Sector</dt><dd>${SECT[a.s].n}</dd>
      <dt>Eslabón</dt><dd>${e.n}</dd>
      <dt>Producto</dt><dd>${a.prod}</dd>
      ${a.cap?`<dt>Capacidad</dt><dd>${a.cap}</dd>`:""}
      ${a.estOf?`<dt>Estado oficial</dt><dd>${a.estOf}</dd>`:""}
      <dt>Provincia</dt><dd>${a.prov}</dd>
      <dt>Ubicación</dt><dd><span class="mono">${coord}</span>${a.prec?`<br><small style="color:var(--muted)">${a.prec}</small>`:""}</dd>
      <dt>Operador</dt><dd>${a.emp.length?a.emp.map(([k,r])=>`<a href="#" data-goco="${k}">${EMP[k].n}</a>${r!=="Operador"?` <small style="color:var(--muted)">(${r.toLowerCase()})</small>`:""}`).join("<br>"):"—"}</dd>
    </dl>
    ${T&&T.nums?`<div class="proyblock"><p class="eyebrow">Números clave</p>${numsBlock(T.nums.slice(0,4))}${T.nums.length>4||T.proc?`<button class="tecmore" data-tab="tec">Ver proceso${T.nums.length>4?`, ${T.nums.length-4} ${T.nums.length-4===1?"número":"números"} más`:""} e hitos →</button>`:""}</div>`:T?`<button class="tecmore" data-tab="tec">Cómo se produce →</button>`:""}
    ${pqBlock(a)}
    ${proyBlock(a)}
    ${a.of?`<div class="quality ok"><b>Dato oficial.</b> Ubicación, estado y controlantes según la cartera de la Secretaría de Minería.${a.pq&&a.pq.act?" La producción proviene de prensa o de la empresa.":""}</div>`:a.pq&&a.pq.of?`<div class="quality ok"><b>Producción verificada</b> con la base oficial de la Secretaría de Energía (pozo por pozo). La ubicación en el mapa sigue siendo aproximada.</div>`:`<div class="quality"><b>Dato preliminar.</b> Carga manual del MVP. La ubicación y los atributos se van a reemplazar por la capa oficial correspondiente.</div>`}`;
  if(tab==="tec") body = tecBlock(a,T);
  if(tab==="emp") body = a.emp.length ? a.emp.map(([k,r])=>coCard(k,r)).join("") : `<p class="note">Infraestructura pública o de uso compartido; sin operador único cargado.</p>`;
  if(tab==="src") body = `<p class="note">Fuentes que respaldan este activo y dónde actualizarlo.</p>${srcList(a)}`;
  drawer.style.setProperty("--c",cvar(a.s));
  const nav = ni>=0 && nl.length>1 ? `<div class="navbtns"><button data-step="-1" aria-label="Activo anterior">‹</button><span>${ni+1} / ${nl.length}</span><button data-step="1" aria-label="Activo siguiente">›</button></div>` : "";
  drawer.classList.toggle("has-nav", !!nav);
  drawer.innerHTML = `
    <header><button class="close" aria-label="Cerrar ficha">×</button>${nav}
      <div class="crumb">${symSvg(e.sym,a.s,12)}${SECT[a.s].n} · ${e.n}</div>
      <h2>${a.n}</h2>
      <span class="pill"><span class="dot ${a.st}" style="width:8px;height:8px;border-radius:50%"></span>${ESTADO[a.st]}</span>
    </header>
    <nav class="tabs" role="tablist">${Object.entries(tabs).map(([k,n])=>`<button role="tab" data-tab="${k}" aria-selected="${k===tab}">${n}</button>`).join("")}</nav>
    <div class="dbody">${body}</div>`;
  showDrawer(dir);
  drawer.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{
    const keys=Object.keys(tabs); openAsset(a,b.dataset.tab, keys.indexOf(b.dataset.tab)>=keys.indexOf(tab)?"fwd":"back"); });
  drawer.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>stepAsset(+b.dataset.step));
  wireDrawer();
}
function numsBlock(ns){
  return `<div class="nums">${ns.map(([l,v,k])=>`<div class="r"><span>${l}</span><b>${v}${k&&SRC[k]?`<a href="${SRC[k].u}" target="_blank" rel="noopener" title="${SRC[k].t.replace(/"/g,"&quot;")}">fuente</a>`:""}</b></div>`).join("")}</div>`;
}
function tecBlock(a,T){
  const srcs=[...new Set(T.src||[])].filter(k=>SRC[k]);
  return `
    ${T.gen?`<p class="gennote">${T.nums?"El proceso que se muestra es el típico de este eslabón; los números sí son de este activo.":"Todavía no hay ficha propia de este activo: se muestra el proceso típico de su eslabón como guía. Los números se cargan cuando haya fuente."}</p>`:""}
    <div class="proyblock"><p class="eyebrow">Método</p><p style="margin:0;font-size:13px">${T.met}</p></div>
    <div class="proyblock"><p class="eyebrow">Cómo se produce</p><ol class="flow">${(T.proc||[]).map(x=>`<li>${x}</li>`).join("")}</ol></div>
    <div class="proyblock"><p class="eyebrow">Producto y calidad</p><p style="margin:0;font-size:13px">${T.prod}</p></div>
    ${T.nums?`<div class="proyblock"><p class="eyebrow">Números</p>${numsBlock(T.nums)}</div>`:""}
    ${T.hitos?`<div class="proyblock"><p class="eyebrow">Hitos y proyección</p><div class="hitos">${T.hitos.map(([f,x])=>`<div><b>${f}</b><span>${x}</span></div>`).join("")}</div></div>`:""}
    ${T.nota?`<p class="note" style="margin:0">${T.nota}</p>`:""}
    ${srcs.length?`<div class="proyblock"><p class="eyebrow">Fuentes de esta ficha</p><ul class="src">${srcs.map(k=>`<li><a href="${SRC[k].u}" target="_blank" rel="noopener">${SRC[k].t}</a></li>`).join("")}</ul></div>`:""}`;
}
function srcLink(k){ const x=SRC[k]; return `<a href="${x.u}" target="_blank" rel="noopener">${x.t} ↗</a>`; }
function rigiLine(a){
  if(!a.rigi) return "";
  const pres = !a.rigi.ok;
  return `<div class="rigi"><span class="tag ${pres?"pres":""}">RIGI</span><span>${a.rigi.st} · ${a.rigi.inv}</span>${srcLink(a.rigi.s).replace('↗</a>','</a>').replace('<a ','<a style="color:var(--muted)" ')}</div>`;
}
const fmt = n => n.toLocaleString("es-AR",{maximumFractionDigits:1});
function pqBlock(o, title="Producción"){
  const q=o.pq; if(!q) return "";
  let bar="";
  if(q.bar){ const [a,m,u]=q.bar; const pct=m?Math.min(100,a/m*100):0;
    bar=`<div class="prog"><div class="track" role="img" aria-label="${fmt(a)} de ${fmt(m)} ${u}"><div class="fill" style="width:${Math.max(pct,a>0?2:0)}%"></div></div><small>Hoy ${fmt(a)} de ${fmt(m)} ${u} objetivo · ${Math.round(pct)}%</small></div>`; }
  return `<div class="proyblock"><p class="eyebrow">${title}</p><dl class="pq">
    ${q.of?`<dt class="oficial">Oficial</dt><dd>${q.of.t} ${srcLink(q.of.s)}</dd>`:""}
    ${q.act?`<dt>${q.of?"Prensa":"Hoy"}</dt><dd>${q.act.t} ${srcLink(q.act.s)}</dd>`:""}
    ${q.meta?`<dt>Objetivo</dt><dd>${q.meta.t} ${srcLink(q.meta.s)}</dd>`:""}${bar}</dl></div>`;
}
function rigiBlock(a){
  if(!a.rigi) return "";
  const r=a.rigi.det, row=(l,v)=>v?`<dt>${l}</dt><dd>${v}</dd>`:"";
  const verif = {bo_texto:"Texto completo de la resolución", bo_extracto:"Extracto de la resolución publicada", empresa:"Comunicado de la empresa (todavía sin resolución)", pendiente:"Resolución identificada; el monto falta confirmar en el texto"}[r.verif]||"";
  return `<div class="proyblock"><p class="eyebrow">RIGI</p>${rigiLine(a)}<dl class="pq" style="margin-top:8px">
    ${row("Vehículo",r.vpu)}${row("Categoría",r.tipo)}${row("Alcance",r.cap)}
    ${row("Inversión mínima en 2 años",r.min2a?musd(r.min2a):"")}${row("Adhesión",fechaC(r.adh))}${row("Inicio de obra",fechaC(r.obra))}
    ${row("Inicio de operación",fechaC(r.op))}${row("Plazo de inversión mínima",fechaC(r.limite))}${row("Fuente",verif)}</dl></div>`;
}
function proyBlock(a){
  if(!a.rigi && !a.proy) return "";
  return `${rigiBlock(a)}${a.proy?`<div class="proyblock"><p class="eyebrow">Proyecciones públicas</p><ul class="proy">${a.proy.map(p=>`<li>${p.t} ${srcLink(p.s)}</li>`).join("")}</ul></div>`:""}`;
}
function openCompany(k){
  const c=EMP[k]; const assets=ALL.filter(a=>a.emp.some(([x])=>x===k));
  const s0 = assets[0]?.s || "og";
  drawer.style.setProperty("--c",cvar(s0));
  drawer.innerHTML = `
    <header><button class="close" aria-label="Cerrar ficha">×</button>
      <div class="crumb">Empresa</div><h2>${c.n}</h2></header>
    <div class="dbody">${coCard(k)}
      <div><p class="eyebrow" style="margin-bottom:6px">Activos en el mapa</p>${assetList(assets)}</div>
    </div>`;
  drawer.classList.remove("has-nav");
  showDrawer("fwd"); wireDrawer();
}
function assetList(xs){
  return `<ul class="asset-list">${xs.map(a=>`<li><button data-asset="${a.id}">${symSvg(etapaOf(a.s,a.e).sym,a.s)}<span class="nm">${a.n}<small>${etapaOf(a.s,a.e).n} · ${a.prov} · ${ESTADO[a.st]}</small></span></button></li>`).join("")}</ul>`;
}
function openProvince(f){
  const name=f.properties.name;
  const xs=ALL.filter(a=>(a.prov||"").split(" / ").includes(name) && visible(a));
  provSel.classed("sel",d=>d===f); st.sel=null; render();
  const pb = path.bounds(f);
  zoomToBox(pb, 7); camFor((pb[0][0]+pb[1][0])/2, 30);
  drawer.style.setProperty("--c","var(--ink)");
  drawer.classList.remove("has-nav");
  const counts = Object.keys(SECT).map(s=>`<div class="kpi" style="--c:${cvar(s)}"><b>${xs.filter(a=>a.s===s).length}</b><span>${SECT[s].n}</span></div>`).join("");
  drawer.innerHTML = `
    <header><button class="close" aria-label="Cerrar ficha">×</button>
      <div class="crumb">Provincia</div><h2>${name}</h2></header>
    <div class="dbody"><div class="kpis">${counts}</div>
      ${xs.length?assetList(xs):`<p class="note">No hay activos cargados con las capas y filtros actuales. Los ductos que cruzan la provincia figuran como interprovinciales.</p>`}
    </div>`;
  showDrawer("fwd"); wireDrawer();
}
function wireDrawer(){
  drawer.querySelector(".close").onclick=closeDrawer;
  drawer.querySelectorAll("[data-asset]").forEach(b=>b.onclick=()=>select(b.dataset.asset,"back"));
  drawer.querySelectorAll("[data-goco]").forEach(b=>b.onclick=ev=>{ev.preventDefault(); openCompany(b.dataset.goco);});
  drawer.querySelectorAll("[data-prof]").forEach(b=>b.onclick=()=>{ drawer.hidden=true; openProfile(b.dataset.prof); });
  drawer.querySelectorAll("[data-co]").forEach(b=>b.onclick=()=>{
    st.company=b.dataset.co; render(); openCompany(b.dataset.co);
    const xs=ALL.filter(a=>a.emp.some(([x])=>x===st.company));
    const pts=xs.flatMap(a=>a.kind==="pt"?[[a.x,a.y]]:a.path.map(([la,lo])=>proj([lo,la])));
    if(pts.length && st.view==="map"){ zoomToBox([[d3.min(pts,p=>p[0])-20,d3.min(pts,p=>p[1])-20],[d3.max(pts,p=>p[0])+20,d3.max(pts,p=>p[1])+20]],6);
      camFor((d3.min(pts,p=>p[0])+d3.max(pts,p=>p[0]))/2, 32); }
  });
}

// ---------- tabla ----------
const COLS = [
  {k:"n",n:"Activo",v:a=>a.n},
  {k:"s",n:"Sector",v:a=>SECT[a.s].n},
  {k:"e",n:"Eslabón",v:a=>etapaOf(a.s,a.e).n},
  {k:"emp",n:"Empresas",v:a=>a.emp.map(([k])=>EMP[k].n).join(", ")},
  {k:"prov",n:"Provincia",v:a=>a.prov},
  {k:"st",n:"Estado",v:a=>ESTADO[a.st]},
  {k:"prod",n:"Producto",v:a=>a.prod},
  {k:"num",n:"Dato clave",v:a=>{const t=TEC[a.id]; return t&&t.nums?`${t.nums[0][0]}: ${t.nums[0][1]}`:(a.cap||"");}}
];
function renderTable(){
  document.getElementById("thead").innerHTML = COLS.map(c=>`<th data-k="${c.k}" aria-sort="${st.sort.k===c.k?(st.sort.dir>0?"ascending":"descending"):"none"}"><span>${c.n}</span></th>`).join("");
  const col=COLS.find(c=>c.k===st.sort.k);
  const rows=ALL.filter(visible).sort((a,b)=>st.sort.dir*col.v(a).localeCompare(col.v(b),"es") || a.n.localeCompare(b.n,"es"));
  document.getElementById("tbody").innerHTML = rows.map(a=>`<tr data-asset="${a.id}">${COLS.map(c=>`<td>${c.k==="n"?`<span class="sw-cell">${symSvg(etapaOf(a.s,a.e).sym,a.s)}<b>${a.n}</b></span>`:c.k==="st"?`<span class="sw-cell"><span class="dot ${a.st}" style="width:8px;height:8px;border-radius:50%;display:inline-block"></span>${c.v(a)}</span>`:c.v(a)}</td>`).join("")}</tr>`).join("")
    || `<tr><td colspan="${COLS.length}" class="note">No hay activos con estos filtros. Probá activar más capas o borrar la búsqueda.</td></tr>`;
}
document.getElementById("thead").addEventListener("click",ev=>{
  const th=ev.target.closest("th"); if(!th) return;
  st.sort = {k:th.dataset.k, dir: st.sort.k===th.dataset.k ? -st.sort.dir : 1}; renderTable();
});
document.getElementById("tbody").addEventListener("click",ev=>{
  const tr=ev.target.closest("[data-asset]"); if(!tr) return;
  st.sel=tr.dataset.asset; render(); openAsset(byId[tr.dataset.asset],"res");
});
function renderStats(){
  const el=document.getElementById("statWrap");
  el.innerHTML = `<div><p class="eyebrow">Estadísticas sectoriales</p><p class="note" style="max-width:68ch">Cifras publicadas más recientes, cada una con su período y su fuente. Tocá una barra con nombre de área para verla en el mapa.</p></div>` +
  Object.entries(STATS).map(([s,d])=>{
    const tiles=d.kpis.map(k=>`<div class="tile"><span class="l">${k.l}</span><span class="v">${k.v}<small>${k.u}</small></span><span class="p">${k.p}</span><a href="${SRC[k.s].u}" target="_blank" rel="noopener" title="${SRC[k.s].t}">Fuente: ${SRC[k.s].t.split(" – ")[0]} ↗</a></div>`).join("");
    const charts=d.charts.map(c=>{
      const mx=Math.max(...c.rows.map(r=>r[1]));
      return `<div class="chart"><h3>${c.t}</h3><div class="sub">${c.sub}</div><div class="bars">${c.rows.map(([n,v,id])=>`<button class="bar" ${id?`data-asset="${id}"`:"tabindex=\"-1\""} title="${n}: ${fmt(v)} ${c.u}${id?" · ver en el mapa":""}"><span class="nm">${n}</span><span class="tr"><span class="bf" style="width:${v/mx*82}%"></span><span class="vl">${fmt(v)}${c.u==="%"?"%":""}</span></span></button>`).join("")}</div><div class="src">${(c.srcs||[c.s]).map(srcLink).join(" · ")}</div></div>`;
    }).join("");
    return `<section class="statsec" style="--c:${cvar(s)}"><h2><i></i>${SECT[s].n}</h2><div class="tiles">${tiles}</div><div class="charts">${charts}</div>${vizCards(s)}</section>`;
  }).join("") + `<section class="statsec x"><h2><i></i>Visión transversal</h2><p class="note" style="max-width:72ch;margin-top:-8px">Los tres sectores comparados entre sí y con el resto de la economía.</p>${vizCards("x")}</section>`;
  el.querySelectorAll("[data-asset]").forEach(b=>b.onclick=()=>{ setView("map"); select(b.dataset.asset); });
  requestAnimationFrame(drawViz);
}
function setView(v){
  st.view=v;
  if(v!=="map"){ cancelAnimationFrame(CAM.raf); CAM.tilt=0; CAM.yaw=0; camApply(); document.getElementById("par").style.transform=""; }
  document.getElementById("vSt").setAttribute("aria-pressed",v==="stats");
  document.getElementById("statWrap").hidden = v!=="stats";
  if(v==="stats"){ drawer.hidden=true; renderStats(); }
  document.getElementById("vMap").setAttribute("aria-pressed",v==="map");
  document.getElementById("vTab").setAttribute("aria-pressed",v==="table");
  document.getElementById("vCo").setAttribute("aria-pressed",v==="co");
  document.getElementById("tableWrap").hidden = v!=="table";
  document.getElementById("coWrap").hidden = v!=="co";
  if(v==="table") renderTable();
  if(v==="co"){ drawer.hidden=true; renderCoList(); if(!st.coSel && window.innerWidth>860) openProfile("ypf"); }
  try{ localStorage.setItem("mp-view",v); }catch(e){}
}
document.getElementById("vMap").onclick=()=>setView("map");
document.getElementById("vTab").onclick=()=>setView("table");
document.getElementById("vCo").onclick=()=>setView("co");
document.getElementById("vSt").onclick=()=>setView("stats");

// ---------- empresas ----------
const assetsOf = k => ALL.filter(a=>a.emp.some(([x])=>x===k));
const roleOf = (a,k) => (a.emp.find(([x])=>x===k)||[])[1];
const secOrder = ["og","mi","ag"];
document.getElementById("coSect").innerHTML = [["all","Todas"],...secOrder.map(s=>[s,SECT[s].n])].map(([k,n])=>`<button class="chip" data-cs="${k}" aria-pressed="${k==="all"}">${k!=="all"?`<span class="dot" style="background:${cvar(k)};border-radius:2px"></span>`:""}${n}</button>`).join("");
document.getElementById("coSect").addEventListener("click",ev=>{
  const b=ev.target.closest("[data-cs]"); if(!b) return; st.coSect=b.dataset.cs;
  document.querySelectorAll("[data-cs]").forEach(x=>x.setAttribute("aria-pressed",x===b)); renderCoList();
});
document.getElementById("coListed").addEventListener("change",ev=>{ st.coListed=ev.target.checked; renderCoList(); });
function renderCoList(){
  const rows = Object.keys(EMP).map(k=>({k,c:EMP[k],xs:assetsOf(k)})).filter(r=>r.xs.length)
    .filter(r=>st.coSect==="all"||r.xs.some(a=>a.s===st.coSect))
    .filter(r=>!st.coListed||r.c.t.length)
    .filter(r=>!st.q||st.q.split(/\s+/).every(t=>norm(r.c.n+" "+r.c.t.map(x=>x[1]).join(" ")+" "+r.xs.map(a=>a.n+" "+a.prov).join(" ")).includes(t)))
    .sort((a,b)=>b.xs.length-a.xs.length||a.c.n.localeCompare(b.c.n,"es"));
  document.getElementById("coList").innerHTML = rows.map(({k,c,xs})=>{
    const secs=[...new Set(xs.map(a=>a.s))];
    const rg=xs.filter(a=>a.rigi).length;
    return `<li><button data-cop="${k}" aria-current="${st.coSel===k}">
      <span class="cn">${c.n}${c.t.slice(0,1).map(([e,t])=>`<span class="tick">${t}</span>`).join("")}</span>
      <span class="cm"><span class="sdots">${secs.map(s=>`<i style="background:${cvar(s)}"></i>`).join("")}</span>${xs.length} activo${xs.length>1?"s":""}${rg?` · ${rg} en RIGI`:""}</span>
    </button></li>`;
  }).join("") || `<li class="note" style="padding:14px">No hay empresas con estos filtros.</li>`;
}
document.getElementById("coList").addEventListener("click",ev=>{ const b=ev.target.closest("[data-cop]"); if(b) openProfile(b.dataset.cop); });

function miniMap(k){
  const xs=assetsOf(k);
  const pts=xs.filter(a=>a.kind==="pt"), lns=xs.filter(a=>a.kind==="ln");
  return `<svg class="minimap" viewBox="20 10 760 1180" role="img" aria-label="Ubicación de sus activos">
    ${GEO.prov.features.map(f=>`<path class="prov" d="${path(f)}"/>`).join("")}
    ${lns.map(a=>`<path d="${lineGen(a.path.map(([la,lo])=>proj([lo,la])))}" fill="none" stroke="${cvar(a.s)}" stroke-width="7" stroke-linecap="round" ${a.st!=="op"?'stroke-dasharray="18 12"':""}/>`).join("")}
    ${pts.map(a=>`<g transform="translate(${a.x},${a.y})"><path d="${d3.symbol(SYM[etapaOf(a.s,a.e).sym],900)()}" fill="${a.st==="pro"?"var(--panel)":cvar(a.s)}" stroke="${a.st==="pro"?cvar(a.s):"var(--border)"}" stroke-width="5"><title>${a.n}</title></path></g>`).join("")}
  </svg>`;
}
function mkBlock(k){
  const m=MK[k]; if(!m) return "";
  const pos=Math.max(0,Math.min(100,(m.px-m.lo)/(m.hi-m.lo)*100));
  const up=(m.tgt/m.px-1)*100;
  const capTxt = m.cap>=1000?`US$ ${fmt(m.cap/1000)} mil M`:`US$ ${fmt(m.cap)} M`;
  const f=(l,v,sm="")=>`<div class="f"><span>${l}</span><b>${v}</b>${sm?`<small>${sm}</small>`:""}</div>`;
  return `<div class="proyblock"><p class="eyebrow">Mercado · ${m.tk} en dólares</p><div class="mk">
    <div class="f"><span>Precio</span><b>US$ ${fmt(m.px)}</b><div class="range" title="Rango de 52 semanas"><i style="left:calc(${pos}% - 1px)"></i></div><small>52 semanas: ${fmt(m.lo)} – ${fmt(m.hi)}</small></div>
    ${f("Capitalización",capTxt)}
    ${f("Precio objetivo promedio",`US$ ${fmt(m.tgt)}`,`${up>=0?"+":""}${Math.round(up)}% · ${m.n} analista${m.n>1?"s":""}`)}
    ${f("Consenso",m.rec)}
    ${f("P/E futuro",`${fmt(m.fpe)}x`)}
    ${m.ev!=null?f("EV/EBITDA",`${fmt(m.ev)}x`):""}
    ${m.nd!=null?f("Deuda neta / EBITDA",`${fmt(m.nd)}x`,m.nd<0?"caja neta":""):""}
    ${m.mg!=null?f("Margen EBITDA",`${m.mg}%`):""}
  </div><p class="note">Foto del ${(()=>{const f=(META.pasos&&META.pasos.mercado&&META.pasos.mercado.ok&&META.pasos.mercado.fecha)||"2026-10-13";const [y,m,d]=f.split("-");return `${+d}-${MESL[+m-1]}-${y}`;})()} tomada de Yahoo Finance (fuente no oficial). No es una recomendación de inversión.${m.ev==null?" Esta empresa reporta en pesos, por eso no se muestran ratios sobre EBITDA.":""}</p></div>`;
}
function openProfile(k){
  st.coSel=k; if(st.view!=="co") setView("co");
  const c=EMP[k], xs=assetsOf(k).sort((a,b)=>secOrder.indexOf(a.s)-secOrder.indexOf(b.s)||["op","con","pro"].indexOf(a.st)-["op","con","pro"].indexOf(b.st));
  const ok=xs.filter(a=>a.rigi&&a.rigi.ok).length, pr=xs.filter(a=>a.rigi&&!a.rigi.ok).length;
  const provs=[...new Set(xs.map(a=>a.prov).filter(p=>p!=="Interprovincial"))];
  const srcs=[...new Set(xs.flatMap(a=>[...a.src,...(a.proy||[]).map(p=>p.s),...(a.rigi?[a.rigi.s]:[]),...(a.pq?[a.pq.of,a.pq.act,a.pq.meta].filter(Boolean).map(x=>x.s):[])]).concat(c.pqo?["cap4"]:[],(c.proy||[]).map(p=>p.s),c.pq?[c.pq.act,c.pq.meta].filter(Boolean).map(x=>x.s):[],MK[k]?["yahoo"]:[]))];
  const el=document.getElementById("coProf");
  el.style.setProperty("--c", cvar(xs[0]?.s||"og"));
  el.innerHTML = `
    <button class="backbtn" id="coBack">← Todas las empresas</button>
    <div class="cohead">
      <div class="meta">
        <p class="eyebrow">${[...new Set(xs.map(a=>SECT[a.s].n))].join(" · ")}</p>
        <h2>${c.n}</h2>
        <div class="co-h">${c.t.map(([e,t])=>`<span class="tick">${EX[e][0]}: ${t}</span>`).join("")}<span class="meta" style="font-size:12px;color:var(--muted)">${c.tipo}</span></div>
        ${c.ceo?`<div style="font-size:13px">CEO: <b>${c.ceo}</b> <span style="color:var(--muted);font-size:12px">· dato a mediados de 2026, verificar</span></div>`:""}
        <div class="links">${coLinks(k)}</div>
      </div>
      ${miniMap(k)}
    </div>
    <div class="stats">
      <div class="stat"><b>${xs.length}</b><span>Activos en el mapa</span></div>
      <div class="stat"><b>${xs.filter(a=>a.st==="op").length}</b><span>En operación</span></div>
      <div class="stat"><b>${xs.filter(a=>a.st!=="op").length}</b><span>En construcción o proyecto</span></div>
      <div class="stat"><b>${ok}<span style="font-size:18px;color:var(--muted)">${pr?` + ${pr}`:""}</span></b><span>RIGI aprobados${pr?" + en trámite":""}</span></div>
    </div>
    ${mkBlock(k)}
    ${(c.pq||c.pqo)?pqBlock({pq:{...(c.pq||{}),...(c.pqo?{of:c.pqo}:{})}},"Producción de la compañía"):""}
    ${c.proy?`<div class="proyblock"><p class="eyebrow">Plan y metas de la compañía</p><ul class="proy">${c.proy.map(p=>`<li>${p.t} ${srcLink(p.s)}</li>`).join("")}</ul></div>`:""}
    <div class="projs">
      <p class="eyebrow">Proyectos y activos · ${provs.join(", ")}</p>
      ${xs.map(a=>`<div class="proj" style="--c:${cvar(a.s)}">
        <div class="proj-h">${symSvg(etapaOf(a.s,a.e).sym,a.s)}<b>${a.n}</b><span class="sub">${etapaOf(a.s,a.e).n} · ${a.prov} · ${roleOf(a,k)}</span>
          <span class="pill"><span class="dot ${a.st}" style="width:8px;height:8px;border-radius:50%"></span>${ESTADO[a.st]}</span></div>
        <div style="font-size:13px;color:var(--muted)">${a.prod}${a.cap?` · ${a.cap}`:""}</div>
        ${a.pq?`<dl class="pq">${a.pq.of?`<dt class="oficial">Oficial</dt><dd>${a.pq.of.t}</dd>`:""}${a.pq.act?`<dt>${a.pq.of?"Prensa":"Hoy"}</dt><dd>${a.pq.act.t}</dd>`:""}${a.pq.meta?`<dt>Objetivo</dt><dd>${a.pq.meta.t}</dd>`:""}</dl>`:""}
        ${rigiLine(a)}
        ${a.proy?`<ul class="proy">${a.proy.map(p=>`<li>${p.t} ${srcLink(p.s)}</li>`).join("")}</ul>`:""}
        <div class="links"><button data-onmap="${a.id}">Ver en el mapa</button>${a.emp.filter(([x])=>x!==k).slice(0,4).map(([x,r])=>`<button data-cop2="${x}">${EMP[x].n}</button>`).join("")}</div>
      </div>`).join("")}
    </div>
    <div class="proyblock"><p class="eyebrow">Fuentes</p><ul class="src">${srcs.map(x=>`<li><a href="${SRC[x].u}" target="_blank" rel="noopener">${SRC[x].t}</a></li>`).join("")}${c.w?`<li><a href="${c.w}" target="_blank" rel="noopener">${c.n} – sitio institucional</a></li>`:""}</ul></div>
    <p class="note">Los montos RIGI son los de cada resolución del Boletín Oficial para el proyecto completo, no la participación de esta empresa.</p>`;
  document.getElementById("coWrap").classList.add("has-sel");
  el.scrollTop=0; renderCoList();
  document.getElementById("coBack").onclick=()=>{ st.coSel=null; document.getElementById("coWrap").classList.remove("has-sel"); renderCoList(); };
  el.querySelectorAll("[data-onmap]").forEach(b=>b.onclick=()=>{ setView("map"); select(b.dataset.onmap); });
  el.querySelectorAll("[data-cop2]").forEach(b=>b.onclick=()=>openProfile(b.dataset.cop2));
}

// ============================================================
// ESTADÍSTICAS AMPLIADAS: 21 gráficos por sector y transversales.
// Datos en VIZ (generado desde datos_ar, mercados, Alpha Vantage y
// publicaciones citadas). Cada gráfico declara sus fuentes en SRC.
// ============================================================

const VZ = {};             // estado de controles (cultivo, rubro, filtro RIGI)
const nf = (n,d=0)=> n==null||isNaN(n) ? "–" : n.toLocaleString("es-AR",{minimumFractionDigits:d,maximumFractionDigits:d});
const MES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const mlab = m => { const [y,mm]=m.split("-"); return `${MES[+mm-1]}-${y.slice(2)}`; };
const pdate = m => { const [y,mm]=m.split("-"); return new Date(+y, +mm-1, 1); };
const mix = (c,p)=>`color-mix(in srgb, ${c} ${p}%, var(--panel))`;
const srcRow = ks => `<div class="src">Fuente: ${ks.map(k=>`<a href="${SRC[k].u}" target="_blank" rel="noopener">${SRC[k].t} ↗</a>`).join("")}</div>`;
const legend = items => `<div class="vlegend">${items.map(([n,c,t])=>`<span><i class="${t||""}" style="background:${c};color:${c}"></i>${n}</span>`).join("")}</div>`;

// ---------- tooltip ----------
let vtip;
function tipOn(ev, html){
  if(!vtip){ vtip=document.createElement("div"); vtip.className="vtip"; document.body.appendChild(vtip); }
  vtip.innerHTML=html; vtip.hidden=false;
  const r=vtip.getBoundingClientRect(), pad=14;
  let x=ev.clientX+pad, y=ev.clientY+pad;
  if(x+r.width>innerWidth-8) x=ev.clientX-r.width-pad;
  if(y+r.height>innerHeight-8) y=ev.clientY-r.height-pad;
  vtip.style.left=Math.max(8,x)+"px"; vtip.style.top=Math.max(8,y)+"px";
}
function tipOff(){ if(vtip) vtip.hidden=true; }
const trow = (n,c,v)=>`<div class="r"><span>${c?`<i style="background:${c}"></i>`:""}${n}</span><em>${v}</em></div>`;

// ---------- utilidades de ejes ----------
function frame(box, h, m={t:10,r:16,b:24,l:44}){
  const W=Math.max(280, box.clientWidth||600);
  const svg=d3.select(box).append("svg").attr("viewBox",`0 0 ${W} ${h}`).attr("role","img");
  const g=svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
  return {svg,g,W,w:W-m.l-m.r,h:h-m.t-m.b,m};
}
function yAxis(g,y,w,fmt=d=>nf(d),ticks=4){
  g.append("g").attr("class","grid").call(d3.axisLeft(y).ticks(ticks).tickSize(-w).tickFormat(""));
  g.append("g").attr("class","ax").call(d3.axisLeft(y).ticks(ticks).tickSize(0).tickPadding(6).tickFormat(fmt)).select(".domain").remove();
}
function xAxisTime(g,x,h,ticks){
  g.append("g").attr("class","ax").attr("transform",`translate(0,${h})`)
   .call(d3.axisBottom(x).ticks(ticks).tickSizeOuter(0).tickFormat(d3.timeFormat("%Y")));
}
// línea vertical + tooltip por posición x (series temporales)
function crosshair(F, x, dates, html){
  const xl=F.g.append("line").attr("class","xhair").attr("y1",0).attr("y2",F.h).style("display","none");
  F.g.append("rect").attr("class","hit").attr("width",F.w).attr("height",F.h)
   .on("pointermove",ev=>{
     const [mx]=d3.pointer(ev); const t=x.invert(mx);
     const i=d3.minIndex(dates,d=>Math.abs(d-t)); const xx=x(dates[i]);
     xl.attr("x1",xx).attr("x2",xx).style("display",null); tipOn(ev, html(i));
   })
   .on("pointerleave",()=>{ xl.style("display","none"); tipOff(); });
}

// ============================================================
// OIL & GAS
// ============================================================
function og1(box){
  const D=VIZ.oilType.map(r=>({d:pdate(r[0]),m:r[0],conv:r[1],shale:r[2],tight:r[3]}));
  const keys=["conv","tight","shale"], col={conv:"var(--pro)",tight:mix("var(--og)",50),shale:"var(--og)"}, nm={conv:"Convencional",tight:"Tight",shale:"Shale"};
  const F=frame(box,280,{t:12,r:92,b:24,l:44});
  const x=d3.scaleTime().domain(d3.extent(D,d=>d.d)).range([0,F.w]);
  const S=d3.stack().keys(keys)(D);
  const y=d3.scaleLinear().domain([0,d3.max(S.at(-1),d=>d[1])*1.05]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w); xAxisTime(F.g,x,F.h,6);
  F.g.selectAll(".ar").data(S).join("path").style("fill",d=>col[d.key]).style("stroke","var(--panel)").style("stroke-width",.6)
    .attr("d",d3.area().x(d=>x(d.data.d)).y0(d=>y(d[0])).y1(d=>y(d[1])));
  const last=S.map(s=>({k:s.key,y:(s.at(-1)[0]+s.at(-1)[1])/2,v:s.at(-1).data[s.key]}));
  F.g.selectAll(".dl").data(last).join("text").attr("class","lbl").attr("x",F.w+6).attr("y",d=>y(d.y)+4)
    .text(d=>`${nm[d.k]} ${nf(d.v)}`);
  crosshair(F,x,D.map(d=>d.d),i=>{ const r=D[i]; const t=r.conv+r.shale+r.tight;
    return `<b>${mlab(r.m)}</b>${trow("Shale",col.shale,nf(r.shale))}${trow("Tight",col.tight,nf(r.tight))}${trow("Convencional",col.conv,nf(r.conv))}${trow("Total","",nf(t))}${trow("No convencional","",nf((r.shale+r.tight)/t*100,1)+"%")}`; });
}
function og2(box){
  const K=VIZ.cohort.keys, R=VIZ.cohort.rows.map(r=>Object.fromEntries([["yr",r[0]],...K.map((k,i)=>[k,r[i+1]])]));
  const shade=k=>{ const i=K.indexOf(k); return mix("var(--og)", 18+i*82/(K.length-1)); };
  box.insertAdjacentHTML("beforeend",`<div class="vlegend"><span><i style="background:${shade(K[0])}"></i>Pozos de 2017 o antes</span><span><i style="background:${shade(K[4])}"></i>…</span><span><i style="background:${shade(K.at(-1))}"></i>Pozos de 2025</span><span>Más oscuro = pozos más nuevos</span></div>`);
  const F=frame(box,280,{t:12,r:16,b:24,l:44});
  const x=d3.scaleLinear().domain([2015,2025]).range([0,F.w]);
  const S=d3.stack().keys(K)(R);
  const y=d3.scaleLinear().domain([0,d3.max(S.at(-1),d=>d[1])*1.05]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w);
  F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")).tickSizeOuter(0));
  F.g.selectAll(".ly").data(S).join("path").style("fill",d=>shade(d.key)).style("stroke","var(--panel)").style("stroke-width",.8)
    .attr("d",d3.area().x(d=>x(d.data.yr)).y0(d=>y(d[0])).y1(d=>y(d[1])).curve(d3.curveMonotoneX));
  crosshair(F,x,R.map(r=>r.yr),i=>{ const r=R[i]; const t=K.reduce((a,k)=>a+r[k],0);
    return `<b>${r.yr} · ${nf(t)} mil bbl/d</b>${K.slice().reverse().filter(k=>r[k]>0.05).map(k=>trow(`Pozos de ${k}`,shade(k),nf(r[k],1))).join("")}`; });
}
function og3(box){
  const src=STATS.og.charts.find(c=>/Operadores/.test(c.t));
  const tot=939422, rows=src.rows.map(([n,v])=>({n,v})); rows.push({n:"Resto de operadores",v:tot-d3.sum(rows,d=>d.v),o:1});
  const empKey=n=>Object.keys(EMP).find(k=>norm(EMP[k].n).startsWith(norm(n).split(" ")[0]) && !/^x-/.test(k));
  const F=frame(box,300,{t:0,r:0,b:0,l:0});
  const root=d3.hierarchy({children:rows}).sum(d=>d.v).sort((a,b)=>b.value-a.value);
  d3.treemap().size([F.w,F.h]).paddingInner(2).round(true)(root);
  const nodes=F.g.selectAll("g").data(root.leaves()).join("g").attr("class","tm").attr("transform",d=>`translate(${d.x0},${d.y0})`);
  const rank=d3.scaleLinear().domain([0,rows.length-2]).range([100,45]);
  nodes.append("rect").attr("width",d=>d.x1-d.x0).attr("height",d=>d.y1-d.y0).attr("rx",3)
    .style("fill",(d,i)=>d.data.o?"var(--exp)":mix("var(--og)",rank(i)))
    .classed("clk",d=>!!empKey(d.data.n))
    .on("pointermove",(ev,d)=>tipOn(ev,`<b>${d.data.n}</b>${trow("Petróleo operado",null,nf(d.data.v)+" bbl/d")}${trow("Participación",null,nf(d.data.v/tot*100,1)+"%")}${empKey(d.data.n)?'<div style="color:var(--muted);margin-top:4px">Tocá para ver la empresa</div>':""}`))
    .on("pointerleave",tipOff)
    .on("click",(ev,d)=>{ const k=empKey(d.data.n); if(k){ tipOff(); setView("co"); openProfile(k); } });
  nodes.filter(d=>(d.x1-d.x0)>70&&(d.y1-d.y0)>34).append("text").attr("x",7).attr("y",17).attr("class","lbl")
    .style("fill",(d,i)=>i<3?"var(--panel)":"var(--ink)").text(d=>d.data.n.length>22?d.data.n.slice(0,20)+"…":d.data.n);
  nodes.filter(d=>(d.x1-d.x0)>70&&(d.y1-d.y0)>34).append("text").attr("x",7).attr("y",31).attr("class","val")
    .style("fill",(d,i)=>i<3?"var(--panel)":"var(--ink)").text(d=>`${nf(d.data.v/tot*100,1)}%`);
}
function og4(box){
  const S=VIZ.sankey, F=frame(box,260,{t:10,r:8,b:10,l:8});
  const k=F.h/S.prod*0.86, nw=12, c1=0, c2=F.w*0.46, c3=F.w-nw;
  const typ=[["Convencional",S.types[0],"var(--pro)"],["Shale",S.types[1],"var(--og)"],["Tight",S.types[2],mix("var(--og)",50)]];
  const gap=(F.h-S.prod*k)/2; let yy=0;
  const L=typ.map(([n,v,c])=>{ const o={n,v,c,y:yy}; yy+=v*k+gap; return o; });
  const midY=(F.h-S.prod*k)/2;
  const outs=[["Procesado en refinerías locales",S.proc,"var(--ink)"],["Exportación y variación de stock",S.rest,"var(--og)"]];
  let oy=0; const Rn=outs.map(([n,v,c])=>{ const o={n,v,c,y:oy}; oy+=v*k+gap*1.4; return o; });
  const band=(x0,y0a,y0b,x1,y1a,y1b)=>{ const cx=(x0+x1)/2; return `M${x0},${y0a}C${cx},${y0a} ${cx},${y1a} ${x1},${y1a}L${x1},${y1b}C${cx},${y1b} ${cx},${y0b} ${x0},${y0b}Z`; };
  let my=midY;
  L.forEach(o=>{ const h=o.v*k;
    F.g.append("path").attr("d",band(c1+nw,o.y,o.y+h,c2,my,my+h)).style("fill",o.c).style("opacity",.35)
      .on("pointermove",ev=>tipOn(ev,`<b>${o.n}</b>${trow("Promedio ene–nov 2025",null,nf(o.v)+" mil bbl/d")}${trow("Participación",null,nf(o.v/S.prod*100,1)+"%")}`)).on("pointerleave",tipOff);
    F.g.append("rect").attr("x",c1).attr("y",o.y).attr("width",nw).attr("height",Math.max(h,1.5)).style("fill",o.c);
    my+=h; });
  F.g.append("rect").attr("x",c2).attr("y",midY).attr("width",nw).attr("height",S.prod*k).style("fill","var(--ink)");
  let sy=midY;
  Rn.forEach(o=>{ const h=o.v*k;
    F.g.append("path").attr("d",band(c2+nw,sy,sy+h,c3,o.y,o.y+h)).style("fill",o.c).style("opacity",.28)
      .on("pointermove",ev=>tipOn(ev,`<b>${o.n}</b>${trow("Promedio ene–nov 2025",null,nf(o.v)+" mil bbl/d")}${trow("Del total producido",null,nf(o.v/S.prod*100,1)+"%")}`)).on("pointerleave",tipOff);
    F.g.append("rect").attr("x",c3).attr("y",o.y).attr("width",nw).attr("height",h).style("fill",o.c);
    sy+=h; });
  L.forEach(o=>F.g.append("text").attr("class","lbl").attr("x",c1+nw+6).attr("y",o.y+Math.max(o.v*k,2)/2+4).text(`${o.n} ${nf(o.v)}`));
  F.g.append("text").attr("class","lbl").attr("x",c2+nw/2).attr("y",midY-6).attr("text-anchor","middle").text(`Producción ${nf(S.prod)}`);
  Rn.forEach(o=>F.g.append("text").attr("class","lbl").attr("x",c3-6).attr("text-anchor","end").attr("y",o.y+o.v*k/2+4).text(`${o.n.split(" ").slice(0,3).join(" ")} ${nf(o.v)}`));
}
function og5(box){
  const D=VIZ.trade.map(([q,e,i])=>({q,e,i,s:e-i}));
  const F=frame(box,270,{t:12,r:16,b:28,l:48});
  const x=d3.scaleBand().domain(D.map(d=>d.q)).range([0,F.w]).padding(.18);
  const y=d3.scaleLinear().domain([-d3.max(D,d=>d.i)*1.05,d3.max(D,d=>d.e)*1.08]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w,d=>nf(Math.abs(d)),5);
  F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`)
    .call(d3.axisBottom(x).tickValues(D.map(d=>d.q).filter(q=>q.endsWith("Q1"))).tickFormat(q=>q.slice(0,4)).tickSizeOuter(0));
  F.g.append("line").attr("x1",0).attr("x2",F.w).attr("y1",y(0)).attr("y2",y(0)).style("stroke","var(--muted)");
  F.g.selectAll(".e").data(D).join("rect").attr("x",d=>x(d.q)).attr("width",x.bandwidth()).attr("y",d=>y(d.e)).attr("height",d=>y(0)-y(d.e)).attr("rx",2).style("fill","var(--og)");
  F.g.selectAll(".i").data(D).join("rect").attr("x",d=>x(d.q)).attr("width",x.bandwidth()).attr("y",y(0)).attr("height",d=>y(-d.i)-y(0)).attr("rx",2).style("fill","var(--pro)");
  F.g.append("path").datum(D).attr("d",d3.line().x(d=>x(d.q)+x.bandwidth()/2).y(d=>y(d.s))).style("fill","none").style("stroke","var(--ink)").style("stroke-width",2);
  F.g.selectAll(".sd").data(D).join("circle").attr("cx",d=>x(d.q)+x.bandwidth()/2).attr("cy",d=>y(d.s)).attr("r",2.6).style("fill","var(--ink)").style("stroke","var(--panel)");
  F.g.selectAll(".hb").data(D).join("rect").attr("class","hit").attr("x",d=>x(d.q)).attr("width",x.step()).attr("y",0).attr("height",F.h)
    .on("pointermove",(ev,d)=>tipOn(ev,`<b>${d.q.replace("-Q","· T")}</b>${trow("Exportaciones","var(--og)","US$ "+nf(d.e)+" M")}${trow("Importaciones","var(--pro)","US$ "+nf(d.i)+" M")}${trow("Saldo","var(--ink)",(d.s>=0?"+":"")+nf(d.s))}`)).on("pointerleave",tipOff);
}
function og6(box){
  const B=VIZ.brent.filter(r=>r[0]>="2018-01").map(r=>({d:pdate(r[0]),m:r[0],v:r[1]}));
  const P=VIZ.oilTot.map(r=>({d:pdate(r[0]),m:r[0],v:r[1]}));
  const dom=[pdate("2018-01"),pdate([VIZ.brent.at(-1)[0],VIZ.oilTot.at(-1)[0]].sort().at(-1))];
  const panel=(data,col,unit,title,h)=>{
    const wrap=document.createElement("div"); box.appendChild(wrap);
    wrap.insertAdjacentHTML("beforeend",`<div style="font-size:12px;color:var(--muted);margin:2px 0">${title}</div>`);
    const F=frame(wrap,h,{t:8,r:56,b:22,l:44});
    const x=d3.scaleTime().domain(dom).range([0,F.w]);
    const y=d3.scaleLinear().domain([0,d3.max(data,d=>d.v)*1.08]).nice().range([F.h,0]);
    yAxis(F.g,y,F.w,d=>nf(d),3); xAxisTime(F.g,x,F.h,8);
    F.g.append("path").datum(data).attr("d",d3.line().x(d=>x(d.d)).y(d=>y(d.v))).style("fill","none").style("stroke",col).style("stroke-width",2);
    const l=data.at(-1); F.g.append("circle").attr("cx",x(l.d)).attr("cy",y(l.v)).attr("r",3.5).style("fill",col);
    F.g.append("text").attr("class","val").attr("x",x(l.d)+6).attr("y",y(l.v)+4).text(nf(l.v));
    crosshair(F,x,data.map(d=>d.d),i=>`<b>${mlab(data[i].m)}</b>${trow(title.split(",")[0],col,nf(data[i].v,unit==="US$"?2:0)+" "+unit)}`);
  };
  panel(B,"var(--ink)","US$","Brent, US$ por barril (promedio mensual)",150);
  panel(P,"var(--og)","mil bbl/d","Producción argentina de petróleo, miles de bbl/d",150);
}

// ============================================================
// MINERÍA
// ============================================================
function mi1(box){
  const orden=["Producción","Construcción","Reingeniería","Factibilidad","Prefactibilidad","Evaluación Económica Preliminar","Exploración avanzada","Exploración inicial","Prospección"];
  const cnt=d3.rollup(SIACAM,v=>v.length,d=>d.min);
  const top=[...cnt].sort((a,b)=>b[1]-a[1]).slice(0,5).map(d=>d[0]);
  const keys=[...top,"Otros"], col=Object.fromEntries(keys.map((k,i)=>[k,i<5?`var(--c${i+1})`:"var(--exp)"]));
  const R=orden.map(e=>{ const xs=SIACAM.filter(o=>o.est===e); const r={e,n:xs.length}; keys.forEach(k=>r[k]=0); xs.forEach(o=>r[top.includes(o.min)?o.min:"Otros"]++); return r; }).filter(r=>r.n);
  box.insertAdjacentHTML("beforeend",legend(keys.map(k=>[k,col[k]])));
  const F=frame(box,R.length*30+20,{t:6,r:40,b:14,l:178});
  const y=d3.scaleBand().domain(R.map(r=>r.e)).range([0,F.h]).padding(.22);
  const x=d3.scaleLinear().domain([0,d3.max(R,r=>r.n)]).range([0,F.w]);
  const S=d3.stack().keys(keys)(R);
  F.g.selectAll(".s").data(S).join("g").style("fill",d=>col[d.key]).selectAll("rect").data(d=>d.map(v=>({...v,k:d.key}))).join("rect")
    .attr("y",d=>y(d.data.e)).attr("height",y.bandwidth()).attr("x",d=>x(d[0])).attr("width",d=>Math.max(0,x(d[1])-x(d[0])-(d[1]>d[0]?1.5:0)))
    .on("pointermove",(ev,d)=>tipOn(ev,`<b>${d.data.e}</b>${trow(d.k,col[d.k],nf(d.data[d.k])+" proyectos")}${trow("Total de la etapa",null,nf(d.data.n))}`)).on("pointerleave",tipOff);
  F.g.selectAll(".l").data(R).join("text").attr("class","lbl mut").attr("x",-8).attr("y",r=>y(r.e)+y.bandwidth()/2+4).attr("text-anchor","end").text(r=>r.e==="Evaluación Económica Preliminar"?"Evaluación econ. preliminar":r.e);
  F.g.selectAll(".v").data(R).join("text").attr("class","val").attr("x",r=>x(r.n)+5).attr("y",r=>y(r.e)+y.bandwidth()/2+4).text(r=>r.n);
}
function mi2(box){
  const K=[["Oro","var(--c4)"],["Plata","var(--pro)"],["Litio","var(--c3)"],["Resto","var(--exp)"]];
  const R=VIZ.minExp.map(([y,o,p,l,r])=>({y:String(y),Oro:o,Plata:p,Litio:l,Resto:r||0,t:r!=null?o+p+l+r:null}));
  box.insertAdjacentHTML("beforeend",legend(K));
  const F=frame(box,250,{t:14,r:10,b:24,l:44});
  const x=d3.scaleBand().domain(R.map(r=>r.y)).range([0,F.w]).padding(.28);
  const S=d3.stack().keys(K.map(k=>k[0]))(R);
  const y=d3.scaleLinear().domain([0,d3.max(R,r=>r.Oro+r.Plata+r.Litio+r.Resto)*1.1]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w); F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`).call(d3.axisBottom(x).tickSizeOuter(0));
  const col=Object.fromEntries(K);
  F.g.selectAll(".s").data(S).join("g").style("fill",d=>col[d.key]).selectAll("rect").data(d=>d.map(v=>({...v,k:d.key}))).join("rect")
    .attr("x",d=>x(d.data.y)).attr("width",x.bandwidth()).attr("y",d=>y(d[1])).attr("height",d=>Math.max(0,y(d[0])-y(d[1])-(d[1]>d[0]?1.5:0)))
    .on("pointermove",(ev,d)=>tipOn(ev,`<b>${d.data.y}</b>${K.filter(([k])=>d.data[k]).map(([k,c])=>trow(k,c,"US$ "+nf(d.data[k])+" M")).join("")}${d.data.t?trow("Total minero",null,"US$ "+nf(d.data.t)+" M"):`<div style="color:var(--muted);margin-top:4px">Sin total publicado para este año</div>`}`)).on("pointerleave",tipOff);
  F.g.selectAll(".t").data(R).join("text").attr("class","val").attr("text-anchor","middle").attr("x",r=>x(r.y)+x.bandwidth()/2).attr("y",r=>y(r.Oro+r.Plata+r.Litio+r.Resto)-5).text(r=>nf(r.t||r.Oro+r.Plata+r.Litio));
}
function mi3(box){
  const R=VIZ.goldIdx.map(([y,p,e,pa,ea])=>({y,p,e,pa,ea}));
  box.insertAdjacentHTML("beforeend",legend([["Precio internacional del oro","var(--ink)","ln"],["Exportaciones argentinas de oro","var(--mi)","ln"]]));
  const F=frame(box,240,{t:12,r:44,b:24,l:40});
  const x=d3.scaleLinear().domain([2019,2025]).range([0,F.w]);
  const y=d3.scaleLinear().domain([60,d3.max(R,r=>Math.max(r.p,r.e))*1.08]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w); F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`).call(d3.axisBottom(x).ticks(7).tickFormat(d3.format("d")).tickSizeOuter(0));
  F.g.append("line").attr("x1",0).attr("x2",F.w).attr("y1",y(100)).attr("y2",y(100)).style("stroke","var(--muted)").style("stroke-dasharray","3 3");
  [["p","var(--ink)"],["e","var(--mi)"]].forEach(([k,c])=>{
    F.g.append("path").datum(R).attr("d",d3.line().x(r=>x(r.y)).y(r=>y(r[k]))).style("fill","none").style("stroke",c).style("stroke-width",2);
    F.g.selectAll(".d"+k).data(R).join("circle").attr("cx",r=>x(r.y)).attr("cy",r=>y(r[k])).attr("r",3.5).style("fill",c).style("stroke","var(--panel)").style("stroke-width",1.5);
    const l=R.at(-1); F.g.append("text").attr("class","val").attr("x",x(l.y)+7).attr("y",y(l[k])+4).text(nf(l[k]));
  });
  crosshair(F,x,R.map(r=>r.y),i=>{ const r=R[i]; return `<b>${r.y}</b>${trow("Oro, precio promedio","var(--ink)","US$ "+nf(r.pa)+"/oz · "+nf(r.p))}${trow("Exportaciones de oro","var(--mi)","US$ "+nf(r.ea)+" M · "+nf(r.e))}`; });
}
const RIGI_PROV = { "Interprovincial":"Interprovincial" };
function rigiRows(){
  const seen=new Set(), out=[];
  ALL.filter(a=>a.rigi).forEach(a=>{
    const key=a.rigi.st+"|"+a.rigi.inv; if(seen.has(key)) return; seen.add(key);
    if(!a.rigi.v) return;
    out.push({n:a.n,id:a.id,s:a.s,prov:RIGI_PROV[a.prov]||a.prov,v:a.rigi.v,ok:a.rigi.ok});
  });
  return out;
}
function mi4(box){
  const mode=VZ.rigi||"all";
  box.insertAdjacentHTML("beforeend",`<div class="vchips">${[["all","Aprobados y en trámite"],["ok","Sólo aprobados"]].map(([k,n])=>`<button class="chip" data-rigi="${k}" aria-pressed="${k===mode}">${n}</button>`).join("")}</div>`);
  box.querySelectorAll("[data-rigi]").forEach(b=>b.onclick=()=>{ VZ.rigi=b.dataset.rigi; box.innerHTML=""; mi4(box); });
  const rows=rigiRows().filter(r=>mode==="all"||r.ok);
  const secs=["og","mi","ag"].filter(s=>rows.some(r=>r.s===s));
  const P=[...d3.rollup(rows,v=>Object.fromEntries([["t",d3.sum(v,r=>r.v)],...secs.map(s=>[s,d3.sum(v.filter(r=>r.s===s),r=>r.v)])]),r=>r.prov)].map(([p,o])=>({p,...o})).sort((a,b)=>b.t-a.t);
  box.insertAdjacentHTML("beforeend",legend(secs.map(s=>[SECT[s].n,cvar(s)]))+`<div style="font-size:12px;color:var(--muted)">Total: US$ ${nf(d3.sum(rows,r=>r.v))} M en ${rows.length} proyectos con monto informado</div>`);
  const F=frame(box,P.length*26+18,{t:6,r:70,b:10,l:120});
  const y=d3.scaleBand().domain(P.map(r=>r.p)).range([0,F.h]).padding(.22);
  const x=d3.scaleLinear().domain([0,d3.max(P,r=>r.t)]).range([0,F.w]);
  const S=d3.stack().keys(secs)(P);
  F.g.selectAll(".s").data(S).join("g").style("fill",d=>cvar(d.key)).selectAll("rect").data(d=>d.map(v=>({...v,k:d.key}))).join("rect")
    .attr("y",d=>y(d.data.p)).attr("height",y.bandwidth()).attr("x",d=>x(d[0])).attr("width",d=>Math.max(0,x(d[1])-x(d[0])-(d[1]>d[0]?1.5:0)))
    .on("pointermove",(ev,d)=>tipOn(ev,`<b>${d.data.p}</b>${rows.filter(r=>r.prov===d.data.p&&r.s===d.k).map(r=>trow(r.n+(r.ok?"":" (en trámite)"),cvar(r.s),"US$ "+nf(r.v)+" M")).join("")}`)).on("pointerleave",tipOff);
  F.g.selectAll(".l").data(P).join("text").attr("class","lbl mut").attr("x",-8).attr("text-anchor","end").attr("y",r=>y(r.p)+y.bandwidth()/2+4).text(r=>r.p);
  F.g.selectAll(".v").data(P).join("text").attr("class","val").attr("x",r=>x(r.t)+5).attr("y",r=>y(r.p)+y.bandwidth()/2+4).text(r=>"US$ "+nf(r.t)+" M");
}
function provMap(box, valueOf, color, tipHtml, h=340){
  const F=frame(box,h,{t:4,r:4,b:4,l:4});
  const feats=GEO.prov.features.filter(f=>valueOf(f.properties.name)!==undefined);
  const pj=d3.geoMercator().fitSize([F.w,F.h],{type:"FeatureCollection",features:feats});
  const pth=d3.geoPath(pj);
  F.g.selectAll("path").data(feats).join("path").attr("d",pth).style("fill",f=>color(valueOf(f.properties.name))).style("stroke","var(--panel)").style("stroke-width",.8)
    .on("pointermove",(ev,f)=>tipOn(ev,tipHtml(f.properties.name))).on("pointerleave",tipOff);
  return {F,pj};
}
const PROVS = ["Buenos Aires","Catamarca","Chaco","Chubut","Ciudad de Buenos Aires","Córdoba","Corrientes","Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones","Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe","Santiago del Estero","Tierra del Fuego","Tucumán"];
function binLegend(th, cols, unit){
  return `<div class="vlegend">${cols.map((c,i)=>`<span><i style="background:${c}"></i>${i===0?`menos de ${nf(th[0])}`:i===cols.length-1?`${nf(th[i-1])} o más`:`${nf(th[i-1])}–${nf(th[i])}`}</span>`).join("")}<span>${unit}</span></div>`;
}
function mi5(box){
  const J=VIZ.minJobs, tot=39311;
  const th=[2500,4000,5500,7000], cols=[20,40,60,80,100].map(p=>mix("var(--mi)",p));
  const sc=d3.scaleThreshold().domain(th).range(cols);
  box.insertAdjacentHTML("beforeend",`<div class="vside"><div class="vmap"></div><div><p class="eyebrow">Empleo directo, promedio 2025</p><ol>${Object.entries(J).sort((a,b)=>b[1]-a[1]).map(([p,v])=>`<li>${p}: <b>${nf(v)}</b> (${nf(v/tot*100,0)}%)</li>`).join("")}</ol><p class="note" style="margin-top:8px">Total: ${nf(tot)} puestos. CAEM no abre «Resto» por provincia; esas provincias aparecen en gris.</p></div></div>`);
  const valueOf=p=>PROVS.includes(p)?(J[p]??null):undefined;
  const {F}=provMap(box.querySelector(".vmap"),valueOf,v=>v==null?"var(--land)":sc(v),p=>`<b>${p}</b>${J[p]!=null?trow("Empleo minero directo",null,nf(J[p]))+trow("Del total país",null,nf(J[p]/tot*100,1)+"%"):'<div style="color:var(--muted)">Incluida en «Resto» (7.316 puestos entre varias provincias)</div>'}`,320);
  box.querySelector(".vmap").insertAdjacentHTML("beforeend",binLegend(th,cols,"puestos"));
}

// ============================================================
// AGRO Y GANADERÍA
// ============================================================
let DEPTOS;
function ag1(box){
  if(!DEPTOS) DEPTOS=topojson.feature(DEPTOS_TOPO, DEPTOS_TOPO.objects[Object.keys(DEPTOS_TOPO.objects)[0]]);
  const crop=VZ.crop||"s", CN={s:"Soja",m:"Maíz",t:"Trigo"}, CAMP=VIZ.agCamp||"2024/2025", NAT={s:VIZ.nac[CAMP][0],m:VIZ.nac[CAMP][1],t:VIZ.nac[CAMP][2]};
  box.insertAdjacentHTML("beforeend",`<div class="vchips">${Object.entries(CN).map(([k,n])=>`<button class="chip" data-crop="${k}" aria-pressed="${k===crop}">${n} · ${nf(NAT[k]/1e6,1)} Mt</button>`).join("")}</div>`);
  box.querySelectorAll("[data-crop]").forEach(b=>b.onclick=()=>{ VZ.crop=b.dataset.crop; box.innerHTML=""; ag1(box); });
  const th=[25,100,250,500,1000], cols=[24,38,54,70,85,100].map(p=>mix("var(--ag)",p));
  const sc=d3.scaleThreshold().domain(th).range(cols);
  const top=DEPTOS.features.filter(f=>f.properties[crop]).sort((a,b)=>b.properties[crop]-a.properties[crop]).slice(0,10);
  box.insertAdjacentHTML("beforeend",`<div class="vside"><div class="vmap"></div><div><p class="eyebrow">Departamentos líderes · ${CN[crop]}</p><ol>${top.map(f=>`<li>${f.properties.n.replace(" (incluye Lezama)","")} <span style="color:var(--muted)">(${f.properties.p})</span>: <b>${nf(f.properties[crop])}</b> mil t</li>`).join("")}</ol><p class="note" style="margin-top:8px">Los 10 primeros suman el ${nf(d3.sum(top,f=>f.properties[crop])*1000/NAT[crop]*100,0)}% de la cosecha nacional de ${CN[crop].toLowerCase()}.</p></div></div>`);
  const mb=box.querySelector(".vmap");
  const F=frame(mb,Math.min(520,Math.max(360,(mb.clientWidth||500)*1.05)),{t:2,r:2,b:2,l:2});
  const pj=d3.geoMercator().fitSize([F.w,F.h],DEPTOS); const pth=d3.geoPath(pj);
  F.g.selectAll("path.d").data(DEPTOS.features).join("path").attr("class","d").attr("d",pth)
    .style("fill",f=>f.properties[crop]?sc(f.properties[crop]):"var(--land)").style("stroke","var(--panel)").style("stroke-width",.35)
    .on("pointermove",(ev,f)=>{ const v=f.properties[crop]; tipOn(ev,`<b>${f.properties.n}</b><div style="color:var(--muted)">${f.properties.p}</div>${v?trow(CN[crop]+" "+CAMP.replace(/\/20(\d\d)$/,"/$1"),null,nf(v,1)+" mil t")+trow("Del total nacional",null,nf(v*1000/NAT[crop]*100,2)+"%"):'<div style="color:var(--muted)">Sin producción registrada o menor a 1.000 t</div>'}`); })
    .on("pointerleave",tipOff);
  const clip={type:"FeatureCollection",features:GEO.prov.features.filter(f=>PROVS.includes(f.properties.name))};
  F.g.append("path").datum(clip).attr("d",pth).style("fill","none").style("stroke","var(--muted)").style("stroke-width",.7).style("pointer-events","none")
    .attr("clip-path",null);
  // recortar el contorno provincial al área visible
  F.svg.append("defs").append("clipPath").attr("id","agclip").append("rect").attr("width",F.w).attr("height",F.h);
  F.g.attr("clip-path","url(#agclip)");
  mb.insertAdjacentHTML("beforeend",binLegend(th,cols,"miles de toneladas por departamento").replace('<div class="vlegend">','<div class="vlegend"><span><i style="background:var(--land)"></i>sin dato o menos de 1</span>'));
}
function ag2(box){
  const S=VIZ.siembra;
  const rows=[
    {n:"Maíz · siembra",v:S.maiz[0],prev:S.maiz[2],note:`de ${nf(S.maiz[1],1)} M ha proyectadas`},
    {n:"Girasol · siembra",v:S.girasol[0],note:`de ${nf(S.girasol[1],1)} M ha proyectadas`},
    {n:"Trigo · condición buena o excelente",v:VIZ.trigoCond,note:"84% ya en encañazón o más avanzado"}
  ];
  box.insertAdjacentHTML("beforeend",legend([["Avance 2026/27","var(--ag)"],["Misma fecha de la campaña anterior","var(--ink)","ln"]]));
  const F=frame(box,rows.length*54+10,{t:6,r:56,b:4,l:8});
  const x=d3.scaleLinear().domain([0,100]).range([0,F.w]);
  rows.forEach((r,i)=>{ const y0=i*54;
    F.g.append("text").attr("class","lbl").attr("x",0).attr("y",y0+12).text(r.n);
    F.g.append("text").attr("class","lbl mut").attr("x",F.w).attr("text-anchor","end").attr("y",y0+12).text(r.note);
    F.g.append("rect").attr("x",0).attr("y",y0+20).attr("width",F.w).attr("height",14).attr("rx",3).style("fill","var(--line)");
    F.g.append("rect").attr("x",0).attr("y",y0+20).attr("width",x(r.v)).attr("height",14).attr("rx",3).style("fill","var(--ag)")
      .on("pointermove",ev=>tipOn(ev,`<b>${r.n}</b>${trow("Hoy",null,nf(r.v,1)+"%")}${r.prev!=null?trow("Campaña anterior, misma fecha",null,nf(r.prev,1)+"%"):""}`)).on("pointerleave",tipOff);
    if(r.prev!=null) F.g.append("line").attr("x1",x(r.prev)).attr("x2",x(r.prev)).attr("y1",y0+16).attr("y2",y0+38).style("stroke","var(--ink)").style("stroke-width",2);
    F.g.append("text").attr("class","val").attr("x",F.w+6).attr("y",y0+31).text(nf(r.v,1)+"%");
  });
}
function ag3(box){
  const B=VIZ.bov;
  box.insertAdjacentHTML("beforeend",`<div class="vstats"><div><b>${nf(B.stock/1e6,1)} M</b><span>cabezas al 31-12-2025 (${nf(B.var,2)}% anual)</span></div><div><b>${nf(B.tv,1)}%</b><span>terneros por vaca, igual que el año previo</span></div><div><b>${nf(B.hem[2026],1)}%</b><span>hembras en la faena, ene–may 2026 (47% en 2025; 50% en 2019)</span></div></div>`);
  const D=VIZ.faena.map(([y,v])=>({y:String(y),v}));
  const F=frame(box,200,{t:16,r:8,b:22,l:36});
  const x=d3.scaleBand().domain(D.map(d=>d.y)).range([0,F.w]).padding(.25);
  const y=d3.scaleLinear().domain([0,d3.max(D,d=>d.v)*1.12]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w,d=>nf(d),3); F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`).call(d3.axisBottom(x).tickValues(D.map(d=>d.y).filter((d,i)=>i%2===0)).tickSizeOuter(0));
  F.g.selectAll("rect").data(D).join("rect").attr("x",d=>x(d.y)).attr("width",x.bandwidth()).attr("y",d=>y(d.v)).attr("height",d=>F.h-y(d.v)).attr("rx",3).style("fill","var(--ag)")
    .on("pointermove",(ev,d)=>tipOn(ev,`<b>${d.y}</b>${trow("Faena bovina",null,nf(d.v,2)+" M cabezas")}`)).on("pointerleave",tipOff);
  const mx=D.reduce((a,b)=>b.v>a.v?b:a), l=D.at(-1);
  [mx,l].forEach(d=>F.g.append("text").attr("class","val").attr("text-anchor","middle").attr("x",x(d.y)+x.bandwidth()/2).attr("y",y(d.v)-5).text(nf(d.v,1)));
}
function ag4(box){
  const P=VIZ.puertos, gr=P["Gran Rosario"], bb=P["Bahía Blanca"];
  const F=frame(box,330,{t:4,r:4,b:4,l:4});
  const feats=GEO.prov.features.filter(f=>["Buenos Aires","Córdoba","Santa Fe","Entre Ríos","La Pampa","Santiago del Estero","San Luis","Chaco","Corrientes","Ciudad de Buenos Aires","Río Negro"].includes(f.properties.name));
  const pj=d3.geoMercator().fitSize([F.w,F.h],{type:"FeatureCollection",features:feats.filter(f=>f.properties.name!=="Río Negro"&&f.properties.name!=="Chaco"&&f.properties.name!=="Corrientes"&&f.properties.name!=="Santiago del Estero")});
  const pth=d3.geoPath(pj);
  F.g.append("clipPath").attr("id","ptclip").append("rect").attr("width",F.w).attr("height",F.h);
  const G=F.g.append("g").attr("clip-path","url(#ptclip)");
  G.selectAll("path").data(feats).join("path").attr("d",pth).style("fill","var(--land)").style("stroke","var(--panel)").style("stroke-width",1);

  const ports=[{n:"Gran Rosario",ll:[-60.65,-32.95],sh:gr[1],t:`${nf(gr[0],1)} Mt · cerca del ${gr[1]}% de las exportaciones agroindustriales`},
               {n:"Bahía Blanca",ll:[-62.27,-38.78],sh:bb[1],t:`${bb[1]}% de las exportaciones agroindustriales (segundo nodo)`}];
  const r=d3.scaleSqrt().domain([0,75]).range([0,34]);
  ports.forEach(p=>{ const [x,y]=pj(p.ll);
    G.append("circle").attr("cx",x).attr("cy",y).attr("r",r(p.sh)).style("fill",mix("var(--ag)",70)).style("stroke","var(--panel)").style("stroke-width",2)
      .on("pointermove",ev=>tipOn(ev,`<b>${p.n}</b><div>${p.t}</div><div style="color:var(--muted);margin-top:4px">Año 2025 · BCR</div>`)).on("pointerleave",tipOff);
    G.append("text").attr("class","lbl").attr("x",x+r(p.sh)+6).attr("y",y+4).text(`${p.n} · ${p.sh}%`);
  });
}
function ag5(box){
  const D=VIZ.granos.map(r=>({d:pdate(r[0]),m:r[0],s:r[1],mz:r[2],t:r[3]}));
  const wrap=document.createElement("div"); wrap.className="vsm"; box.appendChild(wrap);
  [["s","Soja"],["mz","Maíz"],["t","Trigo"]].forEach(([k,n])=>{
    const cell=document.createElement("div"); wrap.appendChild(cell);
    const l=D.at(-1), f=D[0];
    cell.innerHTML=`<h4>${n}<small>US$ ${nf(l[k])}/t · ${l[k]>=f[k]?"+":""}${nf((l[k]/f[k]-1)*100,0)}% vs ${mlab(VIZ.granos[0][0])}</small></h4>`;
    const F=frame(cell,140,{t:6,r:8,b:20,l:34});
    const x=d3.scaleTime().domain(d3.extent(D,d=>d.d)).range([0,F.w]);
    const y=d3.scaleLinear().domain([0,d3.max(D,d=>d[k])*1.08]).nice().range([F.h,0]);
    yAxis(F.g,y,F.w,d=>nf(d),3); xAxisTime(F.g,x,F.h,4);
    F.g.append("path").datum(D).attr("d",d3.line().x(d=>x(d.d)).y(d=>y(d[k]))).style("fill","none").style("stroke","var(--ag)").style("stroke-width",2);
    F.g.append("circle").attr("cx",x(l.d)).attr("cy",y(l[k])).attr("r",3.5).style("fill","var(--ag)");
    crosshair(F,x,D.map(d=>d.d),i=>`<b>${mlab(D[i].m)}</b>${trow(n+", futuro CBOT","var(--ag)","US$ "+nf(D[i][k])+"/t")}`);
  });
}

// ============================================================
// TRANSVERSALES
// ============================================================
function x1(box){
  const R=VIZ.complejos.map(([n,v,s])=>({n,v,s})), tot=d3.sum(R,d=>d.v);
  box.insertAdjacentHTML("beforeend",legend([["Agro y ganadería","var(--ag)"],["Oil & Gas","var(--og)"],["Minería","var(--mi)"],["Otros sectores","var(--exp)"]]));
  const F=frame(box,320,{t:0,r:0,b:0,l:0});
  const root=d3.hierarchy({children:R}).sum(d=>d.v).sort((a,b)=>b.value-a.value);
  d3.treemap().size([F.w,F.h]).paddingInner(2).round(true)(root);
  const g=F.g.selectAll("g").data(root.leaves()).join("g").attr("class","tm").attr("transform",d=>`translate(${d.x0},${d.y0})`);
  const fill=d=>d.data.s?cvar(d.data.s):"var(--exp)";
  g.append("rect").attr("width",d=>d.x1-d.x0).attr("height",d=>d.y1-d.y0).attr("rx",3).style("fill",fill)
    .on("pointermove",(ev,d)=>tipOn(ev,`<b>${d.data.n}</b>${trow("Exportaciones 2025",null,"US$ "+nf(d.data.v)+" M")}${trow("Del total",null,nf(d.data.v/tot*100,1)+"%")}`)).on("pointerleave",tipOff);
  const big=g.filter(d=>(d.x1-d.x0)>66&&(d.y1-d.y0)>34);
  big.append("text").attr("x",7).attr("y",17).attr("class","lbl").style("fill",d=>d.data.s?"var(--panel)":"var(--ink)").text(d=>{ const w=(d.x1-d.x0-12)/6.6; return d.data.n.length>w?d.data.n.slice(0,Math.max(4,w-1))+"…":d.data.n; });
  big.append("text").attr("x",7).attr("y",31).attr("class","val").style("fill",d=>d.data.s?"var(--panel)":"var(--ink)").text(d=>`US$ ${nf(d.data.v/1000,1)} mil M · ${nf(d.data.v/tot*100,0)}%`);
  const share=s=>d3.sum(R.filter(r=>r.s===s),r=>r.v)/tot*100;
  box.insertAdjacentHTML("beforeend",`<p class="read">De US$ ${nf(tot)} M exportados en 2025, los complejos del agro identificados suman el ${nf(share("ag"),0)}%, el petrolero-petroquímico el ${nf(share("og"),0)}% y oro y plata el ${nf(share("mi"),0)}%. El litio está dentro de «Otros complejos».</p>`);
}
function x2(box){
  const D=VIZ.emae.map(([y,a,m,t])=>({y,a,m,t}));
  const S=[["a","Agro, ganadería, caza y silvicultura","var(--ag)"],["m","Minas y canteras (incluye petróleo y gas)","var(--og)"],["t","Economía total","var(--ink)"]];
  box.insertAdjacentHTML("beforeend",legend(S.map(([k,n,c])=>[n,c,"ln"])));
  const F=frame(box,250,{t:12,r:44,b:24,l:40});
  const x=d3.scaleLinear().domain([2017,D.at(-1).y]).range([0,F.w]);
  const y=d3.scaleLinear().domain([60,d3.max(D,d=>Math.max(d.a,d.m,d.t))*1.06]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w); F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`).call(d3.axisBottom(x).ticks(9).tickFormat(d3.format("d")).tickSizeOuter(0));
  F.g.append("line").attr("x1",0).attr("x2",F.w).attr("y1",y(100)).attr("y2",y(100)).style("stroke","var(--muted)").style("stroke-dasharray","3 3");
  S.forEach(([k,n,c])=>{
    F.g.append("path").datum(D).attr("d",d3.line().x(d=>x(d.y)).y(d=>y(d[k]))).style("fill","none").style("stroke",c).style("stroke-width",2);
    F.g.selectAll(".p"+k).data(D).join("circle").attr("cx",d=>x(d.y)).attr("cy",d=>y(d[k])).attr("r",3).style("fill",c).style("stroke","var(--panel)");
  });
  const ends=S.map(([k,n,c])=>({k,c,v:D.at(-1)[k],y:y(D.at(-1)[k])})).sort((a,b)=>a.y-b.y);
  for(let i=1;i<ends.length;i++) if(ends[i].y-ends[i-1].y<12) ends[i].y=ends[i-1].y+12;
  ends.forEach(e=>F.g.append("text").attr("class","val").style("fill",e.c).attr("x",F.w+6).attr("y",e.y+4).text(nf(e.v)));
  crosshair(F,x,D.map(d=>d.y),i=>`<b>${D[i].y} · índice 2017 = 100</b>${S.map(([k,n,c])=>trow(n.split(" (")[0],c,nf(D[i][k],1))).join("")}`);
}
function x3(box){
  const R={tot:["Total",null,4],pp:["Productos primarios","var(--ag)",0],moa:["Manufacturas agropecuarias","var(--ag)",1],moi:["Manufacturas industriales (incluye oro y plata)","var(--mi)",2],cye:["Combustibles y energía","var(--og)",3]};
  const r=VZ.rubro||"tot", P=VIZ.prov24;
  const val=p=>{ const v=P[p==="Ciudad de Buenos Aires"?"Ciudad Autónoma de Buenos Aires":p]; if(!v) return undefined; return r==="tot"?v[0]+v[1]+v[2]+v[3]:v[R[r][2]]; };
  box.insertAdjacentHTML("beforeend",`<div class="vchips">${Object.entries(R).map(([k,[n]])=>`<button class="chip" data-rubro="${k}" aria-pressed="${k===r}">${n.split(" (")[0]}</button>`).join("")}</div>`);
  box.querySelectorAll("[data-rubro]").forEach(b=>b.onclick=()=>{ VZ.rubro=b.dataset.rubro; box.innerHTML=""; x3(box); });
  const vals=PROVS.map(val).filter(v=>v!=null), mx=d3.max(vals);
  const th=r==="tot"?[500,1000,2500,5000,10000]:[100,300,1000,2500,5000];
  const base=R[r][1]||"var(--ink)", cols=[12,28,45,62,80,100].map(p=>mix(base,p));
  const sc=d3.scaleThreshold().domain(th).range(cols);
  const tot=r==="tot"?VIZ.tot24[4]:VIZ.tot24[R[r][2]];
  const rank=PROVS.map(p=>[p,val(p)]).sort((a,b)=>b[1]-a[1]).slice(0,8);
  box.insertAdjacentHTML("beforeend",`<div class="vside"><div class="vmap"></div><div><p class="eyebrow">${R[r][0]} · ${VIZ.provAnio||2024}</p><ol>${rank.map(([p,v])=>`<li>${p}: <b>US$ ${nf(v)} M</b> (${nf(v/tot*100,0)}%)</li>`).join("")}</ol><p class="note" style="margin-top:8px">Total país: US$ ${nf(tot)} M. Incluye exportaciones sin provincia asignada (plataforma, extranjero, indeterminado).</p></div></div>`);
  const mb=box.querySelector(".vmap");
  provMap(mb,p=>PROVS.includes(p)?val(p):undefined,v=>v==null?"var(--land)":sc(v),p=>{ const v=val(p); const raw=P[p==="Ciudad de Buenos Aires"?"Ciudad Autónoma de Buenos Aires":p];
    return `<b>${p}</b>${trow(R[r][0].split(" (")[0],null,"US$ "+nf(v)+" M")}${raw?`<div style="margin-top:4px;color:var(--muted)">PP ${nf(raw[0])} · MOA ${nf(raw[1])} · MOI ${nf(raw[2])} · CyE ${nf(raw[3])}</div>`:""}`; },360);
  mb.insertAdjacentHTML("beforeend",binLegend(th,cols,"millones de US$"));
}
function metaYear(t){
  const q=t.match(/([1-4])T\s*(20\d\d)/); if(q) return +q[2]+(+q[1]-0.5)/4;
  const mo=t.match(/(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)-(20\d\d)/); if(mo) return +mo[2]+(MES.indexOf(mo[1])+0.5)/12;
  if(/fin(es)? de (20\d\d)/.test(t)) return +t.match(/fin(?:es)? de (20\d\d)/)[1]+0.92;
  const ys=[...t.matchAll(/20\d\d/g)].map(m=>+m[0]).filter(y=>y>=2026); return ys.length?Math.min(...ys)+0.5:null;
}
function x4(box){
  const now=2026+(9.5/12);
  const items=[];
  ALL.filter(a=>a.pq&&a.pq.meta).forEach(a=>items.push({n:a.n,s:a.s,t:a.pq.meta.t,bar:a.pq.bar,go:()=>{ setView("map"); select(a.id); }}));
  Object.entries(EMP).filter(([k,c])=>c.pq&&c.pq.meta).forEach(([k,c])=>{ const ss=[...new Set(ALL.filter(a=>a.emp.some(([x])=>x===k)).map(a=>a.s))]; items.push({n:c.n+" (empresa)",s:ss[0]||"og",t:c.pq.meta.t,bar:c.pq.bar,go:()=>{ setView("co"); openProfile(k); }}); });
  const R=items.map(o=>({...o,y:metaYear(o.t)})).filter(o=>o.y&&o.y>=now-0.1).sort((a,b)=>a.y-b.y);
  if(!R.length){ box.innerHTML='<p class="note">Sin metas con fecha publicada.</p>'; return; }
  box.insertAdjacentHTML("beforeend",legend([...new Set(R.map(r=>r.s))].map(s=>[SECT[s].n,cvar(s)]).concat([["Avance hoy vs. meta (cuando es comparable)","var(--ink)","ln"]])));
  const F=frame(box,R.length*28+30,{t:6,r:56,b:22,l:200});
  const x=d3.scaleLinear().domain([now,Math.ceil(d3.max(R,r=>r.y))+0.2]).range([0,F.w]);
  const y=d3.scaleBand().domain(R.map((r,i)=>i)).range([0,F.h]).padding(.3);
  const tv=d3.range(Math.ceil(now),Math.floor(x.domain()[1])+1);
  F.g.append("g").attr("class","grid").call(d3.axisBottom(x).tickValues(tv).tickSize(F.h).tickFormat(""));
  F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`).call(d3.axisBottom(x).tickValues(tv).tickFormat(d3.format("d")).tickSizeOuter(0));
  F.g.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",F.h).style("stroke","var(--ink)");
  F.g.append("text").attr("class","lbl mut").attr("x",3).attr("y",F.h+16).text("hoy");
  F.g.append("text").attr("class","lbl mut").attr("x",0).attr("y",-0).attr("dy",-1).text("");
  R.forEach((r,i)=>{ const yy=y(i), bh=y.bandwidth();
    const row=F.g.append("g").attr("class","clk").on("click",()=>{ tipOff(); r.go(); })
      .on("pointermove",ev=>tipOn(ev,`<b>${r.n}</b><div>${r.t}</div>${r.bar?trow("Hoy",null,`${nf(r.bar[0],1)} de ${nf(r.bar[1],1)} ${r.bar[2]} (${nf(r.bar[0]/r.bar[1]*100,0)}%)`):""}<div style="color:var(--muted);margin-top:4px">Tocá para abrir la ficha</div>`)).on("pointerleave",tipOff);
    row.append("rect").attr("x",0).attr("y",yy).attr("width",Math.max(4,x(r.y))).attr("height",bh).attr("rx",3).style("fill",mix(cvar(r.s),35));
    if(r.bar&&r.bar[0]>0){ const p=Math.min(1,r.bar[0]/r.bar[1]); row.append("rect").attr("x",0).attr("y",yy+bh*0.3).attr("width",Math.max(2,x(r.y)*p)).attr("height",bh*0.4).attr("rx",2).style("fill","var(--ink)"); }
    row.append("circle").attr("cx",x(r.y)).attr("cy",yy+bh/2).attr("r",5).style("fill",cvar(r.s)).style("stroke","var(--panel)").style("stroke-width",1.5);
    row.append("text").attr("class","lbl mut").attr("x",-8).attr("text-anchor","end").attr("y",yy+bh/2+4).text(r.n.length>30?r.n.slice(0,29)+"…":r.n);
    row.append("text").attr("class","val").attr("x",x(r.y)+9).attr("y",yy+bh/2+4).text(r.bar&&r.bar[0]>0?nf(r.bar[0]/r.bar[1]*100,0)+"% de la meta":"aún sin producción");
  });
}
function x5(box){
  const P=VIZ.pairs, M=P.months.map(pdate);
  box.insertAdjacentHTML("beforeend",legend([["Acción (cotización en su mercado)","var(--og)","ln"],["Commodity de referencia","var(--ink)","dash"]]));
  const wrap=document.createElement("div"); wrap.className="vsm"; box.appendChild(wrap);
  P.rows.forEach(r=>{
    const ra=[], rb=[]; for(let i=1;i<M.length;i++){ if(r.a[i]!=null&&r.a[i-1]!=null&&r.b[i]!=null&&r.b[i-1]!=null){ ra.push(r.a[i]/r.a[i-1]-1); rb.push(r.b[i]/r.b[i-1]-1); } }
    const c=(()=>{ if(ra.length<5) return null; const ma=d3.mean(ra), mb=d3.mean(rb); let n=0,da=0,db=0; ra.forEach((v,i)=>{ n+=(v-ma)*(rb[i]-mb); da+=(v-ma)**2; db+=(rb[i]-mb)**2; }); return n/Math.sqrt(da*db); })();
    const cell=document.createElement("div"); wrap.appendChild(cell);
    cell.innerHTML=`<h4>${r.n} <span style="color:var(--muted);font-weight:400">vs ${r.c}</span><small>correlación ${c==null?"–":nf(c,2)}</small></h4>`;
    const F=frame(cell,140,{t:6,r:30,b:20,l:30});
    const x=d3.scaleTime().domain(d3.extent(M)).range([0,F.w]);
    const all=[...r.a,...r.b].filter(v=>v!=null);
    const y=d3.scaleLinear().domain([Math.min(50,d3.min(all)*0.95),d3.max(all)*1.05]).nice().range([F.h,0]);
    yAxis(F.g,y,F.w,d=>nf(d),3); xAxisTime(F.g,x,F.h,3);
    F.g.append("line").attr("x1",0).attr("x2",F.w).attr("y1",y(100)).attr("y2",y(100)).style("stroke","var(--muted)").style("stroke-dasharray","2 3");
    const ln=d3.line().defined(v=>v!=null).x((v,i)=>x(M[i])).y(v=>y(v));
    F.g.append("path").datum(r.b).attr("d",ln).style("fill","none").style("stroke","var(--ink)").style("stroke-width",1.6).style("stroke-dasharray","4 3");
    F.g.append("path").datum(r.a).attr("d",ln).style("fill","none").style("stroke",cvar(r.s)).style("stroke-width",2);
    const li=r.a.length-1; F.g.append("text").attr("class","val").attr("x",x(M[li])+4).attr("y",y(r.a[li])+4).text(nf(r.a[li]));
    crosshair(F,x,M,i=>`<b>${mlab(P.months[i])}</b>${trow(r.t,cvar(r.s),r.a[i]==null?"–":nf(r.a[i],1))}${trow(r.c,"var(--ink)",r.b[i]==null?"sin dato":nf(r.b[i],1))}<div style="color:var(--muted);margin-top:4px">Índice nov-2024 = 100</div>`);
  });
}

// ---------- catálogo y montaje ----------
const VIZ_DEF = {
  og:[
    {id:"og1",f:og1,t:"Petróleo por tipo de recurso",tag:"Área apilada",sub:`Miles de barriles por día, mensual 2016 – ${ymTxt(VIZ.oilType.at(-1)[0])}`,read:(()=>{const f=VIZ.oilType[0],l=VIZ.oilType.at(-1),pc=r=>Math.round((r[2]+r[3])/(r[1]+r[2]+r[3])*100);return `El no convencional pasó de ${pc(f)}% de la producción en ${ymLargo(f[0])} a ${pc(l)}% en ${ymLargo(l[0])}; el convencional cae de forma sostenida.`})(),src:["cap4hist"],wide:true},
    {id:"og2",f:og2,t:"Capas de producción no convencional por año de inicio del pozo",tag:"Cohortes",sub:"Miles de bbl/d de petróleo no convencional según el año de primera producción de cada pozo, 2015–2025",read:"Cada franja es una generación de pozos. La caída rápida de cada capa muestra el declino típico del shale: para crecer hay que perforar cada año más.",src:["cap4ant"]},
    {id:"og3",f:og3,t:"Quién opera el petróleo",tag:"Treemap",sub:`Participación en la producción de petróleo por operador, ${STATS.og.charts[3].sub.replace(/^.*?, /,"")} (total ${STATS.og.kpis[0].v} bbl/d)`,read:"Tocá un rectángulo para abrir la ficha de la empresa.",src:["cap4"]},
    {id:"og4",f:og4,t:"Destino del crudo",tag:"Sankey",sub:"Promedio enero–noviembre 2025, miles de bbl/d",read:"Lo que no se refina en el país se exporta o queda en stock; la serie oficial no separa esas dos salidas.",src:["se363","cap4hist"]},
    {id:"og5",f:og5,t:"Balanza comercial energética",tag:"Barras ±",sub:"Millones de US$ por trimestre: exportaciones (arriba), importaciones (abajo) y saldo (línea)",src:["icaQ"]},
    {id:"og6",f:og6,t:"Precio del Brent y producción local",tag:"Paneles",sub:"Dos escalas distintas en paneles separados, mismo eje de tiempo (2018 – 2026)",src:["yfBrent","cap4hist"],wide:true}
  ],
  mi:[
    {id:"mi1",f:mi1,t:"Embudo de proyectos por etapa y mineral",tag:"Embudo",sub:"Cantidad de proyectos de la cartera oficial (SIACAM), de producción a prospección",src:["siacam"]},
    {id:"mi2",f:mi2,t:"Exportaciones mineras por mineral",tag:"Barras apiladas",sub:"Millones de US$ por año. «Resto» sólo está publicado para 2024 y 2025",src:["caem26"]},
    {id:"mi3",f:mi3,t:"Oro: precio internacional vs. exportaciones",tag:"Índice",sub:"Índice 2019 = 100. Si las exportaciones suben menos que el precio, cayó el volumen exportado",src:["avGold","caem26"]},
    {id:"mi4",f:mi4,t:"Inversión RIGI por provincia y sector",tag:"Barras apiladas",sub:"Millones de US$ por proyecto según las resoluciones del Boletín Oficial (inversión total o, si no la informa, activos computables)",src:["portalRIGI"]},
    {id:"mi5",f:mi5,t:"Empleo minero por provincia",tag:"Coroplético",sub:"Puestos de trabajo directos, promedio 2025",src:["caem26"],wide:true}
  ],
  ag:[
    {id:"ag1",f:ag1,t:"Producción por departamento",tag:"Coroplético",sub:`Campaña ${VIZ.agCamp||"2024/2025"}, miles de toneladas. Elegí el cultivo`,src:["magypEst"],wide:true},
    {id:"ag2",f:ag2,t:"Avance de la campaña 2026/27",tag:"Progreso",sub:"Relevamiento semanal de la Bolsa de Cereales de Buenos Aires, 14-oct-2026. La siembra de soja todavía no empezó",src:["bcbaOct","bcbaMz"]},
    {id:"ag3",f:ag3,t:"Ciclo ganadero: stock, faena y retención",tag:"Barras + indicadores",sub:"Faena bovina anual, millones de cabezas, 2015–2025",src:["faenaSt","stockBov","rosganH"]},
    {id:"ag4",f:ag4,t:"Por dónde sale el agro",tag:"Mapa de nodos",sub:"Participación de cada nodo portuario en las exportaciones agroindustriales, 2025. El tamaño del círculo es proporcional a la participación",read:"El resto (≈ 12%) sale por Quequén, Buenos Aires, Entre Ríos y otros puertos sin cifra publicada en la fuente.",src:["bcrPto"]},
    {id:"ag5",f:ag5,t:"Precios internacionales de los granos",tag:"Paneles",sub:`Futuros de Chicago convertidos a US$ por tonelada, cierres mensuales ${ymTxt(VIZ.granos[0][0])} – ${ymTxt(VIZ.granos.at(-1)[0])}`,src:["cbot"],wide:true}
  ],
  x:[
    {id:"x1",f:x1,t:"Qué exporta la Argentina",tag:"Treemap",sub:"Complejos exportadores 2025, millones de US$, coloreados por sector",src:["indecCx"],wide:true},
    {id:"x2",f:x2,t:"Actividad por sector",tag:"Índice",sub:"EMAE, promedio anual, índice 2017 = 100",read:`Minas y canteras (impulsada por Vaca Muerta y el oro) ${VIZ.emae.at(-1)[2]>=100?"creció":"cayó"} ${Math.abs(Math.round(VIZ.emae.at(-1)[2]-100))}% entre 2017 y ${VIZ.emae.at(-1)[0]}; el agro oscila con el clima, como en la sequía de 2023.`,src:["emae"]},
    {id:"x3",f:x3,t:"Exportaciones por provincia y rubro",tag:"Coroplético",sub:`Millones de US$, ${VIZ.provAnio||2024} (último año publicado). Elegí el rubro`,src:["expProv"],wide:true},
    {id:"x4",f:x4,t:"Camino a las metas de producción",tag:"Línea de tiempo",sub:"Desde hoy hasta la fecha objetivo publicada de cada proyecto o empresa; la barra negra es la producción actual como porcentaje de la meta. Sólo se muestran metas con fecha",src:["ypf2T","vist2T"],wide:true},
    {id:"x5",f:x5,t:"Acciones vs. su commodity",tag:"Paneles",sub:`Índice ${ymTxt(VIZ.pairs.months[0])} = 100, cierres mensuales. Correlación de las variaciones mensuales`,read:"Correlación cercana a 1: la acción sigue al commodity; cercana a 0: pesan más el riesgo país y la gestión propia.",src:["yahooM","yfFut"],wide:true}
  ]
};
function vizCards(sec){
  return `<div class="vgrid">${VIZ_DEF[sec].map(c=>`<div class="vcard${c.wide?" wide":""}"><h3>${c.t}<span class="tag">${c.tag}</span></h3><p class="sub">${c.sub}</p><div class="vbox" id="vz-${c.id}"></div>${c.read?`<p class="read">${c.read}</p>`:""}${srcRow(c.src.filter(k=>SRC[k]))}</div>`).join("")}</div>`;
}
function drawViz(){
  Object.values(VIZ_DEF).flat().forEach(c=>{ const el=document.getElementById("vz-"+c.id); if(!el) return; el.innerHTML="";
    try{ c.f(el); }catch(e){ console.error(c.id,e); el.innerHTML=`<p class="note">No se pudo dibujar este gráfico.</p>`; } });
}
let vizT; window.addEventListener("resize",()=>{ if(st.view!=="stats") return; clearTimeout(vizT); vizT=setTimeout(drawViz,200); });

const side=document.getElementById("side"), bl=document.getElementById("btnLayers");
bl.onclick=()=>{ const o=!side.classList.contains("open"); side.classList.toggle("open",o); bl.setAttribute("aria-expanded",o); };
document.addEventListener("keydown",ev=>{ if(ev.key==="Escape"){ closeDrawer(); side.classList.remove("open"); }
  if(!drawer.hidden && st.sel && st.view==="map" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)){
    if(ev.key==="ArrowRight") stepAsset(1); if(ev.key==="ArrowLeft") stepAsset(-1); } });

// ---------- resaltado sincronizado: pasar el mouse por una lista ilumina el activo en el mapa ----------
let hovId=null;
function hoverAsset(id){
  if(id===hovId) return; hovId=id;
  ptSel.classed("hov",a=>a.id===id); lnSel.classed("hov",a=>a.id===id);
  if(id) ptSel.filter(a=>a.id===id).raise();
}
document.addEventListener("mouseover",ev=>{
  const b=ev.target.closest&&ev.target.closest("[data-asset],[data-onmap]");
  hoverAsset(b ? (b.dataset.asset||b.dataset.onmap) : null);
});

// ---------- profundidad: el mapa acompaña levemente al mouse ----------
{
  const stage=document.getElementById("stage"), par=document.getElementById("par");
  let down=false;
  stage.addEventListener("pointerdown",()=>{ down=true; par.style.transform=""; });
  window.addEventListener("pointerup",()=>{ down=false; });
  stage.addEventListener("pointermove",ev=>{
    if(REDUCED || down || ev.pointerType!=="mouse" || st.view!=="map") return;
    const r=stage.getBoundingClientRect(), x=(ev.clientX-r.left)/r.width-.5, y=(ev.clientY-r.top)/r.height-.5;
    par.style.transform=`rotateY(${(x*4).toFixed(2)}deg) rotateX(${(-y*3).toFixed(2)}deg)`;
  });
  stage.addEventListener("pointerleave",()=>{ par.style.transform=""; });
  // Con el mapa inclinado queda una franja arriba que no cubre el plano. Un gesto que empiece
  // ahí aplana la cámara al instante y se reenvía al mapa, así arrastrar y la rueda siguen andando.
  const offMap = ev => !ev.target.closest || !ev.target.closest("#map");
  const flatNow = ()=>{ cancelAnimationFrame(CAM.raf); CAM.tilt=0; CAM.yaw=0; CAM.flat=true; camApply(); par.style.transform=""; };
  const svgEl = svg.node();
  par.addEventListener("mousedown",ev=>{ if(!offMap(ev)) return; flatNow(); ev.preventDefault();
    svgEl.dispatchEvent(new MouseEvent("mousedown",{clientX:ev.clientX,clientY:ev.clientY,screenX:ev.screenX,screenY:ev.screenY,button:ev.button,buttons:ev.buttons,bubbles:true,cancelable:true,view:window})); });
  par.addEventListener("wheel",ev=>{ if(!offMap(ev)) return; flatNow(); ev.preventDefault();
    svgEl.dispatchEvent(new WheelEvent("wheel",{clientX:ev.clientX,clientY:ev.clientY,deltaX:ev.deltaX,deltaY:ev.deltaY,deltaMode:ev.deltaMode,ctrlKey:ev.ctrlKey,bubbles:true,cancelable:true,view:window})); },{passive:false});
  par.addEventListener("touchstart",ev=>{ if(offMap(ev)) flatNow(); },{passive:true});
  par.addEventListener("click",ev=>{ if(offMap(ev)) closeDrawer(); });
}

document.getElementById("nTot").textContent = ALL.length;
{ const f=META.actualizado.split("-"); const M=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]; document.getElementById("upd").textContent = `${+f[2]}-${M[+f[1]-1]}-${f[0]}`; }
render();
try{ const v=localStorage.getItem("mp-view"); if(v==="table"||v==="co"||v==="stats") setView(v); }catch(e){}
// ---------- Panel de administración ----------
// Se abre con …/#admin (queda recordado en este navegador y aparece el botón «Admin»).
// Sólo muestra estado y atajos: las acciones piden el login de GitHub o de Claude.
const REPO = "martingomezpizarro/matriz-productiva";
const PASO_N = { siacam:"Minería – cartera SIACAM", mercado:"Cotizaciones (Yahoo Finance)", precios:"Precios internacionales", comercio:"Comercio exterior (INDEC)", emae:"Actividad (EMAE)", faena:"Faena (MAGyP)", provincias:"Producción por provincia", agricola:"Estimaciones agrícolas (MAGyP)", energia:"Energía (Secretaría de Energía)" };
const fichaIncompleta = a => a.st!=="exp" && (!TEC[a.id] || !TEC[a.id].nums);
function openAdmin(){
  try{ localStorage.setItem("mp-admin","1"); }catch(e){}
  document.getElementById("btnAdmin").hidden=false;
  const dlg=document.getElementById("admin");
  const rg=Object.entries(RIGI).filter(([,r])=>!r.ref);
  const ap=rg.filter(([,r])=>r.st==="aprobado"), tr=rg.filter(([,r])=>r.st!=="aprobado");
  const tot=d3.sum(ap,([,r])=>r.total||r.comp||0);
  const ult=[...ap].filter(([,r])=>r.bo).sort((a,b)=>String(b[1].bo).localeCompare(String(a[1].bo))).slice(0,6);
  const inc=ALL.filter(fichaIncompleta).sort((a,b)=>(b.rigi?1:0)-(a.rigi?1:0)||["op","con","pro"].indexOf(a.st)-["op","con","pro"].indexOf(b.st));
  const pasos=Object.entries((META&&META.pasos)||{});
  dlg.innerHTML=`<div class="adm"><button class="x" aria-label="Cerrar">×</button>
    <h2>Administración</h2><p style="margin:0;color:var(--muted);font-size:13px">Estado de los datos y atajos para actualizarlos.</p>
    <h3>Actualizar</h3><div class="acts">
      <a class="act" href="https://claude.ai/code" target="_blank" rel="noopener"><b>RIGI y fichas → Claude</b><span>Corre solo todos los días a las 7:56. Para forzarlo: Claude → tareas programadas → «Matriz Productiva: RIGI y fichas» → ejecutar ahora.</span></a>
      <a class="act" href="https://github.com/${REPO}/actions/workflows/actualizar-datos.yml" target="_blank" rel="noopener"><b>Números → GitHub Actions</b><span>SIACAM, cotizaciones, INDEC, MAGyP. Corre el día 1 de cada mes; botón «Run workflow» para correrlo ya.</span></a>
      <a class="act" href="https://github.com/${REPO}/blob/main/scripts/actualizar-energia.bat" target="_blank" rel="noopener"><b>Energía → tu PC</b><span>El portal de la Secretaría bloquea servidores de afuera: correr scripts/actualizar-energia.bat en una PC en Argentina.</span></a>
      <a class="act" href="https://github.com/${REPO}/edit/main/data/manual/rigi.js" target="_blank" rel="noopener"><b>Editar RIGI a mano</b><span>Abre data/manual/rigi.js en GitHub para corregir o sumar un proyecto.</span></a>
    </div>
    <h3>RIGI · revisado el ${fechaC(RIGI_META.actualizado)}</h3>
    <div class="kp"><div><b>${ap.length}</b><span>aprobados en el mapa</span></div><div><b>${tr.length}</b><span>en trámite</span></div><div><b>${musd(tot)}</b><span>inversión de los aprobados</span></div></div>
    <table style="margin-top:10px"><tr><th>Último publicado</th><th>Resolución</th><th>Inversión</th></tr>${ult.map(([k,r])=>`<tr><td><a href="#" data-adm="${k}">${byId[k]?byId[k].n:k}</a></td><td>ME ${r.res} · ${fechaC(r.bo)}</td><td>${musd(r.total||r.comp)}</td></tr>`).join("")}</table>
    <h3>Datos automáticos · última corrida ${fechaC(META.actualizado)}</h3>
    <table><tr><th>Paso</th><th>Fecha</th><th>Resultado</th></tr>${pasos.map(([k,v])=>`<tr><td>${PASO_N[k]||k}</td><td>${fechaC(v.fecha)}</td><td class="${v.ok?"ok":"err"}">${v.ok?"✓ ":"✗ "}${v.detalle||v.error||""}</td></tr>`).join("")}</table>
    <h3>Fichas incompletas · ${inc.length} de ${ALL.filter(a=>a.st!=="exp").length}</h3>
    <p style="margin:0 0 6px;font-size:13px;color:var(--muted)">Activos visibles sin números propios. La tarea diaria completa hasta 5 por día, empezando por los que tienen RIGI.</p>
    <details><summary>Ver la lista</summary><ul>${inc.map(a=>`<li><a href="#" data-adm="${a.id}">${a.n}</a> <small style="color:var(--muted)">${SECT[a.s].n} · ${ESTADO[a.st]}${a.rigi?" · RIGI":""}</small></li>`).join("")}</ul></details>
  </div>`;
  dlg.querySelector(".x").onclick=()=>dlg.close();
  dlg.onclick=e=>{ if(e.target===dlg) dlg.close(); };
  dlg.querySelectorAll("[data-adm]").forEach(b=>b.onclick=e=>{ e.preventDefault(); dlg.close(); setView("map"); select(b.dataset.adm); });
  if(!dlg.open) dlg.showModal();
}
document.getElementById("btnAdmin").onclick=openAdmin;
try{ if(localStorage.getItem("mp-admin")==="1") document.getElementById("btnAdmin").hidden=false; }catch(e){}
window.addEventListener("hashchange",()=>{ if(location.hash==="#admin") openAdmin(); });
if(location.hash==="#admin") openAdmin();
if(location.hash==="#empresas") setView("co");
if(location.hash==="#estadisticas") setView("stats");
