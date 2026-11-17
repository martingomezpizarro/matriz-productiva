"""
Matriz Productiva · capa MUNDO
Baja activos de petróleo y gas, minería y agro de todo el mundo, con sus dueños y
participaciones, y arma data/auto/mundo.js para la página mundo.html.

Fuentes (todas abiertas, se citan en la página):
  GEM  Global Energy Monitor – trackers GOGET (yacimientos), GIOMT (hierro), GCMT (carbón). CC BY 4.0.
       Se leen del repositorio público de mapas de GEM (github.com/GlobalEnergyMonitor/maps).
  CT   Climate TRACE API v6 – minas de cobre y bauxita, refinerías (actividad, capacidad,
       intensidad de emisiones, dueños). CC BY 4.0.
  FAO  FAOSTAT – producción, superficie y rendimiento por país (QCL).
  PSD  USDA FAS – Production, Supply & Distribution: exportaciones por país.

Corre en GitHub Actions (los portales no responden desde todas las redes).
Si una fuente falla, conserva lo que había en el archivo anterior para esa fuente.
"""
import io, json, re, zipfile, datetime as dt, gettext, time
from pathlib import Path
import requests, pandas as pd, pycountry

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "auto" / "mundo.js"
H = {"User-Agent": "MatrizProductiva/1.0 (+https://matrizproductiva.martingomezpizarro.com.ar)"}
HOY = dt.date.today().isoformat()
GEMRAW = "https://raw.githubusercontent.com/GlobalEnergyMonitor/maps/main/trackers/"

def get(url, **kw):
    for i in range(3):
        try:
            r = requests.get(url, headers=H, timeout=180, **kw); r.raise_for_status(); return r
        except Exception as e:
            err = e; time.sleep(3 + 5 * i)
    raise err

# ---------- países ----------
try:
    ES = gettext.translation("iso3166-1", pycountry.LOCALES_DIR, languages=["es"]).gettext
except Exception:
    ES = lambda s: s
ALIAS = {"Russia": "RUS", "Iran": "IRN", "Venezuela": "VEN", "Bolivia": "BOL", "Syria": "SYR", "Vietnam": "VNM",
         "South Korea": "KOR", "North Korea": "PRK", "Laos": "LAO", "Tanzania": "TZA", "Turkey": "TUR", "Türkiye": "TUR",
         "DR Congo": "COD", "Democratic Republic of the Congo": "COD", "Republic of the Congo": "COG", "Congo": "COG",
         "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV", "Czech Republic": "CZE", "Kosovo": "XKX", "Taiwan": "TWN",
         "Brunei": "BRN", "Moldova": "MDA", "Palestine": "PSE", "United States": "USA", "USA": "USA", "UK": "GBR",
         "United Kingdom": "GBR", "Micronesia": "FSM", "Cape Verde": "CPV", "Eswatini": "SWZ", "Macedonia": "MKD",
         "North Macedonia": "MKD", "Burma": "MMR", "Myanmar": "MMR", "East Timor": "TLS", "Timor-Leste": "TLS",
         "Falkland Islands": "FLK", "Netherlands (Kingdom of the)": "NLD", "Türkiye": "TUR", "China, mainland": "CHN",
         "China, Taiwan Province of": "TWN", "European Union": "EU", "Korea, South": "KOR", "Korea, North": "PRK",
         "Burma (Myanmar)": "MMR", "Congo (Kinshasa)": "COD", "Congo (Brazzaville)": "COG", "Gambia, The": "GMB",
         "Bahamas, The": "BHS", "Yemen (Sanaa)": "YEM", "Former Czechoslovakia": None, "EU-15": None}
_cache = {}
def iso3(name):
    if name is None or (isinstance(name, float)) or not str(name).strip(): return None
    n = str(name).strip()
    if n in _cache: return _cache[n]
    v = ALIAS.get(n)
    if v is None and n not in ALIAS:
        if len(n) == 3 and pycountry.countries.get(alpha_3=n.upper()): v = n.upper()
        else:
            try: v = pycountry.countries.lookup(n).alpha_3
            except Exception:
                try: v = pycountry.countries.search_fuzzy(n)[0].alpha_3
                except Exception: v = None
    _cache[n] = v
    return v
