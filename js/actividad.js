// ============================================================
// ACTIVIDAD: tablero mensual de indicadores, PIB por sector, aportes al
// crecimiento del EMAE y proyección de participaciones a 2030.
// Datos: data/auto/actividad.js (ACT), generado por scripts/actualizar.py
// desde la API de Series de Tiempo. Usa utilidades de js/app.js (frame,
// yAxis, tipOn, trow, nf, mix…) y de js/circuito.js (ingreso100, prodKind).
// ============================================================
const AC = { sel:null, apo:"m", esc:"estudio", prj:{li:true,cu:true,au:true,oil:true,gas:true}, g:{} };
const ACT_OK = typeof ACT!=="undefined" && ACT && ACT.monitor;

const AGRUP = [
  ["tot","Actividad total",null], ["og","Oil & Gas","og"], ["mi","Minería","mi"], ["ag","Agro, ganadería y pesca","ag"],
  ["ind","Industria",null], ["con","Construcción",null], ["ser","Servicios públicos",null],
  ["cx","Comercio exterior",null], ["fin","Crédito",null], ["fis","Recaudación",null]
];
// Qué filas del tablero se muestran en cada pestaña de sector
const TAB_GRP = { og:["og","mi"], mi:["mi","og"], ag:["ag"] };

// ---------- utilidades de series ----------
const toMap = arr => new Map((arr||[]).map(([m,v])=>[m,v]));
const ymAdd = (m,k)=>{ const [y,mm]=m.split("-").map(Number); const d=new Date(y,mm-1+k,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const pctv = (a,b)=> a==null||b==null||!b ? null : (a/b-1)*100;
const sg = (v,d=1)=> v==null||isNaN(v) ? "–" : (v>0?"+":"")+nf(v,d);
const qLab = q => q.replace("-Q"," · T");

function rowCalc(r){
  const s=toMap(r.s), d=r.d?toMap(r.d):null;
  return { s, d, yoy:m=>pctv(s.get(m),s.get(ymAdd(m,-12))), mom:m=>d?pctv(d.get(m),d.get(ymAdd(m,-1))):null, last:r.s.at(-1)[0] };
}
function monMeses(n=6){
  // último mes con datos en al menos la mitad de las filas
  const lasts=ACT.monitor.map(r=>r.s.at(-1)[0]).sort();
  const ref=lasts[Math.floor(lasts.length/2)];
  return d3.range(n).map(i=>ymAdd(ref,i-n+1));
}
// color divergente: azul = crecimiento, naranja = caída, gris = sin cambio (la cifra siempre está escrita)
function heat(v, cap=15){
  if(v==null||isNaN(v)) return "transparent";
  const p=Math.min(1,Math.abs(v)/cap); if(p<0.04) return "var(--bg)";
  return `color-mix(in srgb, ${v>0?"var(--c1)":"var(--c2)"} ${Math.round(10+p*48)}%, var(--panel))`;
}
const actSrc = k => SRC["act_"+k] ? `<a href="${SRC["act_"+k].u}" target="_blank" rel="noopener" title="${SRC["act_"+k].t}">↗</a>` : (k==="petroleo"&&SRC.cap4hist?`<a href="${SRC.cap4hist.u}" target="_blank" rel="noopener" title="${SRC.cap4hist.t}">↗</a>`:"");

// ============================================================
// 1. TABLERO
// ============================================================
function actMonitorHTML(grupos, titulo="Tablero de actividad"){
  if(!ACT_OK) return `<p class="note">Los datos de actividad todavía no se generaron. Corré el paso «actividad» de scripts/actualizar.py.</p>`;
  const M=monMeses(), filas=ACT.monitor.filter(r=>!grupos||grupos.includes(r.g));
  const gs=AGRUP.filter(([g])=>filas.some(r=>r.g===g)).sort((a,b)=>!grupos?0:grupos.indexOf(a[0])-grupos.indexOf(b[0]));
  const propias=filas.some(r=>r.sa==="propia");
  const head=`<tr><th rowspan="2" class="ind">Indicador</th>${M.map(m=>`<th colspan="2" class="mes">${mlab(m)}</th>`).join("")}</tr><tr>${M.map(()=>`<th title="Variación contra el mismo mes del año anterior, serie original">i.a.</th><th title="Variación contra el mes anterior, serie sin estacionalidad">m/m</th>`).join("")}</tr>`;
  const body=gs.map(([g,gn,sc])=>`<tr class="ag-g"><th colspan="${1+M.length*2}">${sc?`<i style="background:${cvar(sc)}"></i>`:""}${gn}</th></tr>`+
    filas.filter(r=>r.g===g).map(r=>{ const c=rowCalc(r);
      return `<tr class="ag-r" data-act="${r.k}" tabindex="0"><td class="ind"><span class="nm">${r.n}</span><span class="u">${r.u} · ${r.org}${r.sa==="propia"?" · m/m*":""} ${actSrc(r.k)}</span></td>${M.map(m=>{ const y=c.yoy(m), mo=c.mom(m);
        return `<td class="v" style="background:${heat(y)}" data-m="${m}" data-t="y">${sg(y)}</td><td class="v mo" style="background:${heat(mo,5)}" data-m="${m}" data-t="m">${sg(mo)}</td>`; }).join("")}</tr>
        ${AC.sel===r.k?`<tr class="ag-d"><td colspan="${1+M.length*2}"><div class="vbox" id="actDet"></div></td></tr>`:""}`;
    }).join("")).join("");
  const gid=grupos?grupos.join(","):"";
  return `<div class="vcard wide actmon" id="mon-${gid||"all"}" data-g="${gid}" data-t="${titulo}"><h3>${titulo}<span class="tag">Mapa de calor</span></h3>
    <p class="sub">Variación interanual (i.a., serie original) y mensual (m/m, serie sin estacionalidad) de los últimos 6 meses. Azul: suba; naranja: baja; cuanto más intenso, mayor la variación. Tocá una fila para ver su serie.</p>
    <div class="acttab"><table>${head}${body}</table></div>
    <p class="note">${propias?"* m/m con desestacionalización propia (STL sobre la serie oficial), porque el organismo no publica una serie sin estacionalidad. ":""}Celdas vacías: el organismo todavía no publicó ese mes. ${ACT.fallas&&ACT.fallas.length?`Sin datos en la última actualización: ${ACT.fallas.map(f=>f.split(":")[0]).join(", ")}.`:""}</p>
    <div class="src">Fuente: series oficiales de INDEC, BCRA, Secretarías de Energía, Agricultura y Hacienda y cámaras republicadas por el Ministerio de Economía, vía API de Series de Tiempo (datos.gob.ar), actualizado el ${fechaC(ACT.actualizado)}. El enlace ↗ de cada fila abre la serie.</div></div>`;
}
function actMonitorBind(root){
  root.querySelectorAll(".acttab td.v").forEach(td=>{
    td.onpointermove=ev=>{ const r=ACT.monitor.find(x=>x.k===td.closest("tr").dataset.act), c=rowCalc(r), m=td.dataset.m;
      if(td.dataset.t==="y") tipOn(ev,`<b>${r.n}</b><div style="color:var(--muted)">${mlab(m)} vs ${mlab(ymAdd(m,-12))}</div>${trow(mlab(m),null,c.s.get(m)==null?"sin dato":nf(c.s.get(m),1)+" "+r.u)}${trow(mlab(ymAdd(m,-12)),null,nf(c.s.get(ymAdd(m,-12)),1))}${trow("Variación interanual",null,sg(c.yoy(m))+"%")}`);
      else tipOn(ev,`<b>${r.n}</b><div style="color:var(--muted)">Serie sin estacionalidad${r.sa==="propia"?" (propia)":" (oficial)"}</div>${trow("Variación contra "+mlab(ymAdd(m,-1)),null,sg(c.mom(m))+"%")}`); };
    td.onpointerleave=tipOff;
  });
  root.querySelectorAll(".acttab tr.ag-r").forEach(tr=>{
    const go=()=>{ AC.sel=AC.sel===tr.dataset.act?null:tr.dataset.act; tipOff();
      const card=tr.closest(".actmon"), id=card.id, gr=card.dataset.g?card.dataset.g.split(","):null;
      card.outerHTML=actMonitorHTML(gr,card.dataset.t);
      const nc=document.getElementById(id); actMonitorBind(nc); if(AC.sel) actDetail(nc.querySelector("#actDet"), AC.sel);
      const fr=nc.querySelector(`tr[data-act="${AC.sel||tr.dataset.act}"]`); if(fr) fr.focus({preventScroll:true}); };
    tr.onclick=e=>{ if(e.target.closest("a")) return; go(); };
    tr.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); go(); } };
  });
}
function actDetail(box,k){
  const r=ACT.monitor.find(x=>x.k===k); if(!box||!r) return;
  const S=r.s.filter(x=>x[0]>=ymAdd(r.s.at(-1)[0],-72)).map(([m,v])=>({d:pdate(m),m,v}));
  const D=r.d?r.d.filter(x=>x[0]>=S[0].m).map(([m,v])=>({d:pdate(m),m,v})):[];
  box.insertAdjacentHTML("beforeend",legend([["Serie original","var(--faint)","ln"]].concat(D.length?[[`Sin estacionalidad (${r.sa})`,"var(--ink)","ln"]]:[])));
  const F=frame(box,200,{t:8,r:16,b:22,l:52});
  const x=d3.scaleTime().domain(d3.extent(S,d=>d.d)).range([0,F.w]);
  const all=[...S,...D].map(d=>d.v), y=d3.scaleLinear().domain([d3.min(all)*0.95,d3.max(all)*1.04]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w,d=>nf(d),4); xAxisTime(F.g,x,F.h,6);
  const ln=d3.line().x(d=>x(d.d)).y(d=>y(d.v));
  F.g.append("path").datum(S).attr("d",ln).style("fill","none").style("stroke","var(--faint)").style("stroke-width",1.5);
  if(D.length) F.g.append("path").datum(D).attr("d",ln).style("fill","none").style("stroke","var(--ink)").style("stroke-width",2);
  const dm=new Map(D.map(d=>[d.m,d.v]));
  crosshair(F,x,S.map(d=>d.d),i=>`<b>${mlab(S[i].m)}</b>${trow("Original",null,nf(S[i].v,1))}${dm.has(S[i].m)?trow("Sin estacionalidad",null,nf(dm.get(S[i].m),1)):""}<div style="color:var(--muted);margin-top:4px">${r.u}</div>`);
}

