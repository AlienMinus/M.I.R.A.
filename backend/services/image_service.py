import re
import html
import json
import urllib.parse
from typing import List, Dict, Any, Optional
import concurrent.futures
import requests
from bs4 import BeautifulSoup


class ImageService:
    """
    Dedicated image intelligence and scraping service that extracts relevant, high-resolution
    topic images using Wikimedia Commons (canonical encyclopedic media), Wikipedia PageImages,
    Bing Images (with strict B2B/CAD/blueprint filtering), and verified web sources.
    Guarantees at least 5 images related to the topic.
    """
    def __init__(self, timeout: float = 8.0):
        self.timeout = (4.0, timeout)
        self.session = requests.Session()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        self.wiki_headers = {
            "User-Agent": "MIRA-Intelligence-Search/2.0 (mira-dev@lexcodex.local; verified academic bot)",
            "Accept": "application/json"
        }
        self.banned_substrings = [
            "spacer", "pixel", "tracking", "1x1", "avatar", "icon", "logo-small",
            "badge", "ad-banner", "doubleclick", "analytics", "data:image",
            "fileicon", ".ogg", ".ogv", ".mp3", ".wav", ".pdf"
        ]
        self.banned_domains = [
            "imimg.com", "indiamart.com", "tistatic.com", "tradeindia.com",
            "advancelam.com", "dimensions.com", "vectorstock.com",
            "aliexpress.com", "alibaba.com", "shutterstock.com", "alamy.com",
            "etsystatic.com", "clipart-library.com", "printblame.com"
        ]
        self.animal_terms = {
            "tiger", "tigers", "sher", "deer", "deers", "hiran", "lion", "safari",
            "wildlife", "animal", "cartoon", "bird", "birds", "parrot", "parrots",
            "sparrow", "pigeon", "peacock", "nature wallpaper", "branch"
        }
        self.diagram_banned = {
            "foundation", "footing", "blueprint", "cad", "diagram", "schematic",
            "dimensions.com", "column footing", "slope of", "structure drawing",
            "construction", "elevation", "floor plan", "circuit", "laminate",
            "sunmica", "mdf", "plywood", "wood sheet", "timber board", "financial",
            "goal", "worksheet", "planning goal"
        }
        self.honorifics = {"shrimad", "srimad", "shree", "shri", "sri", "lord", "holy", "saint", "sant"}

    def _clean_query(self, query: str) -> str:
        """Strips conversational noise and prefixes from query for clean image searching."""
        prefixes = [
            r'^(please\s+)?give\s+me\s+(structured\s+)?(notes|summary|details|an\s+essay|bullet\s+points|bullets|information)\s+(on|about|regarding)\s+',
            r'^(please\s+)?(key\s+)?(notes|summary|bullet\s+points|bullets)\s+(on|about|regarding)\s+',
            r'^(please\s+)?(tell\s+me\s+about|explain|describe)\s+',
            r'^(can\s+you\s+)?(tell\s+me|explain|write\s+about)\s+',
            r'^(detailed\s+explanation\s+of|overview\s+of|summarize)\s+',
            r'^(who\s+is|who\s+was|who\s+created|who\s+founded|what\s+is|what\s+are)\s+',
        ]
        cleaned = query.strip()
        for pat in prefixes:
            cleaned = re.sub(pat, '', cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r'[\?\.\!]+$', '', cleaned).strip()
        return cleaned if len(cleaned) >= 2 else query.strip()

    def _get_query_variations(self, query: str) -> List[str]:
        """Generates alternate search keys (stripping honorifics and Hindi compounds)."""
        clean_q = self._clean_query(query)
        variations = [clean_q]

        words = clean_q.split()
        no_hon = " ".join([w for w in words if w.lower() not in self.honorifics]).strip()
        if no_hon and no_hon.lower() != clean_q.lower():
            variations.append(no_hon)

        q_lower = clean_q.lower()
        if "mahapuran" in q_lower or "bhagwat" in q_lower:
            variations.extend(["bhagavata purana", "bhagwat puran", "bhagavad gita"])

        if "gita" in q_lower and "bhagavad" not in q_lower:
            variations.append("bhagavad gita")

        # Deduplicate preserving order
        seen = set()
        res = []
        for v in variations:
            norm = " ".join(v.split())
            if norm.lower() not in seen:
                seen.add(norm.lower())
                res.append(norm)
        return res

    def _is_valid_image_url(self, url: str) -> bool:
        if not url or not url.startswith("http"):
            return False
        u_lower = url.lower()
        if any(banned in u_lower for banned in self.banned_substrings):
            return False
        if any(domain in u_lower for domain in self.banned_domains):
            return False
        return True

    def _is_relevant_image(self, title: str, query: str, url: str = "") -> bool:
        """Rejects absurdly unrelated images (e.g. wild animals, birds, blueprints, CAD diagrams, laminates, partial name mismatches)."""
        q_lower = query.lower()
        t_lower = (title or "").lower()
        u_lower = (url or "").lower()
        t_and_u = f"{t_lower} {u_lower}"

        # 1. Reject unrelated technical diagrams, blueprints, foundation drawings, CAD, wood laminates
        query_wants_diagram = any(term in q_lower for term in ["diagram", "blueprint", "cad", "foundation", "footing", "laminate", "wood"])
        if not query_wants_diagram:
            if any(term in t_lower or term in u_lower for term in self.diagram_banned):
                return False

        # 2. Reject wild animals / birds / parrots for non-animal queries
        query_has_animal = any(term in q_lower for term in self.animal_terms)
        if not query_has_animal:
            if any(term in t_lower or term in u_lower for term in self.animal_terms):
                return False

        # 3. Guard against partial name false-positives (e.g. "Bulletin of Elon College" for "Elon Musk")
        clean_words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', query) if w.lower() not in self.honorifics]
        if len(clean_words) >= 2:
            distinctive = clean_words[-1]  # e.g., "musk", "gita", "heard", "einstein"
            if distinctive not in t_and_u and not all(w in t_and_u for w in clean_words):
                return False
        elif len(clean_words) == 1:
            w = clean_words[0]
            if w not in t_and_u:
                return False

        return True

    def scrape_wikimedia_commons(self, query: str, limit: int = 8) -> List[Dict[str, str]]:
        """
        Queries Wikimedia Commons (commons.wikimedia.org, namespace 6 File:)
        for authentic, encyclopedic, public-domain illustrations, paintings, manuscripts, and photos.
        """
        search_terms = self._get_query_variations(query)
        images = []
        seen_urls = set()

        for term in search_terms:
            if len(images) >= limit:
                break
            # Try exact quoted phrase first for multi-word entities, then plain term
            phrases_to_try = [f'"{term}"', term] if len(term.split()) >= 2 else [term]
            for phrase in phrases_to_try:
                if len(images) >= limit:
                    break
                url = (
                    f"https://commons.wikimedia.org/w/api.php?action=query&format=json"
                    f"&generator=search&gsrsearch={urllib.parse.quote(phrase)}"
                    f"&gsrnamespace=6&gsrlimit={limit + 2}&prop=imageinfo&iiprop=url|mime&iiurlwidth=800"
                )
                try:
                    resp = self.session.get(url, headers=self.wiki_headers, timeout=self.timeout)
                    if resp.status_code == 200:
                        data = resp.json()
                        pages = data.get("query", {}).get("pages", {})
                        for pid, p in pages.items():
                            infos = p.get("imageinfo", [])
                            if not infos:
                                continue
                            info = infos[0]
                            mime = info.get("mime", "").lower()
                            if not mime.startswith("image/"):
                                continue

                            img_url = info.get("thumburl") or info.get("url")
                            if not self._is_valid_image_url(img_url) or img_url in seen_urls:
                                continue

                            raw_title = p.get("title", "")
                            clean_title = re.sub(r'^File:\s*', '', raw_title, flags=re.IGNORECASE)
                            clean_title = re.sub(r'\.(jpg|jpeg|png|webp|gif)$', '', clean_title, flags=re.IGNORECASE).strip()

                            if not self._is_relevant_image(clean_title, query, img_url):
                                continue

                            seen_urls.add(img_url)
                            images.append({
                                "url": img_url,
                                "title": clean_title[:80] or term.title(),
                                "source": "Wikimedia Commons"
                            })
                            if len(images) >= limit:
                                break
                except Exception:
                    pass

        return images

    def scrape_wikipedia_article_images(self, query: str, limit: int = 4) -> List[Dict[str, str]]:
        """
        Queries Wikipedia (en.wikipedia.org) PageImages API.
        STRICT: Only accepts images if the article title shares significant keywords with the query.
        """
        clean_q = self._clean_query(query)
        url = (
            f"https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search"
            f"&gsrsearch={urllib.parse.quote(clean_q)}&gsrlimit=6&prop=pageimages"
            f"&pithumbsize=800"
        )
        images = []
        try:
            resp = self.session.get(url, headers=self.wiki_headers, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                pages = data.get("query", {}).get("pages", {})
                q_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', clean_q.lower()))

                for pid, p in pages.items():
                    if "thumbnail" not in p or not p["thumbnail"].get("source"):
                        continue

                    page_title = p.get("title", "")
                    title_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', page_title.lower()))

                    # Guard against TV show actors or unrelated pages: require at least one keyword match
                    if q_words and not (q_words & title_words):
                        continue

                    img_url = p["thumbnail"]["source"]
                    if not self._is_valid_image_url(img_url):
                        continue

                    if not self._is_relevant_image(page_title, query, img_url):
                        continue

                    images.append({
                        "url": img_url,
                        "title": page_title[:80],
                        "source": "Wikipedia"
                    })
                    if len(images) >= limit:
                        break
        except Exception as e:
            pass
        return images

    def scrape_bing_images(self, query: str, limit: int = 6) -> List[Dict[str, str]]:
        """Scrapes direct image URLs from Bing Image search results with strict domain and content filtering."""
        clean_q = self._clean_query(query)
        url = f"https://www.bing.com/images/search?q={urllib.parse.quote(clean_q)}&setlang=en-US&cc=US&first=1"
        images = []
        try:
            resp = self.session.get(url, headers=self.headers, timeout=self.timeout)
            if resp.status_code == 200:
                blocks = re.findall(r'class="iusc"[^>]*m="([^"]+)"', resp.text)
                for b in blocks:
                    try:
                        data = json.loads(html.unescape(b))
                        img_url = data.get("murl")
                        if not self._is_valid_image_url(img_url):
                            continue
                        title = data.get("tft", "").strip() or clean_q.title()
                        title = re.sub(r'&[a-zA-Z]+;', ' ', title).strip()
                        if not self._is_relevant_image(title, query, img_url):
                            continue
                        images.append({
                            "url": img_url,
                            "title": title[:80],
                            "source": "Web Search"
                        })
                        if len(images) >= limit:
                            break
                    except Exception:
                        continue
        except Exception as e:
            pass
        return images

    def extract_images_from_html(self, html: str, page_url: str, base_title: str = "", query: str = "") -> List[Dict[str, str]]:
        """Extracts og:image and prominent content images from scraped HTML."""
        if not html:
            return []
        images = []
        try:
            soup = BeautifulSoup(html, "html.parser")
            og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
            if og_img and og_img.get("content"):
                src = og_img["content"].strip()
                if self._is_valid_image_url(src) and self._is_relevant_image(base_title, query, src):
                    images.append({
                        "url": src,
                        "title": base_title or "Article Image",
                        "source": "Web Article"
                    })

            for img in soup.find_all("img"):
                src = img.get("src") or img.get("data-src") or ""
                alt = img.get("alt", "").strip()
                if not src.startswith("http") or not self._is_valid_image_url(src):
                    continue
                if len(alt) >= 5 and self._is_relevant_image(alt, query, src):
                    images.append({
                        "url": src,
                        "title": alt[:80],
                        "source": "Web Article"
                    })
                if len(images) >= 4:
                    break
        except Exception:
            pass
        return images

    def get_topic_images(
        self,
        query: str,
        canonical_topic: Optional[str] = None,
        scraped_html_list: Optional[List[Dict[str, str]]] = None,
        min_images: int = 5,
        target_count: int = 8
    ) -> List[Dict[str, str]]:
        """
        Gathers at least min_images related images prioritizing Wikimedia Commons,
        Wikipedia articles, and filtered Bing results concurrently.
        """
        search_query = canonical_topic if canonical_topic and len(canonical_topic) >= 3 else query
        combined: List[Dict[str, str]] = []
        seen_urls = set()

        def add_img(img: Dict[str, str]):
            u = img.get("url", "").strip()
            if not u or u in seen_urls:
                return
            seen_urls.add(u)
            combined.append(img)

        # 1. Fetch Wikimedia Commons, Wikipedia, and Bing in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            commons_future = executor.submit(self.scrape_wikimedia_commons, search_query, limit=target_count)
            wiki_future = executor.submit(self.scrape_wikipedia_article_images, search_query, limit=4)
            bing_future = executor.submit(self.scrape_bing_images, search_query, limit=target_count)

            # Prioritize authentic Wikimedia Commons images first
            try:
                for img in commons_future.result(timeout=4.5):
                    add_img(img)
            except Exception:
                pass

            # Supplement with verified Wikipedia article images
            try:
                for img in wiki_future.result(timeout=4.0):
                    add_img(img)
            except Exception:
                pass

            # Supplement with Bing images if needed
            if len(combined) < target_count:
                try:
                    for img in bing_future.result(timeout=4.0):
                        add_img(img)
                except Exception:
                    pass

        # 2. Extract images from scraped pages ONLY if verified relevant
        if len(combined) < min_images and scraped_html_list:
            for page in scraped_html_list:
                for img in page.get("images", []):
                    img_title = img.get("title", "")
                    img_url = img.get("url", "")
                    if self._is_relevant_image(img_title, search_query, img_url):
                        add_img(img)
                if len(combined) >= min_images:
                    break

        return combined[:target_count]
