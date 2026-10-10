import re
import time
import base64
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from typing import List, Dict, Any, Optional
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
            r'^(who\s+is|who\s+was|who\s+were|what\s+is|what\s+was|what\s+are|where\s+is|where\s+was|why\s+is|why\s+was|how\s+does|how\s+do|how\s+is)\s+',
            r'^(biography\s+of|history\s+of|life\s+of|background\s+of)\s+',
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
        """Filters out foreign language search results."""
        combined = f"{title} {snippet}".lower()
        if not re.search(r'[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]', query):
            if re.search(r'[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]', title):
                return False

        foreign_words = {"yansıtırken", "sesin", "geldiğini", "görünmediğini", "fark ettin", "forumları", "nasıl", "nedir", "nasil"}
        if any(w in combined for w in foreign_words):
            return False

        return True

    def _is_allowed_domain(self, link: str, query: str) -> bool:
        """Filters out adult sites, help policy pages, and unrelated developer forums."""
        lower_link = link.lower()
        banned = [
            "xnxx.com", "pornhub.com", "xvideos.com", "nudist", "support.google.com",
            "youtube.com/answer", "policies.google.com", "social.msdn.microsoft.com",
            "answers.microsoft.com", "experts-exchange.com"
        ]
        if any(b in lower_link for b in banned):
            ms_keywords = {"c#", ".net", "dotnet", "azure", "visual studio", "powershell", "win32", "wpf"}
            q_words = set(re.findall(r'\b\w+\b', query.lower()))
            if not (q_words & ms_keywords) or "xnxx" in lower_link or "nudist" in lower_link:
                return False
        return True

    def _is_topically_relevant(self, title: str, snippet: str, query: str) -> bool:
        """Ensures search snippet has at least one content keyword matching the query."""
        q_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', query.lower()))
        q_content = {w for w in q_words if w not in {"who", "was", "the", "what", "where", "how", "why", "are", "tell", "give", "and", "for"}}
        if not q_content:
            return True
        combined = f"{title} {snippet}".lower()
        return any(qw in combined for qw in q_content)

    def search_bing(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        url = f"https://www.bing.com/search?q={quote(query)}&setlang=en-US&cc=US"
        results = []
        try:
            resp = self.session.get(url, timeout=(4.0, 7.0))
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

                        if not self._is_allowed_domain(link, query):
                            continue

                        if not self._is_topically_relevant(title, snippet, query):
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

    def get_authoritative_wikipedia_extract(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Directly fetches the comprehensive, authoritative introductory extract
        from Wikipedia for named entities and concepts.
        """
        wiki_headers = {
            "User-Agent": "MIRA-Search-Agent/2.0 (contact@mira.ai; educational demo)",
            "Accept": "application/json"
        }
        clean_q = query.strip()

        # Step 1: Direct summary check for exact title
        try:
            direct_title = clean_q.replace(" ", "_")
            direct_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(direct_title)}"
            resp_direct = self.session.get(direct_url, headers=wiki_headers, timeout=(4.0, 6.0))
            if resp_direct.status_code == 200:
                d_data = resp_direct.json()
                d_type = d_data.get("type", "")
                if d_type != "disambiguation":
                    page_title = d_data.get("title", "")
                    lead_extract = d_data.get("extract", "")
                    if page_title and len(lead_extract) >= 120:
                        # Fetch full multi-paragraph intro
                        intro_url = (
                            f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts"
                            f"&exintro=1&explaintext=1&titles={quote(page_title)}&format=json"
                        )
                        full_extract = lead_extract
                        try:
                            resp_intro = self.session.get(intro_url, headers=wiki_headers, timeout=(4.0, 6.0))
                            if resp_intro.status_code == 200:
                                pages = resp_intro.json().get("query", {}).get("pages", {})
                                for pid, p in pages.items():
                                    ex = p.get("extract", "").strip()
                                    if len(ex) > len(full_extract):
                                        full_extract = ex
                        except Exception:
                            pass

                        return {
                            "title": f"{page_title} - Wikipedia",
                            "link": f"https://en.wikipedia.org/wiki/{quote(page_title.replace(' ', '_'))}",
                            "snippet": lead_extract[:350],
                            "full_extract": full_extract,
                            "source": "Wikipedia"
                        }
        except Exception:
            pass

        # Step 2: Wikipedia Search API with title matching
        try:
            search_url = (
                f"https://en.wikipedia.org/w/api.php?action=query&list=search"
                f"&srsearch={quote(clean_q)}&utf8=&format=json&srlimit=4"
            )
            resp = self.session.get(search_url, headers=wiki_headers, timeout=(4.0, 7.0))
            if resp.status_code != 200:
                return None
            search_items = resp.json().get("query", {}).get("search", [])
            if not search_items:
                return None

            # Prioritize title with exact word match
            chosen_item = search_items[0]
            clean_q_lower = clean_q.lower()
            for it in search_items:
                t = it.get("title", "").lower()
                if t == clean_q_lower or (all(w in t for w in clean_q_lower.split()) and len(t.split()) <= len(clean_q_lower.split()) + 1):
                    chosen_item = it
                    break

            top_title = chosen_item.get("title", "")
            if not top_title or self.is_blocked(top_title):
                return None

            extract_url = (
                f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts"
                f"&exintro=1&explaintext=1&titles={quote(top_title)}&format=json"
            )
            resp_ex = self.session.get(extract_url, headers=wiki_headers, timeout=(4.0, 7.0))
            if resp_ex.status_code != 200:
                return None
            pages = resp_ex.json().get("query", {}).get("pages", {})
            for pid, p in pages.items():
                extract = p.get("extract", "").strip()
                if len(extract) >= 150:
                    lead_para = extract.split("\n")[0].strip()
                    link = f"https://en.wikipedia.org/wiki/{quote(top_title.replace(' ', '_'))}"
                    return {
                        "title": f"{top_title} - Wikipedia",
                        "link": link,
                        "snippet": lead_para[:350],
                        "full_extract": extract,
                        "source": "Wikipedia"
                    }
        except Exception as e:
            print(f"[SearchService] Authoritative Wikipedia extract notice: {e}")
        return None

    def search_wikipedia(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        results = []
        extract_url = (
            f"https://en.wikipedia.org/w/api.php?action=query&format=json"
            f"&generator=search&gsrsearch={quote(query)}&gsrlimit={max_results}"
            f"&prop=extracts&exintro=1&explaintext=1"
        )
        wiki_headers = {
            "User-Agent": "MIRA-Search-Agent/2.0 (contact@mira.ai; educational demo)",
            "Accept": "application/json"
        }
        try:
            resp = self.session.get(extract_url, headers=wiki_headers, timeout=(4.0, 7.0))
            if resp.status_code == 200:
                pages = resp.json().get("query", {}).get("pages", {})
                for pid, p in pages.items():
                    title = p.get("title", "")
                    extract = p.get("extract", "").strip()
                    if title and extract and not self.is_blocked(title) and not self.is_blocked(extract):
                        link = f"https://en.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}"
                        lead_para = extract.split("\n")[0].strip()
                        results.append({
                            "title": title,
                            "link": link,
                            "snippet": lead_para[:350],
                            "full_extract": extract,
                            "source": "Wikipedia"
                        })
                    if len(results) >= max_results:
                        break
        except Exception as e:
            print(f"[SearchService] Wikipedia extract search notice: {e}")

        # Secondary fallback: OpenSearch
        if len(results) < max_results:
            url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={quote(query)}&limit={max_results}&namespace=0&format=json"
            try:
                resp = self.session.get(url, headers=wiki_headers, timeout=(4.0, 7.0))
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
            except Exception:
                pass

        return results[:max_results]

    def search_duckduckgo_api(self, query: str) -> List[Dict[str, str]]:
        url = f"https://api.duckduckgo.com/?q={quote(query)}&format=json"
        results = []
        try:
            resp = self.session.get(url, timeout=(4.0, 7.0))
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

    def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Main search method with query cleaning, caching, multi-engine support, and blocked keywords filtering."""
        query = query.strip()
        if not query:
            return []

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

        # 1. Authoritative Wikipedia extract for conceptual and entity queries
        is_entity_query = bool(re.search(r'\b(who|what|where|when|why|how|explain|describe|tell me|biography|history|life)\b', query, re.IGNORECASE))
        if is_entity_query or len(clean_query.split()) <= 4:
            wiki_lead = self.get_authoritative_wikipedia_extract(clean_query)
            if wiki_lead and wiki_lead["link"] not in seen_links:
                seen_links.add(wiki_lead["link"])
                combined_results.append(wiki_lead)

        # 2. Bing Search
        bing_results = self.search_bing(clean_query, max_results=max_results)
        for r in bing_results:
            if r["link"] not in seen_links:
                seen_links.add(r["link"])
                combined_results.append(r)

        # 3. Wikipedia API Search fallback if more results needed
        if len(combined_results) < max_results:
            wiki_results = self.search_wikipedia(clean_query, max_results=max_results - len(combined_results))
            for r in wiki_results:
                if r["link"] not in seen_links:
                    seen_links.add(r["link"])
                    combined_results.append(r)

        # 4. DuckDuckGo Instant Answer fallback
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