// ============================================================
// 2. PIB POR SECTOR
// ============================================================
const PGRP = [["A","Agro y ganadería","var(--ag)"],["C","Minas y canteras (Oil & Gas y minería)","var(--og)"],["D","Industria","var(--c1)"],["G","Comercio","var(--c4)"],["R","Resto de la economía","var(--exp)"]];
const secN = k => (ACT.sectores.find(s=>s.k===k)||{n:k}).n;
// participación anual a precios corrientes (años completos) + últimos 4 trimestres
function pibAnual(){
  const P=ACT.pib, ks=Object.keys(P.sec), out=[];
  const yrs=[...new Set(P.trim.map(q=>q.slice(0,4)))];
  const agg=(idx,lab,parcial)=>{ const o={y:lab,parcial,pib:d3.sum(idx,i=>P.pib[i])}; ks.forEach(k=>o[k]=d3.sum(idx,i=>P.sec[k][i]||0)); o.R=o.pib-d3.sum(ks,k=>o[k]); return o; };
  yrs.forEach(y=>{ const idx=P.trim.map((q,i)=>q.startsWith(y)?i:-1).filter(i=>i>=0); if(idx.length===4) out.push(agg(idx,y,false)); });
  const n=P.trim.length; if(!P.trim[n-1].endsWith("Q4")) out.push(agg(d3.range(n-4,n),"12m",true));
  return {rows:out, ks};
}
function pibShares(box){
  const {rows,ks}=pibAnual(), R=rows.map(r=>({...r, D_:r, sh:Object.fromEntries(PGRP.map(([k])=>[k,(k==="R"?r.R+d3.sum(ks.filter(x=>!PGRP.some(p=>p[0]===x)),x=>r[x]):r[k])/r.pib*100]))}));
  box.insertAdjacentHTML("beforeend",legend(PGRP.map(([k,n,c])=>[n,c])));
  const F=frame(box,280,{t:10,r:118,b:24,l:36});
  const x=d3.scaleBand().domain(R.map(r=>r.y)).range([0,F.w]).padding(.18);
  const keys=PGRP.map(p=>p[0]), S=d3.stack().keys(keys)(R.map(r=>r.sh));
  const y=d3.scaleLinear().domain([0,100]).range([F.h,0]);
  yAxis(F.g,y,F.w,d=>d+"%",4);
  F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`).call(d3.axisBottom(x).tickFormat(t=>t==="12m"?"12 m":"’"+t.slice(2)).tickSizeOuter(0));
  const col=Object.fromEntries(PGRP.map(p=>[p[0],p[2]]));
  F.g.selectAll(".s").data(S).join("g").style("fill",d=>col[d.key]).selectAll("rect").data(d=>d.map((v,i)=>({v,i,k:d.key}))).join("rect")
    .attr("x",d=>x(R[d.i].y)).attr("width",x.bandwidth()).attr("y",d=>y(d.v[1])).attr("height",d=>Math.max(0,y(d.v[0])-y(d.v[1])-1.5));
  F.g.selectAll(".hb").data(R).join("rect").attr("class","hit").attr("x",r=>x(r.y)).attr("width",x.step()).attr("y",0).attr("height",F.h)
    .on("pointermove",(ev,r)=>tipOn(ev,`<b>${r.y==="12m"?"Últimos 12 meses":r.y} · % del PIB</b>${ks.map(k=>[k,r[k]/r.pib*100]).sort((a,b)=>b[1]-a[1]).map(([k,v])=>trow(secN(k),(PGRP.find(p=>p[0]===k)||[])[2]||null,nf(v,1)+"%")).join("")}${trow("Resto (impuestos y ramas sin apertura)",null,nf(r.R/r.pib*100,1)+"%")}`)).on("pointerleave",tipOff);
  const l=S.map(s=>({k:s.key,y:(s.at(-1)[0]+s.at(-1)[1])/2,v:s.at(-1)[1]-s.at(-1)[0]}));
  F.g.selectAll(".dl").data(l).join("text").attr("class","lbl").attr("x",F.w+6).attr("y",d=>y(d.y)+4).text(d=>`${PGRP.find(p=>p[0]===d.k)[1].split(" (")[0]} ${nf(d.v,1)}%`);
}
function pibRank(box){
  const {rows,ks}=pibAnual(), r=rows.at(-1), first=rows[0];
  const D=ks.map(k=>({k,v:r[k]/r.pib*100,v0:first[k]/first.pib*100})).sort((a,b)=>b.v-a.v);
  const F=frame(box,D.length*24+14,{t:4,r:60,b:6,l:220});
  const y=d3.scaleBand().domain(D.map(d=>d.k)).range([0,F.h]).padding(.25), x=d3.scaleLinear().domain([0,d3.max(D,d=>Math.max(d.v,d.v0))]).range([0,F.w]);
  const c=k=>k==="A"?"var(--ag)":k==="C"?"var(--og)":"var(--exp)";
  F.g.selectAll("rect").data(D).join("rect").attr("y",d=>y(d.k)).attr("height",y.bandwidth()).attr("x",0).attr("width",d=>x(d.v)).attr("rx",3).style("fill",d=>c(d.k))
    .on("pointermove",(ev,d)=>tipOn(ev,`<b>${secN(d.k)}</b>${trow(r.y==="12m"?"Últimos 12 meses":r.y,null,nf(d.v,1)+"% del PIB")}${trow(first.y,null,nf(d.v0,1)+"%")}`)).on("pointerleave",tipOff);
  F.g.selectAll(".m").data(D).join("line").attr("x1",d=>x(d.v0)).attr("x2",d=>x(d.v0)).attr("y1",d=>y(d.k)-2).attr("y2",d=>y(d.k)+y.bandwidth()+2).style("stroke","var(--ink)").style("stroke-width",2);
  F.g.selectAll(".l").data(D).join("text").attr("class",d=>"lbl"+(d.k==="A"||d.k==="C"?"":" mut")).attr("x",-8).attr("text-anchor","end").attr("y",d=>y(d.k)+y.bandwidth()/2+4).text(d=>secN(d.k).split(" (")[0]);
  F.g.selectAll(".v").data(D).join("text").attr("class","val").attr("x",d=>Math.max(x(d.v),x(d.v0))+6).attr("y",d=>y(d.k)+y.bandwidth()/2+4).text(d=>nf(d.v,1)+"%");
  box.insertAdjacentHTML("afterbegin",legend([[r.y==="12m"?"Últimos 12 meses":r.y,"var(--exp)"],[`Marca: ${first.y}`,"var(--ink)","ln"]]));
}

// ============================================================
// 3. APORTES AL CRECIMIENTO (EMAE)
// ============================================================
// Aporte del sector i a la variación interanual del EMAE ≈ w_i · I_i(t−12) / Σ w_j · I_j(t−12) · g_i
// (el EMAE base 2004 agrega los sectores con las ponderaciones del VAB 2004).
const AGRP = [["A","Agro","var(--ag)"],["C","Minas y canteras","var(--og)"],["D","Industria","var(--c1)"],["G","Comercio","var(--c4)"],["R","Resto","var(--exp)"]];
function aportes(modo){
  // denominador: Σ w_j·I_j(t−12) = VAB 2004 total × EMAE total(t−12)/100 (no hace falta que estén todas las ramas)
  const E=ACT.emae, W=Object.fromEntries(ACT.sectores.map(s=>[s.k,s.w])), W0=E.w04||485115.2, ks=["A","C","D","G"].filter(k=>E.sec[k]);
  const fila=(p,tot,tot0,get)=>{ const o={p,tot:pctv(tot,tot0),A:0,C:0,D:0,G:0,R:0}; const den=W0*tot0;
    ks.forEach(k=>{ const [v,v0]=get(k); o[k]=W[k]*v0/den*pctv(v,v0); }); o.R=o.tot-d3.sum(ks,k=>o[k]); return o; };
  if(modo==="m"){
    const out=[]; for(let i=12;i<E.meses.length;i++) out.push(fila(E.meses[i],E.tot[i],E.tot[i-12],k=>[E.sec[k][i],E.sec[k][i-12]]));
    return out.slice(-24);
  }
  const yrs=[...new Set(E.meses.map(m=>m.slice(0,4)))].filter(y=>E.meses.filter(m=>m.startsWith(y)).length===12);
  const av=(arr,y)=>d3.mean(E.meses.map((m,i)=>m.startsWith(y)?arr[i]:null).filter(v=>v!=null));
  return yrs.slice(1).map((y,j)=>{ const y0=yrs[j]; return fila(y,av(E.tot,y),av(E.tot,y0),k=>[av(E.sec[k],y),av(E.sec[k],y0)]); });
}
function apoChart(box){
  const modo=AC.apo, D=aportes(modo), keys=AGRP.map(a=>a[0]), col=Object.fromEntries(AGRP.map(a=>[a[0],a[2]]));
  box.insertAdjacentHTML("beforeend",`<div class="vchips">${[["m","Mensual, últimos 24 meses"],["a","Anual"]].map(([k,n])=>`<button class="chip" data-apo="${k}" aria-pressed="${k===modo}">${n}</button>`).join("")}</div>`);
  box.querySelectorAll("[data-apo]").forEach(b=>b.onclick=()=>{ AC.apo=b.dataset.apo; box.innerHTML=""; apoChart(box); });
  box.insertAdjacentHTML("beforeend",legend(AGRP.map(([k,n,c])=>[n,c]).concat([["EMAE total, variación interanual","var(--ink)","ln"]])));
  const F=frame(box,290,{t:12,r:16,b:26,l:40});
  const x=d3.scaleBand().domain(D.map(d=>d.p)).range([0,F.w]).padding(.22);
  const pos=D.map(d=>d3.sum(keys,k=>Math.max(0,d[k]))), neg=D.map(d=>d3.sum(keys,k=>Math.min(0,d[k])));
  const y=d3.scaleLinear().domain([Math.min(d3.min(neg),d3.min(D,d=>d.tot)),Math.max(d3.max(pos),d3.max(D,d=>d.tot))]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w,d=>d+" pp",5);
  F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`).call(d3.axisBottom(x).tickValues(modo==="m"?D.map(d=>d.p).filter((p,i)=>i%3===0):D.map(d=>d.p)).tickFormat(p=>modo==="m"?mlab(p):p).tickSizeOuter(0));
  F.g.append("line").attr("x1",0).attr("x2",F.w).attr("y1",y(0)).attr("y2",y(0)).style("stroke","var(--muted)");
  D.forEach(d=>{ let up=0, dn=0; keys.forEach(k=>{ const v=d[k]; const y0=v>=0?up:dn, y1=y0+v; if(v>=0) up=y1; else dn=y1;
    F.g.append("rect").attr("x",x(d.p)).attr("width",x.bandwidth()).attr("y",y(Math.max(y0,y1))).attr("height",Math.max(0,Math.abs(y(y0)-y(y1))-1)).style("fill",col[k]); }); });
  const cx=d=>x(d.p)+x.bandwidth()/2;
  F.g.append("path").datum(D).attr("d",d3.line().x(cx).y(d=>y(d.tot))).style("fill","none").style("stroke","var(--ink)").style("stroke-width",2);
  F.g.selectAll(".pt").data(D).join("circle").attr("cx",cx).attr("cy",d=>y(d.tot)).attr("r",3).style("fill","var(--ink)").style("stroke","var(--panel)").style("stroke-width",1.5);
  F.g.selectAll(".hb").data(D).join("rect").attr("class","hit").attr("x",d=>x(d.p)).attr("width",x.step()).attr("y",0).attr("height",F.h)
    .on("pointermove",(ev,d)=>{ tipOn(ev,`<b>${modo==="m"?mlab(d.p):d.p} · EMAE ${sg(d.tot)}%</b>${AGRP.map(([k,n,c])=>trow(n,c,sg(d[k],2)+" pp")).join("")}<div style="color:var(--muted);margin-top:4px">«Resto» es la diferencia entre el total y los cuatro sectores: incluye las demás ramas y los impuestos netos.</div>`); })
    .on("pointerleave",tipOff);
}

