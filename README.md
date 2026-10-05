# PlagiaScan

## An Explainable Multi-Algorithm Plagiarism & Document Similarity Analyzer

PlagiaScan is a software-based plagiarism and document similarity analysis system that compares multiple documents using complementary textual and semantic similarity techniques.

Unlike systems that provide only a single similarity percentage, PlagiaScan provides explainable evidence showing how and why two documents are similar.

---

## Features

- Multi-document comparison
- Word overlap analysis
- KMP pattern matching
- Rabin-Karp pattern matching
- Token-level Edit Distance
- Semantic similarity using MiniLM
- Cosine similarity
- Weighted overall similarity score
- Exact match coverage
- Explainable matching evidence
- Similarity matrix
- Pairwise document ranking
- Comparison reports
- Comparison history

---

## Algorithms Used

| Algorithm / Technique | Purpose |
|---|---|
| Word Overlap | Measures common vocabulary between documents |
| KMP | Detects repeated exact phrases using pattern matching |
| Rabin-Karp | Detects matching token sequences using hashing |
| Token Edit Distance | Measures insertions, deletions and substitutions |
| MiniLM + Cosine Similarity | Detects meaning-level and paraphrased similarity |

---

## Similarity Calculation

### Textual Similarity

Textual similarity combines three signals:

```text
Textual Similarity =
0.40 × Word Overlap
+ 0.30 × Edit Similarity
+ 0.30 × Exact Match Coverage
