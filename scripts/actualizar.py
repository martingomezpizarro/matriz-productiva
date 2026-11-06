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
import math
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
        self.act = leer_js(AUTO / "actividad.js", "ACT") if (AUTO / "actividad.js").exists() else {}
        self.sucio = set()

    def fuente(self, clave, titulo, url):
        self.fuentes[clave] = {"t": titulo, "u": url}
        self.sucio.add("fuentes")

    def guardar(self):
        if "viz" in self.sucio:
            escribir_js(AUTO / "viz.js", "VIZ", self.viz,
                        "// GENERADO por scripts/actualizar.py — las claves que el script no toca se conservan.")
        if "act" in self.sucio:
            escribir_js(AUTO / "actividad.js", "ACT", self.act,
                        "// GENERADO por scripts/actualizar.py (paso «actividad»): tablero mensual, EMAE y VAB por sector.\n"
                        "// Fuente: API de Series de Tiempo de datos.gob.ar. No editar a mano.")
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


def serie(ids, desde="2015-01-01", **extra):
    j = get(SERIES, params={"ids": ids, "start_date": desde, "limit": 5000, "format": "json", **extra}).json()
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
    res = next(r for r in pk["resources"] if str(anio) in (r.get("name") or "") and "ddjj" not in norm(r.get("name"))
               and (r.get("format") or "").lower() == "csv")
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


INDEC_FTP = "https://www.indec.gob.ar/ftp/cuadros/economia/"


# ---------------------------------------------------------------- Actividad: tablero mensual, EMAE y PIB por sector
# Todo sale de la API de Series de Tiempo (datos.gob.ar). Cada fila del tablero se baja por separado:
# si una serie deja de publicarse, esa fila queda afuera y el resto sigue.
IPC = "148.3_INIVELNAL_DICI_M_26"
DS = "https://datos.gob.ar/series/api/series/?ids="  # enlace legible para citar cada serie

# clave, grupo, nombre, unidad, id original, id desestacionalizado oficial, real (deflactar por IPC), fuente (organismo)
MONITOR = [
    ("emae", "tot", "EMAE · actividad económica total", "índice 2004 = 100", "143.3_NO_PR_2004_A_21", "143.3_NO_PR_2004_A_31", False, "INDEC"),
    ("petroleo", "og", "Producción de petróleo", "miles de bbl/d", "viz:oilTot", None, False, "Secretaría de Energía (Capítulo IV)"),
    ("gas", "og", "Producción de gas natural", "millones de m³", "364.3_PRODUCCIoNRAL__25", None, False, "Secretaría de Energía"),
    ("nafta", "og", "Ventas de naftas al mercado interno", "miles de m³", "38.3_N_1994_M_6", None, False, "Secretaría de Energía vía Ministerio de Economía"),
    ("gasoil", "og", "Ventas de gasoil al mercado interno", "m³", "38.3_G_1994_M_6", None, False, "Secretaría de Energía vía Ministerio de Economía"),
    ("minas", "mi", "EMAE · Explotación de minas y canteras", "índice 2004 = 100", "11.3_ISD_2004_M_26", None, False, "INDEC"),
    ("agro", "ag", "EMAE · Agricultura, ganadería, caza y silvicultura", "índice 2004 = 100", "11.3_ISOM_2004_M_39", None, False, "INDEC"),
    ("faena", "ag", "Faena vacuna", "cabezas", "40.3_VC_0_M_15", None, False, "SAGyP"),
    ("pesca", "ag", "EMAE · Pesca", "índice 2004 = 100", "11.3_VIPAA_2004_M_5", None, False, "INDEC"),
    ("ipi", "ind", "Producción industrial manufacturera (IPI)", "índice 2004 = 100", "453.1_SERIE_ORIGNAL_0_0_14_46", "453.1_SERIE_DESEADA_0_0_24_58", False, "INDEC"),
    ("acero", "ind", "Producción de acero crudo", "miles de t", "359.3_ACERO_CRUDUDO__11", None, False, "Cámara Argentina del Acero, republicado por el Ministerio de Economía"),
    ("isac", "con", "Actividad de la construcción (ISAC)", "índice 2004 = 100", "33.2_ISAC_NIVELRAL_0_M_18_63", None, False, "INDEC"),
    ("cemento", "con", "Despachos de cemento al mercado interno", "miles de t", "38.3_CEM_1994_M_7", None, False, "AFCP, republicado por el Ministerio de Economía"),
    ("issp", "ser", "Servicios públicos (ISSP)", "índice 2004 = 100", "302.3_S_ORIGINALRAL_0_S_21", "302.3_S_DESEST_NRAL_0_S_19", False, "INDEC"),
    ("expo", "cx", "Exportaciones de bienes", "millones de US$", "74.3_IET_0_M_16", None, False, "INDEC"),
    ("impo", "cx", "Importaciones de bienes", "millones de US$", "74.3_IIT_0_M_25", None, False, "INDEC"),
    ("prest", "fin", "Préstamos al sector privado en pesos (real)", "millones de $ del último mes", "91.1_DETALLE_PRPOT_0_0_25", None, True, "BCRA, deflactado por IPC del INDEC"),
    ("iva", "fis", "Recaudación de IVA DGI (real)", "millones de $ del último mes", "142.3_IVA_D_2001_M_7", None, True, "Secretaría de Hacienda, deflactado por IPC del INDEC"),
    ("cyd", "fis", "Impuesto a los créditos y débitos (real)", "millones de $ del último mes", "142.3_CREDI_2001_M_24", None, True, "Secretaría de Hacienda, deflactado por IPC del INDEC"),
]