// ============================================================
// 4. PROYECCIÓN 2030
// ============================================================
const PRJ_N = { li:"Litio", cu:"Cobre y molibdeno", au:"Oro y plata", oil:"Petróleo", gas:"Gas y GNL" };
const PRJ_C = { li:"var(--c1)", cu:"var(--c2)", au:"var(--c4)", oil:"var(--c6)", gas:"var(--c3)" };
const AN_FIN = 2030;
function emaeAnual(k){ // promedio anual del índice EMAE de un sector (años completos)
  const E=ACT.emae, arr=k==="tot"?E.tot:E.sec[k], o={};
  E.meses.forEach((m,i)=>{ const y=+m.slice(0,4); (o[y]=o[y]||[]).push(arr[i]); });
  return Object.fromEntries(Object.entries(o).filter(([y,v])=>v.length===12).map(([y,v])=>[+y,d3.mean(v)]));
}
function cagr(a,y0,y1){ return a[y0]&&a[y1] ? (Math.pow(a[y1]/a[y0],1/(y1-y0))-1)*100 : 0; }
function emaeResto(){ // EMAE sin agro ni minas: (VAB04·total − wA·A − wC·C) / (VAB04 − wA − wC)
  const W=Object.fromEntries(ACT.sectores.map(s=>[s.k,s.w])), W0=ACT.emae.w04||485115.2;
  const t=emaeAnual("tot"), a=emaeAnual("A"), c=emaeAnual("C");
  return Object.fromEntries(Object.keys(t).map(y=>[y,(W0*t[y]-W.A*a[y]-W.C*c[y])/(W0-W.A-W.C)]));
}
// ventana de tendencia: hasta 10 años (o 6 para minas), sin arrancar en 2020 (base deprimida por la pandemia)
function ventana(a,yl,n){ const ys=Object.keys(a).map(Number); let y0=Math.max(d3.min(ys),yl-n); if(y0===2020) y0=2019; return y0; }
function prjDefaults(){
  const a=emaeAnual("A"), c=emaeAnual("C"), r=emaeResto(), yl=d3.max(Object.keys(a).map(Number));
  const yA=ventana(a,yl,10), yC=ventana(c,yl,6), yR=ventana(r,yl,10);
  return { yl, yA, yC, yR, A:cagr(a,yA,yl), C:cagr(c,yC,yl), R:cagr(r,yR,yl), va:60 };
}
// proyectos nuevos de la Matriz (desde 2026), sin duplicar los que comparten varias empresas
function prjList(){
  const seen=new Set(), out=[];
  Object.values(CIR_EMP).forEach(c=>c.ar.forEach(p=>{ if(seen.has(p.id)||!p.prod||!p.ini||p.ini<2026) return; const k=prodKind(p); if(!PRJ_N[k]) return; seen.add(p.id); out.push({...p,k}); }));
  return out;
}
const ramp = (t,ini)=> t<ini ? 0 : Math.min(1,(t-ini+1)/3);   // tres años de rampa hasta régimen
function proyectar(){
  const def=prjDefaults(), g={...def,...AC.g}, {rows}=pibAnual(), base=rows.filter(r=>!r.parcial).at(-1), B=+base.y;
  const fx=ACT.fx[String(B)], P=prjList();
  const hist=rows.filter(r=>!r.parcial).map(r=>({y:+r.y, A:r.A/r.pib*100, C:r.C/r.pib*100}));
  const out=[], prjVal={};
  for(let t=B;t<=AN_FIN;t++){
    const n=t-B, A=base.A*Math.pow(1+g.A/100,n), Cb=base.C*Math.pow(1+g.C/100,n), R=(base.pib-base.A-base.C)*Math.pow(1+g.R/100,n);
    let add=0; const byK={};
    P.forEach(p=>{ if(!AC.prj[p.k]) return; const ing=ingreso100(p,AC.esc)||0; const v=ing*ramp(t,p.ini)*g.va/100; // US$ M de valor agregado
      byK[p.k]=(byK[p.k]||0)+v; add+=v; });
    const C=Cb+add*fx; const tot=A+C+R;
    out.push({y:t,A:A/tot*100,C:C/tot*100,add,byK}); prjVal[t]=byK;
  }
  return {g,def,hist,out,B,fx,P};
}
function prjCtl(box){
  const r=proyectar(), g=r.g, d=r.def;
  const sl=(k,n,min,max,step,u,help)=>`<label class="psl"><span>${n} <b>${nf(g[k],1)}${u}</b></span><input type="range" min="${min}" max="${max}" step="${step}" value="${g[k]}" data-g="${k}"><small>${help}</small></label>`;
  box.innerHTML=`<div class="pctl">
    ${sl("A","Agro: crecimiento real anual",-3,8,0.1,"%",`Tendencia ${d.yA}–${d.yl}: ${sg(d.A)}% por año`)}
    ${sl("C","Minas y canteras, producción existente",-3,10,0.1,"%",`Tendencia ${d.yC}–${d.yl}: ${sg(d.C)}% por año (incluye el shale)`)}
    ${sl("R","Resto de la economía",-3,6,0.1,"%",`Tendencia ${d.yR}–${d.yl}: ${sg(d.R)}% por año`)}
    ${sl("va","Valor agregado de los proyectos nuevos",30,90,5,"% de las ventas","Parte de la facturación que queda como VAB (salarios, rentas, impuestos y ganancias)")}
    <div class="psl"><span>Proyectos nuevos que suman producción (arranque desde 2026, 3 años de rampa)</span><div class="vchips">${Object.entries(PRJ_N).map(([k,n])=>`<button class="chip" data-prj="${k}" aria-pressed="${!!AC.prj[k]}"><i style="background:${PRJ_C[k]};width:8px;height:8px;border-radius:2px;display:inline-block"></i>${n} · ${r.P.filter(p=>p.k===k).length}</button>`).join("")}</div></div>
    <div class="psl"><span>Precios</span><div class="vchips">${Object.entries(CIR_META.precios).map(([k,p])=>`<button class="chip" data-esc="${k}" aria-pressed="${AC.esc===k}" title="${p.t}">${p.n}</button>`).join("")}</div></div>
    <button class="chip" data-reset>Volver a la tendencia</button></div>`;
  const redraw=()=>{ prjCtl(box); prjDraw(document.getElementById("actPrj")); };
  box.querySelectorAll("[data-g]").forEach(i=>i.oninput=()=>{ AC.g[i.dataset.g]=+i.value; i.previousElementSibling.querySelector("b").textContent=nf(+i.value,1)+(i.dataset.g==="va"?"% de las ventas":"%"); prjDraw(document.getElementById("actPrj")); });
  box.querySelectorAll("[data-prj]").forEach(b=>b.onclick=()=>{ AC.prj[b.dataset.prj]=!AC.prj[b.dataset.prj]; redraw(); });
  box.querySelectorAll("[data-esc]").forEach(b=>b.onclick=()=>{ AC.esc=b.dataset.esc; redraw(); });
  box.querySelector("[data-reset]").onclick=()=>{ AC.g={}; AC.prj={li:true,cu:true,au:true,oil:true,gas:true}; AC.esc="estudio"; redraw(); };
}
function prjDraw(box){
  if(!box) return; box.innerHTML="";
  const r=proyectar(), H=r.hist, O=r.out, last=O.at(-1), h0=H.at(-1);
  box.insertAdjacentHTML("beforeend",legend([["Agro y ganadería","var(--ag)","ln"],["Minas y canteras (Oil & Gas y minería)","var(--og)","ln"],["Proyección (línea punteada)","var(--muted)","dash"]]));
  const F=frame(box,260,{t:12,r:56,b:24,l:36});
  const x=d3.scaleLinear().domain([H[0].y,AN_FIN]).range([0,F.w]);
  const y=d3.scaleLinear().domain([0,Math.max(d3.max(H,d=>Math.max(d.A,d.C)),d3.max(O,d=>Math.max(d.A,d.C)))*1.12]).nice().range([F.h,0]);
  yAxis(F.g,y,F.w,d=>d+"%",4);
  F.g.append("g").attr("class","ax").attr("transform",`translate(0,${F.h})`).call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("d")).tickSizeOuter(0));
  F.g.append("rect").attr("x",x(r.B)).attr("width",F.w-x(r.B)).attr("y",0).attr("height",F.h).style("fill","var(--bg)").style("opacity",.6);
  F.g.append("text").attr("class","lbl mut").attr("x",x(r.B)+6).attr("y",12).text("proyección");
  [["A","var(--ag)"],["C","var(--og)"]].forEach(([k,c])=>{
    F.g.append("path").datum(H).attr("d",d3.line().x(d=>x(d.y)).y(d=>y(d[k]))).style("fill","none").style("stroke",c).style("stroke-width",2);
    F.g.append("path").datum(O).attr("d",d3.line().x(d=>x(d.y)).y(d=>y(d[k]))).style("fill","none").style("stroke",c).style("stroke-width",2).style("stroke-dasharray","5 4");
    F.g.append("circle").attr("cx",x(AN_FIN)).attr("cy",y(last[k])).attr("r",4).style("fill",c).style("stroke","var(--panel)").style("stroke-width",2);
  });
  const ends=[["A",y(last.A)],["C",y(last.C)]].sort((a,b)=>a[1]-b[1]); if(ends[1][1]-ends[0][1]<13){ const m=(ends[0][1]+ends[1][1])/2; ends[0][1]=m-6.5; ends[1][1]=m+6.5; }
  ends.forEach(([k,yy])=>F.g.append("text").attr("class","val").attr("x",x(AN_FIN)+7).attr("y",yy+4).text(nf(last[k],1)+"%"));
  const all=[...H.filter(d=>d.y<r.B).map(d=>({...d,p:false})),...O.map(d=>({...d,p:d.y>r.B}))];
  crosshair(F,x,all.map(d=>d.y),i=>{ const d=all[i]; return `<b>${d.y}${d.p?" · proyección":""}</b>${trow("Agro y ganadería","var(--ag)",nf(d.A,1)+"% del PIB")}${trow("Minas y canteras","var(--og)",nf(d.C,1)+"% del PIB")}${d.p&&d.add?trow("VAB de proyectos nuevos",null,"US$ "+nf(d.add)+" M"):""}`; });
  const tot0=h0.A+h0.C, tot1=last.A+last.C;
  const byK=Object.entries(last.byK).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  box.insertAdjacentHTML("beforeend",`<div class="vstats" style="margin-top:6px"><div><b>${nf(tot0,1)}% → ${nf(tot1,1)}%</b><span>agro + minas y canteras, ${r.B} → ${AN_FIN}</span></div><div><b>US$ ${nf(last.add/1000,1)} mil M</b><span>valor agregado de proyectos nuevos en ${AN_FIN}</span></div>${byK.slice(0,3).map(([k,v])=>`<div><b>US$ ${nf(v/1000,1)} mil M</b><span>${PRJ_N[k]}</span></div>`).join("")}</div>`);
}

