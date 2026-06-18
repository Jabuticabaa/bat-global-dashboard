"""
BAT Dashboard — ETL + Correlation Analysis
Reads both Excel files, validates JOIN keys, geocodes locations,
outputs structured JSON hierarchy L0→L5 ready for the map.
"""

import json, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
from pathlib import Path
import pandas as pd
from openpyxl import load_workbook

# ─── PATHS ───────────────────────────────────────────────────────────────────
BASE = Path(r"C:\Users\Marcelo - 1326\BP One Group\Bloco TSC - Documentos\General\Clientes\Atuais\BAT Global\Estudos\Expansão mercados\Arquivos base")
F1 = BASE / "Dados BAT Total.xlsx"
F2 = BASE / "BAT_Global_Market_Intelligence ATT.xlsx"
OUT = Path(r"C:\Users\Marcelo - 1326\bat-dashboard\public\data")
OUT.mkdir(parents=True, exist_ok=True)

# ─── L1 CONTINENT GROUPING ───────────────────────────────────────────────────
CONTINENT_MAP = {
    "North America":         "América do Norte",
    "Central America":       "América do Norte",
    "Caribe":                "América do Norte",
    "South America":         "América Latina / Sul",
    "Europe Ocidental":      "Europa",
    "Europe Oriental":       "Europa",
    "Europe do Sul":         "Europa",
    "Africa do Norte":       "África",
    "Africa Ocidental":      "África",
    "Africa Oriental":       "África",
    "Africa Central":        "África",
    "Africa do Sul/Austral": "África",
    "Africa Insular":        "África",
    "Asia do Sul":           "Ásia",
    "Asia Oriental":         "Ásia",
    "Sudeste Asiático":      "Ásia",
    "Oriente Médio":         "Ásia",
    "Oceania":               "Oceania",
}

L1_ORDER = ["América do Norte","América Latina / Sul","Europa","África","Ásia","Oceania"]

# ─── BRAZIL/CHILE REGION → NAME MAPPING (JOIN KEY) ───────────────────────────
# BDOS Descrição(Local) prefix → Market Intelligence Region code
BDOS_REGION_MAP = {
    "NNE": "NNE",
    "CTO": "CTO",
    "RIO": "RIO",
    "SPC": "SPC",
    "SPR": "SPR",
    "SUL": "SUL",
    "CEM": "CTO",   # CEM is a sub-depot of CTO (Uberlândia)
}

# BDOS Nome Ciclo → Market Intelligence Country
CICLO_TO_COUNTRY = {
    "BAT BRASIL": "Brazil",
    "BAT CHILE":  "Chile",
}

