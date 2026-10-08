import re
import time
import base64
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from typing import List, Dict, Any
from urllib.parse import unquote, quote

class SearchService:
    def __init__(self, blocked_path: Path = None, cache_ttl: int = 3600):
        self.blocked_path = blocked_path
        self.cache_ttl = cache_ttl
        self.search_cache: Dict[str, Dict[str, Any]] = {}
        self.blocked_keywords = self._load_blocked_keywords()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })

    def _load_blocked_keywords(self) -> List[str]:
        keywords = []
        if self.blocked_path and Path(self.blocked_path).exists():
            try:
                with open(self.blocked_path, "r", encoding="utf-8", errors="ignore") as f:
                    keywords = [line.strip().lower() for line in f if line.strip()]
            except Exception as e:
                print(f"[SearchService] Warning reading blocked list: {e}")
        return keywords

    def normalize_text(self, text: str) -> str:
        t = text.lower()
        replacements = {
            '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
            '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i'
        }
        for k, v in replacements.items():
            t = t.replace(k, v)
        return t

    def is_blocked(self, text: str) -> bool:
        if not self.blocked_keywords or not text:
            return False
        norm = self.normalize_text(text)
        for kw in self.blocked_keywords:
            pattern = rf"\b{re.escape(kw)}\b"
            if re.search(pattern, text, re.IGNORECASE) or re.search(pattern, norm, re.IGNORECASE):
                return True
        return False

    def clean_search_query(self, query: str) -> str:
        """Strips conversational instructions so the search engine queries the core topic."""
        original = query.strip()
        prefixes = [
            r'^(please\s+)?give\s+me\s+(structured\s+)?(notes|summary|details|an\s+essay|bullet\s+points|bullets|information)\s+(on|about|regarding)\s+',
            r'^(please\s+)?(key\s+)?(notes|summary|bullet\s+points|bullets)\s+(on|about|regarding)\s+',
            r'^(please\s+)?(tell\s+me\s+about|explain|describe)\s+',
            r'^(can\s+you\s+)?(tell\s+me|explain|write\s+about)\s+',
            r'^(detailed\s+explanation\s+of|overview\s+of)\s+',
        ]
        suffixes = [
            r'\s+(in\s+paragraphs?|as\s+bullet\s+points?|as\s+bullets?|as\s+notes?|in\s+detail|step\s+by\s+step)$',
            r'[\?\.\!]+$'
        ]
        cleaned = original
        for pat in prefixes:
            cleaned = re.sub(pat, '', cleaned, flags=re.IGNORECASE).strip()
        for pat in suffixes:
            cleaned = re.sub(pat, '', cleaned, flags=re.IGNORECASE).strip()
        return cleaned if len(cleaned) >= 3 else original

    def decode_bing_url(self, href: str) -> str:
        """Decodes base64 redirect links in Bing search results."""
        if not href:
            return ""
        if "u=a1" in href:
            try:
                match = re.search(r"u=a1([^&]+)", href)
                if match:
                    raw = match.group(1)
                    raw += "=" * ((4 - len(raw) % 4) % 4)
                    decoded = base64.b64decode(raw).decode("utf-8", errors="ignore")
                    if decoded.startswith("http"):
                        return decoded
            except Exception:
                pass
        return href

    def _is_relevant_language(self, title: str, snippet: str, query: str) -> bool:
        """Filters out foreign language search results (e.g. Turkish or Chinese pages for English queries)."""
        combined = f"{title} {snippet}".lower()
        # If query is in Latin alphabet, reject CJK search results (e.g. 知乎, 百度)
        if not re.search(r'[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]', query):
            if re.search(r'[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]', title):
                return False

        # Common foreign stopwords/phrases from random regional index contamination
        foreign_words = {"yansıtırken", "sesin", "geldiğini", "görünmediğini", "fark ettin", "forumları", "nasıl", "nedir", "nasil"}
        if any(w in combined for w in foreign_words):
            return False

        return True

    def search_bing(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        url = f"https://www.bing.com/search?q={quote(query)}&setlang=en-US&cc=US"
        results = []
        try:
            resp = self.session.get(url, timeout=(3.0, 5.0))
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                items = soup.select("li.b_algo")
                for it in items:
                    h2 = it.select_one("h2 a")
                    snippet_el = it.select_one(".b_caption p")
                    if h2:
                        title = h2.get_text(strip=True)
                        raw_href = h2.get("href", "")
                        link = self.decode_bing_url(raw_href)
                        snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                        if self.is_blocked(title) or self.is_blocked(snippet):
                            continue

                        if not self._is_relevant_language(title, snippet, query):
                            continue

                        if link and link.startswith("http") and "bing.com" not in link:
                            results.append({
                                "title": title,
                                "link": link,
                                "snippet": snippet,
                                "source": "Bing Search"
                            })
                    if len(results) >= max_results:
                        break
        except Exception as e:
            print(f"[SearchService] Bing search failed: {e}")
        return results

    def search_wikipedia(self, query: str, max_results: int = 4) -> List[Dict[str, str]]:
        results = []
        # 1. Primary: Wikipedia extracts API for rich, authoritative introductory paragraphs
        extract_url = (
            f"https://en.wikipedia.org/w/api.php?action=query&format=json"
            f"&generator=search&gsrsearch={quote(query)}&gsrlimit={max_results}"
            f"&prop=extracts&exintro=1&explaintext=1"
        )
        try:
            resp = self.session.get(extract_url, timeout=(3.0, 5.0))
            if resp.status_code == 200:
                pages = resp.json().get("query", {}).get("pages", {})
                for pid, p in pages.items():
                    title = p.get("title", "")
                    extract = p.get("extract", "").strip()
                    if title and extract and not self.is_blocked(title) and not self.is_blocked(extract):
                        link = f"https://en.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}"
                        results.append({
                            "title": title,
                            "link": link,
                            "snippet": extract[:350],
                            "source": "Wikipedia"
                        })
                    if len(results) >= max_results:
                        break
        except Exception as e:
            print(f"[SearchService] Wikipedia extract search notice: {e}")

        # 2. Secondary fallback: OpenSearch
        if len(results) < max_results:
            url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={quote(query)}&limit={max_results}&namespace=0&format=json"
            try:
                resp = self.session.get(url, timeout=(3.0, 4.0))
                if resp.status_code == 200:
                    data = resp.json()
                    if len(data) >= 4:
                        titles, snippets, links = data[1], data[2], data[3]
                        for title, snippet, link in zip(titles, snippets, links):
                            if not any(r["title"] == title for r in results):
                                if not self.is_blocked(title) and not self.is_blocked(snippet):
                                    results.append({
                                        "title": title,
                                        "link": link,
                                        "snippet": snippet if snippet else f"Wikipedia article on {title}",
                                        "source": "Wikipedia"
                                    })
            except Exception as e:
                pass

        return results[:max_results]

    def search_duckduckgo_api(self, query: str) -> List[Dict[str, str]]:
        url = f"https://api.duckduckgo.com/?q={quote(query)}&format=json"
        results = []
        try:
            resp = self.session.get(url, timeout=(3.0, 4.0))
            data = resp.json()
            abstract = data.get("AbstractText", "")
            abstract_url = data.get("AbstractURL", "")
            heading = data.get("Heading", query)
            if abstract and abstract_url:
                results.append({
                    "title": heading,
                    "link": abstract_url,
                    "snippet": abstract,
                    "source": "DuckDuckGo Instant Answer"
                })
        except Exception as e:
            print(f"[SearchService] DuckDuckGo API failed: {e}")
        return results

    def search(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """Main search method with query cleaning, caching, multi-engine support, and blocked keywords filtering."""
        query = query.strip()
        if not query:
            return []

        # Clean conversational instructions to extract pure search query
        clean_query = self.clean_search_query(query)

        if self.is_blocked(clean_query):
            print(f"[SearchService] Blocked query rejected: {clean_query}")
            return []

        now = time.time()
        if clean_query in self.search_cache:
            entry = self.search_cache[clean_query]
            if now - entry["timestamp"] < self.cache_ttl:
                print(f"[SearchService] Cache hit for query: '{clean_query}'")
                return entry["results"]

        combined_results = []
        seen_links = set()

        bing_results = self.search_bing(clean_query, max_results=max_results)
        for r in bing_results:
            if r["link"] not in seen_links:
                seen_links.add(r["link"])
                combined_results.append(r)

        if len(combined_results) < max_results:
            wiki_results = self.search_wikipedia(clean_query, max_results=max_results - len(combined_results))
            for r in wiki_results:
                if r["link"] not in seen_links:
                    seen_links.add(r["link"])
                    combined_results.append(r)

        if len(combined_results) < 2:
            ddg_results = self.search_duckduckgo_api(clean_query)
            for r in ddg_results:
                if r["link"] not in seen_links:
                    seen_links.add(r["link"])
                    combined_results.append(r)

        final_results = combined_results[:max_results]
        self.search_cache[clean_query] = {
            "results": final_results,
            "timestamp": now
        }
        return final_results
