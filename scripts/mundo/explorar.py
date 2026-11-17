"""Exploración 2: estructura de Climate TRACE v6, listado del CDN de GEM y FAOSTAT bulk.
Guarda sólo esquemas y muestras saneadas (sin tokens) en exploracion/."""
import json, re, requests
from pathlib import Path
OUT = Path("exploracion"); OUT.mkdir(exist_ok=True)
H = {"User-Agent": "MatrizProductiva/1.0"}
TOK = re.compile(r"pk\.[A-Za-z0-9_\-\.]{20,}")
def clean(x): return json.loads(TOK.sub("pk.REDACTED", json.dumps(x)))
def get(u, **k):
    try:
        r = requests.get(u, headers=H, timeout=90, **k); return r
    except Exception as e: return e
res = {}
CT = "https://api.climatetrace.org/v6"
r = get(CT + "/definitions/subsectors"); res["subsectors"] = r.json() if hasattr(r, "json") else str(r)
for ss in ["copper-mining", "iron-mining", "bauxite-mining", "coal-mining", "oil-and-gas-production", "oil-and-gas-refining", "rock-quarrying", "enteric-fermentation-cattle-feedlot", "synthetic-fertilizer-application", "cropland-fires"]:
    r = get(CT + f"/assets?subsectors={ss}&limit=2&year=2024")
    try:
        j = r.json(); res[ss] = {"status": r.status_code, "top_keys": list(j.keys()) if isinstance(j, dict) else type(j).__name__, "sample": clean(j)}
    except Exception as e: res[ss] = {"err": repr(r)[:300]}
    r = get(CT + f"/assets?subsectors={ss}&countries=ARG&limit=5&year=2024")
    try: res[ss + "_ARG"] = clean(r.json())
    except Exception: pass
# detalle de un activo
try:
    a = res["copper-mining"]["sample"]["assets"][0]["Id"]
except Exception:
    a = None
res["detail_id"] = a
if a:
    for p in [f"/assets/{a}", f"/assets/{a}?year=2024"]:
        r = get(CT + p); 
        try: res["detail" + p] = clean(r.json())
        except Exception: res["detail" + p] = str(getattr(r, "status_code", r))
# conteo total de copper
r = get(CT + "/assets?subsectors=copper-mining&limit=1000&year=2024")
try: j = r.json(); res["copper_count"] = len(j.get("assets", j) if isinstance(j, dict) else j)
except Exception as e: res["copper_count"] = repr(e)
(OUT / "ct.json").write_text(json.dumps(res, ensure_ascii=False, indent=1)[:400000])
# GEM CDN listing (S3)
for pre in ["GOGET/", "goget/", "giomt/", "GCMT/", "latest/", "GGIT/", "ggit/", "LATAM/", "gogpt/", "GOGET"]:
    r = get("https://publicgemdata.nyc3.cdn.digitaloceanspaces.com/?prefix=" + pre)
    (OUT / f"gem_list_{pre.strip('/')}.xml").write_text((r.text if hasattr(r, "text") else str(r))[:20000])
r = get("https://publicgemdata.nyc3.digitaloceanspaces.com/?prefix=GOGET/")
(OUT / "gem_list_origin.xml").write_text((r.text if hasattr(r, "text") else str(r))[:20000])
# FAOSTAT bulk
r = get("https://bulks-faostat.fao.org/production/datasets_E.json")
try:
    j = r.json(); ds = j.get("Datasets", {}).get("Dataset", j)
    (OUT / "fao_datasets.json").write_text(json.dumps([d for d in ds if "QCL" in json.dumps(d) or "Crops" in json.dumps(d)][:5], indent=1))
except Exception as e: (OUT / "fao_datasets.json").write_text(repr(e))
print("ok")