# ─── GEOCODING TABLE — Level 5 cities (Brazil operational) ───────────────────
# Standard: WGS84 lat/lng — universal for Leaflet/GeoJSON
GEO_L5 = {
    # NNE ──────────────────────────────────────────────────────────────────────
    "NNE - CID - Recife/PE":                 {"lat":-8.0476,  "lng":-34.8770, "city":"Recife",        "state":"PE","region":"NNE","country":"Brazil"},
    "NNE - COD - Aracaju/SE":                {"lat":-10.9472, "lng":-37.0731, "city":"Aracaju",       "state":"SE","region":"NNE","country":"Brazil"},
    "NNE - COD - Belem/PA":                  {"lat":-1.4558,  "lng":-48.5044, "city":"Belém",         "state":"PA","region":"NNE","country":"Brazil"},
    "NNE - COD - Fortaleza/CE":              {"lat":-3.7327,  "lng":-38.5270, "city":"Fortaleza",     "state":"CE","region":"NNE","country":"Brazil"},
    "NNE - COD - Joao Pessoa/PB":            {"lat":-7.1195,  "lng":-34.8450, "city":"João Pessoa",   "state":"PB","region":"NNE","country":"Brazil"},
    "NNE - COD - MACAPA/AP":                 {"lat":0.0349,   "lng":-51.0694, "city":"Macapá",        "state":"AP","region":"NNE","country":"Brazil"},
    "NNE - COD - Maceio/AL":                 {"lat":-9.6658,  "lng":-35.7350, "city":"Maceió",        "state":"AL","region":"NNE","country":"Brazil"},
    "NNE - COD - Manaus/AM":                 {"lat":-3.1019,  "lng":-60.0250, "city":"Manaus",        "state":"AM","region":"NNE","country":"Brazil"},
    "NNE - COD - Maraba/PA":                 {"lat":-5.3686,  "lng":-49.1178, "city":"Marabá",        "state":"PA","region":"NNE","country":"Brazil"},
    "NNE - COD - PORTO VELHO/RO":            {"lat":-8.7612,  "lng":-63.9004, "city":"Porto Velho",   "state":"RO","region":"NNE","country":"Brazil"},
    "NNE - COD - SAO LUIS /MA":              {"lat":-2.5307,  "lng":-44.3068, "city":"São Luís",      "state":"MA","region":"NNE","country":"Brazil"},
    "NNE - Distribuidora Riograndense - RN": {"lat":-5.7945,  "lng":-35.2110, "city":"Natal",         "state":"RN","region":"NNE","country":"Brazil"},
    "NNE - GD Distribudor - PI":             {"lat":-5.0892,  "lng":-42.8019, "city":"Teresina",      "state":"PI","region":"NNE","country":"Brazil"},
    "NNE - ISD DISTRIBUIDORA RECOL - AC":    {"lat":-9.9754,  "lng":-67.8249, "city":"Rio Branco",    "state":"AC","region":"NNE","country":"Brazil"},
    # CTO ──────────────────────────────────────────────────────────────────────
    "CTO - CID - Contagem/MG":               {"lat":-19.9317, "lng":-44.0536, "city":"Contagem",      "state":"MG","region":"CTO","country":"Brazil"},
    "CTO - COD - Brasilia/DF":               {"lat":-15.7801, "lng":-47.9292, "city":"Brasília",      "state":"DF","region":"CTO","country":"Brazil"},
    "CTO - COD - Campo Grande/MS":           {"lat":-20.4697, "lng":-54.6201, "city":"Campo Grande",  "state":"MS","region":"CTO","country":"Brazil"},
    "CTO - COD - Cuiaba/MT":                 {"lat":-15.6014, "lng":-56.0979, "city":"Cuiabá",        "state":"MT","region":"CTO","country":"Brazil"},
    "CTO - COD - Goiania/GO":                {"lat":-16.6869, "lng":-49.2648, "city":"Goiânia",       "state":"GO","region":"CTO","country":"Brazil"},
    "CTO - COD - Uberlandia/MG":             {"lat":-18.9186, "lng":-48.2772, "city":"Uberlândia",    "state":"MG","region":"CTO","country":"Brazil"},
    "CEM - UBERLANDIA/MG":                   {"lat":-18.9186, "lng":-48.2772, "city":"Uberlândia",    "state":"MG","region":"CTO","country":"Brazil"},
    # RIO ──────────────────────────────────────────────────────────────────────
    "RIO - CID - Rio de Janeiro/RJ":         {"lat":-22.9068, "lng":-43.1729, "city":"Rio de Janeiro","state":"RJ","region":"RIO","country":"Brazil"},
    "RIO - COD - Itabuna/BA":                {"lat":-14.7860, "lng":-39.2799, "city":"Itabuna",       "state":"BA","region":"RIO","country":"Brazil"},
    "RIO - COD - Salvador/BA":               {"lat":-12.9714, "lng":-38.5014, "city":"Salvador",      "state":"BA","region":"RIO","country":"Brazil"},
    "RIO - COD - Vila Velha/ES":             {"lat":-20.3297, "lng":-40.2925, "city":"Vila Velha",    "state":"ES","region":"RIO","country":"Brazil"},
    # SPC ──────────────────────────────────────────────────────────────────────
    "SPC - CID - SAO PAULO/SP":              {"lat":-23.5505, "lng":-46.6333, "city":"São Paulo",     "state":"SP","region":"SPC","country":"Brazil"},
    "SPC - COD - Praia Grande/SP":           {"lat":-24.0059, "lng":-46.4022, "city":"Praia Grande",  "state":"SP","region":"SPC","country":"Brazil"},
    # SPR ──────────────────────────────────────────────────────────────────────
    "SPR  - CID - Curitiba/PR":              {"lat":-25.4284, "lng":-49.2733, "city":"Curitiba",       "state":"PR","region":"SPR","country":"Brazil"},
    "SPR  - COD - Bauru/SP":                 {"lat":-22.3246, "lng":-49.0731, "city":"Bauru",          "state":"SP","region":"SPR","country":"Brazil"},
    "SPR  - COD - Campinas/SP - SPR":        {"lat":-22.9056, "lng":-47.0608, "city":"Campinas",       "state":"SP","region":"SPR","country":"Brazil"},
    "SPR  - COD - Londrina/PR":              {"lat":-23.3045, "lng":-51.1696, "city":"Londrina",        "state":"PR","region":"SPR","country":"Brazil"},
    "SPR  - COD - RIBEIRAO PRETO/SP":        {"lat":-21.1775, "lng":-47.8103, "city":"Ribeirão Preto",  "state":"SP","region":"SPR","country":"Brazil"},
    # SUL ──────────────────────────────────────────────────────────────────────
    "SUL - CID - Porto Alegre/RS":           {"lat":-30.0346, "lng":-51.2177, "city":"Porto Alegre",   "state":"RS","region":"SUL","country":"Brazil"},
    "SUL - COD - Itajai/SC":                 {"lat":-26.9076, "lng":-48.6608, "city":"Itajaí",         "state":"SC","region":"SUL","country":"Brazil"},
    "SUL - COD - Passo Fundo/RS":            {"lat":-28.2620, "lng":-52.4083, "city":"Passo Fundo",    "state":"RS","region":"SUL","country":"Brazil"},
    # NNE extra ────────────────────────────────────────────────────────────────
    "NNE - COD - Boa Vista/RR":              {"lat":-2.8235,  "lng":-60.6758, "city":"Boa Vista",      "state":"RR","region":"NNE","country":"Brazil"},
    "NNE - COD - NATAL/RN":                  {"lat":-5.7945,  "lng":-35.2110, "city":"Natal",          "state":"RN","region":"NNE","country":"Brazil"},
    "NNE - COD - Palmas/TO":                 {"lat":-10.2491, "lng":-48.3243, "city":"Palmas",         "state":"TO","region":"NNE","country":"Brazil"},
    "NNE - COD - Santarem/PA":               {"lat":-2.4418,  "lng":-54.7082, "city":"Santarém",       "state":"PA","region":"NNE","country":"Brazil"},
    "NNE - COD - TERESINA/PI":               {"lat":-5.0892,  "lng":-42.8019, "city":"Teresina",       "state":"PI","region":"NNE","country":"Brazil"},
}

