import re
from typing import List, Dict, Any, Tuple
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.tag import pos_tag

# NLTK packages are loaded locally from user nltk_data directory

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
            "one day", "sunny day", "played together", "papa", "mama", "annie",
            "billy", "village", "journey home", "once there was", "named tim", "named lilly"
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
        """Strips scraped HTML artifacts, mojibake, phonetics, timestamps, and citations."""
        if not text:
            return ""

        # 1. Fix and eliminate common UTF-8 Mojibake artifacts (e.g. â€¡, â€™, â€œ)
        text = (
            text.replace("â€™", "'")
                .replace("â€˜", "'")
                .replace("â€œ", '"')
                .replace("â€", '"')
                .replace("â€”", "—")
                .replace("â€“", "–")
                .replace("â€¦", "...")
                .replace("â€¢", "•")
                .replace("â€¡", "")
                .replace("Ã©", "e")
                .replace("Ã¡", "a")
        )
        text = re.sub(r'â€[^\w\s]*', '', text)

        # 2. Remove Wikipedia dictionary language & phonetic pronunciation headers (both closed and unclosed)
        text = re.sub(r'\(\s*;\s*(?:Sanskrit|Hindi|IPA|romanized|Arabic|Greek|Latin|lit\.)[^\)]*(?:\)|$)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\([^\)]*(?:Sanskrit|Hindi|IPA|romanized|pronounced|lit\.|meaning\s+[\'"])[^\)]*\)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\([^\)]*[\u0900-\u097F\u0600-\u06FF\u4E00-\u9FFF\u0400-\u04FF]+[^\)]*\)', '', text)
        text = re.sub(r'\([^\)]*[əɛɪʊʌɒɔːɜːɑːθðʃʒⓘˈˌʱɐɡ][^\)]*\)', '', text)

        # 3. Remove IPA and phonetic brackets [IPA: ...] or [ˌbʱɐ...]
        text = re.sub(r'\[\s*IPA:[^\]]*\]', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\[[^\]]*[ˌˈːʱɐɡʊɒɔɜɑθðʃʒŋʔ][^\]]*\]', '', text)

        # 4. Remove stray IPA slashes /.../ and cryptic phonetic characters
        text = re.sub(r'/[^/\n]{1,30}/', '', text)
        text = re.sub(r'[ˌˈːʱɐɡʊɒɔɜɑθðʃʒŋʔ]', '', text)

        # 5. Remove isolated non-Latin script clutter (Devanagari, etc.) in English text
        text = re.sub(r'[\u0900-\u097F]+', '', text)

        # 6. Remove orphaned phonetic prefixes ending in a parenthesis, e.g. "g əl / ⓘ, GOO -gəl )"
        text = re.sub(r'^[^\)\n]{1,60}\)\s*', '', text)

        # 7. Remove leading search timestamps (e.g., "3 days ago·", "Sep 3, 2026·")
        text = re.sub(r'^\d+\s+(days?|hours?|mins?|weeks?|months?|years?)\s+ago\s*[\xb7\.\-]?\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^[A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4}\s*[\xb7\.\-]?\s*', '', text)
        text = re.sub(r'\b\d+\s+(days?|hours?|mins?|weeks?|months?|years?)\s+ago\s*[\xb7\.\-]?\s*', '', text, flags=re.IGNORECASE)

        # 8. Remove leading stray punctuation and orphaned opening parenthesis
        text = re.sub(r'^[;\(\)\[\],;:\s\.\xb7\-]+', '', text)
        text = re.sub(r'\(\s*[;:,]\s*', '(', text)
        text = re.sub(r'\(\s*\)', '', text)
        text = re.sub(r'\s+,\s+', ', ', text)

        # 9. Remove multiple dots / ellipses
        text = re.sub(r'\.{2,}', '', text)
        text = re.sub(r'…', '', text)

        # 10. Remove Wikipedia citation markers [1], [2], [edit], [citation needed]
        text = re.sub(r'\[\s*\d+\s*\]', '', text)
        text = re.sub(r'\[(edit|citation needed|note \d+)\]', '', text, flags=re.IGNORECASE)

        # 11. Normalize whitespace
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

        # Strip trailing dangling punctuation like colons, semicolons, dashes
        s = re.sub(r'[\s,;:–—\-]+$', '', s).strip()
        if not s:
            return ""

        # Discard fragments that end abruptly with truncated dictionary markers
        if re.search(r'\b(lit|romanized|pronounced|meaning)\.?$', s, re.IGNORECASE):
            return ""

        # Capitalize first letter
        s = s[0].upper() + s[1:]

        # Ensure sentence ends with punctuation
        if s[-1] not in ".!?":
            s += "."

        return s

    def filter_and_clean_sentences(self, raw_text: str, query: str = None, is_trusted_source: bool = False) -> List[str]:
        if not raw_text:
            return []

        cleaned_text = self.sanitize_text(raw_text)
        raw_sentences = sent_tokenize(cleaned_text)
        cleaned = []

        query_keywords = set(self.get_content_words(query)) if query else set()
        pronouns_and_refs = {
            "he", "his", "him", "she", "her", "they", "their", "it", "its", "this", "these",
            "the", "leader", "movement", "system", "technology", "method", "work", "campaign",
            "theory", "concept", "principle", "founder", "author", "scientist", "nation"
        }

        for s in raw_sentences:
            s = self.clean_sentence(s)

            if len(s) < 25 or s.count(" ") < 3:
                continue

            if self.is_story_hallucination(s, query):
                continue

            if self.is_promotional_or_boilerplate(s):
                continue

            lower_s = s.lower().rstrip(".").strip()
            if lower_s.endswith(("and", "or", "because", "with", "which", "that", "the", "a", "an")):
                continue

            # Ensure sentence is topically relevant to query
            if query_keywords and not is_trusted_source:
                s_words = set(re.findall(r'\b\w+\b', s.lower()))
                # 1. Check direct keyword match or stem
                has_keyword = bool(s_words & query_keywords)
                has_stem = any(
                    len(qw) >= 4 and any(qw in sw or sw in qw for sw in s_words if len(sw) >= 4)
                    for qw in query_keywords
                )
                # 2. Check narrative pronouns + date / uppercase entity
                has_contextual_ref = bool(s_words & pronouns_and_refs) and bool(
                    re.search(r'\b(17|18|19|20)\d{2}\b', s) or any(w[0].isupper() for w in s.split()[1:] if len(w) > 2)
                )

                if not (has_keyword or has_stem or has_contextual_ref):
                    continue

            if not self.is_semantically_duplicate(s, cleaned):
                cleaned.append(s)

        return cleaned

    def is_promotional_or_boilerplate(self, sentence: str) -> bool:
        """Filters commercial marketing copy, admissions blurbs, and website footer clutter."""
        s = sentence.lower()
        patterns = [
            r"\b(welcome to|enroll now|admissions open|leading education network)\b",
            r"\b(schools?, colleges? and coaching|call us|contact us today|visit our campus)\b",
            r"\b(all rights reserved|terms of service|privacy policy|cookie settings)\b",
            r"\b(subscribe now|subscribe to our|follow us on|sign up for free)\b",
            r"\b(click here to|read more at|buy now|add to cart|check out our)\b"
        ]
        return any(re.search(pat, s) for pat in patterns)

    def extract_salient_keywords(self, text: str, query: str = "") -> List[str]:
        """
        Uses NLP POS tagging and regex heuristics to identify high-impact key terms:
        - Named entities & Proper Nouns (NNP, NNPS), including multi-word entities
        - Specialized terms enclosed in quotes or parentheses
        - Significant compound noun concepts (JJ + NN or NN + NN)
        - Core topic terms matching query
        """
        if not text:
            return []

        candidates = []
        seen = set()

        # 1. Phrases enclosed in quotes (e.g. 'primeval man', 'Supreme Being')
        for q in re.findall(r"['\"]([A-Za-z0-9\s\-_]{3,40})['\"]", text):
            q_clean = q.strip()
            if q_clean.lower() not in self.stop_words and q_clean.lower() not in seen and len(q_clean.split()) <= 4:
                candidates.append(q_clean)
                seen.add(q_clean.lower())

        # 2. Query words/phrases if present in text
        if query:
            clean_q = re.sub(r'[^\w\s]', '', query).strip()
            if len(clean_q) > 2 and clean_q.lower() not in self.stop_words:
                for m in re.finditer(rf"\b{re.escape(clean_q)}\b", text, re.IGNORECASE):
                    val = m.group(0)
                    if val.lower() not in seen:
                        candidates.append(val)
                        seen.add(val.lower())

        # 3. NLTK POS Tagging for Proper Nouns & Compound Terms
        try:
            tokens = word_tokenize(text)
            tagged = pos_tag(tokens)

            # Extract multi-word or single-word Proper Nouns (NNP, NNPS)
            current_entity = []
            banned_words = {
                "the", "this", "that", "these", "those", "he", "she", "it", "they",
                "in", "on", "at", "to", "for", "with", "by", "from", "and", "or",
                "is", "was", "are", "were", "also", "however", "therefore", "moreover",
                "according", "welcome", "states", "stated", "says", "said"
            }

            for word, tag in tagged:
                clean_word = word.strip(" ,.:;?!'\"")
                if tag in ("NNP", "NNPS") and clean_word.lower() not in banned_words and len(clean_word) > 1:
                    current_entity.append(clean_word)
                else:
                    if current_entity:
                        ent = " ".join(current_entity)
                        if ent.lower() not in seen and len(ent) > 2 and ent.lower() not in self.stop_words:
                            candidates.append(ent)
                            seen.add(ent.lower())
                        current_entity = []

            if current_entity:
                ent = " ".join(current_entity)
                if ent.lower() not in seen and len(ent) > 2 and ent.lower() not in self.stop_words:
                    candidates.append(ent)
                    seen.add(ent.lower())

            # Extract Compound Noun Concepts (JJ + NN or NN + NN)
            for i in range(len(tagged) - 1):
                w1, t1 = tagged[i]
                w2, t2 = tagged[i+1]
                cw1 = w1.strip(" ,.:;?!'\"")
                cw2 = w2.strip(" ,.:;?!'\"")
                if cw1.lower() in banned_words or cw2.lower() in banned_words:
                    continue
                if (t1.startswith("JJ") and t2.startswith("NN")) or (t1.startswith("NN") and t2.startswith("NN")):
                    pair = f"{cw1} {cw2}"
                    if pair.lower() not in seen and len(pair) > 5 and pair.lower() not in self.stop_words:
                        if cw1[0].isupper() or cw2[0].isupper() or any(k in pair.lower() for k in ["being", "pantheon", "chakra", "gada", "shankha", "system", "law", "origin", "model", "network", "theory", "concept", "principle"]):
                            candidates.append(pair)
                            seen.add(pair.lower())

        except Exception:
            caps = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
            for c in caps:
                if c.lower() not in seen and len(c) > 3 and c.lower() not in self.stop_words:
                    candidates.append(c)
                    seen.add(c.lower())

        # Sort candidates descending by length so longer phrases are highlighted first
        candidates.sort(key=lambda x: len(x), reverse=True)
        return candidates

    def apply_markdown_highlighting(self, text: str, keywords: List[str], max_highlights: int = 5) -> str:
        """
        Applies markdown bold syntax (**keyword**) to up to max_highlights keywords.
        Guarantees existing markdown links, code blocks, or bold tags are preserved safely.
        """
        if not text or not keywords:
            return text

        result = text
        highlighted = 0
        used = set()

        for kw in keywords:
            if highlighted >= max_highlights:
                break

            kw_clean = kw.strip()
            if not kw_clean or len(kw_clean) < 3 or kw_clean.lower() in used:
                continue

            # Word boundary regex preserving original case, avoiding already bolded text
            pattern = rf"(?<![\*\w\[])({re.escape(kw_clean)})(?![\*\w\]])"

            if re.search(pattern, result):
                result = re.sub(pattern, r"**\1**", result, count=1)
                used.add(kw_clean.lower())
                highlighted += 1

        return result

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

        overview_sents = ordered[:2] if len(ordered) >= 2 else ordered[:1]
        overview_text = " ".join(overview_sents) if overview_sents else f"Key summary regarding {query}."
        kw_overview = self.extract_salient_keywords(overview_text, query=query)
        overview_hl = self.apply_markdown_highlighting(overview_text, kw_overview, max_highlights=4)

        remaining = ordered[2:]
        background = remaining[:4]
        milestones = remaining[4:9]
        impact_legacy = remaining[9:15]

        lines = [
            f"# {title}",
            "",
            "### Executive Overview",
            overview_hl,
            "",
            "### Core Background & Historical Origins"
        ]

        if not background:
            background = remaining[:3]

        for b in background:
            kw_b = self.extract_salient_keywords(b, query=query)
            b_hl = self.apply_markdown_highlighting(b, kw_b, max_highlights=3)
            lines.append(f"- {b_hl}")

        if milestones:
            lines.append("")
            lines.append("### Major Milestones & Key Contributions")
            for m in milestones:
                kw_m = self.extract_salient_keywords(m, query=query)
                m_hl = self.apply_markdown_highlighting(m, kw_m, max_highlights=3)
                lines.append(f"- {m_hl}")

        if impact_legacy:
            lines.append("")
            lines.append("### Impact, Philosophy & Global Legacy")
            for l in impact_legacy:
                kw_l = self.extract_salient_keywords(l, query=query)
                l_hl = self.apply_markdown_highlighting(l, kw_l, max_highlights=3)
                lines.append(f"- {l_hl}")

        return "\n".join(lines)

    def format_as_paragraphs(
        self,
        query: str,
        sentences: List[str],
        sources: List[Dict[str, str]]
    ) -> str:
        deduped = []
        for s in sentences:
            if not self.is_semantically_duplicate(s, deduped) and not self.is_promotional_or_boilerplate(s):
                deduped.append(s)

        if not deduped:
            deduped = [f"Information regarding {query} was compiled from verified web sources."]

        ordered = self.order_by_relevance(query, deduped)

        overview_sents = []
        background_sents = []
        core_achievements_sents = []
        impact_sents = []
        legacy_sents = []

        is_biographical = bool(re.search(r'\b(who|biography|born|died|life|figure|father|leader|author|activist|president|prime minister)\b', query, re.IGNORECASE))

        for idx, s in enumerate(ordered):
            sl = s.lower()
            if is_biographical:
                if any(w in sl for w in ["born", "raised", "childhood", "youth", "early life", "education", "college", "school", "trained", "graduated", "bar at", "moved to", "london", "gujarat", "inner temple", "lawsuit"]):
                    background_sents.append(s)
                elif any(w in sl for w in ["congress", "movement", "campaign", "march", "salt", "quit india", "nonviolent", "satyagraha", "protest", "strike", "activism", "leadership", "resistance"]):
                    core_achievements_sents.append(s)
                elif any(w in sl for w in ["independence", "partition", "violence", "assassinated", "godse", "war", "government", "treaty", "pakistan", "presidency", "minister"]):
                    impact_sents.append(s)
                elif any(w in sl for w in ["birthday", "commemorated", "jayanti", "legacy", "international day", "father of the nation", "bapu", "inspired", "memorial", "tribute", "remembered"]):
                    legacy_sents.append(s)
                elif idx < 2:
                    overview_sents.append(s)
                else:
                    core_achievements_sents.append(s)
            else:
                if any(w in sl for w in ["history", "origin", "developed by", "invented", "founded", "began", "created by", "evolution"]):
                    background_sents.append(s)
                elif any(w in sl for w in ["mechanism", "architecture", "works by", "principles", "features", "algorithms", "components", "structure", "engine"]):
                    core_achievements_sents.append(s)
                elif any(w in sl for w in ["applications", "use cases", "industry", "implemented", "impact", "systems", "benefits", "advantages"]):
                    impact_sents.append(s)
                elif any(w in sl for w in ["future", "standard", "legacy", "evolution", "modern", "outlook", "widely used", "adopted"]):
                    legacy_sents.append(s)
                elif idx < 2:
                    overview_sents.append(s)
                else:
                    core_achievements_sents.append(s)

        all_categorized = [overview_sents, background_sents, core_achievements_sents, impact_sents, legacy_sents]
        non_empty = [cat for cat in all_categorized if cat]

        # Balanced distribution fallback
        if len(non_empty) < 3 or len(ordered) < 6:
            num_paras = 3 if len(ordered) >= 6 else (2 if len(ordered) >= 3 else 1)
            chunk_size = max(1, len(ordered) // num_paras)
            body_paragraphs = []
            for i in range(num_paras):
                if i == num_paras - 1:
                    chunk = ordered[i * chunk_size:]
                else:
                    chunk = ordered[i * chunk_size:(i + 1) * chunk_size]
                if chunk:
                    body_paragraphs.append(" ".join(chunk))

            headers = [
                "### Overview & Significance",
                "### Detailed Context & Core Operations",
                "### Key Outcomes & Enduring Impact"
            ]
            sections = []
            for h, p in zip(headers, body_paragraphs):
                kw = self.extract_salient_keywords(p, query=query)
                p_hl = self.apply_markdown_highlighting(p, kw, max_highlights=5)
                sections.append(f"{h}\n{p_hl}")
            return "\n\n".join(sections).strip()

        sections = []
        if is_biographical:
            header_map = [
                ("### Historical Overview & Identity", overview_sents),
                ("### Early Life, Education & Formative Background", background_sents),
                ("### Major Movements, Satyagraha & Core Leadership", core_achievements_sents),
                ("### Independence, Historical Transformation & Critical Events", impact_sents),
                ("### Enduring Legacy & Global Recognition", legacy_sents),
            ]
        else:
            header_map = [
                ("### Executive Overview & Definition", overview_sents),
                ("### Background, Origins & Fundamental Concepts", background_sents),
                ("### Core Architecture, Principles & Key Operations", core_achievements_sents),
                ("### Real-World Applications & Industry Impact", impact_sents),
                ("### Summary, Enduring Value & Future Horizons", legacy_sents),
            ]

        for heading, sents in header_map:
            if sents:
                p_text = " ".join(sents).strip()
                if p_text:
                    kw = self.extract_salient_keywords(p_text, query=query)
                    p_hl = self.apply_markdown_highlighting(p_text, kw, max_highlights=5)
                    sections.append(f"{heading}\n{p_hl}")

        return "\n\n".join(sections).strip()

    def extract_summary(self, query: str, sentences: List[str], max_length: int = 350) -> str:
        """
        Synthesizes a distinct, high-impact concluding takeaway summarizing the response,
        ensuring it does NOT duplicate the opening introductory paragraph.
        """
        if not sentences:
            return f"Information regarding {query} was comprehensively analyzed and synthesized."
        ordered = self.order_by_relevance(query, sentences)

        # Select a concluding takeaway distinct from paragraph 1
        if len(ordered) >= 4:
            candidate = ordered[3] if len(ordered) == 4 else ordered[-1]
            conclusion = f"In summary, {candidate.strip()}"
        elif len(ordered) >= 2:
            conclusion = f"Overall, {ordered[1].strip()}"
        else:
            conclusion = f"Key takeaway: {ordered[0].strip()}"

        if len(conclusion) > max_length:
            conclusion = conclusion[:max_length].rstrip(" ,;.") + "..."
        return conclusion

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