NOMBRE = {"RUS": "Rusia", "IRN": "Irán", "VEN": "Venezuela", "BOL": "Bolivia", "KOR": "Corea del Sur", "PRK": "Corea del Norte",
          "SYR": "Siria", "TZA": "Tanzania", "VNM": "Vietnam", "LAO": "Laos", "MDA": "Moldavia", "COD": "RD del Congo",
          "COG": "Congo", "TWN": "Taiwán", "NLD": "Países Bajos", "XKX": "Kosovo", "BRN": "Brunéi", "MKD": "Macedonia del Norte",
          "CZE": "Chequia", "TUR": "Turquía", "PSE": "Palestina", "FLK": "Islas Malvinas", "GBR": "Reino Unido", "USA": "Estados Unidos",
          "CIV": "Costa de Marfil", "MMR": "Myanmar", "SWZ": "Esuatini", "FSM": "Micronesia"}
def pais_es(a3):
    if a3 in NOMBRE: return NOMBRE[a3]
    c = pycountry.countries.get(alpha_3=a3)
    if not c: return a3
    return ES(getattr(c, "common_name", None) or c.name) if ES(c.name) == c.name else ES(c.name)
def num(a3):
    c = pycountry.countries.get(alpha_3=a3); return c.numeric if c else None

# ---------- participaciones ----------
PCT = re.compile(r"^(.*?)\s*[\(\[]\s*([\d.,]+)\s*%\s*[\)\]]\s*$")
def dueños(s):
    """'YPF (50%);Chevron (50%)' -> [['YPF',50.0],['Chevron',50.0]]; sin % -> [nombre, None]."""
    if s is None or isinstance(s, float) or not str(s).strip(): return []
    out = []
    for p in re.split(r";\s*", str(s)):
        p = p.strip()
        if not p or p.lower() in ("unknown", "other", "others", "nan"): 
            m = PCT.match(p) if p else None
            if m and p: out.append(["Otros/sin identificar", float(m.group(2).replace(",", "."))])
            continue
        m = PCT.match(p)
        if m:
            nm = m.group(1).strip()
            out.append(["Otros/sin identificar" if nm.lower() in ("unknown", "other", "others") else nm, float(m.group(2).replace(",", "."))])
        else:
            out.append([p, None])
    # sin porcentajes y un solo dueño = 100%
    if len(out) == 1 and out[0][1] is None: out[0][1] = 100.0
    return out
def entero(x):
    try:
        v = int(float(str(x)[:4])); return v if 1850 < v < 2100 else None
    except Exception: return None
def wiki(u):
    return u.replace("https://www.gem.wiki/", "").replace("https://gem.wiki/", "") if isinstance(u, str) else None
def r(x, n=2):
    try:
        x = float(x)
        if x != x: return None
        return round(x, n)
    except Exception: return None

# ---------- estado ----------
EST = {"operating": "op", "operativo": "op", "in_development": "dev", "construction": "dev", "proposed": "pro",
       "discovered": "pro", "exploration": "pro", "shut_in": "par", "mothballed": "par", "shelved": "par",
       "retired": "cer", "decommissioned": "cer", "abandoned": "cer", "cancelled": "cer", "UGS": "otro", "unknown": "otro"}

