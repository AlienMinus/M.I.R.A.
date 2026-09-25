import re
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Tuple

class LSTMTextFormatter(nn.Module):
    def __init__(
        self,
        vocab_size: int = 50257,
        embed_dim: int = 128,
        hidden_dim: int = 128,
        num_layers: int = 2,
        bidirectional: bool = True,
        dropout: float = 0.1
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.hidden_dim = hidden_dim
        self.bidirectional = bidirectional
        self.num_directions = 2 if bidirectional else 1
        
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=bidirectional,
            dropout=dropout if num_layers > 1 else 0.0
        )
        
        rep_dim = hidden_dim * self.num_directions
        self.attn_vector = nn.Linear(rep_dim, 1, bias=False)
        
        self.coherence_head = nn.Sequential(
            nn.Linear(rep_dim, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
        
        self.relevance_head = nn.Sequential(
            nn.Linear(rep_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
        
        self.boundary_head = nn.Sequential(
            nn.Linear(rep_dim * 2, 32),
            nn.ReLU(),
            nn.Linear(32, 2)
        )

    def _pool_sequence(self, lstm_out: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        scores = self.attn_vector(lstm_out)
        if mask is not None:
            scores = scores.masked_fill(~mask.unsqueeze(-1), -1e9)
        attn_weights = F.softmax(scores, dim=1)
        pooled = torch.sum(lstm_out * attn_weights, dim=1)
        return pooled

    def encode_tokens(self, token_tensor: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        embeds = self.embedding(token_tensor)
        out, (hn, cn) = self.lstm(embeds)
        pooled = self._pool_sequence(out)
        return out, pooled

    @torch.no_grad()
    def score_sentences(
        self,
        sentences: List[str],
        query: str,
        tokenizer,
        device: str = 'cpu'
    ) -> List[Tuple[str, float]]:
        if not sentences:
            return []

        self.eval()
        self.to(device)

        query_ids = tokenizer.encode_ordinary(query)[:64]
        if not query_ids:
            query_ids = [0]
        q_tensor = torch.tensor([query_ids], dtype=torch.long, device=device)
        _, q_rep = self.encode_tokens(q_tensor)

        scored_sentences = []
        q_words = set(re.findall(r'\b\w+\b', query.lower()))

        for sent in sentences:
            sent_clean = sent.strip()
            if len(sent_clean) < 20:
                continue

            sent_ids = tokenizer.encode_ordinary(sent_clean)[:128]
            if not sent_ids:
                continue

            s_tensor = torch.tensor([sent_ids], dtype=torch.long, device=device)
            _, s_rep = self.encode_tokens(s_tensor)

            coh_score = self.coherence_head(s_rep).item()
            combined_rep = torch.cat([s_rep, q_rep], dim=-1)
            rel_score = self.relevance_head(combined_rep).item()

            # Boost direct answer sentences that share query keywords
            s_words = set(re.findall(r'\b\w+\b', sent_clean.lower()))
            overlap_count = len(s_words & q_words)
            keyword_bonus = min(0.35, overlap_count * 0.12)

            length = len(sent_clean)
            len_bonus = 1.0 if 40 <= length <= 280 else 0.85

            total_score = ((0.55 * rel_score + 0.45 * coh_score) + keyword_bonus) * len_bonus
            scored_sentences.append((sent_clean, total_score))

        # Sort highest score first
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        return scored_sentences

    @torch.no_grad()
    def rank_and_filter(
        self,
        candidate_sentences: List[str],
        query: str,
        tokenizer,
        top_k: int = 6,
        device: str = 'cpu'
    ) -> List[str]:
        scored = self.score_sentences(candidate_sentences, query, tokenizer, device=device)
        selected = []

        for sent, score in scored:
            cand_words = set(re.findall(r'\b\w+\b', sent.lower()))
            if not cand_words:
                continue

            # Strict pairwise deduplication against previously selected sentences
            is_dup = False
            for acc in selected:
                acc_words = set(re.findall(r'\b\w+\b', acc.lower()))
                inter = len(cand_words & acc_words)
                if not inter:
                    continue
                jaccard = inter / len(cand_words | acc_words)
                overlap_cand = inter / len(cand_words)
                overlap_acc = inter / len(acc_words)
                
                # If either sentence shares > 48% of content or Jaccard >= 0.35, discard duplicate
                if jaccard >= 0.35 or overlap_cand >= 0.48 or overlap_acc >= 0.48:
                    is_dup = True
                    break

            if not is_dup:
                selected.append(sent)

            if len(selected) >= top_k:
                break

        return selected