# Chile regions centroids (L4 for Chile — no L5 operational data yet)
GEO_CHILE_REGIONS = {
    "ANTOFAGASTA": {"lat":-23.6509, "lng":-70.3975},
    "ARICA":       {"lat":-18.4783, "lng":-70.3126},
    "CALAMA":      {"lat":-22.4557, "lng":-68.9183},
    "CASTRO":      {"lat":-42.4827, "lng":-73.7626},
    "CHILLAN":     {"lat":-36.6063, "lng":-72.1034},
    "CONCEPCION":  {"lat":-36.8270, "lng":-73.0498},
    "COPIAPO":     {"lat":-27.3668, "lng":-70.3323},
    "COQUIMBO":    {"lat":-29.9533, "lng":-71.3395},
    "IQUIQUE":     {"lat":-20.2133, "lng":-70.1503},
    "LOS ANGELES": {"lat":-37.4710, "lng":-72.3538},
    "OSORNO":      {"lat":-40.5736, "lng":-73.1343},
    "PUERTO MONTT":{"lat":-41.4717, "lng":-72.9369},
    "PUNTA ARENAS":{"lat":-53.1638, "lng":-70.9171},
    "SAN FERNANDO":{"lat":-34.5867, "lng":-70.9910},
    "SANTIAGO":    {"lat":-33.4489, "lng":-70.6693},
    "TALCA":       {"lat":-35.4264, "lng":-71.6554},
    "TEMUCO":      {"lat":-38.7359, "lng":-72.5904},
    "VALDIVIA":    {"lat":-39.8142, "lng":-73.2459},
    "VALPARAISO":  {"lat":-33.0472, "lng":-71.6127},
}

