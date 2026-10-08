import os
from pathlib import Path
import torch

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

MODEL_PATH = BASE_DIR / 'ion.pt'
BLOCKED_KEYWORDS_PATH = PROJECT_ROOT / 'public' / 'blocked.txt'

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

GPT_CONFIG = {
    'vocab_size': 50257,
    'block_size': 128,
    'n_layer': 6,
    'n_head': 6,
    'n_embd': 384,
    'dropout': 0.1,
    'bias': True
}

LSTM_CONFIG = {
    'vocab_size': 50257,
    'embed_dim': 128,
    'hidden_dim': 128,
    'num_layers': 2,
    'bidirectional': True,
    'dropout': 0.1
}

SEARCH_CONFIG = {
    'max_results': 5,
    'max_scrape_pages': 3,
    'request_timeout': 3.5,
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

SERVER_CONFIG = {
    'host': '0.0.0.0',
    'port': 5000,
    'threads': 6,
    'debug': False
}
