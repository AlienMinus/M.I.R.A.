import os
import re
import json
from pathlib import Path
from typing import Dict, Any, Optional, List

class RAGService:
    """
    Static Knowledge & Ecosystem RAG Service for MIRA.
    Indexes local responses (about, greetings, help, smalltalk, jokes)
    and ecosystem applications (apps.json).

    Implements strict matching to prevent false positives on general queries
    while providing instant responses for persona queries and ecosystem apps.
    """
    def __init__(self, base_dir: Optional[str] = None):
        if base_dir:
            self.project_root = Path(base_dir).resolve()
        else:
            self.project_root = Path(__file__).resolve().parent.parent.parent

        self.responses_dir = self.project_root / "src" / "data" / "responses"
        self.apps_file = self.project_root / "src" / "data" / "apps" / "apps.json"

        self.knowledge_base: Dict[str, str] = {}
        self.apps_catalog: List[Dict[str, Any]] = []
        self.app_index: Dict[str, Dict[str, Any]] = {}

        # Critical stopwords and common pronouns that must NEVER trigger RAG
        self.banned_single_words = {
            "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by",
            "is", "are", "was", "were", "be", "been", "being",
            "he", "she", "it", "they", "them", "his", "her", "hers", "its", "their",
            "who", "what", "which", "where", "when", "why", "how",
            "this", "that", "these", "those", "and", "or", "but", "so", "as"
        }

        self._load_knowledge_base()

    def _normalize(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()

    def _load_knowledge_base(self):
        """Loads curated response files and ecosystem apps."""
        # 1. Load curated responses
        if self.responses_dir.exists():
            for json_file in self.responses_dir.glob("*.json"):
                try:
                    with open(json_file, "r", encoding="utf-8", errors="ignore") as f:
                        data = json.load(f)
                        if isinstance(data, dict):
                            for k, v in data.items():
                                if k.startswith("__"):
                                    continue
                                norm_k = self._normalize(k)
                                if norm_k and norm_k not in self.banned_single_words:
                                    self.knowledge_base[norm_k] = str(v)
                except Exception as e:
                    print(f"[RAGService] Error loading {json_file.name}: {e}")
        else:
            print(f"[RAGService] Warning: Responses dir not found at {self.responses_dir}")

        # 2. Load MIRA Ecosystem Apps
        if self.apps_file.exists():
            try:
                with open(self.apps_file, "r", encoding="utf-8", errors="ignore") as f:
                    apps_data = json.load(f)
                    if isinstance(apps_data, list):
                        self.apps_catalog = apps_data
                        for app in apps_data:
                            app_id = self._normalize(app.get("id", ""))
                            app_name = self._normalize(app.get("label", ""))
                            if app_id:
                                self.app_index[app_id] = app
                            if app_name:
                                self.app_index[app_name] = app
            except Exception as e:
                print(f"[RAGService] Error loading apps.json: {e}")
        else:
            print(f"[RAGService] Warning: Apps catalog not found at {self.apps_file}")

        print(f"[RAGService] Loaded {len(self.knowledge_base)} knowledge items & {len(self.app_index)} app keywords.")

    def find_direct_response(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Attempts to match query against persona, greetings, or ecosystem apps.
        Uses STRICT matching rules to prevent false positives on general queries.
        """
        norm_query = self._normalize(query)
        if not norm_query:
            return None

        words = norm_query.split()

        # 0. Skip RAG completely for programming / code generation requests
        coding_markers = ["write a", "code for", "program to", "how to code", "how to write", "script to", "implement", "print hello"]
        if any(marker in norm_query for marker in coding_markers):
            return None

        # 1. Check Ecosystem Apps (Strict exact or explicit launch intent)
        for app_key, app in self.app_index.items():
            is_exact = norm_query == app_key
            is_launch_intent = norm_query in {
                f"open {app_key}", f"launch {app_key}", f"go to {app_key}",
                f"{app_key} app", f"what is {app_key}", f"about {app_key}"
            }
            if is_exact or is_launch_intent:
                label = app.get("label", app_key.title())
                desc = app.get("desc", "")
                link = app.get("link", "#")
                
                resp = (
                    f"### {label}\n\n"
                    f"{desc}\n\n"
                    f"- **Status**: {app.get('status', 'Active').title()}\n"
                    f"- **Access**: [{label} Workspace]({link})"
                )
                return {
                    "text": resp,
                    "source": f"MIRA Ecosystem App: {label}",
                    "category": "ecosystem"
                }

        # 2. Greeting / Common short utterance normalization (e.g. hii -> hi, heyy -> hey)
        check_query = norm_query
        if re.fullmatch(r'h+i+', norm_query):
            check_query = "hi"
        elif re.fullmatch(r'h+e+y+', norm_query):
            check_query = "hey"
        elif re.fullmatch(r'h+e+l+o+', norm_query):
            check_query = "hello"

        # Exact Match in Knowledge Base
        if check_query in self.knowledge_base:
            return {
                "text": self.knowledge_base[check_query],
                "source": "MIRA Local Knowledge",
                "category": "persona"
            }

        # 3. High-confidence phrase matching for multi-word persona queries
        # Only trigger if the user query is very short (<= 4 words) and predominantly matches the key
        if 2 <= len(words) <= 4:
            best_match = None
            best_len = 0
            for k, text in self.knowledge_base.items():
                k_words = k.split()
                if len(k_words) >= 2 and (norm_query == k or norm_query == f"who is {k}" or norm_query == f"what is {k}"):
                    if len(k) > best_len:
                        best_match = text
                        best_len = len(k)
            
            if best_match:
                return {
                    "text": best_match,
                    "source": "MIRA Local Knowledge",
                    "category": "persona"
                }

        return None

    def retrieve_context(self, query: str, top_k: int = 2) -> List[Dict[str, str]]:
        """Retrieves supplementary context snippets if relevant."""
        norm_query = self._normalize(query)
        contexts = []
        for app_key, app in self.app_index.items():
            if app_key in norm_query:
                contexts.append({
                    "title": app.get("label", app_key),
                    "snippet": app.get("desc", ""),
                    "source": "MIRA Apps"
                })
                if len(contexts) >= top_k:
                    break
        return contexts