// ============================================================
// 5. FICHA DE SECTOR (pestañas Oil & Gas / Minería / Agro)
// ============================================================
function secTiles(s){
  if(!ACT_OK) return "";
  const k=s==="ag"?"A":"C", {rows}=pibAnual(), r=rows.at(-1), E=ACT.emae, n=E.meses.length-1, a=E.sec[k];
  const yoy=pctv(a[n],a[n-12]), an=emaeAnual(k), yl=d3.max(Object.keys(an).map(Number));
  const ytd=(()=>{ const yy=E.meses[n].slice(0,4), i0=E.meses.findIndex(m=>m.startsWith(yy)); const cur=d3.sum(a.slice(i0,n+1)), prev=d3.sum(a.slice(i0-12,n-11)); return pctv(cur,prev); })();
  const t=(l,v,u,p,src)=>`<div class="tile"><span class="l">${l}</span><span class="v">${v}<small>${u}</small></span><span class="p">${p}</span>${src}</div>`;
  const sL=k=>SRC[k]?`<a href="${SRC[k].u}" target="_blank" rel="noopener" title="${SRC[k].t}">Fuente: ${SRC[k].t.split(" – ")[0]} ↗</a>`:"";
  const nota=s==="ag"?"":`<p class="note" style="max-width:76ch">En las cuentas nacionales el petróleo, el gas y la minería metalífera forman un solo sector («Explotación de minas y canteras»). El EMAE no los abre por separado; el tablero de abajo suma indicadores propios de cada rubro.</p>`;
  return `<div class="tiles">${t(s==="ag"?"Agro en el PIB":"Minas y canteras en el PIB",nf(r[k]/r.pib*100,1),"%",`${r.y==="12m"?"Últimos 12 meses":r.y}, a precios corrientes`,sL("actPib"))}
    ${t("Actividad, variación interanual",sg(yoy),"%",`${mlab(E.meses[n])} (EMAE)`,sL("actEmae"))}
    ${t("Acumulado del año",sg(ytd),"%",`ene–${mlab(E.meses[n]).split("-")[0]} vs mismo período de ${+E.meses[n].slice(0,4)-1}`,sL("actEmae"))}
    ${t(`Crecimiento promedio ${ventana(an,yl,6)}–${yl}`,sg(cagr(an,ventana(an,yl,6),yl)),"% anual","Índice EMAE en volumen",sL("actEmae"))}</div>${nota}`;
}