FUENTES = {
  "gem_goget": {"t": "Global Energy Monitor – Global Oil and Gas Extraction Tracker", "lic": "CC BY 4.0", "url": "https://globalenergymonitor.org/projects/global-oil-gas-extraction-tracker/"},
  "gem_giomt": {"t": "Global Energy Monitor – Global Iron Ore Mines Tracker", "lic": "CC BY 4.0", "url": "https://globalenergymonitor.org/projects/global-iron-ore-mines-tracker/"},
  "gem_gcmt":  {"t": "Global Energy Monitor – Global Coal Mine Tracker", "lic": "CC BY 4.0", "url": "https://globalenergymonitor.org/projects/global-coal-mine-tracker/"},
  "ct":        {"t": "Climate TRACE – inventario por activo (API v6)", "lic": "CC BY 4.0", "url": "https://climatetrace.org/data"},
  "fao":       {"t": "FAO – FAOSTAT, Cultivos y productos de ganadería (QCL)", "lic": "CC BY 4.0", "url": "https://www.fao.org/faostat/es/#data/QCL"},
  "psd":       {"t": "USDA FAS – Production, Supply and Distribution (PSD)", "lic": "Dominio público (EE.UU.)", "url": "https://apps.fas.usda.gov/psdonline/"},
}
TIPOS = {
  "campo": {"n": "Yacimientos de petróleo y gas", "s": "og", "u": "millones de boe/año", "tam": "Producción", "ef": None, "src": "gem_goget"},
  "refi":  {"n": "Refinerías", "s": "og", "u": "mil bbl/d de capacidad", "tam": "Capacidad", "ef": "kg CO2e por barril procesado", "efMenor": True, "src": "ct"},
  "cu":    {"n": "Minas de cobre", "s": "mi", "u": "millones de t de mineral/año", "tam": "Mineral procesado", "ef": "kg CO2e por t de mineral", "efMenor": True, "src": "ct"},
  "fe":    {"n": "Minas de hierro", "s": "mi", "u": "millones de t/año de capacidad", "tam": "Capacidad de diseño", "ef": "Uso de la capacidad (producción 2023 ÷ capacidad)", "efMenor": False, "src": "gem_giomt"},
  "al":    {"n": "Minas de bauxita", "s": "mi", "u": "millones de t de mineral/año", "tam": "Mineral extraído", "ef": "kg CO2e por t de mineral", "efMenor": True, "src": "ct"},
  "coal":  {"n": "Minas de carbón", "s": "mi", "u": "millones de t/año", "tam": "Producción (o capacidad)", "ef": "t por trabajador por año", "efMenor": False, "src": "gem_gcmt"},
}

def prev():
    try:
        s = OUT.read_text(encoding="utf-8"); return json.loads(s[s.index("{"): s.rindex("}") + 1])
    except Exception: return {}
P = prev()
# los activos guardados usan índices a P["emp"]: se vuelven a nombres para poder reutilizarlos
for _a in P.get("act", []):
    _e = P.get("emp", [])
    if isinstance(_a[8], int) and _a[8] < len(_e): _a[8] = _e[_a[8]]
    _a[9] = [[_e[o[0]] if isinstance(o[0], int) and o[0] < len(_e) else o[0], o[1]] for o in (_a[9] or [])]
D = {"meta": {"actualizado": HOY, "pasos": {}}, "fuentes": FUENTES, "tipos": TIPOS, "act": [], "agro": {}, "paises": {}}
ACT = []  # [tipo, nombre, iso3, lat, lon, estado, tamaño, eficiencia, operador, dueños, año, url, fuente]

def paso(nombre, fn):
    t = time.time()
    try:
        n = fn(); D["meta"]["pasos"][nombre] = {"ok": True, "n": n, "s": round(time.time() - t, 1)}
    except Exception as e:
        D["meta"]["pasos"][nombre] = {"ok": False, "err": repr(e)[:300]}
        # conservar lo anterior
        tipos = {"goget": ["campo"], "giomt": ["fe"], "gcmt": ["coal"], "ct": ["cu", "al", "refi"]}.get(nombre, [])
        old = [a for a in P.get("act", []) if a[0] in tipos]
        ACT.extend(old)
        if nombre in ("fao", "psd") and P.get("agro"): D["agro"].update({k: v for k, v in P["agro"].items() if (k.startswith("x_") == (nombre == "psd"))})
    print(nombre, D["meta"]["pasos"][nombre], flush=True)

# ---------- GEM ----------
def gem_csv(path, **kw):
    return pd.read_csv(io.BytesIO(get(GEMRAW + requests.utils.quote(path)).content), low_memory=False, **kw)

def p_goget():
    g = gem_csv("goget/compilation_output/Oil & Gas Extraction-map-file-2025-02-26.csv")
    n = 0
    for _, x in g.iterrows():
        st = EST.get(str(x["status"]), "otro")
        if st == "cer": continue
        prod = r(x["production---total-(oil,-gas-and-hydrocarbons)-(million-boe/y)"], 3)
        a3 = iso3(x["country/area"]) or iso3(str(x["country/area"]).split("-")[0])
        if a3 is None or pd.isna(x["lat"]): continue
        nm = re.sub(r"\s*\((?:[^()]*)\)\s*$", "", str(x["wiki-name"])).replace(" Oil and Gas Field", "")
        yr = x.get("production-year---oil") if not pd.isna(x.get("production-year---oil")) else x.get("production-year---gas")
        ow = dueños(x["parent"]) or dueños(x["owner"])
        ACT.append(["campo", nm, a3, r(x["lat"], 4), r(x["lng"], 4), st, prod, None, None if pd.isna(x["operator"]) else str(x["operator"]), ow,
                    entero(yr), wiki(x["url"]), "gem_goget"])
        n += 1
    return n

