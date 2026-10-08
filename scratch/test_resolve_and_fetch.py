import html
import json
import re
import urllib.parse
import requests

HONORIFICS = ["shrimad", "srimad", "shree", "shri", "sri", "lord", "holy", "saint", "sant"]

def get_query_variations(query: str) -> list[str]:
    clean_q = re.sub(r'^(please\s+)?(tell\s+me\s+about|what\s+is|who\s+is|give\s+me|explain)\s+', '', query, flags=re.IGNORECASE).strip()
    variations = [clean_q]

    # Strip honorifics
    words = clean_q.split()
    no_hon = " ".join([w for w in words if w.lower() not in HONORIFICS]).strip()
    if no_hon and no_hon.lower() != clean_q.lower():
        variations.append(no_hon)

    # Replace Hindi compound forms like 'mahapuran' -> 'purana' / 'puran'
    if "mahapuran" in clean_q.lower():
        v1 = re.sub(r'\bmahapuran\b', 'purana', clean_q, flags=re.IGNORECASE)
        v2 = re.sub(r'\bmahapuran\b', 'puran', clean_q, flags=re.IGNORECASE)
        v3 = re.sub(r'\bbhagwat\s+mahapuran\b', 'bhagavata purana', clean_q, flags=re.IGNORECASE)
        variations.extend([v3, v1, v2])

    if "bhagwat" in clean_q.lower() and "bhagavata" not in clean_q.lower():
        variations.append(re.sub(r'\bbhagwat\b', 'bhagavata', clean_q, flags=re.IGNORECASE))

    # Deduplicate preserving order
    seen = set()
    res = []
    for v in variations:
        norm = " ".join(v.split())
        if norm.lower() not in seen:
            seen.add(norm.lower())
            res.append(norm)
    return res

def resolve_canonical(query: str) -> str:
    for var in get_query_variations(query):
        try:
            # 1. Try direct redirects
            url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(var)}&redirects=1&format=json"
            r = requests.get(url, headers={"User-Agent": "MIRA/1.0"}, timeout=(2.5, 4.0)).json()
            pages = r.get("query", {}).get("pages", {})
            for p in pages.values():
                if p.get("pageid") and p.get("title") and not p.get("missing"):
                    return p["title"]

            # 2. Try OpenSearch
            os_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={urllib.parse.quote(var)}&limit=3&format=json"
            r_os = requests.get(os_url, headers={"User-Agent": "MIRA/1.0"}, timeout=(2.5, 4.0)).json()
            titles = r_os[1] if len(r_os) > 1 else []
            for t in titles:
                # check if t has redirects
                r2 = requests.get(f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(t)}&redirects=1&format=json", headers={"User-Agent": "MIRA/1.0"}, timeout=(2.5, 4.0)).json()
                for p in r2.get("query", {}).get("pages", {}).values():
                    if p.get("pageid") and p.get("title") and not p.get("missing"):
                        return p["title"]
        except Exception as e:
            pass
    return query

def search_commons(term: str, limit: int = 8):
    url = (
        f"https://commons.wikimedia.org/w/api.php?action=query&format=json"
        f"&generator=search&gsrsearch={urllib.parse.quote(term)}"
        f"&gsrnamespace=6&gsrlimit={limit}&prop=imageinfo&iiprop=url|mime&iiurlwidth=800"
    )
    images = []
    try:
        r = requests.get(url, headers={"User-Agent": "MIRA/1.0"}, timeout=(2.5, 5.0)).json()
        pages = r.get("query", {}).get("pages", {})
        for p in pages.values():
            infos = p.get("imageinfo", [])
            if not infos: continue
            info = infos[0]
            if not info.get("mime", "").startswith("image/"): continue
            img_url = info.get("thumburl") or info.get("url")
            raw_title = p.get("title", "")
            clean_title = re.sub(r'^File:\s*', '', raw_title)
            clean_title = re.sub(r'\.[a-zA-Z0-9]+$', '', clean_title)
            images.append({"title": clean_title, "url": img_url})
    except Exception as e:
        print("Commons error:", e)
    return images

def fetch_images(q):
    print("====================================")
    print("Testing Query:", q)
    canon = resolve_canonical(q)
    print("Resolved Canonical:", canon)
    imgs = search_commons(canon)
    if len(imgs) < 5:
        for var in get_query_variations(q):
            if var.lower() != canon.lower():
                extra = search_commons(var)
                for item in extra:
                    if not any(i["url"] == item["url"] for i in imgs):
                        imgs.append(item)
            if len(imgs) >= 8:
                break
    print(f"Found {len(imgs)} images:")
    for i in imgs[:5]:
        print("  -", i["title"][:60], "-->", i["url"][:60])

if __name__ == "__main__":
    fetch_images("shrimad bhagwat mahapuran")
    fetch_images("bhagwat gita")
    fetch_images("amber heard")