def get_geo(loc_key, ciclo):
    """Return geo dict for a BDOS loc_key. Handles Brazil (GEO_L5) and Chile (CL{n} - CITY)."""
    if loc_key in GEO_L5:
        return GEO_L5[loc_key]
    if ciclo == "BAT CHILE":
        m = re.match(r"CL\d+ - (.+)$", loc_key)
        if m:
            city = m.group(1).strip()
            g = GEO_CHILE_REGIONS.get(city)
            if g:
                return {"lat": g["lat"], "lng": g["lng"],
                        "city": city.title(), "state": "", "region": city, "country": "Chile"}
    return None

def parse_num(s):
    if s is None or s == "" or s == "-": return None
    if isinstance(s, (int, float)):
        v = float(s)
        # Round to integer if very close (handles Excel floating-point formula noise)
        return round(v) if abs(v - round(v)) < 0.5 else round(v, 4)
    s = str(s).replace("$","").replace(".","").replace(",",".").strip()
    s = re.sub(r"[^\d\.\-]","",s)
    try: return float(s)
    except: return None

def parse_pct(s):
    if s is None or s == "" or s == "-": return None
    if isinstance(s, (int, float)):
        v = float(s)
        return round(v * 100, 4) if v < 1.5 else v  # normalize decimal fractions
    s = str(s).replace("%","").replace(",",".").strip()
    try:
        v = float(s)
        return round(v * 100, 4) if v < 1.5 else v
    except: return None

# ─── READ MARKET INTELLIGENCE ─────────────────────────────────────────────────
print("Reading Market Intelligence...")
wb_mi = load_workbook(F2, read_only=True, data_only=True)

# By Country (rows 5+, row 4 = header)
ws_country = wb_mi["🌍 By Country"]
rows_country = list(ws_country.iter_rows(min_row=4, values_only=True))
hdr_c = [str(c) if c else "" for c in rows_country[0]]

countries_data = {}
for row in rows_country[1:]:
    if not row[1] or not row[2]: continue
    subregion = str(row[1]).strip()
    country   = str(row[2]).strip()
    if not country or country.startswith("BAT"): continue
    countries_data[country] = {
        "country":     country,
        "subregion":   subregion,
        "continent":   CONTINENT_MAP.get(subregion, "Other"),
        "gdp":         parse_num(row[3]),
        "population":  parse_num(row[4]),
        "income_pc":   parse_num(row[5]),
        "smokers_est": parse_num(row[6]),
        "smokers_pct": parse_pct(row[7]),
        "bat_share":   parse_pct(row[8]),
        "tobacco_mkt": parse_num(row[9]),
        "pos_total":   parse_num(row[10]),
        "pos_bat":     parse_num(row[11]),
        "labour_cost": parse_num(row[12]),
        "pos_active":  parse_num(row[13]),
        "pos_active_pct": parse_pct(row[14]),
        "posms":       parse_num(row[15]),
        "posms_pct":   parse_pct(row[16]),
        "op_cost":     parse_num(row[17]),
        "data_type":   "estimated",
        "regions":     {}
    }

# By Region (rows 5+, row 4 = header)
ws_region = wb_mi["📍 By Region"]
rows_region = list(ws_region.iter_rows(min_row=4, values_only=True))

