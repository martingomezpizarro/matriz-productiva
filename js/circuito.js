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
  const gC=gRoot.select(".gCapArc").html(""); let capN=0;
  if(GL.capas.cap) caps.sort((a,b)=>(a.k===sel)-(b.k===sel)).forEach(o=>{
    const pth=gC.append("path").attr("class","arc cap"+(o.k===sel?" on":"")).attr("data-k",o.k).attr("d",arcD(o.c.hq.ll,o.ll)).style("--c",cvar(o.c.sec));
    if(o.k===sel && GL.anim==="sel" && !REDUCED){ const ip=d3.geoInterpolate([o.c.hq.ll[1],o.c.hq.ll[0]],[o.ll[1],o.ll[0]]);
      pth.attr("d",gPath({type:"LineString",coordinates:[ip(0),ip(.001)]})).transition().delay(150+capN++*90).duration(900).ease(d3.easeCubicOut)
        .attrTween("d",()=>t=>gPath({type:"LineString",coordinates:[ip(0),ip(Math.max(.001,t))]})); }
  });
  // producto: Argentina → destinos
  const gP=gRoot.select(".gProdArc").html(""), gD=gRoot.select(".gDst").html("");
  const kindsSel=new Set(calcKinds(sel));
  if(GL.capas.prod) CIR_CADENA.forEach(cd=>{
    if(GL.sec!=="all" && (GL.sec==="mi") !== ["li","cu","au"].includes(cd.k)) return;
    const hi=kindsSel.has(cd.k);
    cd.dest.forEach(([n,ll])=>{
      gP.append("path").attr("class","arc prod"+(hi?" flow":"")).attr("d",arcD(cd.orig,ll)).style("stroke",PCOL[cd.k]).style("stroke-opacity",hi?.95:.35);
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
    const m=marker(gR,o.ll); if(on) m.append("circle").attr("r",4.2).attr("class","glpulse").style("--c",sc);
    m.append("circle").attr("r",on?4.2:3).attr("class","arp"+(on?" on":"")).style("--c",sc);
    m.on("mousemove",ev=>{ const a=byId[o.p.id]; const who=keys.filter(k=>CIR_EMP[k].ar.some(p=>p.id===o.p.id)).map(k=>CIR_EMP[k].n);
      tipOn(ev,`<b>${esc(a?a.n:o.p.n)}</b><div style="color:var(--muted);font-size:12px">${a?esc(a.prov):""}</div><div style="font-size:12px;margin-top:4px">${who.map(esc).join(" · ")}</div>`); })
     .on("mouseleave",tipOff).on("click",()=>{ const k=keys.find(k=>CIR_EMP[k].ar.some(p=>p.id===o.p.id)&&k!==GL.sel)||GL.sel; glSelect(CIR_EMP[GL.sel].ar.some(p=>p.id===o.p.id)?GL.sel:k); });
  });
  // casas matrices
  const gH=gRoot.select(".gHq").html(""), gL=gRoot.select(".gLab").html("");
  const byHq={}; keys.forEach(k=>{ const c=CIR_EMP[k]; const key=c.hq.ll.map(v=>v.toFixed(0)).join(","); (byHq[key]=byHq[key]||[]).push(k); });
  keys.forEach(k=>{ const c=CIR_EMP[k]; const on=k===sel;
    const m=marker(on?gL:gH,c.hq.ll,"hq"+(on?" on":"")); m.style("--c",cvar(c.sec)).attr("data-k",k);
    if(on) m.append("circle").attr("r",5).attr("class","glpulse");
    m.append("rect").attr("x",-4).attr("y",-4).attr("width",8).attr("height",8).attr("rx",1.5);
    if(on) m.append("text").attr("x",8).attr("y",4).style("font-weight",600).text(c.n);
    m.on("mousemove",ev=>{ const key=c.hq.ll.map(v=>v.toFixed(0)).join(","); tipOn(ev,`<b>${esc(c.hq.c)}</b><div style="font-size:12px">${byHq[key].map(x=>esc(CIR_EMP[x].n)).join(" · ")}</div><div style="color:var(--muted);font-size:11px;margin-top:4px">Tocá para ver la empresa</div>`); })
     .on("mouseleave",tipOff).on("click",()=>glSelect(k));
  });
  gRoot.selectAll("text").style("font-size",(11/gK)+"px").style("stroke-width",(3/gK)+"px");
  if(GL.anim==="sel") glFly(cs);
}
// Vuelo de cámara: encuadra casa matriz, proyectos y otros activos de la empresa elegida.
function glFly(c){
  const pts=[c.hq.ll, ...c.ar.map(p=>llOf(p.id)).filter(Boolean), ...(GL.capas.act?(c.mundo||[]).map(x=>x[1]):[])].map(ll=>gProj([ll[1],ll[0]]));
  if(!pts.length) return;
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  let [x0,x1,y0,y1]=[Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)];
  const pad=40; x0-=pad; x1+=pad; y0-=pad; y1+=pad;
  const k=Math.max(1,Math.min(5, .92/Math.max((x1-x0)/GW,(y1-y0)/GH)));
  const t=d3.zoomIdentity.translate(GW/2,GH/2).scale(k).translate(-(x0+x1)/2,-(y0+y1)/2);
  gSvg.transition().duration(REDUCED?0:1100).ease(d3.easeCubicInOut).call(gZoom.transform,t);
}
function calcKinds(k){ return [...new Set(CIR_EMP[k].ar.map(prodKind))]; }

