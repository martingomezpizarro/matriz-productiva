import io, json, requests, traceback
import pandas as pd
UA={"User-Agent":"Mozilla/5.0 matriz-productiva (+https://matriz.martingomezpizarro.com.ar)"}
out=open("sondeo/resultado.txt","w",encoding="utf-8")
def P(*a): print(*a, file=out, flush=True)
def sec(t): P("\n"+"="*20, t, "="*20)
def get(u, **k): r=requests.get(u, headers=UA, timeout=120, **k); r.raise_for_status(); return r
def run(t, f):
    sec(t)
    try: f()
    except Exception: P(traceback.format_exc()[-1500:])

def siacam():
    b=get("https://www.mecon.gob.ar/dataset/Cartera-de-Proyectos-Mineros-Metaliferos-y-Litio-del-SIACAM.xlsx").content
    x=pd.ExcelFile(io.BytesIO(b)); P("hojas:", x.sheet_names)
    for sh in x.sheet_names:
        df=pd.read_excel(x, sheet_name=sh, header=None, nrows=10)
        P("--", sh, df.shape); P(df.to_string(max_colwidth=40))
        full=pd.read_excel(x, sheet_name=sh, header=None); P("filas totales", len(full))
run("SIACAM", siacam)

def series():
    for ids in ["11.3_ISOM_2004_M_39,11.3_ISD_2004_M_26,143.3_NO_PR_2004_A_31","40.2_VC_0_T_15","74.3_IECE_0_M_35,74.3_IICL_0_M_42"]:
        j=get("https://apis.datos.gob.ar/series/api/series/", params={"ids":ids,"limit":3,"sort":"desc","metadata":"simple"}).json()
        P(ids); P(json.dumps(j.get("meta"),ensure_ascii=False)[:1500]); P(j.get("data"))
run("SERIES", series)

def prov():
    t=get("https://infra.datos.gob.ar/catalog/sspm/dataset/350/distribution/350.1/download/exportaciones-provincia-rubro.csv").text
    df=pd.read_csv(io.StringIO(t)); P(df.shape); P(df.head(5).to_string()); P(df.tail(3).to_string()); P(list(df.columns))
run("EXPORTACIONES PROVINCIA", prov)

def magyp():
    j=get("https://datos.magyp.gob.ar/api/3/action/package_show", params={"id":"estimaciones-agricolas"}).json()["result"]
    for r in j["resources"]: P(r.get("name"),"|",r.get("format"),"|",r.get("url"),"|",r.get("last_modified") or r.get("created"))
    csvs=[r["url"] for r in j["resources"] if (r.get("format") or "").lower()=="csv"]
    if csvs:
        t=get(csvs[0]).content
        for enc in ("utf-8","latin-1"):
            try: s=t.decode(enc); break
            except: pass
        P(s[:1500])
run("MAGYP", magyp)

def yahoo():
    import yfinance as yf
    for tk in ["YPF","VIST","FSM","LUN.TO"]:
        i=yf.Ticker(tk).info
        keys=["currentPrice","fiftyTwoWeekLow","fiftyTwoWeekHigh","marketCap","targetMeanPrice","recommendationKey","numberOfAnalystOpinions","forwardPE","enterpriseToEbitda","totalDebt","totalCash","ebitda","ebitdaMargins","financialCurrency","currency"]
        P(tk, {k:i.get(k) for k in keys})
    for tk in ["BZ=F","GC=F","HG=F","ZS=F","ZC=F","ZW=F","CRESY","MUX"]:
        h=yf.Ticker(tk).history(period="3mo", interval="1mo"); P(tk); P(h.tail(3)[["Close"]].to_string())
run("YAHOO", yahoo)
