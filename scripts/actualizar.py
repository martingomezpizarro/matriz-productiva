#!/usr/bin/env python3
"""
Actualiza los datos automáticos de Matriz Productiva (carpeta data/auto).

Cada paso baja una fuente, valida lo que bajó y reescribe su archivo. Si un paso
falla, se deja el dato anterior y se anota el error en data/auto/meta.js: nunca
se publica un archivo a medio armar.

Uso:
    python scripts/actualizar.py                 # todos los pasos de la nube
    python scripts/actualizar.py --grupo energia # sólo Energía (desde una PC en Argentina)
    python scripts/actualizar.py mercado precios # pasos sueltos

Grupos:
    nube     corre en GitHub Actions: SIACAM, Yahoo, Series de Tiempo, INDEC, MAGyP
    energia  Secretaría de Energía: su portal bloquea servidores fuera de Argentina,
             así que este grupo se corre desde una computadora en el país
"""
from __future__ import annotations

import argparse
import calendar
import datetime as dt
import io
import json
import re
import sys
import traceback
import unicodedata
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[1]
AUTO = ROOT / "data" / "auto"
GEO = ROOT / "data" / "geo"
UA = {"User-Agent": "Mozilla/5.0 (matriz-productiva; +https://matrizproductiva.martingomezpizarro.com.ar)"}
HOY = dt.date.today()
MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]


# ---------------------------------------------------------------- utilidades
def fecha_txt(d: dt.date) -> str:
    return f"{d.day}-{MES[d.month - 1]}-{d.year}"


def mes_txt(ym: str) -> str:  # "2026-08" -> "ago-2026"
    y, m = ym.split("-")[:2]
    return f"{MES[int(m) - 1]}-{y}"


