// src/utils/googleSearch.js

const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
let blockedKeywords = [];

const fetchBlockedKeywords = async () => {
  if (blockedKeywords.length > 0) return;
  try {
    const response = await fetch('/blocked.txt');
    const text = await response.text();
    blockedKeywords = text.split('\n').map(k => k.trim()).filter(k => k.length > 0);
  } catch (error) {
    console.error("Error loading blocked keywords:", error);
  }
};

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i');
};

const containsBlockedKeyword = (text) => {
  const normalized = normalizeText(text);
  return blockedKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(text) || regex.test(normalized);
  });
};

const parseDuckDuckGoHTML = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  const results = [];
  const resultElements = Array.from(doc.querySelectorAll(".result"));
  
  for (const el of resultElements) {
    const titleEl = el.querySelector(".result__a");
    const snippetEl = el.querySelector(".result__snippet");
    
    if (titleEl) {
      const title = titleEl.textContent.trim();
      let link = titleEl.getAttribute("href");
      const snippet = snippetEl ? snippetEl.textContent.trim() : "";
      
      // Check for blocked keywords in title and snippet
      if (containsBlockedKeyword(title) || containsBlockedKeyword(snippet)) {
         continue;
      }
      
      // Decode DuckDuckGo redirect links
      if (link && link.includes("uddg=")) {
        try {
          const match = link.match(/uddg=([^&]+)/);
          if (match && match[1]) {
            link = decodeURIComponent(match[1]);
          }
        } catch (e) {
          // keep original link if decode fails
        }
      }

      if (link && !link.startsWith("//") && !link.includes("duckduckgo.com")) {
         results.push({
           title,
           link,
           snippet,
           source: "Web"
         });
      }
    }
  }

  return results.slice(0, 5);
};

export const searchWeb = async (query) => {
  if (!query) return [];

  await fetchBlockedKeywords();

  if (containsBlockedKeyword(query)) {
    console.warn(`Search query blocked: ${query}`);
    return [];
  }

  const cacheKey = query;
  if (searchCache.has(cacheKey)) {
    const { results, timestamp } = searchCache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      console.log(`Cache hit for query: ${query}`);
      return results;
    }
    searchCache.delete(cacheKey);
  }

  // Use DuckDuckGo HTML version as it is easier to scrape and less likely to block proxies
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  // List of proxies to try in order
 const proxies = [
    {
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}&t=${Date.now()}`,
      type: 'json',
      extract: (data) => data.contents
    },
    {
      url: `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(searchUrl)}`,
      type: 'text'
    },
    {
      url: `https://thingproxy.freeboard.io/fetch/${searchUrl}`,
      type: 'text'
    },
    {
      url: `https://corsproxy.io/?${encodeURIComponent(searchUrl)}`,
      type: 'text'
    },
    {
      url: `https://webproxy.developers.workers.dev/?url=${encodeURIComponent(searchUrl)}`,
      type: 'text'
    }
  ];

  for (const proxy of proxies) {
    try {
      console.log(`Attempting proxy: ${proxy.url}`);
      const response = await fetch(proxy.url);
      if (!response.ok) continue;
      
      let html = '';
      if (proxy.type === 'json') {
        
        const data = await response.json();
        html = proxy.extract ? proxy.extract(data) : data;
      } else {
        html = await response.text();
      }

      if (html && html.length > 100) {
        const results = parseDuckDuckGoHTML(html);
        if (results.length > 0) {
          searchCache.set(cacheKey, { results, timestamp: Date.now() });
          return results;
        }
      }
    } catch (error) {
      console.warn(`Proxy ${proxy.url} failed:`, error);
      continue;
    }
  }

  console.warn(`All proxies failed for query: ${query}`);
  return [];
};
