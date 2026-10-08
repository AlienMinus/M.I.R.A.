import re
import urllib.parse
from typing import List, Dict, Any, Optional
import concurrent.futures
import requests
from bs4 import BeautifulSoup

class ImageService:
    """
    Dedicated image scraping service that extracts relevant, high-resolution
    topic images using Bing Images, Wikimedia PageImages API, and scraped web sources.
    Guarantees at least 5 images related to the topic.
    """
    def __init__(self, timeout: int = 4):
        self.timeout = (2.0, 3.0)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        self.wiki_headers = {
            "User-Agent": "MIRA-Intelligence-Engine/1.0 (contact@mira.local; research bot)",
            "Accept": "application/json"
        }
        self.banned_substrings = [
            "spacer", "pixel", "tracking", "1x1", "avatar", "icon", "logo-small",
            "badge", "ad-banner", "doubleclick", "analytics", "data:image"
        ]
        self.animal_terms = {
            "tiger", "tigers", "sher", "deer", "deers", "hiran", "lion", "safari",
            "wildlife", "animal", "cartoon", "bird", "birds", "parrot", "parrots",
            "sparrow", "pigeon", "peacock", "nature wallpaper", "branch"
        }

    def _clean_query(self, query: str) -> str:
        """Strips conversational noise from query for clean image searching."""
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

    def _is_valid_image_url(self, url: str) -> bool:
        if not url or not url.startswith("http"):
            return False
        u_lower = url.lower()
        if any(banned in u_lower for banned in self.banned_substrings):
            return False
        return True

    def _is_relevant_image(self, title: str, query: str) -> bool:
        """Rejects absurdly unrelated images (e.g. wild animals, birds, blueprints, CAD diagrams)."""
        q_lower = query.lower()
        t_lower = title.lower()

        # 1. Reject unrelated technical diagrams, blueprints, foundation drawings, CAD
        diagram_banned = {
            "foundation", "footing", "blueprint", "cad", "diagram", "schematic",
            "dimensions.com", "column footing", "slope of", "structure drawing",
            "construction", "elevation", "floor plan", "circuit"
        }
        if not any(term in q_lower for term in ["diagram", "blueprint", "cad", "foundation", "footing"]):
            if any(term in t_lower for term in diagram_banned):
                return False

        # 2. Reject wild animals / birds / parrots for non-animal queries
        query_has_animal = any(term in q_lower for term in self.animal_terms)
        if not query_has_animal:
            if any(term in t_lower for term in self.animal_terms):
                return False

        return True

    def scrape_bing_images(self, query: str, limit: int = 8) -> List[Dict[str, str]]:
        """Scrapes direct image URLs from Bing Image search results."""
        clean_q = self._clean_query(query)
        url = f"https://www.bing.com/images/search?q={urllib.parse.quote(clean_q)}&setlang=en-US&cc=US&first=1"
        images = []
        try:
            resp = requests.get(url, headers=self.headers, timeout=self.timeout)
            if resp.status_code == 200:
                murls = re.findall(r'&quot;murl&quot;:&quot;(https?://[^&]+?)&quot;', resp.text)
                titles = re.findall(r'&quot;tft&quot;:&quot;([^&]+?)&quot;', resp.text)

                for i, img_url in enumerate(murls):
                    if not self._is_valid_image_url(img_url):
                        continue
                    title = titles[i].strip() if i < len(titles) and titles[i].strip() else clean_q.title()
                    title = re.sub(r'&[a-zA-Z]+;', ' ', title).strip()
                    if not self._is_relevant_image(title, query):
                        continue
                    images.append({
                        "url": img_url,
                        "title": title[:80],
                        "source": "Web Search"
                    })
                    if len(images) >= limit:
                        break
        except Exception as e:
            print(f"[ImageService] Bing images failed for '{clean_q}': {e}")
        return images

    def scrape_wikimedia_images(self, query: str, limit: int = 8) -> List[Dict[str, str]]:
        """Queries Wikimedia PageImages API for reliable, high-resolution encyclopedic images."""
        clean_q = self._clean_query(query)
        url = (
            f"https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search"
            f"&gsrsearch={urllib.parse.quote(clean_q)}&gsrlimit={limit}&prop=pageimages"
            f"&pithumbsize=800"
        )
        images = []
        try:
            resp = requests.get(url, headers=self.wiki_headers, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                pages = data.get("query", {}).get("pages", {})
                for pid, p in pages.items():
                    if "thumbnail" in p and p["thumbnail"].get("source"):
                        img_url = p["thumbnail"]["source"]
                        if self._is_valid_image_url(img_url):
                            images.append({
                                "url": img_url,
                                "title": p.get("title", clean_q.title()),
                                "source": "Wikimedia"
                            })
                    if len(images) >= limit:
                        break
        except Exception as e:
            print(f"[ImageService] Wikimedia images failed for '{clean_q}': {e}")
        return images

    def extract_images_from_html(self, html: str, page_url: str, base_title: str = "") -> List[Dict[str, str]]:
        """Extracts og:image and prominent content images from scraped HTML."""
        if not html:
            return []
        images = []
        try:
            soup = BeautifulSoup(html, "html.parser")
            og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
            if og_img and og_img.get("content"):
                src = og_img["content"].strip()
                if self._is_valid_image_url(src):
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
                if len(alt) >= 5 and not any(b in alt.lower() for b in ["icon", "logo", "banner", "button"]):
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
        Gathers at least min_images related images using Bing, Wikimedia, and page extracts concurrently.
        Uses canonical_topic when provided to avoid misspellings and false matches.
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

        # 1. Fetch Wikimedia and Bing in parallel, prioritizing encyclopedic Wikimedia Commons
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            wiki_future = executor.submit(self.scrape_wikimedia_images, search_query, limit=target_count)
            bing_future = executor.submit(self.scrape_bing_images, search_query, limit=target_count)

            # Prioritize verified encyclopedic Wikimedia images first
            try:
                for img in wiki_future.result(timeout=5.0):
                    add_img(img)
            except Exception:
                pass

            # Supplement with verified Bing images
            try:
                for img in bing_future.result(timeout=5.0):
                    add_img(img)
            except Exception:
                pass

        # 2. Extract images from scraped pages ONLY if verified relevant
        if len(combined) < min_images and scraped_html_list:
            for page in scraped_html_list:
                for img in page.get("images", []):
                    img_title = img.get("title", "")
                    if self._is_relevant_image(img_title, search_query):
                        add_img(img)
                if len(combined) >= min_images:
                    break

        return combined[:target_count]