# Sectores del PIB (letras CIIU). emae = índice mensual del EMAE, pib = VAB trimestral a precios corrientes,
# w = VAB 2004 a precios de 2004 (millones de $, INDEC, dataset 6.1): ponderación del EMAE base 2004.
SECTORES = [
    ("A", "Agro, ganadería y silvicultura", "ag", "11.3_ISOM_2004_M_39", "8.2_AGCS_2004_T_39", 39125.2),
    ("B", "Pesca", None, "11.3_VIPAA_2004_M_5", "8.2_P_2004_T_5", 1442.5),
    ("C", "Minas y canteras (petróleo, gas y minería)", "og", "11.3_ISD_2004_M_26", "8.2_EMC_2004_T_26", 24321.8),
    ("D", "Industria manufacturera", None, "11.3_VMASD_2004_M_23", "8.2_IM_2004_T_23", 91866.3),
    ("E", "Electricidad, gas y agua", None, "11.3_ITC_2004_M_21", "8.2_SEGA_2004_T_32", 8702.4),
    ("F", "Construcción", None, "11.3_VMATC_2004_M_12", "8.2_C_2004_T_12", 14904.7),
    ("G", "Comercio", None, "11.3_AGCS_2004_M_41", "8.2_CMMR_2004_T_41", 60034.6),
    ("H", "Hoteles y restaurantes", None, "11.3_P_2004_M_20", "8.2_HR_2004_T_20", 6936.0),
    ("I", "Transporte y comunicaciones", None, "11.3_EMC_2004_M_25", "8.2_TAC_2004_T_40", 29789.9),
    ("J", "Intermediación financiera", None, "11.3_IM_2004_M_25", "8.2_IF_2004_T_25", 15079.4),
    ("K", "Inmobiliarias, empresariales y de alquiler", None, "11.3_SEGA_2004_M_48", "8.2_AIEA_2004_T_48", 53084.4),
    ("L", "Administración pública y defensa", None, "11.3_C_2004_M_60", "8.2_APDPSSAO_2004_T_60", 21585.1),
    ("M", "Enseñanza", None, "11.3_CMMR_2004_M_10", "8.2_E_2004_T_10", 17057.4),
    ("N", "Salud y servicios sociales", None, "11.3_HR_2004_M_24", "8.2_SSS_2004_T_24", 13201.4),
    ("O", "Otros servicios comunitarios", None, "11.3_TAC_2004_M_60", "8.2_OASCSP_2004_T_60", 12253.5),
    ("T", "Impuestos netos de subsidios y resto", None, "11.3_IF_2004_M_25", None, 485115.2 - 409384.6),
]
PIB_PM = "8.2_PIBPM_2004_T_38"
FX_A3500 = "92.1_TCV_0_0_21"  # BCRA, tipo de cambio de valuación, mensual


