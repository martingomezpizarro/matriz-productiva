// ============================================================
// CIRCUITO GLOBAL: qué pesa la Argentina dentro de cada empresa con proyectos RIGI,
// dónde está el resto de su negocio y hacia dónde va lo que se produce acá.
// Datos: data/manual/circuito.js (CIR_*) · Mapa: data/geo/mundo.js (MUNDO)
// ============================================================
Object.assign(SRC, CIR_SRC);

const GL = { pr:"estudio", sec:"all", sel:"riotinto", capas:{cap:true, prod:true, act:true}, ready:false };
try{ const g=JSON.parse(localStorage.getItem("mp-gl")||"{}"); if(g.pr&&CIR_META.precios[g.pr]) GL.pr=g.pr; if(g.sel&&CIR_EMP[g.sel]) GL.sel=g.sel; }catch(e){}
const glSave = ()=>{ try{ localStorage.setItem("mp-gl", JSON.stringify({pr:GL.pr, sel:GL.sel})); }catch(e){} };

const PCOL = { li:"var(--c1)", cu:"var(--c2)", gas:"var(--c3)", au:"var(--c4)", ag:"var(--c4)", ure:"var(--c5)", oil:"var(--c6)" };
const PNOM = k => (CIR_PROD[k]||CIR_PROD.au).n;
const MET = {
  ing:  { u:"US$ M", l:"ingresos" },
  cu:   { u:"kt Cu", l:"producción de cobre" },
  oz:   { u:"koz Au", l:"producción de oro" },
  kboe: { u:"mil boe/d", l:"producción" },
  bk:   { u:"US$ mil M", l:"backlog de EBITDA" }
};
const nfx = (n,d=0)=> n==null||isNaN(n) ? "–" : n.toLocaleString("es-AR",{minimumFractionDigits:d,maximumFractionDigits:d});
const pct = (x,d)=> x==null ? "–" : nfx(x*100, d!=null?d:(x<0.1&&x>0?1:0))+"%";
const EST = '<span class="est" title="Estimación propia a partir de datos publicados">≈</span>';
const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

// ---------- cálculo ----------
function prodKind(p){
  const q=p.prod||{};
  if(q.lce) return "li"; if(q.cu) return "cu"; if(q.au||q.ag) return "au"; if(q.bbld) return "oil"; if(q.gnl) return "gas"; if(q.urea) return "ure";
  const a=byId[p.id]; if(!a) return "au";
  if(a.s==="og") return /gnl|lng|gas/i.test(a.n+a.prod)?"gas":"oil";
  if(a.s==="ag") return "ure";
  return a.e==="li"?"li":a.e==="cu"?"cu":"au";
}
// Ingreso anual del proyecto a 100% (US$ M) con los precios del escenario.
function ingreso100(p, pr){
  if(p.fijo!=null) return p.fijo/((p.part||100)/100);
  const q=p.prod; if(!q) return null;
  const P=CIR_META.precios[pr]; let v=0;
  if(q.cu) v+=q.cu*P.cu; if(q.au) v+=q.au*P.au; if(q.ag) v+=q.ag*P.ag; if(q.lce) v+=q.lce*P.lce; if(q.mo) v+=q.mo*P.mo;
  if(q.bbld) v+=q.bbld*365*P.brent; if(q.urea) v+=q.urea*P.urea;
  v/=1e6;
  if(q.gnl) v+=q.gnl*52*P.gnl;          // Mtpa × 52 MMBtu/t × US$/MMBtu
  return v;
}
function ingresoAtr(p, pr){ const v=ingreso100(p,pr); return v==null||p.part==null ? null : v*p.part/100; }
function metVal(c, p, pr){
  if(p.m!=null) return p.m;
  if(p.part==null) return null;
  if(c.met==="ing") return ingresoAtr(p,pr);
  if(c.met==="cu") return p.prod&&p.prod.cu ? p.prod.cu*p.part/100/1000 : 0;
  if(c.met==="oz") return p.prod&&p.prod.au ? p.prod.au*p.part/100/1000 : 0;
  return null;
}
function calc(k, pr=GL.pr){
  const c=CIR_EMP[k]; if(!c.met) return null;
  const items=c.ar.map(p=>({p, v:metVal(c,p,pr), ing:ingresoAtr(p,pr), ing100:ingreso100(p,pr), kind:prodKind(p)}));
  const sum=items.reduce((s,x)=>s+(x.v||0),0);
  const base=c.base.v, hoy=c.hoy?c.hoy.v:0;
  const total=base-hoy+sum;
  items.forEach(x=>x.sh = x.v!=null&&total>0 ? x.v/total : null);
  const rigiSum=items.filter(x=>x.p.rigi&&x.p.rigi!=="no").reduce((s,x)=>s+(x.v||0),0);
  return { c, items, base, hoy, sum, total,
    hoySh: c.local ? 1 : (base>0 ? hoy/base : 0),
    proySh: c.local ? 1 : (total>0 ? sum/total : 0),
    rigiSh: total>0 ? rigiSum/total : 0,
    crec: base>0 ? total/base-1 : null };
}

