import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

data = json.load(open('public/data/countries.json', encoding='utf-8'))

print("pos_active_pct samples:")
for c in ['Brazil','Chile','USA','Argentina','Colombia','Germany']:
    d = data.get(c, {})
    print(f"  {c}: bat_share={d.get('bat_share')} pos_active_pct={d.get('pos_active_pct')}")

br = data['Brazil']
print("\nBrazil regions:")
for r, rd in br.get('regions', {}).items():
    print(f"  {r}: pos_bat={rd.get('pos_bat')} pos_active_pct={rd.get('pos_active_pct')} bat_share={rd.get('bat_share')}")

# Check for USA / major countries pos_bat
print("\nTop 15 by pos_bat:")
top = sorted([(c, d.get('pos_bat') or 0) for c, d in data.items()], key=lambda x: -x[1])[:15]
for c, v in top:
    print(f"  {c}: {v:,.0f} (bat_share={data[c].get('bat_share')}%)")