def ym(ts) -> str:
    return pd.Timestamp(ts).strftime("%Y-%m")


def desestacionalizar(s: pd.Series):
    """Serie sin estacionalidad propia (STL sobre logaritmos, período 12). Sólo si no hay una oficial."""
    from statsmodels.tsa.seasonal import STL
    x = s.dropna()
    x = x[x > 0]
    # último tramo contiguo, hasta 12 años
    idx = pd.date_range(x.index.min(), x.index.max(), freq="MS")
    x = x.reindex(idx)
    if x.isna().any():
        x = x[x.isna()[::-1].cumsum()[::-1] == 0]
    x = x.tail(144)
    if len(x) < 48:
        return None
    r = STL(pd.Series(x.values, index=x.index).apply(lambda v: math.log(v)), period=12, robust=True).fit()
    return (r.trend + r.resid).apply(math.exp)


# filas del tablero que salen del EMAE: se reemplazan por los cuadros de INDEC cuando están disponibles
EMAE_FILA = {"emae": "tot", "minas": "C", "agro": "A", "pesca": "B"}


def paso_actividad(E: Estado):
    ipc = serie(IPC, "2015-01-01")[IPC].dropna()
    try:
        ind = emae_indec()
        print(f"   EMAE de INDEC hasta {ym(ind.index.max())}")
    except Exception as e:  # si el cuadro cambia de formato, se sigue con la API
        ind = None
        print(f"   EMAE de INDEC no disponible: {e}")
    filas, fallas = [], []
    for k, g, n, u, sid, said, real, org in MONITOR:
        sid_cita = None
        try:
            if ind is not None and k in EMAE_FILA:
                s = ind[EMAE_FILA[k]].dropna()
                if k == "emae":
                    said, s_sa = None, ind["sa"].dropna()
                sid_cita = INDEC_FTP + ("sh_emae_mensual_base2004.xls" if k == "emae" else "sh_emae_actividad_base2004.xls")
            elif sid.startswith("viz:"):
                s = pd.Series({pd.Timestamp(m + "-01"): v for m, v in E.viz[sid[4:]]}).sort_index()
            else:
                s = serie(sid, "2014-01-01")[sid].dropna()
            if s.empty:
                raise ValueError("sin datos")
            if real:
                s = (s / ipc.reindex(s.index) * ipc.iloc[-1]).dropna()
            sa, tipo = None, None
            if ind is not None and k == "emae":
                sa, tipo = s_sa, "oficial"
            elif said:
                sa = serie(said, "2014-01-01")[said].dropna()
                tipo = "oficial"
            else:
                sa = desestacionalizar(s)
                tipo = "propia" if sa is not None else None
            if s.index.max() < pd.Timestamp(HOY) - pd.DateOffset(months=15):
                raise ValueError(f"serie discontinuada (último dato {ym(s.index.max())})")
            filas.append({"k": k, "g": g, "n": n, "u": u, "id": sid, "url": sid_cita, "org": org, "real": real, "sa": tipo,
                          "s": [[ym(i), r1(v, 2)] for i, v in s[s.index >= "2016-01-01"].items()],
                          "d": [[ym(i), r1(v, 2)] for i, v in sa[sa.index >= "2016-01-01"].items()] if sa is not None else None})
        except Exception as e:
            fallas.append(f"{k}: {e}"[:120])
            print(f"   {k}: {e}")
    if len(filas) < 8:
        raise ValueError(f"Sólo {len(filas)} series del tablero respondieron: {'; '.join(fallas)}")

    # EMAE por sector, mensual
    ids = ",".join(s[3] for s in SECTORES)
    if ind is not None:
        em = ind[ind.index >= "2016-01-01"].rename(columns={**{s[0]: s[3] for s in SECTORES}, "tot": "143.3_NO_PR_2004_A_21", "sa": "143.3_NO_PR_2004_A_31"})
    else:
        em = serie(ids, "2016-01-01")
        tot = serie("143.3_NO_PR_2004_A_21,143.3_NO_PR_2004_A_31", "2016-01-01")
        em = em.join(tot).dropna(how="all")
    # INDEC deja huecos en algunas ramas (construcción, servicios comunitarios); se exigen completas sólo
    # las que el sitio usa en los aportes (agro, minas, industria, comercio) y el total.
    clave = [s[3] for s in SECTORES if s[0] in ("A", "C", "D", "G")] + ["143.3_NO_PR_2004_A_21", "143.3_NO_PR_2004_A_31"]
    em = em[em[clave].notna().all(axis=1)]
    if len(em) < 60:
        raise ValueError(f"EMAE sectorial demasiado corto ({len(em)} meses completos)")
    emae = {"meses": [ym(i) for i in em.index],
            "tot": [r1(v, 2) for v in em["143.3_NO_PR_2004_A_21"]],
            "sa": [r1(v, 2) for v in em["143.3_NO_PR_2004_A_31"]],
            "sec": {s[0]: [r1(v, 2) for v in em[s[3]]] for s in SECTORES if em[s[3]].notna().mean() > 0.5},
            "w04": 485115.2}

    # VAB a precios corrientes por sector, trimestral (las letras que INDEC dejó de abrir quedan en «Resto»)
    pids = [s[4] for s in SECTORES if s[4]] + [PIB_PM]
    pb = serie(",".join(pids), "2016-01-01").dropna(subset=[PIB_PM])
    pib = {"trim": [f"{i.year}-Q{(i.month - 1) // 3 + 1}" for i in pb.index], "pib": [r1(v, 0) for v in pb[PIB_PM]], "sec": {}}
    for s in SECTORES:
        if s[4] and pb[s[4]].notna().sum() >= len(pb) - 1 and pb[s[4]].iloc[-4:].notna().all():
            pib["sec"][s[0]] = [r1(v, 0) for v in pb[s[4]]]

    # Tipo de cambio mayorista promedio anual (para pasar a dólares el VAB del año base de la proyección)
    fxm = serie(FX_A3500, "2016-01-01")[FX_A3500].dropna()
    fxg = fxm.groupby(fxm.index.year).agg(["mean", "count"])
    fx = pd.Series({pd.Timestamp(f"{y}-01-01"): f["mean"] for y, f in fxg.iterrows() if f["count"] == 12})

    E.act = {"actualizado": HOY.isoformat(), "monitor": filas, "fallas": fallas, "emae": emae, "pib": pib,
             "fx": {str(i.year): r1(v, 2) for i, v in fx.items()},
             "sectores": [{"k": s[0], "n": s[1], "s": s[2], "w": s[5], "pib": bool(s[4] and s[0] in pib["sec"])} for s in SECTORES]}
    E.sucio.add("act")
    if ind is not None:
        E.fuente("actEmae", f"INDEC – EMAE por sector de actividad, base 2004, a {ymTxt(emae['meses'][-1])} (cuadros del EMAE)",
                 INDEC_FTP + "sh_emae_actividad_base2004.xls")
    else:
        E.fuente("actEmae", f"INDEC – EMAE por sector de actividad, base 2004, a {ymTxt(emae['meses'][-1])} (Series de Tiempo, datasets 11 y 143)",
                 DS + ",".join([s[3] for s in SECTORES]))
    E.fuente("actPib", f"INDEC – Valor agregado bruto por sector a precios corrientes, a {pib['trim'][-1]} (Series de Tiempo, dataset 8)",
             DS + ",".join(pids))
    E.fuente("actFx", "BCRA – Tipo de cambio de valuación (peso por dólar), promedio anual (Series de Tiempo)", DS + FX_A3500)
    for f in filas:
        if not f["id"].startswith("viz:"):
            E.fuente("act_" + f["k"], f"{f['org']} – {f['n']}, a {ymTxt(f['s'][-1][0])}" + (" (cuadros de INDEC)" if f["url"] else " (Series de Tiempo)"), f["url"] or DS + f["id"])
    return f"{len(filas)} series del tablero a {max(f['s'][-1][0] for f in filas)}; EMAE a {emae['meses'][-1]}; VAB a {pib['trim'][-1]}" + (f"; sin datos: {len(fallas)}" if fallas else "")


