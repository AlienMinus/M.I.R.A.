import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any

class ScraperService:
    def __init__(self, timeout: int = 5, user_agent: str = None):
        self.timeout = timeout
        self.headers = {
            'User-Agent': user_agent or 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        self.disclaimer_keywords = [
            'cookie policy', 'privacy policy', 'all rights reserved',
            'terms of service', 'accept all cookies', 'enable javascript'
        ]

    def _is_clean_paragraph(self, text: str) -> bool:
        if len(text) < 30 or len(text) > 1500:
            return False
        lower = text.lower()
        if any(dk in lower for dk in self.disclaimer_keywords):
            return False
        if text.count(' ') < 3:
            return False
        return True

    def scrape_url(self, url: str) -> List[str]:
        if not url or not url.startswith('http'):
            return []

        paragraphs = []
        try:
            resp = requests.get(url, headers=self.headers, timeout=self.timeout)
            if resp.status_code != 200:
                return []

            content_type = resp.headers.get('Content-Type', '')
            if 'text/html' not in content_type:
                return []

            soup = BeautifulSoup(resp.text, 'html.parser')
            for unwanted in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'form', 'svg', 'noscript', 'button']):
                unwanted.decompose()

            # 1. Search all <p> tags
            for p in soup.find_all('p'):
                clean_text = p.get_text(separator=' ', strip=True)
                if self._is_clean_paragraph(clean_text):
                    paragraphs.append(clean_text)

            # 2. If <p> tags yielded few paragraphs, check li, section, article
            if len(paragraphs) < 3:
                for block in soup.find_all(['li', 'section', 'article']):
                    clean_text = block.get_text(separator=' ', strip=True)
                    if self._is_clean_paragraph(clean_text) and clean_text not in paragraphs:
                        paragraphs.append(clean_text)

        except Exception as e:
            print(f'[ScraperService] Failed to scrape {url}: {e}')

        return paragraphs

    def scrape_sources(self, search_results: List[Dict[str, str]], max_pages: int = 3) -> List[Dict[str, Any]]:
        scraped_data = []
        target_results = search_results[:max_pages]
        if not target_results:
            return []

        from concurrent.futures import ThreadPoolExecutor, as_completed

        def _fetch(res):
            url = res.get('link', '')
            title = res.get('title', '')
            snippet = res.get('snippet', '')
            paragraphs = self.scrape_url(url)
            return {
                'title': title,
                'link': url,
                'snippet': snippet,
                'source': res.get('source', 'Web'),
                'paragraphs': paragraphs[:6]
            }

        with ThreadPoolExecutor(max_workers=min(len(target_results), 4)) as executor:
            future_to_res = {executor.submit(_fetch, res): res for res in target_results}
            for future in as_completed(future_to_res):
                try:
                    data = future.result()
                    scraped_data.append(data)
                except Exception as e:
                    print(f'[ScraperService] Concurrent scrape failed: {e}')

        return scraped_data
