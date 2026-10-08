# MIRA AI - Backend Services & Neural Pipelines

The backend for MIRA AI is built with Flask, Waitress production WSGI, PyTorch, and Hugging Face Transformers.

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start Waitress WSGI Server (port 5000)
python app.py
```

## 🧠 Neural & Algorithmic Components

- **CodeService (`services/code_service.py`)**:
  - Microsoft CodeBERT (`microsoft/codebert-base`) bimodal transformer embeddings.
  - Multi-language synthesis for Python, C, C++, JavaScript, TypeScript, Go, Rust, Java, HTML, CSS, SQL, Shell.
  - Zero dummy stubs; idiomatic file I/O, PEP 3333 WSGI servers, random generators, algorithms.
- **ImageService (`services/image_service.py`)**:
  - Wikimedia Commons API integration with exact phrase matching.
  - Multi-word distinctive entity verification (rejects unrelated institutions and historical yearbooks).
- **NLPService (`services/nlp_service.py`)**:
  - Sentence scoring and neural text extraction.
  - Non-duplicating concluding takeaway synthesis (`extract_summary()`).
  - Key phrase extraction for markdown formatting.
- **PipelineService (`services/pipeline_service.py`)**:
  - Dynamic chat history topic naming (`generate_topic_title()`).
  - Orchestration across Emotion, RAG, Web Search, Scraper, Neural GPT, and CodeBERT.
- **EmotionService (`services/emotion_service.py`)**:
  - Static emotion detection heuristics (`data/emotions.json`).
  - Tone adaptation for conversational and emotional prompts.
