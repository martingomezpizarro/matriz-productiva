"""Exploración de fuentes mundiales (corre en GitHub Actions): guarda muestras chicas
de cada fuente en exploracion/ para diseñar el parser. No toca data/."""
import json, os, io, zipfile, csv, time
from pathlib import Path
import requests

OUT = Path("exploracion"); OUT.mkdir(exist_ok=True)
H = {"User-Agent": "MatrizProductiva/1.0 (+https://matrizproductiva.martingomezpizarro.com.ar)"}
log = {}

def probe(name, url, kind="auto", keep=4000, timeout=90):
    t = time.time()
    try:
        r = requests.get(url, headers=H, timeout=timeout)
        info = {"url": url, "status": r.status_code, "bytes": len(r.content), "ctype": r.headers.get("content-type"), "s": round(time.time()-t, 1)}
        body = r.content
        if r.ok:
            raw = OUT / f"{name}.raw"
            if body[:2] == b"PK":
                z = zipfile.ZipFile(io.BytesIO(body)); info["zip"] = [(i.filename, i.file_size) for i in z.infolist()][:40]
                for i in z.infolist()[:6]:
                    if i.filename.lower().endswith(".csv"):
                        with z.open(i) as f: (OUT / f"{name}__{Path(i.filename).name}.head.txt").write_bytes(f.read(6000))
            elif url.endswith(".geojson") or b'"FeatureCollection"' in body[:400]:
                g = json.loads(body); feats = g.get("features", [])
                info["n"] = len(feats)
                keys = {}
                for f in feats:
                    for k in (f.get("properties") or {}): keys[k] = keys.get(k, 0) + 1
                info["keys"] = keys
                (OUT / f"{name}.sample.json").write_text(json.dumps(feats[:3] + [f for f in feats if "Argentina" in json.dumps(f.get("properties"))][:3], ensure_ascii=False, indent=1)[:30000])
            else:
                (OUT / f"{name}.head.txt").write_bytes(body[:keep])
        else:
            (OUT / f"{name}.err.txt").write_bytes(body[:2000])
        log[name] = info
    except Exception as e:
        log[name] = {"url": url, "error": repr(e)[:400]}

G = "https://publicgemdata.nyc3.cdn.digitaloceanspaces.com"
probe("gem_goget_csv", G + "/goget/Oil%20&%20Gas%20Extraction-map-file-2025-02-26.csv", keep=20000)
for c in ["/GOGET/2026-03/goget_map_2026-03-02.geojson", "/GOGET/2026-03/LATAM_map_2026-03-02.geojson", "/GOGET/2026-03/latam_map_2026-03-02.geojson"]:
    probe("gem_goget_" + c.split("/")[-1].split("_")[0], G + c)
probe("gem_latam", G + "/hydro/2026-03/LATAM_map_2026-03-19.geojson")
probe("gem_giomt", G + "/giomt/2025-10/giomt_map_2025-10-17.geojson")
probe("gem_gcmt", G + "/GCMT/2025-09/gcmt_map_2025-09-22-sectionfix.geojson")
probe("gem_ggit", G + "/ggit/2026-03/ggit_map_2026-02-20.geojson")
probe("gem_goit", G + "/GOIT/2025-03/goit_2025-04-09.geojson")
probe("gem_gchi", G + "/GChI/2025-11/gchi_map_2025-11-10.geojson")

CT = "https://api.climatetrace.org"
for v in ["v6", "v7"]:
    probe(f"ct_{v}_subsectors", f"{CT}/{v}/definitions/subsectors")
    probe(f"ct_{v}_assets_cu", f"{CT}/{v}/assets?subsectors=copper-mining&limit=5&year=2024")
    probe(f"ct_{v}_assets_ar", f"{CT}/{v}/assets?countries=ARG&limit=50&year=2024", keep=30000)
probe("ct_v6_asset_detail_guess", f"{CT}/v6/assets?subsectors=oil-and-gas-production&countries=ARG&limit=3", keep=20000)

probe("usda_psd_oilseeds", "https://apps.fas.usda.gov/psdonline/downloads/psd_oilseeds_csv.zip")
probe("usda_psd_grains", "https://apps.fas.usda.gov/psdonline/downloads/psd_grains_pulses_csv.zip")
probe("usda_psd_livestock", "https://apps.fas.usda.gov/psdonline/downloads/psd_livestock_csv.zip")
probe("fao_qcl_api", "https://faostatservices.fao.org/api/v1/en/data/QCL?area=9&item=236&element=5419&year=2023", keep=8000)
probe("fao_bulk_list", "https://bulks-faostat.fao.org/production/datasets_E.json", keep=8000)
probe("trase_api", "https://api.trase.earth/api/v3/nodes?context_id=1", keep=6000)
probe("gleif", "https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=YPF%20SOCIEDAD%20ANONIMA", keep=6000)
probe("wikidata", "https://query.wikidata.org/sparql?format=json&query=" + requests.utils.quote(
  'SELECT ?m ?mLabel ?coord ?opLabel WHERE { ?m wdt:P31/wdt:P279* wd:Q820477; wdt:P17 wd:Q414; wdt:P625 ?coord. OPTIONAL{?m wdt:P137 ?op} SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } } LIMIT 200'), keep=30000)
probe("sodir_licensee", "https://factpages.sodir.no/public?/Factpages/external/tableview/licence_licensee_hst&rs:Command=Render&rc:Toolbar=false&rc:Parameters=f&IpAddress=not_used&CultureCode=en&rs:Format=CSV&Top100=false", keep=5000)
probe("ga_mines", "https://services.ga.gov.au/gis/rest/services/Australian_Operating_Mines/MapServer/0/query?where=1%3D1&outFields=*&f=json&resultRecordCount=3", keep=8000)
probe("eiti_api", "https://eiti.org/api/v2.0/summary_data?page=1", keep=5000)
(OUT / "_log.json").write_text(json.dumps(log, ensure_ascii=False, indent=1))
print(json.dumps(log, indent=1)[:5000])