// ---------- montaje ----------
function actPanoramaHTML(){
  if(!ACT_OK) return `<section class="statsec x"><h2><i></i>Actividad</h2>${actMonitorHTML()}</section>`;
  const E=ACT.emae, {rows}=pibAnual(), r=rows.at(-1), n=E.meses.length-1;
  const sh=k=>r[k]/r.pib*100;
  return `<section class="statsec x"><h2><i></i>La economía hoy</h2>
    <div class="tiles">
      <div class="tile"><span class="l">EMAE, variación interanual</span><span class="v">${sg(pctv(E.tot[n],E.tot[n-12]))}<small>%</small></span><span class="p">${mlab(E.meses[n])}</span><a href="${SRC.actEmae.u}" target="_blank" rel="noopener">Fuente: INDEC ↗</a></div>
      <div class="tile"><span class="l">EMAE, variación mensual sin estacionalidad</span><span class="v">${sg(pctv(E.sa[n],E.sa[n-1]))}<small>%</small></span><span class="p">${mlab(E.meses[n])}</span><a href="${SRC.actEmae.u}" target="_blank" rel="noopener">Fuente: INDEC ↗</a></div>
      <div class="tile"><span class="l">Agro + minas y canteras en el PIB</span><span class="v">${nf(sh("A")+sh("C"),1)}<small>%</small></span><span class="p">Agro ${nf(sh("A"),1)}% · Minas ${nf(sh("C"),1)}% (${r.y==="12m"?"últimos 12 meses":r.y})</span><a href="${SRC.actPib.u}" target="_blank" rel="noopener">Fuente: INDEC ↗</a></div>
    </div>
    <div class="vgrid">${actMonitorHTML()}</div>
  </section>
  <section class="statsec x"><h2><i></i>La película completa: el PIB por sector</h2>
    <p class="note" style="max-width:76ch;margin-top:-8px">Cuánto pesa cada sector en la economía (a precios corrientes) y cuánto aportó cada uno al crecimiento (en volumen).</p>
    <div class="vgrid">
      <div class="vcard"><h3>Participación en el PIB<span class="tag">Barras al 100%</span></h3><p class="sub">Valor agregado de cada sector como % del PIB, a precios corrientes. El último bloque son los últimos 4 trimestres publicados</p><div class="vbox" id="actShare"></div><p class="read">El peso a precios corrientes mezcla volumen y precios relativos: una buena cosecha con precios bajos puede pesar menos que una mala con precios altos.</p>${srcRow(["actPib"])}</div>
      <div class="vcard"><h3>Ranking de sectores<span class="tag">Barras</span></h3><p class="sub">% del PIB en el último período y, con una marca, en el primer año de la serie</p><div class="vbox" id="actRank"></div>${srcRow(["actPib"])}</div>
      <div class="vcard wide"><h3>Quién empuja el crecimiento<span class="tag">Aportes</span></h3><p class="sub">Aporte de cada sector a la variación interanual del EMAE, en puntos porcentuales. Las barras suman la línea</p><div class="vbox" id="actApo"></div><p class="read">Aporte = peso del sector en el EMAE (VAB 2004 × nivel de actividad del año anterior) × su variación. Así se ve, por ejemplo, cuánto del crecimiento explica una cosecha récord o Vaca Muerta.</p>${srcRow(["actEmae"])}</div>
    </div>
  </section>
  <section class="statsec x"><h2><i></i>Hacia ${AN_FIN}: cuánto podrían pesar los tres sectores</h2>
    <p class="note" style="max-width:78ch;margin-top:-8px"><b>Ejercicio propio, no es un pronóstico oficial.</b> Parte de la participación del último año completo y la mueve con supuestos que podés cambiar: la tendencia de cada sector y la producción a régimen de los proyectos nuevos cargados en la Matriz (Circuito global y RIGI), valuada a los precios elegidos y pasada a pesos con el dólar mayorista promedio del año base. Mantiene constantes los precios relativos.</p>
    <div class="vgrid"><div class="vcard wide"><div class="pgrid"><div id="actCtl"></div><div><div class="vbox" id="actPrj"></div></div></div>${srcRow(["actPib","actEmae","actFx"])}</div></div>
  </section>`;
}
function actSectorHTML(s){
  return `<div class="actsec">${secTiles(s)}<div class="vgrid">${actMonitorHTML(TAB_GRP[s], "Indicadores mensuales del sector")}</div></div>`;
}
function drawAct(root){
  if(!ACT_OK) return;
  const run=(id,f)=>{ const el=document.getElementById(id); if(!el) return; el.innerHTML=""; try{ f(el); }catch(e){ console.error(id,e); el.innerHTML='<p class="note">No se pudo dibujar este gráfico.</p>'; } };
  run("actShare",pibShares); run("actRank",pibRank); run("actApo",apoChart);
  const ctl=document.getElementById("actCtl"); if(ctl){ try{ prjCtl(ctl); }catch(e){ console.error(e); } run("actPrj",prjDraw); }
  root.querySelectorAll(".actmon").forEach(c=>actMonitorBind(c));
  if(AC.sel) actDetail(document.getElementById("actDet"), AC.sel);
}