def p_giomt():
    g = gem_csv("giomt/output/data-2024-11-25.csv")
    n = 0
    for _, x in g.iterrows():
        st = EST.get(str(x["status"]), "otro")
        if st == "cer" or pd.isna(x["lat"]): continue
        a3 = iso3(x["country/area"]);
        if not a3: continue
        cap = r(pd.to_numeric(x["design-capacity-(ttpa)"], errors="coerce") / 1000, 3)
        pr = pd.to_numeric(x["production-2023-(ttpa)"], errors="coerce")
        uso = r(pr / 1000 / cap, 3) if cap and pr == pr and cap > 0 else None
        ACT.append(["fe", str(x["name-(english)"]).replace(" Mine", ""), a3, r(x["lat"], 4), r(x["lng"], 4), st, cap, uso, None,
                    dueños(x["parent"]) or dueños(x["owner"]), 2023 if uso is not None else None, wiki(x["url"]), "gem_giomt"])
        n += 1
    return n

def p_gcmt():
    g = pd.read_csv(io.BytesIO(get(GEMRAW + "coal-mine/data.csv").content), encoding="utf-16", low_memory=False)
    n = 0
    for _, x in g.iterrows():
        st = EST.get(str(x["status"]), "otro")
        if st == "cer" or pd.isna(x["lat"]): continue
        a3 = iso3(x["country"])
        if not a3: continue
        pr = r(x["production"], 3); cap = r(x["capacity"], 3)
        wf = pd.to_numeric(str(x["workforce"]).replace(",", ""), errors="coerce")
        ef = r(pr * 1e6 / wf, 0) if pr and wf == wf and wf > 0 else None
        ACT.append(["coal", str(x["project"]).replace(" Coal Mine", ""), a3, r(x["lat"], 4), r(x["lng"], 4), st, pr if pr else cap, ef, None,
                    dueños(x["parent"]) or dueños(x["owner"]), None, wiki(x["url"]), "gem_gcmt"])
        n += 1
    return n

# ---------- Climate TRACE ----------
CT = "https://api.climatetrace.org/v6"
def ct_assets(ss):
    out, off = [], 0
    while True:
        j = get(f"{CT}/assets?subsectors={ss}&limit=1000&offset={off}&year=2024").json()
        a = j.get("assets") or []
        out += a
        if len(a) < 1000: break
        off += 1000
        if off > 20000: break
    return out
def co2e(a):
    for e in a.get("EmissionsSummary") or []:
        if e.get("Gas") == "co2e_100yr": return e
    return {}
def p_ct():
    n = 0
    for ss, tipo in [("copper-mining", "cu"), ("bauxite-mining", "al"), ("oil-and-gas-refining", "refi")]:
        seen = set()
        for a in ct_assets(ss):
            if a["Id"] in seen: continue
            seen.add(a["Id"])
            c = (a.get("Centroid") or {}).get("Geometry")
            if not c: continue
            e = co2e(a); act = e.get("Activity"); cap = e.get("Capacity"); ef = e.get("EmissionsFactor")
            owners = []
            for o in a.get("Owners") or []:
                nm = (o.get("CompanyName") or "").strip()
                if nm and nm.lower() not in [x[0].lower() for x in owners]: owners.append([nm, None])
            if len(owners) == 1: owners[0][1] = 100.0
            if tipo == "refi":
                size = r((cap or 0) / 1000, 1) if cap else None
                eff = r(ef * 1000, 1) if ef else None             # kg CO2e / bbl
                st = "op" if act else "otro"
            else:
                size = r((act or 0) / 1e6, 3) if act else None
                eff = r(ef * 1000, 1) if ef and act else None     # kg CO2e / t mineral
                st = "op" if act else "pro"
            ACT.append([tipo, a["Name"], a["Country"], r(c[1], 4), r(c[0], 4), st, size, eff, None, owners, 2024, None, "ct"])
            n += 1
    return n