// ---------- secciones ----------
function glKeys(){ return Object.keys(CIR_EMP).filter(k=>GL.sec==="all"||CIR_EMP[k].sec===GL.sec); }
function rankRows(){
  const rows=glKeys().map(k=>({k,r:calc(k)})).filter(x=>x.r);
  const glob=rows.filter(x=>!x.r.c.local).sort((a,b)=>b.r.proySh-a.r.proySh);
  const loc=rows.filter(x=>x.r.c.local).sort((a,b)=>b.r.rigiSh-a.r.rigiSh);
  let ri=0; const row=(k,r,h,p,lab)=>`<button class="glrank" data-gk="${k}" aria-current="${k===GL.sel}" style="--c:${cvar(r.c.sec)};--i:${ri++}">
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
          ${CIR_VAL[p.id]?`<button class="chip vbtn" data-val="${p.id}" title="Abrir el laboratorio de valuación">Valuar</button>`:""}<span class="gpv">${ingTxt}${r&&x.sh!=null?` · <b>${pct(x.sh,1)}</b>`:""}</span></div>
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
    ${CIR_COSTO[k]?(()=>{ const co=CIR_COSTO[k], P=CIR_META.precios[GL.pr], px=co.pk==="cu"?P.cu/2204.62:P[co.pk], mg=co.pk==="brent"?null:(px-co.v)/px;
      return `<p class="note" style="margin:0">Costo de producción oficial: <b>${co.u.startsWith("US$/lb")?"US$ "+nfx(co.v,2):"US$ "+nfx(co.v,co.v<100?2:0)} ${esc(co.u.replace("US$",""))}</b> — ${esc(co.t)}. ${mg!=null?`Con el precio del escenario (${co.pk==="cu"?"US$ "+nfx(px,2):"US$ "+nfx(px,px<100?2:0)}), el margen es de <b>${pct(mg)}</b> del precio.`:`Brent del escenario: US$ ${nfx(px)}.`} <a href="${SRC[co.s].u}" target="_blank" rel="noopener">Fuente ↗</a></p>`; })():""}
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
function glSelect(k){ const dir=GL.sel===k?"":"sel"; GL.sel=k;
  const vp=CIR_EMP[k].ar.find(p=>CIR_VAL[p.id]); if(vp&&VL.id!==vp.id){ VL.id=vp.id; VL.p=null; VL.capexF=100; VL.costF=100; } glSave(); GL.anim=dir||null; glRefresh(); GL.anim=null; const el=document.getElementById("glCard"); if(el&&window.innerWidth<1100) el.scrollIntoView({behavior:REDUCED?"auto":"smooth",block:"start"}); }
function glRefresh(){
  document.getElementById("glRank").innerHTML=rankRows();
  const gc=document.getElementById("glCard"); gc.innerHTML=card(GL.sel); gc.dataset.anim=GL.anim||"soft";
  document.getElementById("glCad").innerHTML=cadenaSec();
  drawMap();
  wireGl();
  countUp(gc, ".glkpis b");
  if(GL.prPrev!==GL.pr){ VL.p=null; GL.prPrev=GL.pr; }
  valRender(GL.anim==="sel");
}
function wireGl(){
  const w=document.getElementById("glWrap");
  w.querySelectorAll("[data-gk]").forEach(b=>b.onclick=()=>glSelect(b.dataset.gk));
  w.querySelectorAll("[data-onmap2]").forEach(b=>b.onclick=()=>{ setView("map"); select(b.dataset.onmap2); });
  w.querySelectorAll("[data-cop3]").forEach(b=>b.onclick=()=>openProfile(b.dataset.cop3));
  w.querySelectorAll("[data-val]").forEach(b=>b.onclick=()=>valOpen(b.dataset.val));
  w.querySelectorAll("[data-tip]").forEach(e=>{ e.onmousemove=ev=>tipOn(ev,`<b>${esc(e.dataset.tip)}</b>`); e.onmouseleave=tipOff; });
  // resaltado sincronizado: pasar por una empresa de la lista ilumina sus flujos en el mapa
  w.querySelectorAll(".glrank").forEach(b=>{ const k=b.dataset.gk;
    b.onmouseenter=()=>{ gRoot.selectAll(`.arc.cap[data-k="${k}"]`).classed("hl",true).raise(); gRoot.selectAll(`.hq[data-k="${k}"]`).classed("hl",true); };
    b.onmouseleave=()=>{ gRoot.selectAll(".arc.cap.hl").classed("hl",false); gRoot.selectAll(".hq.hl").classed("hl",false); }; });
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
      <div id="glVal"></div>
      ${paisSec()}
      <div id="glCad"></div>
      ${methSec()}`;
    buildMap(document.getElementById("glMap"));
    w.querySelectorAll("[data-gs]").forEach(b=>b.onclick=()=>{ GL.sec=b.dataset.gs; w.querySelectorAll("[data-gs]").forEach(x=>x.setAttribute("aria-pressed",x===b));
      if(GL.sec!=="all" && CIR_EMP[GL.sel].sec!==GL.sec) GL.sel=glKeys().find(k=>CIR_EMP[k].met)||glKeys()[0]; glRefresh(); });
    w.querySelectorAll("[data-gp]").forEach(b=>b.onclick=()=>{ GL.pr=b.dataset.gp; glSave(); w.querySelectorAll("[data-gp]").forEach(x=>x.setAttribute("aria-pressed",x===b)); glRefresh(); });
    w.querySelectorAll("[data-gc]").forEach(i=>i.onchange=()=>{ GL.capas[i.dataset.gc]=i.checked; drawMap(); });
    GL.ready=true;
    GL.anim="sel"; glRefresh(); GL.anim=null; countUp(w, ".glpais .tile .v"); return;
  }
  glRefresh();
}
window.renderCircuito=renderCircuito;
if(st.view==="gl") renderCircuito();