for row in rows_region[1:]:
    if not row[1] or not row[2] or not row[3]: continue
    country = str(row[2]).strip()
    region  = str(row[3]).strip()
    if country not in countries_data: continue
    geo_r = GEO_CHILE_REGIONS.get(region.upper(), {}) if country == "Chile" else {}
    countries_data[country]["regions"][region] = {
        "region":      region,
        "country":     country,
        "gdp":         parse_num(row[4]),
        "population":  parse_num(row[5]),
        "income_pc":   parse_num(row[6]),
        "smokers_est": parse_num(row[7]),
        "smokers_pct": parse_pct(row[8]),
        "bat_share":   parse_pct(row[9]),
        "tobacco_mkt": parse_num(row[10]),
        "pos_total":   parse_num(row[11]),
        "pos_bat":     parse_num(row[12]),
        "labour_cost": parse_num(row[13]),
        "pos_active":  parse_num(row[14]),
        "pos_active_pct": parse_pct(row[15]),
        "posms":       parse_num(row[16]),
        "posms_pct":   parse_pct(row[17]),
        "lat":         geo_r.get("lat"),
        "lng":         geo_r.get("lng"),
        "data_type":   "estimated",
        "cities":      {}
    }

wb_mi.close()
print(f"  Countries loaded: {len(countries_data)}")
print(f"  Brazil regions: {list(countries_data.get('Brazil',{}).get('regions',{}).keys())}")
print(f"  Chile regions: {list(countries_data.get('Chile',{}).get('regions',{}).keys())[:5]}... ({len(countries_data.get('Chile',{}).get('regions',{}))} total)")

# ─── READ BDOS (operational data) ─────────────────────────────────────────────
print("\nReading BDOS (sampling for correlation analysis)...")
wb_ops = load_workbook(F1, read_only=True, data_only=True)
ws_bdos = wb_ops["BDOS"]

rows_iter = ws_bdos.iter_rows(min_row=1, values_only=True)
hdr_b = [str(c) if c else "" for c in next(rows_iter)]

# Col indices (0-based)
COL = {h: i for i, h in enumerate(hdr_b)}
print(f"  BDOS columns: {list(COL.keys())[:10]}...")

# Aggregate by location key
loc_stats = {}   # loc_key → {os_count, productive, sla_total, sla_count, rating_total, rating_count, ciclo, statuses}
ciclo_counts = {}

row_count = 0
for row in rows_iter:
    row_count += 1
    ciclo = str(row[COL.get("Nome Ciclo", 2)] or "").strip()
    loc   = str(row[COL.get("Descrição (Local)", 13)] or "").strip()
    status = str(row[COL.get("Status", 9)] or "").strip()
    prod  = str(row[COL.get("Produtiva", 23)] or "").strip()
    sla   = row[COL.get("Dias para SLA", 22)]
    rating= row[COL.get("Avaliação da OS", 27)]
    camp  = str(row[COL.get("Descrição (Campanhas)", 26)] or "").strip()

    if ciclo: ciclo_counts[ciclo] = ciclo_counts.get(ciclo, 0) + 1

    if not loc or loc == "<SEM LOCAL>": continue
    if loc not in loc_stats:
        loc_stats[loc] = {"os":0,"prod":0,"sla_sum":0,"sla_n":0,"rate_sum":0,"rate_n":0,
                          "ciclo":ciclo,"statuses":{},"campaigns":{}}
    s = loc_stats[loc]
    s["os"] += 1
    if prod == "Sim": s["prod"] += 1
    if sla is not None:
        try: s["sla_sum"] += float(str(sla).replace(",",".")); s["sla_n"] += 1
        except: pass
    if rating is not None and str(rating).strip() not in ("","None"):
        try: s["rate_sum"] += float(str(rating).replace(",",".")); s["rate_n"] += 1
        except: pass
    s["statuses"][status] = s["statuses"].get(status, 0) + 1
    if camp and camp not in ("NENHUMA",""):
        s["campaigns"][camp] = s["campaigns"].get(camp, 0) + 1

wb_ops.close()
print(f"  Total rows processed: {row_count:,}")
print(f"  Ciclos (países): {ciclo_counts}")
print(f"  Unique locations: {len(loc_stats)}")

# ─── CORRELATION REPORT ───────────────────────────────────────────────────────
print("\n" + "="*70)
print("CORRELATION ANALYSIS — BRAZIL & CHILE")
print("="*70)

