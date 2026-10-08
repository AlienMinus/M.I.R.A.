import html
import json
import re
import requests
import urllib.parse

def test_bing(query):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&setlang=en-US&cc=US&first=1"
    try:
        r = requests.get(url, headers=headers, timeout=5)
        blocks = re.findall(r'class="iusc"[^>]*m="([^"]+)"', r.text)
        print(f"Bing found {len(blocks)} iusc blocks for '{query}'")
        for b in blocks[:3]:
            try:
                data = json.loads(html.unescape(b))
                print("  URL:", data.get("murl", "")[:70], "| Title:", data.get("tft", ""))
            except Exception as e:
                print("  JSON error:", e)
    except Exception as e:
        print("Bing request failed:", e)

if __name__ == "__main__":
    test_bing("amber heard")
    test_bing("bhagavad gita")