// ---------- mapa del mundo ----------
const GW=1000, GH=520;
let gProj, gPath, gSvg, gRoot, gZoom, gK=1;
function llOf(id, fb){ const a=byId[id]; if(a&&a.ll) return a.ll; if(a&&a.path) return a.path[Math.floor(a.path.length/2)]; return fb; }
function arcD(a,b){ // gran círculo [lat,lon] → path proyectado
  return gPath({type:"LineString", coordinates:[[a[1],a[0]],[b[1],b[0]]]});
}
function buildMap(el){
  const land=topojson.feature(MUNDO, MUNDO.objects.countries);
  gProj=d3.geoNaturalEarth1().fitExtent([[6,6],[GW-6,GH-6]], {type:"Sphere"});
  gPath=d3.geoPath(gProj);
  el.innerHTML=`<svg class="glmap" viewBox="0 0 ${GW} ${GH}" role="img" aria-label="Mapa mundial: casas matrices de las empresas, sus otros activos y los destinos de lo que se produce en la Argentina"></svg>
    <div class="glzoom"><button data-gz="in" aria-label="Acercar">+</button><button data-gz="out" aria-label="Alejar">−</button><button data-gz="ar" aria-label="Ver Sudamérica" style="font-size:11px">AR</button><button data-gz="all" aria-label="Ver todo el mundo" style="font-size:13px">⤢</button></div>`;
  gSvg=d3.select(el).select("svg");
  gRoot=gSvg.append("g");
  gRoot.append("path").attr("class","grat").attr("d",gPath(d3.geoGraticule10()));
  gRoot.append("g").selectAll("path").data(land.features).join("path")
    .attr("class",d=>"ctry"+(d.id==="032"?" ar":"")).attr("d",gPath).append("title").text(d=>d.properties.name);
  ["gProdArc","gCapArc","gAct","gDst","gArP","gHq","gLab"].forEach(n=>gRoot.append("g").attr("class",n));
  gZoom=d3.zoom().scaleExtent([1,12]).translateExtent([[0,0],[GW,GH]]).on("zoom",ev=>{
    gK=ev.transform.k; gRoot.attr("transform",ev.transform);
    gRoot.selectAll(".sz").attr("transform",function(){ return this.dataset.t+` scale(${1/gK})`; });
    gRoot.selectAll("text").style("font-size",(11/gK)+"px").style("stroke-width",(3/gK)+"px");
  });
  gSvg.call(gZoom);
  el.querySelectorAll("[data-gz]").forEach(b=>b.onclick=()=>{
    const z=b.dataset.gz;
    if(z==="in") gSvg.transition().duration(350).call(gZoom.scaleBy,1.6);
    else if(z==="out") gSvg.transition().duration(350).call(gZoom.scaleBy,1/1.6);
    else if(z==="all") gSvg.transition().duration(500).call(gZoom.transform,d3.zoomIdentity);
    else glZoomTo([[-75,-56],[-52,-20]]);
  });
}
function glZoomTo([[lo0,la0],[lo1,la1]]){
  const [x0,y0]=gProj([lo0,la1]), [x1,y1]=gProj([lo1,la0]);
  const k=Math.min(12, 0.9/Math.max((x1-x0)/GW,(y1-y0)/GH));
  const t=d3.zoomIdentity.translate(GW/2,GH/2).scale(k).translate(-(x0+x1)/2,-(y0+y1)/2);
  gSvg.transition().duration(650).call(gZoom.transform,t);
}
function marker(sel, ll, cls){ // grupo que no escala con el zoom
  const [x,y]=gProj([ll[1],ll[0]]);
  return sel.append("g").attr("class","sz "+(cls||"")).attr("data-t",`translate(${x},${y})`).attr("transform",`translate(${x},${y}) scale(${1/gK})`);
}
function drawMap(){
  const keys=glKeys();
  const sel=GL.sel, cs=CIR_EMP[sel];
  const sc=cvar(cs.sec);
  // capital: casa matriz → proyectos argentinos
  const caps=[];
  keys.forEach(k=>{ const c=CIR_EMP[k]; const seen=new Set();
    c.ar.forEach(p=>{ const ll=llOf(p.id); if(!ll||seen.has(p.id)) return; seen.add(p.id); caps.push({k,c,p,ll}); }); });
  const gC=gRoot.select(".gCapArc").html("");
  if(GL.capas.cap) caps.sort((a,b)=>(a.k===sel)-(b.k===sel)).forEach(o=>{
    gC.append("path").attr("class","arc cap"+(o.k===sel?" on":"")).attr("d",arcD(o.c.hq.ll,o.ll)).style("--c",cvar(o.c.sec));
  });
  // producto: Argentina → destinos
  const gP=gRoot.select(".gProdArc").html(""), gD=gRoot.select(".gDst").html("");
  const kindsSel=new Set(calcKinds(sel));
  if(GL.capas.prod) CIR_CADENA.forEach(cd=>{
    if(GL.sec!=="all" && (GL.sec==="mi") !== ["li","cu","au"].includes(cd.k)) return;
    const hi=kindsSel.has(cd.k);
    cd.dest.forEach(([n,ll])=>{
      gP.append("path").attr("class","arc prod").attr("d",arcD(cd.orig,ll)).style("stroke",PCOL[cd.k]).style("stroke-opacity",hi?.95:.35);
      const m=marker(gD,ll); m.append("circle").attr("r",3).attr("fill",PCOL[cd.k]).attr("class","gas");
      if(hi) m.append("text").attr("class","dst").attr("x",5).attr("y",3).text(n);
    });
  });
  // otros activos de la empresa elegida
  const gA=gRoot.select(".gAct").html("");
  if(GL.capas.act) (cs.mundo||[]).forEach(([n,ll,pr,nt])=>{
    const m=marker(gA,ll,"gact");
    m.append("path").attr("d",d3.symbol(d3.symbolDiamond,70)()).attr("class","gas").attr("fill",sc);
    m.append("text").attr("x",7).attr("y",4).text(n);
    m.on("mousemove",ev=>tipOn(ev,`<b>${esc(n)}</b><div class="r"><span>${esc(pr)}</span></div><div style="color:var(--muted);font-size:12px">${esc(nt||"")} · ${esc(cs.n)}</div>`)).on("mouseleave",tipOff);
  });
  // proyectos argentinos
  const gR=gRoot.select(".gArP").html("");
  const seenP=new Set();
  caps.forEach(o=>{ if(seenP.has(o.p.id)) return; seenP.add(o.p.id);
    const on=CIR_EMP[sel].ar.some(p=>p.id===o.p.id);
    const m=marker(gR,o.ll); m.append("circle").attr("r",on?4.2:3).attr("class","arp"+(on?" on":"")).style("--c",sc);
    m.on("mousemove",ev=>{ const a=byId[o.p.id]; const who=keys.filter(k=>CIR_EMP[k].ar.some(p=>p.id===o.p.id)).map(k=>CIR_EMP[k].n);
      tipOn(ev,`<b>${esc(a?a.n:o.p.n)}</b><div style="color:var(--muted);font-size:12px">${a?esc(a.prov):""}</div><div style="font-size:12px;margin-top:4px">${who.map(esc).join(" · ")}</div>`); })
     .on("mouseleave",tipOff).on("click",()=>{ const k=keys.find(k=>CIR_EMP[k].ar.some(p=>p.id===o.p.id)&&k!==GL.sel)||GL.sel; glSelect(CIR_EMP[GL.sel].ar.some(p=>p.id===o.p.id)?GL.sel:k); });
  });
  // casas matrices
  const gH=gRoot.select(".gHq").html(""), gL=gRoot.select(".gLab").html("");
  const byHq={}; keys.forEach(k=>{ const c=CIR_EMP[k]; const key=c.hq.ll.map(v=>v.toFixed(0)).join(","); (byHq[key]=byHq[key]||[]).push(k); });
  keys.forEach(k=>{ const c=CIR_EMP[k]; const on=k===sel;
    const m=marker(on?gL:gH,c.hq.ll,"hq"+(on?" on":"")); m.style("--c",cvar(c.sec));
    m.append("rect").attr("x",-4).attr("y",-4).attr("width",8).attr("height",8).attr("rx",1.5);
    if(on) m.append("text").attr("x",8).attr("y",4).style("font-weight",600).text(c.n);
    m.on("mousemove",ev=>{ const key=c.hq.ll.map(v=>v.toFixed(0)).join(","); tipOn(ev,`<b>${esc(c.hq.c)}</b><div style="font-size:12px">${byHq[key].map(x=>esc(CIR_EMP[x].n)).join(" · ")}</div><div style="color:var(--muted);font-size:11px;margin-top:4px">Tocá para ver la empresa</div>`); })
     .on("mouseleave",tipOff).on("click",()=>glSelect(k));
  });
  gRoot.selectAll("text").style("font-size",(11/gK)+"px").style("stroke-width",(3/gK)+"px");
}
function calcKinds(k){ return [...new Set(CIR_EMP[k].ar.map(prodKind))]; }