// ============================================================
// LABORATORIO DE VALUACIÓN: flujo de fondos, VAN, TIR, repago, precio de equilibrio y sensibilidades.
// Datos y supuestos en CIR_VAL (data/manual/circuito.js). Año de valuación: 2026.
// ============================================================
Object.assign(SRC, CIR_SRC);
const VAL_T0 = 2026;
const VL = { id:null, p:null, r:8, capexF:100, costF:100, tax:25 };
// precio del escenario en la unidad del proyecto
function valPrecioEsc(v, pr){ const P=CIR_META.precios[pr]; const x=P[v.pk]; return v.pk==="cu" ? x/2204.62 : x; }
function valModel(v, o){
  const P=CIR_META.precios[GL.pr];
  // costo neto: si hay subproductos, el crédito se recalcula con los precios del escenario
  let costo=v.costo.v*o.costF/100;
  if(v.byp){
    const cuLb=v.perfil.reduce((s,[,n,q])=>s+n*q,0)/v.perfil.reduce((s,[,n])=>s+n,0)*v.conv;
    const credEst=(v.byp.au*3300+v.byp.ag*40)/cuLb, credEsc=(v.byp.au*P.au+v.byp.ag*P.ag)/cuLb;
    costo=(v.costo.v+credEst)*o.costF/100-credEsc;
  }
  const q={}; v.perfil.forEach(([y0,n,qq])=>{ for(let i=0;i<n;i++) q[y0+i]=qq; });
  const cap={}; v.capex.forEach(([y,c])=>cap[y]=(cap[y]||0)+c*o.capexF/100);
  const yrs=[...new Set([...Object.keys(q),...Object.keys(cap)].map(Number))].sort((a,b)=>a-b);
  const y0=yrs[0], y1=yrs[yrs.length-1], prod0=Math.min(...Object.keys(q).map(Number));
  const rows=[]; const amort=[];  // [año desde, monto anual, años restantes]
  for(let y=y0;y<=y1;y++){
    const qq=(q[y]||0)*v.conv, venta=qq*o.p*v.real/1e6, reg=venta*(v.regal||0)/100, opx=qq*costo/1e6;
    const margen=venta-reg-opx, cx=cap[y]||0;
    if(cx) amort.push({desde:Math.max(y+1,prod0), anual:cx/5, resta:5});
    let dep=0; amort.forEach(a=>{ if(y>=a.desde && a.resta>0){ dep+=a.anual; a.resta--; } });
    const imp=o.tax/100*Math.max(0,margen-dep);
    rows.push({y, q:q[y]||0, venta, reg, opx, margen, imp, cx, f:margen-imp-cx, hundido:y<VAL_T0});
  }
  const van=rows.filter(r=>!r.hundido).reduce((s,r)=>s+r.f/Math.pow(1+o.r/100, r.y-VAL_T0),0);
  const npvAt=i=>rows.reduce((s,r,k)=>s+r.f/Math.pow(1+i,k),0);
  let tir=null; if(npvAt(-.9)>0 && npvAt(5)<0){ let lo=-.9,hi=5; for(let k=0;k<80;k++){ const m=(lo+hi)/2; npvAt(m)>0?lo=m:hi=m; } tir=(lo+hi)/2*100; }
  let acc=0, pay=null; rows.forEach(r=>{ acc+=r.f; if(pay==null && acc>=0 && r.y>=prod0) pay=r.y-prod0+1; });
  const capTot=v.capex.filter(([y])=>y<=prod0).reduce((s,[,c])=>s+c,0)*o.capexF/100;
  const qMax=Math.max(...v.perfil.map(x=>x[2]));
  return { rows, van, tir, pay, costo, prod0, capTot, qMax, margenU:o.p*v.real*(1-(v.regal||0)/100)-costo };
}
function valEquilibrio(v,o){ let lo=0, hi=o.p*6; if(valModel(v,{...o,p:hi}).van<0) return null;
  for(let k=0;k<60;k++){ const m=(lo+hi)/2; valModel(v,{...o,p:m}).van>0?hi=m:lo=m; } return (lo+hi)/2; }