print("\n── JOIN KEY: BDOS.Nome Ciclo → Market Intel Country ──")
for ciclo, count in sorted(ciclo_counts.items(), key=lambda x: -x[1]):
    mapped = CICLO_TO_COUNTRY.get(ciclo, "⚠ UNMAPPED")
    in_mi  = "✓ IN MI" if mapped in countries_data else "✗ NOT IN MI"
    print(f"  BDOS[{ciclo}] ({count:,} OSs) → MI[{mapped}] {in_mi}")

print("\n── BDOS Locations → Region Mapping ──")
join_ok = []; join_fail = []
for loc_key, stats in sorted(loc_stats.items()):
    ciclo  = stats["ciclo"]
    geo    = get_geo(loc_key, ciclo)
    prefix = loc_key.split(" - ")[0].strip()
    if CICLO_TO_COUNTRY.get(ciclo) == "Chile":
        mi_reg = geo.get("region") if geo else None
    else:
        mi_reg = BDOS_REGION_MAP.get(prefix)
    country= CICLO_TO_COUNTRY.get(ciclo,"?")
    in_mi_reg = (country in countries_data and
                 mi_reg and mi_reg in countries_data.get(country,{}).get("regions",{}))
    pct_prod = round(stats["prod"]/stats["os"]*100,1) if stats["os"] else 0
    avg_sla  = round(stats["sla_sum"]/stats["sla_n"],1) if stats["sla_n"] else None
    avg_rate = round(stats["rate_sum"]/stats["rate_n"],1) if stats["rate_n"] else None
    has_geo  = "✓geo" if geo else "✗geo"
    reg_ok   = "✓reg" if in_mi_reg else "✗reg"
    print(f"  {has_geo} {reg_ok} [{loc_key}]")
    print(f"        country={country} | mi_region={mi_reg} | OSs={stats['os']:,} | prod={pct_prod}% | SLA={avg_sla}d | rating={avg_rate}")
    if geo:
        print(f"        WGS84: lat={geo['lat']}, lng={geo['lng']} | city={geo['city']}/{geo['state']}")
    if not geo: join_fail.append(loc_key)
    else: join_ok.append(loc_key)

print(f"\n── SUMMARY ──")
print(f"  Locations WITH geocoding: {len(join_ok)}")
print(f"  Locations WITHOUT geocoding: {len(join_fail)}")
if join_fail:
    print(f"  UNMAPPED: {join_fail}")

# ─── BUILD HIERARCHICAL JSON ──────────────────────────────────────────────────
print("\nBuilding hierarchical JSON L0→L5...")

# Inject operational data into Brazil regions (L4) and cities (L5)
brazil = countries_data.get("Brazil", {})
brazil["data_type"] = "real+estimated"

for loc_key, stats in loc_stats.items():
    ciclo   = stats["ciclo"]
    geo = get_geo(loc_key, ciclo)
    if not geo: continue
    country = CICLO_TO_COUNTRY.get(ciclo)
    if not country or country not in countries_data: continue

    prefix  = loc_key.split(" - ")[0].strip()
    if country == "Chile":
        # For Chile, region key == city name extracted from "CL{n} - CITY"
        mi_reg = geo.get("region")
    else:
        mi_reg = BDOS_REGION_MAP.get(prefix)
    if not mi_reg: continue

    c_data = countries_data[country]
    if mi_reg not in c_data["regions"]: continue

    reg_data = c_data["regions"][mi_reg]
    if "cities" not in reg_data: reg_data["cities"] = {}

    city_key = f"{geo['city']}/{geo['state']}"
    pct_prod = round(stats["prod"]/stats["os"]*100,1) if stats["os"] else 0
    avg_sla  = round(stats["sla_sum"]/stats["sla_n"],1) if stats["sla_n"] else None
    avg_rate = round(stats["rate_sum"]/stats["rate_n"],1) if stats["rate_n"] else None

    reg_data["cities"][city_key] = {
        "city":           geo["city"],
        "state":          geo["state"],
        "lat":            geo["lat"],
        "lng":            geo["lng"],
        "loc_key":        loc_key,
        "country":        country,
        "region":         mi_reg,
        "os_total":       stats["os"],
        "os_productive":  stats["prod"],
        "productive_pct": pct_prod,
        "sla_avg_days":   avg_sla,
        "avg_rating":     avg_rate,
        "top_campaigns":  dict(sorted(stats["campaigns"].items(), key=lambda x:-x[1])[:10]),
        "statuses":       stats["statuses"],
        "data_type":      "real"
    }
    # Accumulate operational totals into region
    reg_data.setdefault("os_total", 0)
    reg_data.setdefault("os_productive", 0)
    reg_data["os_total"]      += stats["os"]
    reg_data["os_productive"] += stats["prod"]
    reg_data["data_type"] = "real+estimated"
    c_data["data_type"]   = "real+estimated"

