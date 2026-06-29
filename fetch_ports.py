import json
import urllib.request
import urllib.parse
import os

query = """
SELECT ?port ?portLabel ?coord WHERE {
  ?port wdt:P31/wdt:P279* wd:Q44782.
  ?port wdt:P625 ?coord.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 5000
"""
url = 'https://query.wikidata.org/sparql?query=' + urllib.parse.quote(query) + '&format=json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})

print("Fetching data from Wikidata...")
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
    
    ports = []
    for item in data['results']['bindings']:
        name = item.get('portLabel', {}).get('value')
        coord = item.get('coord', {}).get('value')
        if name and coord and 'Point(' in coord:
            try:
                lon, lat = coord.replace('Point(', '').replace(')', '').split()
                ports.append({'name': name, 'lat': float(lat), 'lon': float(lon)})
            except:
                pass
    
    os.makedirs('frontend/public', exist_ok=True)
    with open('frontend/public/ports.json', 'w', encoding='utf-8') as f:
        json.dump(ports, f)
    print(f'Saved {len(ports)} ports to frontend/public/ports.json.')
except Exception as e:
    print('Failed:', e)