const fP=(v,x)=> x==null?"–": (v.pk==="cu"?"US$ "+nfx(x,2): v.pk==="ag"?"US$ "+nfx(x,2): v.pk==="brent"?"US$ "+nfx(x,1):"US$ "+nfx(x));
const fMc=x=> x==null?"–":(x<0?"−":"")+(Math.abs(x)>=1000?nfx(Math.abs(x)/1000,1)+" mil":nfx(Math.abs(x)));   // compacto, en US$ M
const fM=x=> x==null?"–":(x<0?"−":"")+"US$ "+nfx(Math.abs(x))+" M";

const GLOSARIO = [
  ["VAN (valor actual neto)","Suma de todos los flujos de fondos futuros traídos a hoy con una tasa de descuento: VAN = Σ flujo_t ÷ (1 + tasa)^t. Si es positivo, el proyecto vale más de lo que cuesta. En minería se publica como «NPV8» (al 8%) o «NPV5» (al 5%, habitual en oro y plata)."],
  ["Tasa de descuento","El rendimiento mínimo que exige el inversor por el tiempo y el riesgo. Las mineras grandes usan 8% para cobre y 5% para metales preciosos; un proyecto en un país con más riesgo o sin financiar suele valuarse a 10–12%. Cuando suben las tasas de interés, sube esta tasa y caen los VAN, sobre todo de los proyectos que producen recién en 4 a 8 años."],
  ["TIR (tasa interna de retorno)","La tasa que hace el VAN igual a cero. Si la TIR supera la tasa exigida, el proyecto conviene. Una TIR de 15–20% es buena para un proyecto de cobre grande."],
  ["Repago (payback)","Años de producción necesarios para recuperar la inversión con el flujo acumulado. Es simple pero no considera el valor del tiempo."],
  ["Costo C1 (cash cost)","Costo en efectivo de producir: mina, planta, energía, personal y transporte, por libra u onza. No incluye inversiones de sostenimiento ni impuestos."],
  ["AISC (costo sostenido total)","C1 + inversión de sostenimiento + regalías + gastos generales. Es el piso de precio para que una mina en operación no pierda caja. La diferencia entre precio y AISC es el margen por unidad."],
  ["Créditos por subproductos","Cuando una mina de cobre también vende oro o plata, esos ingresos se restan del costo. Por eso Vicuña muestra un AISC «neto» muy bajo: si cae el oro, su costo neto sube."],
  ["Precio de equilibrio (breakeven)","El precio del metal con el que el VAN da cero: por debajo, el proyecto destruye valor. Es la medida más útil para comparar la resistencia de los proyectos a una caída de precios."],
  ["Intensidad de capital","Inversión inicial ÷ capacidad anual (US$ por tonelada al año). Permite comparar proyectos de distinto tamaño: un cobre por debajo de US$ 25.000–30.000/t es considerado eficiente."],
  ["P/NAV (precio sobre valor de activos)","Capitalización bursátil ÷ VAN atribuible de los activos. Las productoras grandes cotizan cerca de 1 vez; las desarrolladoras, a 0,3–0,7 vez porque el mercado descuenta riesgo de construcción y financiamiento."],
  ["EV/EBITDA","Valor de la empresa (capitalización + deuda neta) ÷ ganancia operativa antes de amortizaciones. Mide cuántos años de caja paga el mercado; para empresas que ya producen."],
  ["Regalías y RIGI","Las provincias cobran regalías mineras de hasta 3% en boca de mina; en petróleo, 12%. El RIGI baja el impuesto a las ganancias de 35% a 25% y elimina los derechos de exportación a los 3 años (2 en proyectos estratégicos). Probá cambiar la alícuota para ver cuánto valor agrega el régimen."]
];
// ---------- interfaz del laboratorio ----------
// Los controles se arman una vez por proyecto; al mover un deslizador sólo se actualizan las salidas,
// con resortes interrumpibles (Motion) que parten del valor que se ve en pantalla.
const valOpts = ()=>({p:VL.p, r:VL.r, capexF:VL.capexF, costF:VL.costF, tax:VL.tax});
const capUnit = v => v.pk==="cu"?"t de cobre":v.pk==="lce"?"t LCE":v.pk==="brent"?"bbl/d":"oz";
function valSec(){
  const ids=Object.keys(CIR_VAL).filter(id=>GL.sec==="all"||CIR_VAL[id].sec===GL.sec);
  if(!ids.length) return "";
  if(!VL.id||!ids.includes(VL.id)){ VL.id=ids[0]; VL.p=null; }
  const v=CIR_VAL[VL.id]; if(VL.p==null) VL.p=valPrecioEsc(v,GL.pr);
  const pMin=v.pEst*.4, pMax=v.pEst*2.4, stepP=v.pk==="cu"?0.01:v.pk==="ag"||v.pk==="brent"?0.5:v.pk==="au"?10:100;
  const quick=[["Estudio",v.pEst],[CIR_META.precios.estudio.n,valPrecioEsc(v,"estudio")],[CIR_META.precios.alto.n,valPrecioEsc(v,"alto")]].filter((x,i,a)=>a.findIndex(y=>Math.abs(y[1]-x[1])<1e-9)===i);
  const srcs=[...new Set([v.costo.s, v.est&&v.est.s, v.s2, "rigiKPMG", "rigiMarval", v.sec==="og"?"ley17319":"ley24196"].filter(s=>s&&SRC[s]))];
  const fs=[.7,.85,1,1.15,1.3], rs=[5,8,10,12];
  return `<div class="glsec vlab" style="--c:${cvar(v.sec)}"><h2>Laboratorio de valuación</h2>
    <p class="note">Flujo de fondos simplificado de cada proyecto con los costos oficiales de sus estudios. Mové el precio, la tasa de descuento, la inversión o el costo y mirá cuánto vale el proyecto y cuánto le toca a cada empresa. Al final, qué significa cada métrica.</p>
    <div class="chips vchips" role="group" aria-label="Proyecto">${ids.map(id=>`<button class="chip" data-vid="${id}" aria-pressed="${id===VL.id}"><span class="dot" style="background:${cvar(CIR_VAL[id].sec)};border-radius:2px"></span>${esc(CIR_VAL[id].n)}</button>`).join("")}</div>
    <div class="vgrid2">
      <div class="vctl">
        <label><span>Precio <b data-vo="lp"></b> <small>${esc(v.u)}</small></span><input type="range" data-vk="p" min="${pMin}" max="${pMax}" step="${stepP}" value="${VL.p}"></label>
        <div class="vqk">${quick.map(([n,x])=>`<button class="chip" data-vp="${x}">${esc(n)} · ${fP(v,x)}</button>`).join("")}</div>
        <label><span>Tasa de descuento <b data-vo="lr"></b></span><input type="range" data-vk="r" min="3" max="15" step="0.5" value="${VL.r}"></label>
        <label><span>Inversión <b data-vo="lc"></b> <small>del estudio</small></span><input type="range" data-vk="capexF" min="50" max="200" step="5" value="${VL.capexF}"></label>
        <label><span>Costo unitario <b data-vo="lo"></b> <small>del oficial</small></span><input type="range" data-vk="costF" min="50" max="200" step="5" value="${VL.costF}"></label>
        <div class="seg" role="group" aria-label="Impuesto a las ganancias" style="align-self:flex-start">${[[25,"RIGI 25%"],[35,"Régimen general 35%"]].map(([t,n])=>`<button data-vtax="${t}" aria-pressed="${VL.tax===t}">${n}</button>`).join("")}</div>
        <p class="note" style="margin:0">Costo oficial: <b>${fP(v,v.costo.v)}</b> ${esc(v.u.replace("US$",""))}. ${esc(v.costo.t)}.${v.byp?` <span data-vo="neto"></span>`:""}</p>
      </div>
      <div class="vout">
        <div class="glkpis vk">
          <div><b data-vo="van"></b><span>VAN al <span data-vo="lr2"></span> (100% del proyecto)</span></div>
          <div><b data-vo="tir"></b><span>TIR</span></div>
          <div><b data-vo="pay"></b><span>Repago desde el inicio de la producción</span></div>
          <div><b data-vo="eq"></b><span>Precio de equilibrio (VAN = 0)</span></div>
          <div><b data-vo="mu"></b><span>Margen por unidad después de costo${v.regal?" y regalías":""}</span></div>
          <div><b data-vo="ci"></b><span>Intensidad de capital (US$ por ${esc(capUnit(v))} de capacidad anual)</span></div></div>
        ${v.est?`<p class="note vcmp">Estudio publicado: <b>VAN${v.est.tasa} ${fM(v.est.van)}</b>, TIR ${nfx(v.est.tir,1)}%${v.est.pay?`, repago ${nfx(v.est.pay,1)} años`:""}${v.est.precio?`, con precio ${fP(v,v.est.precio)}`:""}. ${esc(v.est.t)}. <a href="${SRC[v.est.s].u}" target="_blank" rel="noopener">Fuente ↗</a> El modelo de esta página es más simple y descuenta a 2026: sirve para ver sensibilidades, no reemplaza al estudio.</p>`
          :`<p class="note vcmp"><b>Sin estudio económico publicado:</b> el valor es una estimación propia con los supuestos de abajo.</p>`}
        <div class="vatr">${v.emp.map(([k,pa])=>`<div><b>${esc(CIR_EMP[k]?CIR_EMP[k].n:k)}</b> · ${nfx(pa,pa%1?1:0)}% → <b data-vo="at-${k}"></b> <small data-vo="pn-${k}"></small></div>`).join("")}</div>
      </div>
    </div>
    <div class="vcards">
      <div class="vcard wide"><p class="eyebrow">Flujo de fondos anual (US$ M, 100% del proyecto)</p>
        <svg class="vchart" viewBox="0 0 640 230" role="img" aria-label="Flujo de fondos anual y acumulado"><g class="vax"></g><g class="vbars"></g><path class="vcum"/><g class="vxl"></g><g class="vhits"></g></svg>
        <div class="glkey"><span><i style="background:var(--c)"></i>Flujo del año</span><span><i style="background:color-mix(in srgb,var(--ink) 30%,var(--panel))"></i>Inversión (flujo negativo)</span><span><i style="background:var(--ink);height:2px"></i>Acumulado</span><span class="vsunkk" hidden><i style="background:var(--line)"></i>Ya invertido antes de 2026 (no entra en el VAN)</span></div></div>
      <div class="vcard"><p class="eyebrow">Sensibilidad: VAN según precio y tasa (US$ M)</p>
        <div class="vgw"><table class="vgridt"><thead><tr><th>Tasa \\ precio</th>${fs.map((f,j)=>`<th><span data-vo="gh${j}"></span><small>${f===1?"elegido":(f>1?"+":"")+Math.round((f-1)*100)+"%"}</small></th>`).join("")}</tr></thead>
          <tbody>${rs.map((r,i)=>`<tr><th>${r}%</th>${fs.map((f,j)=>`<td data-gi="${i}" data-gj="${j}"></td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <p class="note" style="margin:4px 0 0">VAN a 100% del proyecto. Verde: crea valor; naranja: lo destruye. Recuadrada, la tasa elegida si está en la tabla.</p></div>
      <div class="vcard"><p class="eyebrow">Qué mueve más el valor</p><div class="vtor"></div>
        <p class="note" style="margin:4px 0 0">Cuánto cambia el VAN si cada variable se mueve 10% en contra o a favor (la tasa, 2 puntos). La barra más larga es el riesgo principal.</p></div>
    </div>
    <div class="vsup"><p class="eyebrow">Supuestos de este proyecto</p><ul>${(v.sup||[]).map(t=>`<li>${esc(t)}</li>`).join("")}<li>Producción en ${esc(v.q)}; impuesto a las ganancias del <span data-vo="tx"></span> con la inversión amortizada en 5 años; sin deuda ni capital de trabajo.</li></ul>
      <div class="glsrc">${srcs.map(s=>`<a href="${SRC[s].u}" target="_blank" rel="noopener">${esc(SRC[s].t)} ↗</a>`).join("")}</div></div>
    <details class="vglos"><summary>Aprender: qué significa cada métrica</summary><dl>${GLOSARIO.map(([t,d])=>`<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl></details>
  </div>`;
}
// número que se anima con resorte desde lo que se ve (hereda la velocidad si estaba en movimiento)
function vNum(el, to, fmt){
  if(!el) return;
  if(to==null||!isFinite(to)){ if(el._a) el._a.stop(); el._cur=null; el.textContent="–"; return; }
  const M=window.Motion;
  if(REDUCED||!M||el._cur==null){ el._cur=to; el.textContent=fmt(to); return; }
  if(el._a) el._a.stop();
  let last=el._cur, lt=performance.now();
  el._a=M.animate(el._cur, to, { type:"spring", bounce:0, duration:.4, velocity:el._vel||0,
    onUpdate:x=>{ const now=performance.now(); el._vel=(x-last)/Math.max(.001,(now-lt)/1000); last=x; lt=now; el._cur=x; el.textContent=fmt(x); },
    onComplete:()=>{ el._vel=0; } });
}
function valUpdate(first){
  const el=document.getElementById("glVal"); const v=CIR_VAL[VL.id]; if(!el||!v) return;
  const o=valOpts(), m=valModel(v,o), eq=valEquilibrio(v,o);
  const q=s=>el.querySelector(`[data-vo="${s}"]`);
  q("lp").textContent=fP(v,VL.p); q("lr").textContent=nfx(VL.r,1).replace(",0","")+"%"; q("lr2").textContent=q("lr").textContent;
  q("lc").textContent=VL.capexF+"%"; q("lo").textContent=VL.costF+"%"; q("tx").textContent=VL.tax+"%";
  if(q("neto")) q("neto").innerHTML=`Con el oro y la plata del escenario, el costo neto queda en <b>${fP(v,m.costo)}</b>.`;
  vNum(q("van"), m.van, fM); q("van").style.color=m.van>=0?"var(--op)":"var(--og)";
  vNum(q("tir"), m.tir, x=>nfx(x,1)+"%");
  q("pay").textContent=m.pay==null?"–":m.pay+(m.pay===1?" año":" años");
  vNum(q("eq"), eq, x=>fP(v,x));
  vNum(q("mu"), m.margenU, x=>fP(v,x));
  const ci=m.capTot/m.qMax*1e6/(v.pk==="brent"?1:1);
  vNum(q("ci"), ci, x=> x>=1000?"US$ "+nfx(x/1000,1)+" mil":"US$ "+nfx(x));
  v.emp.forEach(([k,pa])=>{ const at=m.van*pa/100, mk=MK[k];
    vNum(q("at-"+k), at, fM);
    q("pn-"+k).textContent = mk ? `(${pct(at/mk.cap)} de su capitalización de US$ ${nfx(mk.cap)} M)` : k==="mcewen" ? `(capitalización ≈ US$ 1.100–1.300 M en 2026: ${pct(at/1200)} del punto medio)` : ""; });
  // gráfico: d3 join con transiciones interrumpibles
  const svg=d3.select(el).select(".vchart"), W=Math.max(320,Math.round(svg.node().getBoundingClientRect().width)||640), H=W<600?220:250, mL=48,mR=10,mT=12,mB=26;
  svg.attr("viewBox",`0 0 ${W} ${H}`);
  const rows=m.rows; let acc=0; const cum=rows.map(r=>acc+=r.f);
  const x=d3.scaleBand().domain(rows.map(r=>r.y)).range([mL,W-mR]).padding(.18);
  const y=d3.scaleLinear().domain([Math.min(0,...rows.map(r=>r.f),...cum),Math.max(0,...rows.map(r=>r.f),...cum)]).nice(4).range([H-mB,mT]);
  const D=REDUCED||first?0:320;
  svg.select(".vax").html(y.ticks(4).map(t=>`<line x1="${mL}" x2="${W-mR}" y1="${y(t)}" y2="${y(t)}" class="${t===0?"z":"g"}"/><text x="${mL-6}" y="${y(t)+3.5}" text-anchor="end">${nfx(t)}</text>`).join(""));
  const bars=svg.select(".vbars").selectAll("rect").data(rows).join(e=>e.append("rect").attr("rx",2).attr("x",d=>x(d.y)).attr("width",x.bandwidth()).attr("y",y(0)).attr("height",0));
  bars.attr("class",d=>"vb"+(d.f<0?" neg":"")+(d.hundido?" sunk":"")).attr("x",d=>x(d.y)).attr("width",x.bandwidth())
    .transition().duration(first&&!REDUCED?700:D).delay((d,i)=>first&&!REDUCED?i*12:0).ease(d3.easeCubicOut)
    .attr("y",d=>y(Math.max(0,d.f))).attr("height",d=>Math.max(1,Math.abs(y(d.f)-y(0))));
  const line=d3.line().x((d,i)=>x(rows[i].y)+x.bandwidth()/2).y(d=>y(d));
  svg.select(".vcum").transition().duration(first&&!REDUCED?700:D).ease(d3.easeCubicOut).attr("d",line(cum));
  const step=Math.ceil(rows.length/Math.max(4,Math.floor(W/70)));
  svg.select(".vxl").html(rows.map((r,i)=>i%step===0?`<text x="${x(r.y)+x.bandwidth()/2}" y="${H-8}" text-anchor="middle">${r.y}</text>`:"").join(""));
  svg.select(".vhits").selectAll("rect").data(rows).join("rect").attr("x",d=>x(d.y)-x.bandwidth()*.09).attr("y",mT).attr("width",x.bandwidth()*1.18).attr("height",H-mB-mT).attr("fill","transparent")
    .on("mousemove",(ev,d)=>tipOn(ev,`<b>${d.y}${d.hundido?" · ya invertido":""}</b>${trow("Producción",null,d.q?nfx(d.q):"–")}${trow("Ventas",null,fM(d.venta))}${d.reg?trow("Regalías",null,fM(-d.reg)):""}${trow("Costos",null,fM(-d.opx))}${trow("Impuesto a las ganancias",null,fM(-d.imp))}${trow("Inversión",null,fM(-d.cx))}${trow("Flujo del año",null,"<b>"+fM(d.f)+"</b>")}`))
    .on("mouseleave",tipOff);
  el.querySelector(".vsunkk").hidden=!rows.some(r=>r.hundido);
  // sensibilidad
  const fs=[.7,.85,1,1.15,1.3], rs=[5,8,10,12];
  const vals=rs.map(r=>fs.map(f=>valModel(v,{...o,p:o.p*f,r}).van)), mx=Math.max(1,...vals.flat().map(Math.abs));
  fs.forEach((f,j)=>q("gh"+j).textContent=fP(v,o.p*f));
  el.querySelectorAll("td[data-gi]").forEach(td=>{ const i=+td.dataset.gi, j=+td.dataset.gj, val=vals[i][j], a=Math.round(Math.abs(val)/mx*55)+6;
    td.textContent=fMc(val); td.style.background=`color-mix(in srgb,${val>=0?"var(--op)":"var(--og)"} ${a}%,var(--panel))`; td.classList.toggle("cur", rs[i]===VL.r&&j===2); });
  // tornado (transform scaleX, no width)
  const it=[["Precio ±10%",d=>({...o,p:o.p*(1+d)})],["Costo ±10%",d=>({...o,costF:o.costF*(1-d)})],["Inversión ±10%",d=>({...o,capexF:o.capexF*(1-d)})],["Tasa ±2 puntos",d=>({...o,r:o.r-d*20})]]
    .map(([n,f])=>{ const a=valModel(v,f(.1)).van-m.van, b=valModel(v,f(-.1)).van-m.van; return {n,lo:Math.min(a,b),hi:Math.max(a,b)}; });
  const tm=Math.max(1,...it.map(t=>Math.max(-t.lo,t.hi)));
  const tor=d3.select(el).select(".vtor").selectAll(".tr").data(it,d=>d.n).join(e=>{ const g=e.append("div").attr("class","tr"); g.append("span"); const b=g.append("div").attr("class","tb"); b.append("i").attr("class","dn"); b.append("i").attr("class","up"); g.append("em"); return g; });
  tor.sort((a,b)=>Math.max(-b.lo,b.hi)-Math.max(-a.lo,a.hi));
  tor.select("span").text(d=>d.n); tor.select("em").text(d=>`${fM(d.lo)} / +${fM(d.hi).replace(/^−/,"")}`);
  tor.select(".dn").style("transform",d=>`scaleX(${Math.max(0,-d.lo)/tm})`); tor.select(".up").style("transform",d=>`scaleX(${Math.max(0,d.hi)/tm})`);
}
function valRender(anim){
  const el=document.getElementById("glVal"); if(!el) return;
  el.innerHTML=valSec(); el.dataset.anim=anim?"1":"";
  if(!CIR_VAL[VL.id]) return;
  el.querySelectorAll("[data-vid]").forEach(b=>b.onclick=()=>{ VL.id=b.dataset.vid; VL.p=null; VL.capexF=100; VL.costF=100; valRender(true); });
  const sync=()=>el.querySelectorAll("input[data-vk]").forEach(i=>i.value=VL[i.dataset.vk]);
  el.querySelectorAll("[data-vp]").forEach(b=>b.onclick=()=>{ VL.p=+b.dataset.vp; sync(); valUpdate(); });
  el.querySelectorAll("[data-vtax]").forEach(b=>b.onclick=()=>{ VL.tax=+b.dataset.vtax; el.querySelectorAll("[data-vtax]").forEach(x=>x.setAttribute("aria-pressed",x===b)); valUpdate(); });
  el.querySelectorAll("input[data-vk]").forEach(i=>i.oninput=()=>{ VL[i.dataset.vk]=+i.value; valUpdate(); });
  valUpdate(true);
}
function valOpen(id){ if(!CIR_VAL[id]) return; VL.id=id; VL.p=null; VL.capexF=100; VL.costF=100;
  if(GL.sec!=="all"&&CIR_VAL[id].sec!==GL.sec){ GL.sec="all"; document.querySelectorAll("[data-gs]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.gs==="all")); glRefresh(); }
  valRender(true); const el=document.getElementById("glVal"); if(el) el.scrollIntoView({behavior:REDUCED?"auto":"smooth",block:"start"}); }
// el gráfico usa el ancho real en píxeles: se recalcula al cambiar el tamaño de la ventana
{ let rz; addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(()=>{ if(st.view==="gl"&&document.getElementById("glVal")?.querySelector(".vchart")) valUpdate(); },150); }); }
