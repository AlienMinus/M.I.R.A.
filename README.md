# MIRA AI - Hybrid Neural Search & Intelligent Code Engine 🌌

[![React 19](https://img.shields.io/badge/Frontend-React%2019-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%207-646CFF?logo=vite)](https://vitejs.dev/)
[![PyTorch](https://img.shields.io/badge/Backend-PyTorch%202.x-EE4C2C?logo=pytorch)](https://pytorch.org/)
[![CodeBERT](https://img.shields.io/badge/Model-Microsoft%20CodeBERT-blue?logo=huggingface)](https://huggingface.co/microsoft/codebert-base)
[![Monaco Editor](https://img.shields.io/badge/Editor-Monaco%20Editor-007acc?logo=visualstudiocode)](https://microsoft.github.io/monaco-editor/)
[![Waitress](https://img.shields.io/badge/WSGI-Waitress%20Production-green)](https://docs.pylonsproject.org/projects/waitress/en/stable/)

**MIRA** is a full-stack, local-first artificial intelligence assistant combining hybrid neural language generation, encyclopedic media retrieval, multi-language code synthesis powered by **Microsoft CodeBERT**, and a Monaco-driven developer environment with live HTML preview.

---

## 🌟 Key Features

### 💻 1. Developer Studio & Monaco Editor
- **Embedded Monaco Editor**: VS Code-grade code editor powered by `@monaco-editor/react` with `vs-dark` theme, precise syntax highlighting, line numbers, automatic layout, and dynamic container sizing.
- **Dedicated Live HTML Preview**: Interactive sandboxed `[Preview]` iframe rendering for HTML/CSS/JS components. Sandboxing protects execution while giving immediate visual feedback. Non-HTML languages strictly preserve clean code viewing and one-click copying.
- **Multi-Language Support**: Complete, idiomatic syntax support for Python, C, C++, JavaScript, TypeScript, Go, Rust, Java, C#, SQL, Bash, HTML, CSS, JSON, and Markdown.

### 🧠 2. Code Intelligence via Microsoft CodeBERT
- **Bimodal Semantic Embeddings**: Leverages `microsoft/codebert-base` to tokenize natural language specifications and map them into dense vector representations.
- **Zero Dummy Stubs**: Synthesizes complete, runnable, production-quality programs (e.g., Python context-managed file readers, PEP 3333 WSGI HTTP servers, CSPRNG/Mersenne Twister random generators, algorithmic data structures) without static placeholder stubs.
- **Strict Intent Discrimination**: Semantic keyword gating prevents algorithmic cross-talk (e.g., prime number tests vs. random number generators).

### 🔍 3. Encyclopedic Verification & Strict Entity Media
- **Distinctive Entity Filtering**: Wikimedia Commons and encyclopedic image retrieval with multi-word distinctive entity verification (e.g., eliminates historical college yearbooks when querying "Elon Musk").
- **Relevant Encyclopedic Media Gallery**: Clean horizontal thumbnail gallery with high-resolution image preview modals, attribution links, and thumbnail fallback.

### 📝 4. Intelligent NLP & Non-Redundant Synthesis
- **Concluding Synthesis Cards**: Summaries are rendered as a dedicated `.conclusion-highlight-card` at the end of responses rather than duplicating the opening paragraph.
- **Dynamic Chat Nameplates**: Real-time generation of concise, high-clarity chat history titles in the sidebar (e.g., *"Elon Musk"*, *"Python File Reader"*, *"WSGI Server Architecture"*).
- **Keyword Highlight Extraction**: NLP-driven key phrase extraction emphasizing critical conceptual terms using markdown bolding.

### ⚡ 5. Emotion Detection & Neural Pipeline
- **Emotion Engine**: Static heuristic detection (`data/emotions.json`) combined with external sentiment analysis to tailor assistant tone for emotional prompts.
- **Pipeline Status Badges**: Microchip status badge with aquamarine pulse indicating real-time pipeline phases (Emotion → Search → Scrape → Neural GPT → CodeBERT).

---

## 🏗️ Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                   MIRA Frontend (React 19 + Vite)            │
│  ┌───────────────────────┐   ┌───────────────────────────┐  │
│  │ Monaco Editor Frame   │   │ Sandboxed HTML Preview    │  │
│  └───────────────────────┘   └───────────────────────────┘  │
│  ┌───────────────────────┐   ┌───────────────────────────┐  │
│  │ Encyclopedic Gallery  │   │ Dynamic Chat History      │  │
│  └───────────────────────┘   └───────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON API
┌──────────────────────────────▼──────────────────────────────┐
│             Waitress WSGI Multi-Threaded Backend            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ PipelineService Orchestrator                          │  │
│  ├─────────────────┬─────────────────┬───────────────────┤  │
│  │ CodeService     │ SearchService   │ NLPService        │  │
│  │ (CodeBERT base) │ (Commons/DDG)   │ (Bi-LSTM / NLTK)  │  │
│  ├─────────────────┼─────────────────┼───────────────────┤  │
│  │ ImageService    │ RAGService      │ EmotionService    │  │
│  │ (Entity Filter) │ (Vector Memory) │ (JSON Heuristics) │  │
│  └─────────────────┴─────────────────┴───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

---

### 1. Installation

#### Clone the Repository
```bash
git clone https://github.com/your-org/mira_v1.git
cd mira_v1
```

#### Install Frontend Dependencies
```bash
npm install
```

#### Install Backend Dependencies
```bash
pip install -r requirements.txt
```
*(Or inside `backend/`: `pip install -r backend/requirements.txt`)*

---

### 2. Running MIRA

#### Start the Backend Server (Port 5000)
```bash
python backend/app.py
```
*The backend initializes Microsoft CodeBERT, PyTorch transformer weights (`ion.pt`), and the Waitress production WSGI server on `http://localhost:5000`.*

#### Start the Frontend Client (Port 5173)
```bash
npm run dev
```
*Open your browser at `http://localhost:5173` to interact with MIRA.*

---

## 📦 Project Structure

```text
mira_v1/
├── backend/
│   ├── app.py                  # Flask + Waitress application entry point
│   ├── config.py               # Model hyperparameters & server configuration
│   ├── ion.pt                  # Pre-trained PyTorch GPT transformer weights
│   ├── requirements.txt        # Python library dependencies
│   ├── data/
│   │   └── emotions.json       # Static emotional response lexicon
│   └── services/
│       ├── code_service.py     # CodeBERT tokenization, embedding & synthesis
│       ├── image_service.py    # Wikimedia Commons API & strict entity filtering
│       ├── nlp_service.py      # Sentence ranking, keyword extraction, conclusion synthesis
│       ├── pipeline_service.py # Master query orchestrator & dynamic topic generator
│       ├── search_service.py   # Hybrid web retrieval engine
│       ├── scraper_service.py  # Page text extraction & deduplication
│       ├── emotion_service.py  # Sentiment detection & emotional replies
│       └── rag_service.py      # In-memory document retrieval
├── src/
│   ├── components/
│   │   ├── Container/
│   │   │   ├── AIResponse.jsx  # Monaco editor, HTML preview, conclusion card, images
│   │   │   ├── AIResponse.css  # Dark theme styles & preview frame layout
│   │   │   ├── Container.jsx   # Message dispatcher, chat title manager
│   │   │   └── UserMessage.jsx # User query bubbles
│   │   ├── Sidebar/
│   │   │   ├── ChatHistory.jsx # Dynamic chat list with topic nameplates
│   │   │   └── Sidebar.jsx     # Navigation and settings drawer
│   │   └── ChatInput/
│   │       └── ChatInput.jsx   # Input field, attachments & prompt submit
│   ├── App.jsx                 # Main application layout
│   └── main.jsx                # React root entry
├── package.json                # Frontend dependencies (@monaco-editor/react, etc.)
├── vite.config.js              # Vite build & proxy configuration
└── requirements.txt            # Root Python dependencies
```

---

## 🛠️ API Reference

### `POST /api/generate`
Executes full query pipeline (Emotion -> Search -> Scrape -> Generation -> CodeBERT -> Concluding Synthesis).

**Request Body:**
```json
{
  "prompt": "python code for reading the content of a txt file",
  "format": "auto"
}
```

**Response Structure:**
```json
{
  "success": true,
  "topic_title": "Python File Reader",
  "pipeline_stages": ["intent_classification", "codebert_synthesis"],
  "code_block": {
    "language": "python",
    "code": "def read_file(filepath: str) -> str:\n    with open(filepath, 'r', encoding='utf-8') as f:\n        return f.read()\n...",
    "explanation": "Context-managed file stream handler in Python with robust error handling."
  },
  "generated_text": "...",
  "conclusion": "In summary, using Python's with open() context manager ensures safe resource closure...",
  "images": []
}
```

---

## 🧪 Testing Common Scenarios

| Test Case | Expected Behavior |
| :--- | :--- |
| `"Elon musk"` | Accurate Wikipedia photo of Elon Musk; 0 college yearbook photos; distinct conclusion summary. |
| `"python code for reading the content of a txt file"` | Complete `open()` context manager with exception handling; embedded in Monaco Editor. |
| `"generate code for a basic wsgi server.py"` | Complete `wsgiref.simple_server` implementation compliant with PEP 3333. |
| `"write a python program to generate random number"` | Synthesizes `random.randint` / `random.random` generator (NOT prime numbers). |
| `"responsive html profile card"` | Monaco Editor with active `[Preview]` tab rendering a live interactive sandboxed card. |

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