def ymTxt(m):  # "2026-07" -> "jul-2026"
    return mes_txt(m)






MESES_IDX = {m: i + 1 for i, m in enumerate(MESES)}


def indec_tabla(nombre, hoja=0):
    """Lee un cuadro mensual de INDEC (col 0 = año en enero, col 1 = mes) y devuelve (DataFrame con índice
    de fechas, fila de encabezados)."""
    raw = get(INDEC_FTP + nombre).content
    df = pd.read_excel(io.BytesIO(raw), sheet_name=hoja, header=None)
    hdr = df.iloc[2].tolist()
    anio, filas = None, []
    for _, r in df.iterrows():
        a, m = r.iloc[0], r.iloc[1]
        if isinstance(a, (int, float)) and not pd.isna(a) and 1990 < a < 2100:
            anio = int(a)
        if anio and isinstance(m, str) and norm(m).split(" ")[0] in MESES_IDX:
            filas.append((pd.Timestamp(anio, MESES_IDX[norm(m).split(" ")[0]], 1), r.iloc[2:].tolist()))
    if len(filas) < 120:
        raise ValueError(f"{nombre}: formato inesperado ({len(filas)} meses)")
    out = pd.DataFrame([v for _, v in filas], index=[f for f, _ in filas]).apply(pd.to_numeric, errors="coerce")
    return out, hdr[2:]