# Finalize region productive_pct
for country, cd in countries_data.items():
    for reg, rd in cd.get("regions",{}).items():
        if rd.get("os_total",0) > 0:
            rd["productive_pct"] = round(rd["os_productive"]/rd["os_total"]*100,1)

# Build full L0→L5 tree
hierarchy = {"level": 0, "name": "Mundo", "continents": {}}
for l1 in L1_ORDER:
    hierarchy["continents"][l1] = {"level":1,"name":l1,"subregions":{}}

for country, cd in countries_data.items():
    l1 = cd["continent"]
    l2 = cd["subregion"]
    if l1 not in hierarchy["continents"]: continue
    cont = hierarchy["continents"][l1]
    if l2 not in cont["subregions"]:
        cont["subregions"][l2] = {"level":2,"name":l2,"continent":l1,"countries":{}}
    cont["subregions"][l2]["countries"][country] = cd

# Save outputs
(OUT/"hierarchy.json").write_text(
    json.dumps(hierarchy, ensure_ascii=False, indent=2), encoding="utf-8")

(OUT/"countries.json").write_text(
    json.dumps(countries_data, ensure_ascii=False, indent=2), encoding="utf-8")

(OUT/"geocoding_l5.json").write_text(
    json.dumps(GEO_L5, ensure_ascii=False, indent=2), encoding="utf-8")

# Summary stats
all_cities = sum(len(cd.get("regions",{}).get(r,{}).get("cities",{}))
    for cd in countries_data.values() for r in cd.get("regions",{}))
total_os = sum(s["os"] for s in loc_stats.values())

print(f"\n── OUTPUT FILES ──")
print(f"  {OUT/'hierarchy.json'} ({(OUT/'hierarchy.json').stat().st_size//1024}KB)")
print(f"  {OUT/'countries.json'} ({(OUT/'countries.json').stat().st_size//1024}KB)")
print(f"  {OUT/'geocoding_l5.json'}")
print(f"\n── FINAL STATS ──")
print(f"  L1 continents:    {len(hierarchy['continents'])}")
print(f"  L2 sub-regions:   {sum(len(c['subregions']) for c in hierarchy['continents'].values())}")
print(f"  L3 countries:     {len(countries_data)}")
print(f"  L4 regions:       {sum(len(cd.get('regions',{})) for cd in countries_data.values())}")
print(f"  L5 cities (real): {all_cities}")
print(f"  Total OSs mapped: {total_os:,}")

# Download world GeoJSON for choropleth map
import urllib.request
world_geojson_path = OUT / "world.geojson"
if not world_geojson_path.exists():
    print("\nDownloading world GeoJSON...")
    url = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    try:
        urllib.request.urlretrieve(url, world_geojson_path)
        print(f"  Downloaded world.geojson ({world_geojson_path.stat().st_size//1024}KB)")
    except Exception as e:
        print(f"  Primary URL failed: {e}, trying fallback...")
        try:
            url2 = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
            urllib.request.urlretrieve(url2, world_geojson_path)
            print(f"  Downloaded world.geojson from fallback ({world_geojson_path.stat().st_size//1024}KB)")
        except Exception as e2:
            print(f"  Fallback also failed: {e2}")
else:
    print(f"\n  world.geojson already exists ({world_geojson_path.stat().st_size//1024}KB)")

print("\nDone.")