# ---------- FAOSTAT ----------
FAO_ITEMS = {"soja": "Soya beans", "maiz": "Maize (corn)", "trigo": "Wheat", "girasol": "Sunflower seed", "cebada": "Barley",
             "carne": "Meat of cattle with the bone, fresh or chilled", "leche": "Raw milk of cattle"}
FAO_N = {"soja": "Soja", "maiz": "Maíz", "trigo": "Trigo", "girasol": "Girasol", "cebada": "Cebada", "carne": "Carne vacuna", "leche": "Leche de vaca"}
def p_fao():
    z = zipfile.ZipFile(io.BytesIO(get("https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip").content))
    f = [i for i in z.namelist() if i.endswith(".csv") and "All_Data" in i][0]
    df = pd.read_csv(z.open(f), encoding="latin-1", usecols=["Area Code (M49)", "Area", "Item", "Element", "Year", "Unit", "Value"], low_memory=False)
    df = df[df["Item"].isin(FAO_ITEMS.values()) & df["Element"].isin(["Production", "Area harvested", "Yield"])]
    df["m49"] = df["Area Code (M49)"].astype(str).str.replace("'", "").str.zfill(3)
    n = 0
    for k, it in FAO_ITEMS.items():
        d = df[df["Item"] == it]
        prod = d[d["Element"] == "Production"]
        year = int(prod[prod["m49"] == "001"]["Year"].max()) if (prod["m49"] == "001").any() else int(prod["Year"].max())
        dy = d[d["Year"] == year].pivot_table(index=["m49", "Area"], columns="Element", values="Value", aggfunc="first").reset_index()
        world = float(dy[dy["m49"] == "001"]["Production"].iloc[0]) if (dy["m49"] == "001").any() else None
        rows = []
        for _, x in dy.iterrows():
            m = x["m49"]
            c = pycountry.countries.get(numeric=m)
            if not c or not (x.get("Production") == x.get("Production")) or not x.get("Production"): continue
            y = x.get("Yield")
            rows.append([c.alpha_3, r(x["Production"] / 1e6, 4), r(x.get("Area harvested", float("nan")) / 1e6, 4) if "Area harvested" in x else None, r(y, 0) if y == y else None])
        rows.sort(key=lambda v: -(v[1] or 0))
        D["agro"][k] = {"n": FAO_N[k], "anio": year, "u": "millones de t", "mundo": r(world / 1e6, 3) if world else None,
                        "yu": ("kg/ha" if k not in ("carne", "leche") else None), "p": rows, "src": "fao"}
        n += len(rows)
    return n

# ---------- USDA PSD ----------
PSD = {"oilseeds": [("x_harina", "Meal, Soybean", "Harina de soja"), ("x_aceite", "Oil, Soybean", "Aceite de soja"), ("x_poroto", "Oilseed, Soybean", "Poroto de soja")],
       "grains_pulses": [("x_maiz", "Corn", "Maíz"), ("x_trigo", "Wheat", "Trigo")],
       "livestock": [("x_carne", "Meat, Beef and Veal", "Carne vacuna")]}
def p_psd():
    n = 0
    for fn, items in PSD.items():
        z = zipfile.ZipFile(io.BytesIO(get(f"https://apps.fas.usda.gov/psdonline/downloads/psd_{fn}_csv.zip").content))
        df = pd.read_csv(z.open(z.namelist()[0]), low_memory=False)
        df = df[df["Attribute_Description"] == "Exports"]
        for k, com, nom in items:
            d = df[df["Commodity_Description"] == com]
            if d.empty: continue
            cur = dt.date.today().year
            yrs = sorted(y for y in d["Market_Year"].unique() if y <= cur - 2)  # campaña cerrada (la del año pasado todavía es estimación)
            # último año con dato mayormente completo
            y = yrs[-1]
            dy = d[d["Market_Year"] == y]
            rows = []
            for _, x in dy.iterrows():
                if x["Country_Name"] in ("World", "European Union"):
                    a3 = "EU" if x["Country_Name"] == "European Union" else None
                    if a3 is None: continue
                else:
                    a3 = iso3(x["Country_Name"])
                if not a3 or not x["Value"]: continue
                rows.append([a3, r(x["Value"] / 1000, 4)])
            rows.sort(key=lambda v: -v[1])
            u = str(dy["Unit_Description"].iloc[0]) if len(dy) else ""
            D["agro"][k] = {"n": "Exportaciones de " + nom.lower(), "anio": int(y), "u": "millones de t" if "MT" in u else u, "p": rows, "src": "psd"}
            n += len(rows)
    return n