def emae_indec():
    """EMAE por letra, total y desestacionalizado, directo de los cuadros de INDEC (salen antes que en la API)."""
    let, hdr = indec_tabla("sh_emae_actividad_base2004.xls", "Tabla Letras")
    cols = {}
    for i, h in enumerate(hdr):
        h = str(h).strip()
        m = re.match(r"^([A-O])\s*-", h)
        if m:
            cols[m.group(1)] = let.columns[i]
        elif "impuesto" in norm(h):
            cols["T"] = let.columns[i]
    if len(cols) < 14:
        raise ValueError(f"EMAE por letra: columnas no reconocidas {hdr}")
    df = pd.DataFrame({k: let[c] for k, c in cols.items()})
    tot, _ = indec_tabla("sh_emae_mensual_base2004.xls")
    df["tot"], df["sa"] = tot.iloc[:, 0], tot.iloc[:, 2]
    return df.dropna(subset=["tot", "A", "C"])


# ---------------------------------------------------------------- orquestación
PASOS = {
    "siacam": ("nube", paso_siacam), "mercado": ("nube", paso_mercado), "precios": ("nube", paso_precios),
    "comercio": ("nube", paso_comercio), "emae": ("nube", paso_emae), "faena": ("nube", paso_faena),
    "provincias": ("nube", paso_provincias), "agricola": ("nube", paso_agricola),
    "actividad": ("nube", paso_actividad),
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