// ---------- secciones ----------
function glKeys(){ return Object.keys(CIR_EMP).filter(k=>GL.sec==="all"||CIR_EMP[k].sec===GL.sec); }
function rankRows(){
  const rows=glKeys().map(k=>({k,r:calc(k)})).filter(x=>x.r);
  const glob=rows.filter(x=>!x.r.c.local).sort((a,b)=>b.r.proySh-a.r.proySh);
  const loc=rows.filter(x=>x.r.c.local).sort((a,b)=>b.r.rigiSh-a.r.rigiSh);
  const row=(k,r,h,p,lab)=>`<button class="glrank" data-gk="${k}" aria-current="${k===GL.sel}" style="--c:${cvar(r.c.sec)}">
      <span class="nm"><i></i>${esc(r.c.n)}</span>
      <span class="trk"><span class="b h" style="width:${Math.max(.4,h*100)}%"></span><span class="b p" style="width:${Math.max(.4,p*100)}%"></span></span>
      <span class="v">${lab}</span></button>`;
  return `<div class="glsec"><h2>Peso de la Argentina en cada empresa</h2>
    <p class="note">Empresas globales: qué parte de su negocio es argentino hoy y cuánto sería con sus proyectos a régimen (${esc(CIR_META.precios[GL.pr].n.toLowerCase())}). Tocá una para ver el detalle.</p>
    <div class="glkey"><span><i style="background:color-mix(in srgb,var(--ink) 30%,var(--panel))"></i>Hoy</span><span><i style="background:var(--ink)"></i>Con los proyectos a régimen</span></div>
    <div class="gllist">${glob.map(({k,r})=>row(k,r,r.hoySh,r.proySh,`${pct(r.hoySh)} → <b>${pct(r.proySh)}</b>`)).join("")}</div>
    ${loc.length?`<p class="note" style="margin-top:6px">Empresas argentinas o de un solo país: la Argentina ya es todo su negocio. La barra muestra cuánto pesarían sus proyectos RIGI en los ingresos (o la producción) proyectados.</p>
    <div class="gllist">${loc.map(({k,r})=>row(k,r,0,r.rigiSh,`RIGI <b>${pct(r.rigiSh)}</b>`)).join("")}</div>`:""}
  </div>`;
}
function stackBar(r){
  const segs=r.items.filter(x=>x.sh);
  const rest=Math.max(0,1-segs.reduce((s,x)=>s+x.sh,0));
  return `<div class="glstack" role="img" aria-label="Composición del total proyectado">${segs.map(x=>`<i style="width:${x.sh*100}%;background:${PCOL[x.kind]}" data-tip="${esc(x.p.n)}: ${pct(x.sh,1)}"></i>`).join("")}${rest>0.001?`<i class="rest" style="width:${rest*100}%" data-tip="Resto de la empresa: ${pct(rest,1)}"></i>`:""}</div>
    <div class="glsl">${segs.map(x=>`<span><i style="background:${PCOL[x.kind]}"></i>${esc(x.p.n)} · ${pct(x.sh,1)}</span>`).join("")}${rest>0.001?`<span><i style="background:color-mix(in srgb,var(--ink) 12%,var(--panel))"></i>Resto · ${pct(rest,1)}</span>`:""}</div>`;
}
function volTxt(p){
  const q=p.prod; if(!q) return p.m!=null?"":"s/d";
  const out=[];
  if(q.cu) out.push(nfx(q.cu/1000)+" kt Cu"); if(q.lce) out.push(nfx(q.lce/1000,1).replace(",0","")+" kt LCE"); if(q.au) out.push(nfx(q.au/1000)+" koz Au");
  if(q.ag) out.push(nfx(q.ag/1e6,1)+" Moz Ag"); if(q.mo) out.push(nfx(q.mo/1000,1)+" kt Mo"); if(q.bbld) out.push(nfx(q.bbld/1000)+" mil bbl/d");
  if(q.gnl) out.push(nfx(q.gnl,2)+" Mtpa GNL"); if(q.urea) out.push(nfx(q.urea/1e6,2)+" Mt urea");
  return out.join(" · ");
}
const fmtMet = (v,met)=> v==null?"–": met==="bk"? "US$ "+nfx(v,1)+" mil M" : met==="ing" ? "US$ "+nfx(v)+" M" : nfx(v)+" "+MET[met].u;
function card(k){
  const c=CIR_EMP[k], r=calc(k), sc=cvar(c.sec);
  const E=x=>x?EST:"";
  const srcs=[...new Set([c.base&&c.base.s, c.hoy&&c.hoy.s, c.meta&&c.meta.s, ...c.ar.map(p=>p.s), ...(c.fuentes||[])].filter(x=>x&&SRC[x]))];
  const emp=EMP[c.emp];
  let kp="";
  if(r){
    const metN=c.metN||MET[c.met].l;
    kp = c.local
      ? `<div class="glkpis"><div>${c.localT?`<b>AR</b><span>${esc(c.localT)}</span>`:`<b>100%</b><span>de su negocio está en la Argentina</span>`}</div>
          <div><b style="color:${sc}">${pct(r.rigiSh)}</b><span>pesarían sus proyectos RIGI en el total proyectado</span></div>
          <div><b>${r.crec!=null?(r.crec>=0?"+":"")+pct(r.crec):"–"}</b><span>crecimiento sobre la base (${esc(metN)})</span></div></div>`
      : `<div class="glkpis"><div><b>${pct(r.hoySh,1)}</b><span>Argentina hoy (${esc(metN)}, ${esc(c.base.per)})${E(c.hoy&&c.hoy.est)}</span></div>
          <div><b style="color:${sc}">${pct(r.proySh,1)}</b><span>Argentina con los proyectos a régimen</span></div>
          <div><b>${fmtMet(r.sum,c.met)}</b><span>aporte argentino a régimen${c.met==="ing"?" por año":""}</span></div></div>`;
  }
  const meta = c.meta ? (()=>{ const s=r.sum/c.meta.v; return `<p class="note" style="margin:0">${esc(c.meta.t)}: los proyectos argentinos serían el <b>${pct(s)}</b> de esa meta.</p>`; })() : "";
  const tab = `<div class="glproj"><p class="eyebrow">Proyectos en la Argentina · ingreso atribuible por año y peso en el total proyectado</p>
    ${(r?r.items:c.ar.map(p=>({p,ing:ingresoAtr(p,GL.pr),ing100:ingreso100(p,GL.pr),kind:prodKind(p)}))).map(x=>{ const p=x.p, a=byId[p.id];
      const ingTxt = x.ing!=null ? `US$ ${nfx(x.ing)} M` : p.m!=null&&c.met==="bk" ? `US$ ${nfx(p.m*1000/20)} M EBITDA` : x.v!=null ? fmtMet(x.v,c.met) : x.ing100!=null ? `<span title="Proyecto completo; participación no informada">100%: US$ ${nfx(x.ing100)} M</span>` : "s/d";
      const det=[p.part==null?"participación s/d":"participación "+nfx(p.part,p.part%1?1:0)+"%", volTxt(p)&&volTxt(p)!=="s/d"?"a régimen (100%): "+volTxt(p):"", esc(p.t||""), p.ini?"arranque "+p.ini:""].filter(Boolean).join(" · ");
      return `<div class="gp"><div class="gph"><i style="background:${PCOL[x.kind]}"></i>
          <span class="gpn">${a?`<button data-onmap2="${p.id}" title="Ver en el mapa de la Argentina">${esc(p.n)}</button>`:esc(p.n)}${E(p.est)} <span class="rigipill ${p.rigi||""}">${p.rigi==="no"?"fuera del RIGI":RIGI_EST[p.rigi]||"–"}</span></span>
          <span class="gpv">${ingTxt}${r&&x.sh!=null?` · <b>${pct(x.sh,1)}</b>`:""}</span></div>
        <div class="gpd">${det}</div></div>`; }).join("")}
  </div>`;
  return `<div class="glcard" style="--c:${sc}">
    <div><p class="eyebrow">${c.sec==="mi"?"Minería":"Energía"} · casa matriz: ${esc(c.hq.c)}</p><h3>${esc(c.n)}</h3>
      <p class="sub" style="margin:6px 0 0">${esc(c.perfil||"")}</p>
      ${emp?`<p style="margin:8px 0 0;font-size:12px"><button class="chip" data-cop3="${c.emp}">Ficha de la empresa →</button></p>`:""}</div>
    ${kp}
    ${r&&!c.local?stackBar(r):r&&c.local&&r.items.some(x=>x.sh)?stackBar(r):""}
    ${r?`<p class="note" style="margin:0">Base: ${fmtMet(r.base,c.met)} (${esc(c.base.per)})${E(c.base.est)}. ${c.hoy&&c.hoy.t?`Hoy en la Argentina: ${fmtMet(r.hoy,c.met)} — ${esc(c.hoy.t)}${E(c.hoy.est)}.`:""}</p>`:`<p class="note" style="margin:0">Sin cifras públicas suficientes para calcular su peso: se muestran los proyectos y el contexto.</p>`}
    ${meta}
    ${tab}
    ${c.claves&&c.claves.length?`<div><p class="eyebrow" style="margin-bottom:6px">Lectura</p><ul class="glclaves">${c.claves.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>`:""}
    ${c.mundo&&c.mundo.length?`<div><p class="eyebrow" style="margin-bottom:6px">El resto de su negocio en el mundo</p><div class="glmundo">${c.mundo.map(([n,,p,nt])=>`<span title="${esc(nt||"")}"><b>${esc(n)}</b> · ${esc(p)}</span>`).join("")}</div></div>`:""}
    <div class="glsrc"><p class="eyebrow">Fuentes</p>${srcs.map(s=>`<a href="${SRC[s].u}" target="_blank" rel="noopener">${esc(SRC[s].t)} ↗</a>`).join("")}</div>
  </div>`;
}
function paisSec(){
  return `<div class="glsec"><h2>La Argentina en el mundo</h2>
    <p class="note">Participación del país en la producción mundial de cada producto, hoy y con la cartera de proyectos (contra el tamaño del mercado actual).</p>
    <div class="glpais">${CIR_PAIS.map(x=>{ const mx=10;  // escala común 0–10% para comparar tarjetas
      return `<div class="tile" style="--c:${PCOL[x.k]}"><span class="l">${esc(x.n)}</span>
        <span class="v">${nfx(x.hoy,1)}<small>% hoy</small>${x.proy!=null?`<em>→</em>${nfx(x.proy,1)}<small>% con la cartera</small>`:""}</span>
        <div class="pb" title="Escala común: 0 a 10% del mundo"><div>Hoy<s class="h" style="width:${x.hoy/mx*100}%"></s></div>${x.proy!=null?`<div>Cartera<s style="width:${x.proy/mx*100}%"></s></div>`:""}</div>
        <span class="p">${esc(x.hoyT)}</span><span class="p" style="color:var(--muted)">${esc(x.proyT)}</span>
        <a href="${SRC[x.s[0]].u}" target="_blank" rel="noopener" title="${x.s.filter(s=>SRC[s]).map(s=>SRC[s].t).join(" · ")}">Fuentes: ${x.s.filter(s=>SRC[s]).map(s=>SRC[s].t.split(" – ")[0]).filter((v,i,a)=>a.indexOf(v)===i).join(", ")} ↗</a></div>`; }).join("")}</div></div>`;
}
function cadenaSec(){
  return `<div class="glsec"><h2>El circuito productivo, eslabón por eslabón</h2>
    <p class="note">Dónde se agrega valor en cada cadena y quién lo captura. En casi todas, la Argentina exporta el primer o segundo eslabón; la refinación y la manufactura final quedan afuera.</p>
    <div class="glcad">${CIR_CADENA.filter(cd=>GL.sec==="all"||(GL.sec==="mi")===["li","cu","au"].includes(cd.k)).map(cd=>`<div class="row" style="--c:${PCOL[cd.k]}"><span class="lab"><i></i>${esc(PNOM(cd.k))}</span>
      <ol>${cd.pasos.map(([t,d])=>`<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ol></div>`).join("")}</div></div>`;
}
function methSec(){
  const P=CIR_META.precios;
  return `<div class="glsec"><h2>Cómo se calcula</h2><div class="glmeth">
    <p><b>Peso proyectado</b> = aporte argentino a régimen ÷ (base de la empresa − lo que la Argentina ya aporta + aporte argentino a régimen). El aporte de cada proyecto es su producción anual a régimen × precio de referencia × participación de la empresa. El resto de la empresa queda fijo en su último año: la cifra mide escala, no es un pronóstico de resultados.</p>
    <p><b>Métricas.</b> Se usan ingresos cuando la empresa los publica en una base comparable. Para Glencore (cuyos ingresos incluyen el trading de terceros) y BHP se usa la producción de cobre; para Golar, el backlog de EBITDA de sus buques de licuefacción; para Pluspetrol, la producción que opera en la Argentina; para Shandong Gold, las onzas de oro.</p>
    <p><b>Precios.</b> ${esc(P.estudio.n)}: ${esc(P.estudio.t)}. ${esc(P.alto.n)}: ${esc(P.alto.t)}. ${esc(CIR_META.fx)}</p>
    <p><b>Señales.</b> ${EST} marca una estimación propia a partir de datos publicados. Los proyectos sin participación informada se muestran a 100% pero no entran en la suma. «Fuera del RIGI» indica activos argentinos de la empresa que no pidieron el régimen, incluidos para ver el negocio completo.</p>
    <p class="note">${esc(CIR_META.nota)} Actualizado al ${fechaC(CIR_META.actualizado)}.</p></div></div>`;
}

// ---------- render ----------
function glSelect(k){ GL.sel=k; glSave(); glRefresh(); const el=document.getElementById("glCard"); if(el&&window.innerWidth<1100) el.scrollIntoView({behavior:REDUCED?"auto":"smooth",block:"start"}); }
function glRefresh(){
  document.getElementById("glRank").innerHTML=rankRows();
  document.getElementById("glCard").innerHTML=card(GL.sel);
  document.getElementById("glCad").innerHTML=cadenaSec();
  drawMap();
  wireGl();
}
function wireGl(){
  const w=document.getElementById("glWrap");
  w.querySelectorAll("[data-gk]").forEach(b=>b.onclick=()=>glSelect(b.dataset.gk));
  w.querySelectorAll("[data-onmap2]").forEach(b=>b.onclick=()=>{ setView("map"); select(b.dataset.onmap2); });
  w.querySelectorAll("[data-cop3]").forEach(b=>b.onclick=()=>openProfile(b.dataset.cop3));
  w.querySelectorAll("[data-tip]").forEach(e=>{ e.onmousemove=ev=>tipOn(ev,`<b>${esc(e.dataset.tip)}</b>`); e.onmouseleave=tipOff; });
}
function renderCircuito(){
  const w=document.getElementById("glWrap");
  if(!GL.ready){
    const P=CIR_META.precios;
    w.innerHTML=`<div class="glhead"><div><p class="eyebrow">Circuito global de las empresas del RIGI</p><h2>Qué pesa la Argentina en cada empresa</h2>
        <p class="note">Dónde están las casas matrices, qué más produce cada empresa en el mundo, cuánto de su negocio sale de la Argentina hoy y cuánto saldría con sus proyectos a régimen, y hacia dónde va lo que se produce acá.</p></div>
      <div class="glctl">
        <div class="seg" role="group" aria-label="Sector">${[["all","Todas"],["mi","Minería"],["og","Energía"]].map(([k,n])=>`<button data-gs="${k}" aria-pressed="${GL.sec===k}">${n}</button>`).join("")}</div>
        <div class="seg" role="group" aria-label="Precios de referencia">${Object.entries(P).map(([k,p])=>`<button data-gp="${k}" aria-pressed="${GL.pr===k}" title="${esc(p.t)}">${esc(p.n)}</button>`).join("")}</div>
      </div></div>
      <div class="glgrid">
        <div class="glsec" style="gap:10px">
          <div class="glmapbox"><div id="glMap"></div>
            <div class="gllegend">
              <span><i class="sq"></i>Casa matriz</span>
              <span><i style="background:var(--ink);opacity:.4"></i>Capital: casa matriz → proyecto</span>
              <span><i class="dt" style="background:var(--ink)"></i>Proyecto en la Argentina</span>
              <span><svg width="10" height="10" viewBox="-5 -5 10 10"><path d="${d3.symbol(d3.symbolDiamond,40)()}" fill="var(--muted)"/></svg>Otros activos de la empresa elegida</span>
              ${Object.keys(CIR_PROD).map(k=>`<span><i style="background:${PCOL[k]}"></i>${esc(CIR_PROD[k].n)} → destino</span>`).join("")}
            </div>
            <div class="gllegend" style="border-top:0;padding-top:0">
              ${[["cap","Flujos de capital"],["prod","Destinos de exportación"],["act","Otros activos"]].map(([k,n])=>`<label style="display:inline-flex;gap:5px;align-items:center;cursor:pointer"><input type="checkbox" data-gc="${k}" ${GL.capas[k]?"checked":""}>${n}</label>`).join("")}
            </div>
          </div>
          <div id="glRank"></div>
        </div>
        <div id="glCard"></div>
      </div>
      ${paisSec()}
      <div id="glCad"></div>
      ${methSec()}`;
    buildMap(document.getElementById("glMap"));
    w.querySelectorAll("[data-gs]").forEach(b=>b.onclick=()=>{ GL.sec=b.dataset.gs; w.querySelectorAll("[data-gs]").forEach(x=>x.setAttribute("aria-pressed",x===b));
      if(GL.sec!=="all" && CIR_EMP[GL.sel].sec!==GL.sec) GL.sel=glKeys().find(k=>CIR_EMP[k].met)||glKeys()[0]; glRefresh(); });
    w.querySelectorAll("[data-gp]").forEach(b=>b.onclick=()=>{ GL.pr=b.dataset.gp; glSave(); w.querySelectorAll("[data-gp]").forEach(x=>x.setAttribute("aria-pressed",x===b)); glRefresh(); });
    w.querySelectorAll("[data-gc]").forEach(i=>i.onchange=()=>{ GL.capas[i.dataset.gc]=i.checked; drawMap(); });
    GL.ready=true;
  }
  glRefresh();
}
window.renderCircuito=renderCircuito;
if(st.view==="gl") renderCircuito();