def norm(s) -> str:
    s = unicodedata.normalize("NFD", str(s)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def slug(s) -> str:
    return norm(s).replace(" ", "-")


def get(url, **kw) -> requests.Response:
    r = requests.get(url, headers=UA, timeout=kw.pop("timeout", 180), **kw)
    r.raise_for_status()
    return r


def leer_js(path: Path, var: str):
    txt = path.read_text(encoding="utf-8")
    m = re.search(rf"(?:const {var} =|Object\.assign\({var}, )\s*", txt)
    if not m:
        raise ValueError(f"No encontré {var} en {path.name}")
    obj, _ = json.JSONDecoder().raw_decode(txt[m.end():])
    return obj


def escribir_js(path: Path, var: str, obj, cabecera: str, assign=False):
    cuerpo = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    linea = f"Object.assign({var}, {cuerpo});" if assign else f"const {var} = {cuerpo};"
    path.write_text(cabecera.rstrip() + "\n" + linea + "\n", encoding="utf-8")


def r1(x, n=1):
    return None if x is None or pd.isna(x) else round(float(x), n)


class Estado:
    """Carga los archivos automáticos una vez y los guarda al final si cambiaron."""

    def __init__(self):
        self.viz = leer_js(AUTO / "viz.js", "VIZ")
        self.meta = leer_js(AUTO / "meta.js", "META")
        self.fuentes = leer_js(AUTO / "fuentes-auto.js", "SRC")
        self.sucio = set()

    def fuente(self, clave, titulo, url):
        self.fuentes[clave] = {"t": titulo, "u": url}
        self.sucio.add("fuentes")

    def guardar(self):
        if "viz" in self.sucio:
            escribir_js(AUTO / "viz.js", "VIZ", self.viz,
                        "// GENERADO por scripts/actualizar.py — las claves que el script no toca se conservan.")
        if "fuentes" in self.sucio:
            escribir_js(AUTO / "fuentes-auto.js", "SRC", self.fuentes,
                        "// GENERADO por scripts/actualizar.py — títulos de fuentes con la fecha de la última descarga.\n"
                        "// Pisa las entradas de data/manual/fuentes.js con la misma clave.", assign=True)
        escribir_js(AUTO / "meta.js", "META", self.meta,
                    "// GENERADO por scripts/actualizar.py — fecha y resultado de cada paso automático.")


# ---------------------------------------------------------------- SIACAM
SIACAM_URL = "https://www.mecon.gob.ar/dataset/Cartera-de-Proyectos-Mineros-Metaliferos-y-Litio-del-SIACAM.xlsx"
CLAVES_EMP = {  # controlante según SIACAM -> clave de data/manual/empresas.js
    "glencore": "glencore", "galan lithium": "galan", "rio tinto": "riotinto", "ganfeng": "ganfeng",
    "lithium argentina": "lar", "triangle lithium": "lar", "eramet": "eramet", "pan american silver": "paas",
    "newmont": "newmont", "anglogold": "anglo", "abrasilver": "abra", "cerrado gold": "cerrado",
    "posco": "posco", "barrick": "barrick", "fortuna mining": "fortuna", "mcewen": "mcewen",
    "hochschild": "hochschild", "first quantum": "fqm", "zijin": "zijin", "shandong gold": "shandong",
    "lundin": "lundin", "bhp": "bhp",
}


def clave_emp(nombre):
    n = norm(nombre)
    return next((v for k, v in CLAVES_EMP.items() if n.startswith(k)), None)


def paso_siacam(E: Estado):
    previo = leer_js(AUTO / "siacam.js", "SIACAM")
    ids_previos = {}
    for o in previo:  # conserva los ids (los usan las fichas cargadas a mano)
        ids_previos.setdefault((norm(o["n"]), o["prov"], o["min"]), []).append(o["id"])
    df = pd.read_excel(io.BytesIO(get(SIACAM_URL).content), sheet_name=0)
    df.columns = [str(c).strip().upper() for c in df.columns]
    falta = {"NOMBRE", "LATITUD", "LONGITUD", "MINERAL PRINCIPAL", "PROVINCIA", "ESTADO"} - set(df.columns)
    if falta:
        raise ValueError(f"El XLSX cambió de formato; faltan columnas {falta}")
    vacio = lambda v: v is None or (isinstance(v, float) and pd.isna(v)) or str(v).strip() in ("", "-")
    usados, out = set(), []
    for _, f in df.iterrows():
        if vacio(f["NOMBRE"]) or vacio(f["LATITUD"]):
            continue
        n, prov, mineral = str(f["NOMBRE"]).strip(), str(f["PROVINCIA"]).strip(), str(f["MINERAL PRINCIPAL"]).strip()
        cola = ids_previos.get((norm(n), prov, mineral), [])
        id_ = cola.pop(0) if cola else None
        if not id_ or id_ in usados:
            base = id_ = "mi-" + slug(n)
            k = 2
            while id_ in usados:
                id_, k = f"{base}-{k}", k + 1
        usados.add(id_)
        ctrl = []
        for i in (1, 2, 3):
            nom = f.get(f"CONTROLANTE ({i}°)")
            if vacio(nom):
                continue
            pct, orig = f.get(f"PORCENTAJE ({i}°)"), f.get(f"ORIGEN ({i}°)")
            pct = None if vacio(pct) else round(float(pct) * (100 if float(pct) <= 1 else 1), 1)
            ctrl.append([str(nom).strip(), pct, "" if vacio(orig) else str(orig).strip(), clave_emp(nom)])
        out.append({"id": id_, "n": n, "prov": prov, "ll": [round(float(f["LATITUD"]), 4), round(float(f["LONGITUD"]), 4)],
                    "est": str(f["ESTADO"]).strip(), "min": mineral, "ctrl": ctrl})
    if len(out) < 0.8 * len(previo):
        raise ValueError(f"Sólo {len(out)} proyectos contra {len(previo)} anteriores: no lo publico")
    escribir_js(AUTO / "siacam.js", "SIACAM", out,
                "// GENERADO por scripts/actualizar.py desde la cartera oficial SIACAM (Secretaría de Minería).")
    E.fuente("siacam", f"Secretaría de Minería – Cartera de proyectos mineros (SIACAM), descarga del {fecha_txt(HOY)}", SIACAM_URL)
    return f"{len(out)} proyectos ({len(out) - len(previo):+d})"


# ---------------------------------------------------------------- Yahoo
REC = {"strong_buy": "Compra fuerte", "buy": "Compra", "hold": "Mantener",
       "underperform": "Bajo rendimiento", "sell": "Venta", "strong_sell": "Venta fuerte"}


def paso_mercado(E: Estado):
    import yfinance as yf
    mk = leer_js(AUTO / "mercado.js", "MK")
    ok = []
    for k, v in mk.items():
        try:
            i = yf.Ticker(v["tk"]).info
            px = i.get("currentPrice") or i.get("regularMarketPrice")
            if not px:
                continue
            d = {"tk": v["tk"], "px": r1(px, 2), "lo": r1(i.get("fiftyTwoWeekLow"), 2), "hi": r1(i.get("fiftyTwoWeekHigh"), 2),
                 "cap": round(i["marketCap"] / 1e6) if i.get("marketCap") else v.get("cap"),
                 "tgt": r1(i.get("targetMeanPrice"), 2), "rec": REC.get(i.get("recommendationKey"), v.get("rec")),
                 "n": i.get("numberOfAnalystOpinions"), "fpe": r1(i.get("forwardPE"))}
            if i.get("financialCurrency") == "USD":  # múltiplos sólo si reporta en dólares
                d["ev"] = r1(i.get("enterpriseToEbitda"))
                if i.get("ebitda") and i.get("totalDebt") is not None:
                    d["nd"] = r1((i["totalDebt"] - (i.get("totalCash") or 0)) / i["ebitda"], 2)
                if i.get("ebitdaMargins") is not None:
                    d["mg"] = round(i["ebitdaMargins"] * 100)
            mk[k] = {a: b for a, b in d.items() if b is not None}
            ok.append(k)
        except Exception as e:  # una acción que falla no frena al resto
            print(f"   {v['tk']}: {e}")
    if not ok:
        raise RuntimeError("Yahoo no devolvió ninguna cotización")
    escribir_js(AUTO / "mercado.js", "MK", mk,
                "// GENERADO por scripts/actualizar.py desde Yahoo Finance (no oficial). cap en US$ M.\n"
                "// ev = EV/EBITDA y nd = deuda neta/EBITDA sólo cuando la empresa reporta en dólares.")
    E.fuente("yahoo", f"Yahoo Finance (no oficial), cotizaciones al {fecha_txt(HOY)}", "https://finance.yahoo.com")
    return f"{len(ok)}/{len(mk)} cotizaciones"


def mensual(tk, desde, como="last"):
    """Serie mensual de Yahoo (cierre o promedio), sólo meses completos."""
    import yfinance as yf
    h = yf.Ticker(tk).history(start=desde, interval="1d", auto_adjust=True)["Close"].dropna()
    h.index = h.index.tz_localize(None)
    s = h.resample("MS").mean() if como == "mean" else h.resample("MS").last()
    s.index = s.index.strftime("%Y-%m")
    return s[s.index < HOY.strftime("%Y-%m")]


COMMOD = {"Brent": "BZ=F", "Oro": "GC=F", "Cobre": "HG=F", "Soja (CBOT)": "ZS=F"}


def paso_precios(E: Estado):
    v = E.viz
    # Brent: promedio mensual desde 2018
    b = mensual("BZ=F", "2018-01-01", "mean")
    v["brent"] = [[m, r1(x, 2)] for m, x in b.items()]
    # Granos: cierres mensuales de los últimos 60 meses, en US$ por tonelada
    desde = (pd.Timestamp(HOY) - pd.DateOffset(months=61)).strftime("%Y-%m-01")
    s, c, t = mensual("ZS=F", desde), mensual("ZC=F", desde), mensual("ZW=F", desde)
    g = pd.concat({"s": s * 0.367437, "c": c * 0.393683, "t": t * 0.367437}, axis=1).dropna().tail(60)
    v["granos"] = [[m, r1(f.s), r1(f.c), r1(f.t)] for m, f in g.iterrows()]
    # Acciones vs. commodity: últimos 24 meses completos, base primer mes = 100
    desde = (pd.Timestamp(HOY) - pd.DateOffset(months=26)).strftime("%Y-%m-01")
    filas, meses = v["pairs"]["rows"], None
    for r in filas:
        a, bb = mensual(r["t"], desde), mensual(COMMOD[r["c"]], desde)
        df = pd.concat({"a": a, "b": bb}, axis=1).tail(24)
        meses = list(df.index)
        base = lambda col: next(x for x in df[col] if pd.notna(x))
        r["a"] = [r1(x / base("a") * 100) if pd.notna(x) else None for x in df["a"]]
        r["b"] = [r1(x / base("b") * 100) if pd.notna(x) else None for x in df["b"]]
    v["pairs"]["months"] = meses
    E.sucio.add("viz")
    E.fuente("yfFut", f"Yahoo Finance – Futuros de Brent (BZ=F), oro (GC=F), cobre (HG=F) y soja (ZS=F), cierres mensuales a {mes_txt(meses[-1])}",
             "https://finance.yahoo.com/quote/BZ=F")
    E.fuente("yfBrent", f"Yahoo Finance – Futuro del Brent (BZ=F), promedio mensual a {mes_txt(v['brent'][-1][0])}",
             "https://finance.yahoo.com/quote/BZ=F")
    E.fuente("yahooM", f"Yahoo Finance (no oficial), cierres mensuales a {mes_txt(meses[-1])}", "https://finance.yahoo.com")
    E.fuente("cbot", f"Futuros CBOT de soja, maíz y trigo (ZS=F, ZC=F, ZW=F) vía Yahoo Finance, cierres mensuales a {mes_txt(v['granos'][-1][0])}",
             "https://finance.yahoo.com/quote/ZS=F")
    return f"Brent a {v['brent'][-1][0]}, granos a {v['granos'][-1][0]}, acciones a {meses[-1]}"


# ---------------------------------------------------------------- Series de Tiempo / INDEC
SERIES = "https://apis.datos.gob.ar/series/api/series/"


def serie(ids, desde="2015-01-01"):
    j = get(SERIES, params={"ids": ids, "start_date": desde, "limit": 5000, "format": "json"}).json()
    cols = ["fecha"] + ids.split(",")
    df = pd.DataFrame(j["data"], columns=cols)
    df["fecha"] = pd.to_datetime(df["fecha"])
    return df.set_index("fecha")


def paso_comercio(E: Estado):
    # Serie trimestral oficial; si no trae datos, se arma sumando la mensual.
    trim, mens = "74.2_IECE_0_T_35,74.2_IICL_0_T_42", "74.3_IECE_0_M_35,74.3_IICL_0_M_42"
    filas, ids = [], trim
    df = serie(trim, "2018-01-01")
    print(f"   trimestral: {len(df)} filas, no nulas {df.notna().sum().to_dict()}")
    for f, r in df.dropna().iterrows():
        filas.append([f"{f.year}-Q{(f.month - 1) // 3 + 1}", r1(r.iloc[0]), r1(r.iloc[1])])
    if len(filas) < 20:
        ids = mens
        df = serie(mens, "2018-01-01")
        print(f"   mensual: {len(df)} filas, no nulas {df.notna().sum().to_dict()}")
        q = df.groupby(df.index.to_period("Q"))
        filas = [[f"{p.year}-Q{p.quarter}", r1(g.iloc[:, 0].sum()), r1(g.iloc[:, 1].sum())]
                 for p, g in q if g.iloc[:, 0].notna().sum() == 3 and g.iloc[:, 1].notna().sum() == 3]
    if len(filas) < 20:
        raise ValueError(f"Serie trimestral demasiado corta ({len(filas)} trimestres)")
    E.viz["trade"] = filas
    E.sucio.add("viz")
    E.fuente("icaQ", f"INDEC – Intercambio Comercial Argentino: exportación de combustibles y energía e importación de combustibles y lubricantes, a {filas[-1][0]} (Series de Tiempo)",
             SERIES + "?ids=" + ids + "&format=csv")
    return f"hasta {filas[-1][0]}"


def paso_emae(E: Estado):
    ids = "11.3_ISOM_2004_M_39,11.3_ISD_2004_M_26,143.3_NO_PR_2004_A_31"
    df = serie(ids, "2017-01-01")
    g = df.groupby(df.index.year).agg(["mean", "count"])
    anios = [y for y in g.index if all(g.loc[y, (c, "count")] == 12 for c in ids.split(","))]
    if 2017 not in anios:
        raise ValueError("No hay año base 2017 completo")
    base = {c: g.loc[2017, (c, "mean")] for c in ids.split(",")}
    E.viz["emae"] = [[int(y)] + [r1(g.loc[y, (c, "mean")] / base[c] * 100) for c in ids.split(",")] for y in anios]
    E.sucio.add("viz")
    E.fuente("emae", f"INDEC – EMAE, apertura sectorial, base 2004, promedios anuales hasta {anios[-1]} (Series de Tiempo)",
             SERIES + "?ids=" + ids + "&format=csv")
    return f"2017–{anios[-1]}"


def paso_faena(E: Estado):
    ids = "40.2_VC_0_T_15"
    df = serie(ids, "2015-01-01").dropna()
    if df.empty:
        raise ValueError("La serie de faena no trae datos")
    g = df.groupby(df.index.year)[ids].agg(["sum", "count"])
    E.viz["faena"] = [[int(y), r1(f["sum"] / 1e6, 2)] for y, f in g.iterrows() if f["count"] == 4]
    E.sucio.add("viz")
    E.fuente("faenaSt", f"SAGyP – Faena de cabezas vacunas, hasta {E.viz['faena'][-1][0]} (Series de Tiempo, dataset 40)",
             SERIES + "?ids=" + ids + "&format=csv")
    return f"hasta {E.viz['faena'][-1][0]}"


PROV_URL = "https://infra.datos.gob.ar/catalog/sspm/dataset/350/distribution/350.1/download/exportaciones-provincia-rubro.csv"


def paso_provincias(E: Estado):
    df = pd.read_csv(io.StringIO(get(PROV_URL).text))
    df = df.dropna(subset=["total_exportaciones_total_exportaciones"])
    f = df.iloc[-1]
    anio = int(str(f["indice_tiempo"])[:4])
    prov = {}
    for nombre in E.viz["prov24"]:
        s = "ciudad_de_buenos_aires" if nombre.startswith("Ciudad") else slug(nombre).replace("-", "_")
        prov[nombre] = [r1(f[f"{s}_{r}"]) for r in ("pp", "moa", "moi", "cye")]
    E.viz["prov24"] = prov
    E.viz["tot24"] = [r1(f[f"total_exportaciones_{r}"]) for r in ("pp", "moa", "moi", "cye", "total_exportaciones")]
    E.viz["provAnio"] = anio
    E.sucio.add("viz")
    E.fuente("expProv", f"INDEC / Subsecretaría de Programación Macroeconómica – Exportaciones por provincia y rubro, {anio}", PROV_URL)
    return f"año {anio}"


# ---------------------------------------------------------------- MAGyP
def paso_agricola(E: Estado):
    pk = get("https://datos.magyp.gob.ar/api/3/action/package_show", params={"id": "estimaciones-agricolas"}).json()["result"]
    res = next(r for r in pk["resources"] if (r.get("format") or "").lower() == "csv" and norm(r.get("name")) == "estimaciones agricolas")
    raw = get(res["url"], timeout=600).content
    df = pd.read_csv(io.BytesIO(raw), encoding="utf-8", low_memory=False,
                     usecols=["cultivo", "campania", "provincia", "departamento", "produccion_tm"])
    df["c"] = df["cultivo"].map(norm)
    df["produccion_tm"] = pd.to_numeric(df["produccion_tm"], errors="coerce").fillna(0)
    nac_prev = E.viz["nac"]
    control = sorted(nac_prev)[-2]  # campaña ya publicada para validar qué cultivos sumar

    # Elige, para cada cultivo, la regla cuyo total reproduce la campaña de control.
    def reglas(base):
        cs = sorted(set(c for c in df["c"].unique() if c.split(" ")[0] == base))
        yield [f"{base} total"]
        yield [c for c in cs if "total" not in c]
        yield [base]
        yield [c for c in cs if c.startswith(base + " pan")]
    elegidas = {}
    for i, base in enumerate(["soja", "maiz", "trigo"]):
        meta = nac_prev[control][i]
        for regla in reglas(base):
            tot = df[df["c"].isin(regla) & (df["campania"] == control)]["produccion_tm"].sum()
            if regla and tot and abs(tot / meta - 1) < 0.02:
                elegidas[base] = regla
                break
        else:
            raise ValueError(f"No pude reproducir {base} {control} ({meta:,.0f} t); cultivos: {sorted(df['c'].unique())[:60]}")
    camp = sorted(df["campania"].dropna().unique())
    nac = {}
    for cp in camp:
        tots = [df[df["c"].isin(elegidas[b]) & (df["campania"] == cp)]["produccion_tm"].sum() for b in ("soja", "maiz", "trigo")]
        nac[cp] = [round(t) for t in tots]
    completas = [cp for cp in camp if all(nac[cp]) and
                 all(nac[cp][i] > 0.4 * nac[control][i] for i in range(3))]
    ultima = completas[-1]
    E.viz["nac"] = {cp: nac[cp] for cp in completas[-4:]}
    # Producción por departamento de la última campaña completa (miles de t)
    sub = df[df["campania"] == ultima]
    por = {}
    for b, k in (("soja", "s"), ("maiz", "m"), ("trigo", "t")):
        g = sub[sub["c"].isin(elegidas[b])].groupby([sub["provincia"].map(norm), sub["departamento"].map(norm)])["produccion_tm"].sum()
        for (p, d), v in g.items():
            por.setdefault((p, d), {})[k] = v
    topo = leer_js(GEO / "departamentos.js", "DEPTOS_TOPO")
    geos = next(iter(topo["objects"].values()))["geometries"]
    hits = 0
    for gm in geos:
        pr = gm["properties"]
        clave = (norm(pr["p"]), norm(pr["n"].replace(" (incluye Lezama)", "")))
        val = por.get(clave)
        if val:
            hits += 1
        for k in ("s", "m", "t"):
            x = (val or {}).get(k, 0) / 1000
            if x >= 0.05:
                pr[k] = round(x, 1)
            else:
                pr.pop(k, None)
    con_dato = sum(1 for (p, d) in por if any(por[(p, d)].values()))
    if hits < 0.85 * min(con_dato, len(geos)):
        raise ValueError(f"Sólo crucé {hits} de {con_dato} departamentos con producción: no lo publico")
    E.viz["agCamp"] = ultima
    E.sucio.add("viz")
    escribir_js(GEO / "departamentos.js", "DEPTOS_TOPO", topo,
                "// Límites departamentales (TopoJSON, IGN) con producción de soja (s), maíz (m) y trigo (t) en miles de t\n"
                "// de la última campaña completa de MAGyP. GENERADO por scripts/actualizar.py.")
    E.fuente("magypEst", f"MAGyP – Estimaciones agrícolas por departamento, campaña {ultima} (archivo del {res.get('last_modified', '')[:10]})",
             "https://datos.magyp.gob.ar/dataset/estimaciones-agricolas")
    return f"campaña {ultima}, {hits} departamentos"


# ---------------------------------------------------------------- Energía (desde Argentina)
ENERGIA = "http://datos.energia.gob.ar/api/3/action/package_show"
BBL = 6.28981
AREAS = {  # nombre normalizado del área en Capítulo IV -> id del activo en el mapa
    "loma campana": "og-lc", "la amarga chica": "og-lac", "bandurria sur": "og-bs",
    "bajada del palo oeste": "og-bdpo", "fortin de piedra": "og-fp", "aguada pichana este": "og-ape",
    "loma la lata sierra barrosa": "og-lll", "cerro dragon": "og-cd", "cuenca marina austral 1": "og-fenix",
    "bajo del choique la invernada": "og-bdc", "rincon de aranda": "og-rda",
}
OPERADORES = {  # inicio del nombre normalizado de la empresa -> clave de empresas.js
    "ypf": "ypf", "pan american": "pae", "pluspetrol": "pluspetrol", "vista": "vista", "shell": "shell",
    "chevron": "chevron", "tecpetrol": "tecpetrol", "pampa": "pampa", "total austral": "total",
    "totalenergies": "total",
}
NOMBRE_OP = {"pecom": "PECOM", "phoenix": "Phoenix Global Resources", "capex": "Capex", "cgc": "CGC",
             "compania general de combustibles": "CGC", "president": "President Petroleum",
             "petrolera aconcagua": "Petrolera Aconcagua", "crown point": "Crown Point", "medanito": "Medanito"}


def nombre_operador(emp):
    n = norm(emp)
    k = next((v for p, v in OPERADORES.items() if n.startswith(p)), None)
    if k:
        return k, None
    corto = next((v for p, v in NOMBRE_OP.items() if n.startswith(p)), None)
    if not corto:
        corto = re.sub(r"\b(s ?a ?u?|s ?r ?l|sucursal argentina|sociedad anonima|argentina|energia)\b", "", n).strip().title()
    return None, corto


def paso_energia(E: Estado):
    pk = get(ENERGIA, params={"id": "produccion-de-petroleo-y-gas-por-pozo"}, timeout=60).json()["result"]
    anio = HOY.year if HOY.month > 2 else HOY.year - 1  # en ene/feb todavía se completa el año anterior
    res = next(r for r in pk["resources"] if str(anio) in (r.get("name") or "") and (r.get("format") or "").lower() == "csv")
    df = pd.read_csv(io.BytesIO(get(res["url"], timeout=900).content), low_memory=False)
    df.columns = [c.strip().lower() for c in df.columns]
    need = {"mes", "prod_pet", "prod_gas", "empresa", "areapermisoconcesion", "provincia", "tipo_de_recurso"}
    if need - set(df.columns):
        raise ValueError(f"Capítulo IV cambió de formato; faltan {need - set(df.columns)}")
    for c in ("prod_pet", "prod_gas"):
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)
    tot = df.groupby("mes")[["prod_pet", "prod_gas"]].sum().sort_index()
    dias = {m: calendar.monthrange(anio, int(m))[1] for m in tot.index}
    bbl = {int(m): tot.loc[m, "prod_pet"] * BBL / dias[m] for m in tot.index}
    # último mes completo: el que no cae más de 10% contra el mes anterior (las DDJJ llegan tarde)
    meses = sorted(bbl)
    ult = meses[-1]
    while len(meses) > 1 and bbl[ult] < 0.9 * bbl[meses[meses.index(ult) - 1]]:
        ult = meses[meses.index(ult) - 1]
    m = df[df["mes"] == ult]
    d = calendar.monthrange(anio, ult)[1]
    pet = lambda x: round(x * BBL / d)
    gas = lambda x: round(x / 1000 / d, 2)
    nqn_nc = m[(m["provincia"].map(norm) == "neuquen") & (m["tipo_de_recurso"].map(norm) == "no convencional")]["prod_pet"].sum()
    areas = m.groupby("areapermisoconcesion").agg(pet=("prod_pet", "sum"), gas=("prod_gas", "sum"))
    op_area = m.groupby(["areapermisoconcesion", "empresa"])["prod_pet"].sum().reset_index().sort_values("prod_pet").drop_duplicates("areapermisoconcesion", keep="last").set_index("areapermisoconcesion")["empresa"]
    fil_area = []
    for a, f in areas.iterrows():
        k, corto = nombre_operador(op_area.get(a, ""))
        fil_area.append({"n": str(a).strip().title(), "id": AREAS.get(norm(a)), "op": k, "opn": corto,
                         "pet": pet(f["pet"]), "gas": gas(f["gas"])})
    ops = m.groupby("empresa").agg(pet=("prod_pet", "sum"), gas=("prod_gas", "sum"))
    fil_op = []
    for e, f in ops.iterrows():
        k, corto = nombre_operador(e)
        fil_op.append({"k": k, "n": corto, "pet": pet(f["pet"]), "gas": gas(f["gas"])})
    # agrupa sucursales de una misma operadora
    junt = {}
    for o in fil_op:
        j = junt.setdefault(o["k"] or o["n"], {"k": o["k"], "n": o["n"], "pet": 0, "gas": 0})
        j["pet"] += o["pet"]; j["gas"] = round(j["gas"] + o["gas"], 2)
    ym = f"{anio}-{ult:02d}"
    prod = {
        "mes": ym, "mesTxt": f"{MESES[ult - 1]} {anio}",
        "pet": pet(tot.loc[ult, "prod_pet"]) if ult in tot.index else pet(m["prod_pet"].sum()),
        "gas": gas(m["prod_gas"].sum()), "nqnNC": pet(nqn_nc),
        "mensual": [[MESES[k - 1].capitalize(), round(bbl[k])] for k in meses if k <= ult],
        "areasPet": sorted(fil_area, key=lambda x: -x["pet"])[:40],
        "areasGas": sorted(fil_area, key=lambda x: -x["gas"])[:40],
        "operadores": sorted(junt.values(), key=lambda x: -x["pet"])[:30],
        "fuente": res["url"],
    }
    escribir_js(AUTO / "produccion.js", "PROD", prod,
                "// GENERADO por scripts/actualizar.py desde Capítulo IV (Secretaría de Energía).\n"
                "// Petróleo en bbl/d y gas en MMm³/d del último mes completo.")
    # serie mensual total (kbbl/d) para el gráfico de Brent vs. producción
    tot_serie = {r[0]: r[1] for r in E.viz.get("oilTot", [])}
    for k in meses:
        if k <= ult:
            tot_serie[f"{anio}-{k:02d}"] = round(bbl[k] / 1000, 1)
    E.viz["oilTot"] = [[a, b] for a, b in sorted(tot_serie.items())]
    # serie por tipo de recurso (convencional / shale / tight), si el archivo trae el subtipo
    sub = next((c for c in ("sub_tipo_recurso", "subtipo_recurso", "sub_tipo_de_recurso") if c in df.columns), None)
    if sub:
        tipos = {r[0]: r[1:] for r in E.viz.get("oilType", [])}
        for k in meses:
            if k > ult:
                continue
            mm, dd = df[df["mes"] == k], calendar.monthrange(anio, k)[1]
            conv = mm[mm["tipo_de_recurso"].map(norm) == "convencional"]["prod_pet"].sum()
            sh = mm[mm[sub].map(norm) == "shale"]["prod_pet"].sum()
            ti = mm[mm[sub].map(norm) == "tight"]["prod_pet"].sum()
            tipos[f"{anio}-{k:02d}"] = [round(x * BBL / dd / 1000, 1) for x in (conv, sh, ti)]
        E.viz["oilType"] = [[a, *b] for a, b in sorted(tipos.items())]
    E.sucio.add("viz")
    E.fuente("cap4", f"Secretaría de Energía – Producción por pozo (Capítulo IV), {mes_txt(ym)} (descarga del {fecha_txt(HOY)})",
             "http://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo")
    E.fuente("cap4hist", f"Secretaría de Energía – Producción de petróleo por tipo de recurso (Capítulo IV), a {mes_txt(ym)}",
             "http://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo")
    return f"{mes_txt(ym)}: {prod['pet']:,} bbl/d".replace(",", ".")


