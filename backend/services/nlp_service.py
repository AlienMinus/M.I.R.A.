import re
from typing import List, Dict, Any, Tuple
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.tag import pos_tag

# Ensure NLTK packages
for pkg in ["punkt", "punkt_tab", "stopwords", "averaged_perceptron_tagger", "averaged_perceptron_tagger_eng"]:
    try:
        nltk.download(pkg, quiet=True)
    except Exception as e:
        pass

class NLPService:
    def __init__(self):
        try:
            self.stop_words = set(stopwords.words("english"))
        except Exception:
            self.stop_words = {"the", "a", "an", "is", "are", "and", "or", "in", "on", "for", "with", "to", "of", "by", "at", "it", "this", "that"}

        # TinyStories / creative hallucination markers
        self.story_markers = {
            "rainbow", "lulu", "tim", "lily", "once upon a time", "went back inside",
            "little girl", "little boy", "mommy", "daddy", "she was very sad",
            "he was happy", "smiled and said", "bright colors", "hugged each other",
            "one day", "sunny day", "played together"
        }

        # Format detection keywords
        self.note_keywords = {
            "note", "notes", "bullet", "bullets", "point", "points",
            "list", "outline", "summary", "summarize", "key takeaways",
            "takeaway", "structured", "brief", "checklist", "key points"
        }

        self.paragraph_keywords = {
            "paragraph", "paragraphs", "essay", "article", "detailed",
            "explain", "explanation", "story", "write about", "description"
        }

    def sanitize_text(self, text: str) -> str:
        """Strips scraped HTML artifacts, phonetics, timestamps, and citations."""
        if not text:
            return ""

        # 1. Remove Wikipedia-style phonetic pronunciation guides in parentheses
        text = re.sub(r'\([^\)]*[əɛɪʊʌɒɔːɜːɑːθðʃʒⓘˈˌ][^\)]*\)', '', text)

        # 2. Remove stray IPA slashes /.../
        text = re.sub(r'/[^/\n]{1,30}/', '', text)

        # 3. Remove orphaned phonetic prefixes ending in a parenthesis, e.g. "g əl / ⓘ, GOO -gəl )"
        text = re.sub(r'^[^\)\n]{1,60}\)\s*', '', text)

        # 4. Remove leading search timestamps (e.g., "3 days ago·", "Sep 3, 2026·")
        text = re.sub(r'^\d+\s+(days?|hours?|mins?|weeks?|months?|years?)\s+ago\s*[\xb7\.\-]?\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^[A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4}\s*[\xb7\.\-]?\s*', '', text)
        text = re.sub(r'\b\d+\s+(days?|hours?|mins?|weeks?|months?|years?)\s+ago\s*[\xb7\.\-]?\s*', '', text, flags=re.IGNORECASE)

        # 5. Remove leading stray punctuation
        text = re.sub(r'^[\)\],;:\s\.\xb7\-]+', '', text)

        # 6. Remove multiple dots / ellipses
        text = re.sub(r'\.{2,}', '', text)
        text = re.sub(r'…', '', text)

        # 7. Remove Wikipedia citation markers [1], [2], [edit], [citation needed]
        text = re.sub(r'\[\s*\d+\s*\]', '', text)
        text = re.sub(r'\[(edit|citation needed|note \d+)\]', '', text, flags=re.IGNORECASE)

        # 8. Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def has_verb(self, sentence: str) -> bool:
        """Ensures the text is a complete grammatical sentence with at least one verb."""
        try:
            tokens = word_tokenize(sentence)
            tags = pos_tag(tokens)
            return any(tag.startswith("VB") or tag in {"MD"} for word, tag in tags)
        except Exception:
            # Fallback simple check
            common_verbs = {"is", "are", "was", "were", "been", "has", "have", "had", "founded", "created", "launched", "started", "developed", "includes", "became", "made", "used"}
            return any(w.lower() in common_verbs for w in sentence.split())

    def is_story_hallucination(self, sentence: str, query: str = None) -> bool:
        """Detects if sentence is a TinyStories hallucination unrelated to query."""
        s_lower = sentence.lower()
        q_lower = (query or "").lower()

        if any(w in q_lower for w in ["story", "fairy", "tale", "rainbow"]):
            return False

        return any(sm in s_lower for sm in self.story_markers)

    def get_content_words(self, text: str) -> set:
        words = re.findall(r'\b\w+\b', text.lower())
        return set(w for w in words if w not in self.stop_words and len(w) > 1 and not w.isnumeric())

    def get_entities_and_numbers(self, text: str) -> set:
        words = re.findall(r'\b[A-Z0-9][a-zA-Z0-9_-]*\b', text)
        return set(w.lower() for w in words if len(w) > 2 and w.lower() not in self.stop_words)

    def is_semantically_duplicate(self, candidate: str, accepted: List[str]) -> bool:
        """
        Rigorous pairwise deduplication:
        Checks Jaccard similarity, content word overlap, and shared entity facts.
        """
        cand_content = self.get_content_words(candidate)
        cand_entities = self.get_entities_and_numbers(candidate)
        if not cand_content:
            return True

        for acc in accepted:
            acc_content = self.get_content_words(acc)
            acc_entities = self.get_entities_and_numbers(acc)

            # 1. Content words overlap
            intersection = cand_content & acc_content
            if intersection:
                jaccard = len(intersection) / len(cand_content | acc_content)
                overlap_cand = len(intersection) / len(cand_content)
                overlap_acc = len(intersection) / len(acc_content)

                if jaccard >= 0.35 or overlap_cand >= 0.48 or overlap_acc >= 0.48:
                    return True

            # 2. Key entity & numerical facts overlap
            shared_entities = cand_entities & acc_entities
            if len(shared_entities) >= 3:
                return True

        return False

    def clean_sentence(self, sentence: str) -> str:
        s = self.sanitize_text(sentence)
        if not s:
            return ""

        # Discard fragments starting with lowercase verbs or conjunctions
        lower_words = s.split()
        if lower_words and lower_words[0].lower() in {"is", "are", "was", "were", "been", "which", "that", "and", "or", "but"}:
            return ""

        # Discard non-sentences (e.g. lists of discontinued products without verbs)
        if not self.has_verb(s):
            return ""

        # Fix spacing before punctuation
        s = re.sub(r'\s+([,.:;?!])', r'\1', s)
        s = re.sub(r'([,.:;?!])([A-Za-z])', r'\1 \2', s)

        # Capitalize first letter
        s = s[0].upper() + s[1:]

        # Ensure sentence ends with punctuation
        if s[-1] not in ".!?":
            s += "."

        return s

    def filter_and_clean_sentences(self, raw_text: str, query: str = None) -> List[str]:
        if not raw_text:
            return []

        cleaned_text = self.sanitize_text(raw_text)
        raw_sentences = sent_tokenize(cleaned_text)
        cleaned = []

        query_keywords = set(self.get_content_words(query)) if query else set()

        for s in raw_sentences:
            s = self.clean_sentence(s)

            if len(s) < 25 or s.count(" ") < 3:
                continue

            if self.is_story_hallucination(s, query):
                continue

            lower_s = s.lower().rstrip(".").strip()
            if lower_s.endswith(("and", "or", "because", "with", "which", "that", "the", "a", "an")):
                continue

            # Ensure sentence is topically relevant
            if query_keywords:
                s_words = set(re.findall(r'\b\w+\b', s.lower()))
                if not (s_words & query_keywords):
                    entities = self.get_entities_and_numbers(s)
                    if not entities:
                        continue

            if not self.is_semantically_duplicate(s, cleaned):
                cleaned.append(s)

        return cleaned

    def detect_format_intent(self, prompt: str, user_override: str = None) -> str:
        if user_override and user_override in ["structured_notes", "paragraphed"]:
            return user_override

        prompt_lower = prompt.lower()
        words = set(re.findall(r'\b\w+\b', prompt_lower))

        note_score = 0
        if any(phrase in prompt_lower for phrase in ["bullet points", "key takeaways", "structured notes", "take away", "give me notes"]):
            note_score += 3
        for kw in self.note_keywords:
            if kw in words:
                note_score += 1

        para_score = 0
        if any(phrase in prompt_lower for phrase in ["write an essay", "detailed explanation", "in paragraphs"]):
            para_score += 3
        for kw in self.paragraph_keywords:
            if kw in words:
                para_score += 1

        if note_score > para_score:
            return "structured_notes"
        return "paragraphed"

    def order_by_relevance(self, query: str, sentences: List[str]) -> List[str]:
        """Puts direct answer sentences first, followed by contextual details."""
        if not query or len(sentences) <= 1:
            return sentences

        q_words = set(re.findall(r'\b\w+\b', query.lower()))
        # High-intent question keywords
        answer_verbs = {"founded", "created", "invented", "discovered", "developed", "launched", "started", "built", "is", "was"}

        def score(s):
            s_words = set(re.findall(r'\b\w+\b', s.lower()))
            overlap = len(s_words & q_words)
            has_action = bool(s_words & answer_verbs)
            return overlap * 2 + (3 if has_action else 0)

        # Sort with highest direct relevance first
        return sorted(sentences, key=score, reverse=True)

    def format_as_structured_notes(
        self,
        query: str,
        sentences: List[str],
        sources: List[Dict[str, str]]
    ) -> str:
        title = query.strip().rstrip("?.!").title()

        deduped = []
        for s in sentences:
            if not self.is_semantically_duplicate(s, deduped):
                deduped.append(s)

        ordered = self.order_by_relevance(query, deduped)

        overview = ordered[0] if len(ordered) > 0 else f"Key summary regarding {query}."
        bullets = ordered[1:6] if len(ordered) > 1 else ordered[:1]
        details = ordered[6:10] if len(ordered) > 6 else []

        lines = [
            f"# {title}",
            "",
            "### Overview",
            overview,
            "",
            "### Key Takeaways & Findings"
        ]

        for b in bullets:
            lines.append(f"- {b}")

        if details:
            lines.append("")
            lines.append("### In-Depth Breakdown")
            lines.append(" ".join(details))

        return "\n".join(lines)

    def format_as_paragraphs(
        self,
        query: str,
        sentences: List[str],
        sources: List[Dict[str, str]]
    ) -> str:
        deduped = []
        for s in sentences:
            if not self.is_semantically_duplicate(s, deduped):
                deduped.append(s)

        if not deduped:
            deduped = [f"Information regarding {query} was compiled from verified web sources."]

        ordered = self.order_by_relevance(query, deduped)

        if len(ordered) <= 2:
            body_paragraphs = [" ".join(ordered)]
        else:
            mid = max(len(ordered) // 2, 1)
            p1 = " ".join(ordered[:mid])
            p2 = " ".join(ordered[mid:])
            body_paragraphs = [p1, p2]

        lines = []
        for p in body_paragraphs:
            if p.strip():
                lines.append(p.strip())

        return "\n\n".join(lines).strip()

    def extract_summary(self, query: str, sentences: List[str], max_length: int = 250) -> str:
        """Extracts a high-impact, concise executive summary from ranked sentences."""
        if not sentences:
            return f"Information regarding {query} was analyzed and synthesized."
        ordered = self.order_by_relevance(query, sentences)
        summary_sentences = ordered[:2]
        summary = " ".join(summary_sentences).strip()
        if len(summary) > max_length:
            summary = summary[:max_length].rstrip(" ,;.") + "..."
        return summary

    def format_response(
        self,
        query: str,
        sentences: List[str],
        sources: List[Dict[str, str]],
        requested_format: str = "auto"
    ) -> Tuple[str, str]:
        format_type = self.detect_format_intent(query, user_override=requested_format)

        if format_type == "structured_notes":
            formatted = self.format_as_structured_notes(query, sentences, sources)
        else:
            formatted = self.format_as_paragraphs(query, sentences, sources)

        return formatted, format_type
