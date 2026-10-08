import re
import json
import requests
from typing import Dict, Any, Optional, Tuple

class EmotionService:
    """
    Emotion Detection Engine for MIRA.
    Integrates with the external Emotion Detection API:
    https://emotion-detection-browser-extention.vercel.app/analyze
    with a built-in neural emotion fallback to handle affective queries,
    interjections, and emotional states like 'oh my god', 'i feel sad', 'wow'.
    """
    def __init__(self, api_url: str = "https://emotion-detection-browser-extention.vercel.app/analyze", timeout: float = 2.5):
        self.api_url = api_url
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "MIRA-Assistant/1.0"
        })

        # Emotional interjections and keywords patterns
        self.surprise_patterns = [
            r"\b(oh\s+my\s+god|omg|holy\s+shit|holy\s+crap|holy\s+cow|jesus\s+christ|no\s+way|whoa|woah|wow|unbelievable|are\s+you\s+kidding|for\s+real)\b"
        ]
        self.sadness_patterns = [
            r"\b(sad|depressed|unhappy|crying|heartbroken|hopeless|lonely|down|hurting|grief|miserable|feeling\s+bad)\b"
        ]
        self.joy_patterns = [
            r"\b(happy|excited|thrilled|yay|awesome|great\s+news|delighted|overjoyed|wonderful|ecstatic|celebrating)\b"
        ]
        self.anger_patterns = [
            r"\b(angry|furious|pissed|mad|annoyed|frustrated|irritated|hate\s+this|hate\s+it|rage)\b"
        ]
        self.fear_patterns = [
            r"\b(scared|afraid|terrified|anxious|nervous|freaking\s+out|panic|worried|fear)\b"
        ]
        self.gratitude_patterns = [
            r"\b(thank\s+you|thanks|appreciate\s+it|grateful|love\s+you)\b"
        ]

    def _match_local_emotion(self, text: str) -> Optional[str]:
        t = text.lower().strip()
        for pat in self.surprise_patterns:
            if re.search(pat, t):
                return "surprise"
        for pat in self.sadness_patterns:
            if re.search(pat, t):
                return "sadness"
        for pat in self.joy_patterns:
            if re.search(pat, t):
                return "joy"
        for pat in self.anger_patterns:
            if re.search(pat, t):
                return "anger"
        for pat in self.fear_patterns:
            if re.search(pat, t):
                return "fear"
        for pat in self.gratitude_patterns:
            if re.search(pat, t):
                return "love"
        return None

    def analyze_emotion(self, text: str) -> Tuple[Optional[str], float]:
        """
        Queries the user's emotion detection API.
        Falls back to rule-based affective analysis if external service is unavailable.
        """
        clean_text = text.strip()
        if not clean_text:
            return None, 0.0

        # 1. Attempt External Vercel Emotion Detection API
        try:
            resp = self.session.post(
                self.api_url,
                json={"text": clean_text},
                timeout=self.timeout
            )
            if resp.status_code == 200:
                data = resp.json()
                # Expected format: {"success": true, "emotion": "surprise", "score": 0.9} or array of emotions
                if isinstance(data, dict):
                    if "emotion" in data:
                        return data["emotion"], float(data.get("score", 0.9))
                    if "emotions" in data and isinstance(data["emotions"], list) and len(data["emotions"]) > 0:
                        top = data["emotions"][0]
                        return top.get("label", "neutral"), float(top.get("score", 0.8))
                elif isinstance(data, list) and len(data) > 0:
                    top = data[0]
                    if isinstance(top, dict):
                        return top.get("label", "neutral"), float(top.get("score", 0.8))
        except Exception:
            pass

        # 2. Local Fallback Pattern Classifier
        local_emo = self._match_local_emotion(clean_text)
        if local_emo:
            return local_emo, 0.85

        return None, 0.0

    def is_conversational_emotional_prompt(self, text: str) -> bool:
        """Determines if the prompt is an emotional statement rather than an informational query."""
        t = text.lower().strip()
        words = t.split()

        # Pure short interjections (<= 5 words) like "oh my god", "omg", "i feel sad"
        if len(words) <= 5:
            if self._match_local_emotion(t):
                return True

        # First-person emotional state expressions
        if re.search(r"\b(i\s+am|i'm|i\s+feel|feeling)\s+(so\s+|really\s+|very\s+)?(sad|depressed|happy|scared|nervous|angry|mad|furious|heartbroken)\b", t):
            return True

        return False

    def generate_emotional_response(self, text: str, emotion: str) -> str:
        """Generates an empathetic, human response tailored to the detected emotion."""
        t = text.lower().strip()

        if emotion == "surprise":
            if any(term in t for term in ["oh my god", "omg", "holy", "no way"]):
                return (
                    "Whoa, what happened? Did something crazy or unexpected just take place? "
                    "I'm all ears—tell me what's going on!"
                )
            return (
                "That sounds really unexpected! What brought this on? "
                "I'd love to hear more details."
            )

        if emotion == "sadness":
            return (
                "I'm really sorry you're feeling down. It's completely okay to take a moment and feel whatever you're feeling. "
                "Do you want to talk or vent about what's on your mind? I'm right here with you."
            )

        if emotion == "joy":
            return (
                "That is awesome! I love hearing positive vibes like that. 🎉 "
                "What's the good news? Tell me more!"
            )

        if emotion == "anger":
            return (
                "That sounds super frustrating. Take a breath—what went wrong? "
                "Vent to me or let me know how I can help you solve it."
            )

        if emotion == "fear":
            return (
                "Hey, take a gentle breath. You're safe right now. What's causing you to feel anxious or scared? "
                "Let's break it down together."
            )

        if emotion == "love":
            return (
                "Thank you so much! That means the world to me. I'm always right here whenever you need me! ✨"
            )

        return "I'm listening. Tell me more about what's on your mind!"