# ---------------------------------------------------------------- orquestación
PASOS = {
    "siacam": ("nube", paso_siacam), "mercado": ("nube", paso_mercado), "precios": ("nube", paso_precios),
    "comercio": ("nube", paso_comercio), "emae": ("nube", paso_emae), "faena": ("nube", paso_faena),
    "provincias": ("nube", paso_provincias), "agricola": ("nube", paso_agricola),
    "energia": ("energia", paso_energia),
}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pasos", nargs="*", help=f"pasos sueltos: {', '.join(PASOS)}")
    ap.add_argument("--grupo", choices=["nube", "energia", "todo"], default="nube")
    a = ap.parse_args()
    if set(a.pasos) - set(PASOS):
        ap.error(f"pasos desconocidos: {', '.join(set(a.pasos) - set(PASOS))}")
    elegidos = a.pasos or [p for p, (g, _) in PASOS.items() if a.grupo in (g, "todo")]
    E = Estado()
    fallas = 0
    for p in elegidos:
        print(f"→ {p}")
        try:
            detalle = PASOS[p][1](E)
            E.meta.setdefault("pasos", {})[p] = {"fecha": HOY.isoformat(), "ok": True, "detalle": detalle}
            print(f"   ok · {detalle}")
        except Exception as e:
            fallas += 1
            E.meta.setdefault("pasos", {}).setdefault(p, {})
            E.meta["pasos"][p].update({"ok": False, "error": f"{type(e).__name__}: {e}"[:300], "intento": HOY.isoformat()})
            print(f"   FALLÓ · {e}")
            traceback.print_exc(limit=2)
    if fallas < len(elegidos):
        E.meta["actualizado"] = HOY.isoformat()
    E.guardar()
    print(f"\nListo: {len(elegidos) - fallas} pasos bien, {fallas} con error.")
    sys.exit(1 if fallas == len(elegidos) else 0)


if __name__ == "__main__":
    main()