# ---------- GEM bucket: ¿hay versiones nuevas? (sólo registro) ----------
def p_gem_nuevo():
    keys, marker = [], ""
    for _ in range(10):
        x = get("https://publicgemdata.nyc3.cdn.digitaloceanspaces.com/?marker=" + requests.utils.quote(marker)).text
        ks = re.findall(r"<Key>([^<]+)</Key>", x); keys += ks
        if "<IsTruncated>true" not in x or not ks: break
        marker = ks[-1]
    interes = [k for k in keys if re.search(r"(goget|giomt|gcmt|ownership|geot)", k, re.I) and re.search(r"\.(csv|geojson|json|xlsx)$", k)]
    D["meta"]["gem_cdn"] = interes[-40:]
    return len(keys)

for nombre, fn in [("goget", p_goget), ("giomt", p_giomt), ("gcmt", p_gcmt), ("ct", p_ct), ("fao", p_fao), ("psd", p_psd), ("gem_cdn", p_gem_nuevo)]:
    paso(nombre, fn)

# tabla de empresas: los nombres se guardan una vez y los activos usan el índice
# Las fuentes escriben la misma empresa de varias formas ("BP", "BP P.L.C.", "Bp Plc"): se unifican por una
# clave sin mayúsculas, puntuación ni forma societaria, y se muestra el nombre más frecuente.
SUF = r"(?<![\w-])(sa|sau|sab de cv|de cv|inc|incorporated|corp|corporation|co|company|ltd|limited|llc|plc|ag|se|nv|bv|asa|spa|gmbh|pjsc|ojsc|jsc|oao|pao|tbk|berhad|bhd|sl|srl|the|group|holdings?)(?![\w-])"
def clave(nm):
    k = re.sub(r"\(.*?\)", " ", nm.lower())
    k = k.replace(".", "")
    k = re.sub(r"[,&'’]", " ", k)
    k = re.sub(SUF, " ", k)
    k = re.sub(r"\s+", " ", k).strip()
    return k or nm.lower()
from collections import Counter
_nombres = {}
for a in ACT:  # el nombre de dueño pesa más que el de operador (suele venir mejor escrito)
    for nm, w in [(a[8], 1)] + [(o[0], 3) for o in (a[9] or [])]:
        if isinstance(nm, str): _nombres.setdefault(clave(nm), Counter())[nm] += w
EMP, IDX = [], {}
def ix(nm):
    if nm is None: return None
    k = clave(nm)
    if k not in IDX: IDX[k] = len(EMP); EMP.append(_nombres[k].most_common(1)[0][0] if k in _nombres else nm)
    return IDX[k]
for a in ACT:
    if isinstance(a[8], str): a[8] = ix(a[8])
    m = {}
    for o in (a[9] or []):
        k = ix(o[0]) if isinstance(o[0], str) else o[0]
        if k in m and m[k] is not None and o[1] is not None: m[k] += o[1]
        elif k not in m: m[k] = o[1]
    a[9] = [[k, (round(v, 2) if v is not None else None)] for k, v in m.items()]
D["emp"] = EMP
D["act"] = ACT
# países presentes
ps = set(a[2] for a in ACT) | {p[0] for v in D["agro"].values() for p in v.get("p", [])}
D["paises"] = {a3: [pais_es(a3), num(a3)] for a3 in sorted(x for x in ps if x and x != "EU")}
D["paises"]["EU"] = ["Unión Europea", None]
OUT.parent.mkdir(parents=True, exist_ok=True)
cab = ("// Generado por scripts/mundo/mundo.py – no editar a mano.\n"
       "// Activos mundiales de petróleo y gas, minería y agro con dueños y participaciones.\n"
       "// Fuentes: Global Energy Monitor (CC BY 4.0), Climate TRACE (CC BY 4.0), FAOSTAT, USDA FAS PSD.\n")
OUT.write_text(cab + "const MUNDO_DATA = " + json.dumps(D, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print("activos:", len(ACT), "bytes:", OUT.stat().st_size)
