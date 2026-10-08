import time
import torch
from pathlib import Path
from typing import Dict, Any, List

import config
from models.gpt import load_gpt_model
from models.lstm import LSTMTextFormatter
from .search_service import SearchService
from .scraper_service import ScraperService
from .nlp_service import NLPService
from .image_service import ImageService
from .rag_service import RAGService

class PipelineService:
    def __init__(self, device: str = None):
        self.device = device or config.DEVICE
        print(f"[PipelineService] Initializing on device: {self.device}")

        self.search_service = SearchService(
            blocked_path=config.BLOCKED_KEYWORDS_PATH,
            cache_ttl=3600
        )
        self.scraper_service = ScraperService(
            timeout=config.SEARCH_CONFIG["request_timeout"],
            user_agent=config.SEARCH_CONFIG["user_agent"]
        )

        self.nlp_service = NLPService()
        self.image_service = ImageService()
        self.rag_service = RAGService()

        self.gpt_model, self.tokenizer = load_gpt_model(
            model_path=config.MODEL_PATH,
            config_dict=config.GPT_CONFIG,
            device=self.device
        )

        self.lstm_formatter = LSTMTextFormatter(
            vocab_size=config.LSTM_CONFIG["vocab_size"],
            embed_dim=config.LSTM_CONFIG["embed_dim"],
            hidden_dim=config.LSTM_CONFIG["hidden_dim"],
            num_layers=config.LSTM_CONFIG["num_layers"],
            bidirectional=config.LSTM_CONFIG["bidirectional"],
            dropout=config.LSTM_CONFIG["dropout"]
        ).to(self.device)
        self.lstm_formatter.eval()

        print("[PipelineService] Pipeline initialized successfully.")

    def run_pipeline(self, prompt: str, requested_format: str = "auto") -> Dict[str, Any]:
        start_time = time.time()
        prompt = prompt.strip()
        if not prompt:
            return {"error": "Empty prompt provided", "success": False}

        execution_log = []

        # 0. CHECK DIRECT RAG MATCH (Persona, greetings, ecosystem apps)
        direct_match = self.rag_service.find_direct_response(prompt)
        if direct_match:
            elapsed = round(time.time() - start_time, 2)
            execution_log.append(f"Matched in local knowledge base ({direct_match.get('source')}).")
            return {
                "success": True,
                "prompt": prompt,
                "format_applied": "direct",
                "generated_text": direct_match["text"],
                "summary": "",
                "images": [],
                "sources": [{"title": direct_match["source"], "url": "#", "snippet": direct_match["text"]}],
                "scraped_count": 0,
                "execution_time_seconds": elapsed,
                "pipeline_log": execution_log,
                "is_rag": True
            }

        # 1. WEB SEARCH
        execution_log.append("Executing web search...")
        search_results = self.search_service.search(
            query=prompt,
            max_results=config.SEARCH_CONFIG["max_results"]
        )
        execution_log.append(f"Retrieved {len(search_results)} search results.")

        # 2. SCRAPE WEBSITES
        scraped_sources = []
        scraped_paragraphs = []
        if search_results:
            execution_log.append("Scraping top website pages...")
            scraped_sources = self.scraper_service.scrape_sources(
                search_results,
                max_pages=config.SEARCH_CONFIG["max_scrape_pages"]
            )
            for src in scraped_sources:
                scraped_paragraphs.extend(src.get("paragraphs", []))
            execution_log.append(f"Scraped {len(scraped_paragraphs)} paragraphs from {len(scraped_sources)} websites.")

        # 3. SCRAPE TOPIC IMAGES (Bing + Wikimedia + Scraped Page Images, min 5)
        execution_log.append("Extracting high-resolution topic imagery...")
        canonical_topic = prompt
        if search_results:
            top_title = search_results[0].get("title", "")
            clean_title = re.split(r'[-–—|:]', top_title)[0].strip()
            if len(clean_title) >= 3 and not any(w in clean_title.lower() for w in ["search", "results", "overview", "login"]):
                canonical_topic = clean_title

        topic_images = self.image_service.get_topic_images(
            query=prompt,
            canonical_topic=canonical_topic,
            scraped_html_list=scraped_sources,
            min_images=5,
            target_count=8
        )
        execution_log.append(f"Retrieved {len(topic_images)} verified images for '{canonical_topic}'.")

        # 4. PYTORCH GPT MODEL GENERATION
        execution_log.append("Generating response with PyTorch GPT model...")
        gpt_generated_text = ""
        try:
            top_snippet = search_results[0]["snippet"] if search_results else ""
            if top_snippet:
                cond_text = f"Q: {prompt}\nContext: {top_snippet[:100]}\nA:"
            else:
                cond_text = f"Q: {prompt}\nA:"

            tokens = self.tokenizer.encode_ordinary(cond_text)
            if len(tokens) > 70:
                tokens = tokens[-70:]

            input_tensor = torch.tensor([tokens], dtype=torch.long, device=self.device)
            with torch.no_grad():
                gen_ids = self.gpt_model.generate(input_tensor, max_new_tokens=60, temperature=0.7, top_k=40)
            gpt_generated_text = self.tokenizer.decode(gen_ids[0].tolist())
            if cond_text in gpt_generated_text:
                gpt_generated_text = gpt_generated_text.replace(cond_text, "").strip()
        except Exception as e:
            print(f"[PipelineService] GPT generation fallback: {e}")
            gpt_generated_text = ""

        # 5. COLLECT CANDIDATES & PYTORCH LSTM RANKING
        execution_log.append("Cleaning, sanitizing, and ranking sequences using PyTorch Bi-LSTM...")
        raw_candidates = []

        # Add search snippets
        for r in search_results:
            if r.get("snippet"):
                raw_candidates.extend(self.nlp_service.filter_and_clean_sentences(r["snippet"], query=prompt))

        # Add scraped paragraphs
        for p in scraped_paragraphs:
            raw_candidates.extend(self.nlp_service.filter_and_clean_sentences(p, query=prompt))

        # Add GPT generated sentences (filtered for relevance and story hallucinations)
        if gpt_generated_text:
            raw_candidates.extend(self.nlp_service.filter_and_clean_sentences(gpt_generated_text, query=prompt))

        if not raw_candidates:
            raw_candidates = [
                f"Information regarding {prompt} was gathered and analyzed from online sources.",
                "The neural engine processed the search context to extract verified findings."
            ]

        # Use LSTM to rank, filter, and score coherence against user query
        ranked_sentences = self.lstm_formatter.rank_and_filter(
            candidate_sentences=raw_candidates,
            query=prompt,
            tokenizer=self.tokenizer,
            top_k=6,
            device=self.device
        )
        execution_log.append(f"Selected {len(ranked_sentences)} non-redundant, coherent sentences via LSTM.")

        # 6. EXECUTIVE SUMMARY & NLTK FORMATTING
        execution_log.append("Generating executive summary and applying NLTK structure...")
        summary = self.nlp_service.extract_summary(prompt, ranked_sentences)

        formatted_text, format_type = self.nlp_service.format_response(
            query=prompt,
            sentences=ranked_sentences,
            sources=search_results,
            requested_format=requested_format
        )

        elapsed = round(time.time() - start_time, 2)
        execution_log.append(f"Completed in {elapsed}s.")

        return {
            "success": True,
            "prompt": prompt,
            "format_applied": format_type,
            "generated_text": formatted_text,
            "summary": summary,
            "images": topic_images,
            "sources": search_results,
            "scraped_count": len(scraped_sources),
            "execution_time_seconds": elapsed,
            "pipeline_log": execution_log
        }
