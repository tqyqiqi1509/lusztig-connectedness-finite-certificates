#!/usr/bin/env python3
"""Enumerate every D4 operator arrow and verify its fixed simple-left path.

No arrow list, cell list, graph library, or domino insertion code is an input.
The cells are recomputed from integer Kazhdan--Lusztig polynomial recurrence.
Generator indices: 0=s'_1, 1=s_2, 2=s_3 (central), 3=s_4.
"""
from collections import Counter
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "computation"))
from kl_compute import Coxeter

w = Coxeter("D", 4)
w.kl(False)
adj = [set() for _ in range(w.N)]
rev = [set() for _ in range(w.N)]
for y in range(w.N):
    for s in range(w.rank):
        if not (w.descent[y] >> s & 1):
            adj[y].add(w.left[s][y])
            adj[y].update(x for x, mu in w.mu[y]
                          if mu and w.descent[x] >> s & 1)
for x, neighbors in enumerate(adj):
    for y in neighbors:
        rev[y].add(x)

# Kosaraju's algorithm; orientations are immaterial for strong components.
seen, order = set(), []
def visit(x):
    seen.add(x)
    for y in sorted(adj[x]):
        if y not in seen:
            visit(y)
    order.append(x)
for x in range(w.N):
    if x not in seen:
        visit(x)
cid, cells = {}, []
def assign(x, c):
    cid[x] = c
    cells[c].append(x)
    for y in sorted(rev[x]):
        if y not in cid:
            assign(y, c)
for x in reversed(order):
    if x not in cid:
        cells.append([])
        assign(x, len(cells) - 1)

def descent(x, s):
    return bool(w.descent[x] >> s & 1)

def star(x, a, b):
    assert not descent(x, a) and descent(x, b), (x, a, b)
    candidates = [z for z in (w.left[a][x], w.left[b][x])
                  if descent(z, a) and not descent(z, b)]
    assert len(candidates) == 1, (x, a, b, candidates)
    return candidates[0]

OUTER, CENTRAL = (0, 1, 3), 2
def kind(x):
    candidates = []
    ds = {s for s in range(4) if descent(x, s)}
    for b in OUTER:
        g, d = (s for s in OUTER if s != b)
        if ds == {b, CENTRAL} and star(x, g, CENTRAL) != star(x, d, CENTRAL):
            candidates.append(("A", b))
        if ds == {g, d} and star(x, CENTRAL, g) != star(x, CENTRAL, d):
            candidates.append(("B", b))
    if ds == set(OUTER) and len({star(x, CENTRAL, b) for b in OUTER}) == 1:
        candidates.append(("C", None))
    if ds == {CENTRAL} and len({star(x, b, CENTRAL) for b in OUTER}) == 1:
        candidates.append(("D", None))
    assert len(candidates) <= 1, (x, candidates)
    return candidates[0] if candidates else None

def multiply(x, word):
    for s in reversed(word):
        x = w.left[s][x]
    return x

types = [kind(x) for x in range(w.N)]
records = []
for x, tx in enumerate(types):
    if tx is None:
        continue
    typ, distinguished = tx
    for b in OUTER if distinguished is None else (distinguished,):
        g, d = (s for s in OUTER if s != b)
        target = {"A": ("D", None), "B": ("C", None),
                  "C": ("B", b), "D": ("A", b)}[typ]
        words = ((b,), (g, d, CENTRAL) if distinguished is None
                 else (CENTRAL, g, d), (CENTRAL, d, CENTRAL),
                 (CENTRAL, g, CENTRAL))
        outputs = []
        for word in words:
            y = multiply(x, word)
            if types[y] != target:
                continue
            outputs.append(y)
            if len(word) == 1:
                labels = word
            elif word[0] == word[-1] == CENTRAL:
                e = word[1]
                labels = (CENTRAL, e, CENTRAL) if typ in ("A", "D") else (e, CENTRAL, e)
            else:
                labels = tuple(reversed(word))
            path, z = [x], x
            for s in labels:
                z = w.left[s][z]
                path.append(z)
            assert z == y, (x, y, word, path)
            assert all(cid[z] == cid[x] for z in path), (x, word, path)
            records.append({"input": w.elems[x], "type": tx, "outer": b,
                            "word": word, "execution": labels,
                            "path": [w.elems[z] for z in path]})
        assert len(outputs) in (1, 2), (x, tx, b, outputs)
        assert len(set(outputs)) == len(outputs), (x, tx, b, outputs)

arrows = {(tuple(r["input"]), tuple(r["path"][-1])) for r in records}
assert all((y, x) in arrows for x, y in arrows)
lengths = Counter(len(r["execution"]) for r in records)
result = {"group_order": w.N, "left_cells": len(cells),
          "kl_polynomial_pairs": sum(map(len, w.polys)),
          "directed_operator_arrows": len(records),
          "path_lengths": dict(sorted(lengths.items())),
          "type_counts": dict(Counter(t[0] if t else "none" for t in types)),
          "failures": 0,
          "checks": ["all group elements enumerated by generators",
                     "KL recurrence over integers", "left-cell strong components",
                     "all type predicates and four candidate words",
                     "one or two distinct outputs per applicable relation",
                     "reciprocity", "each prescribed path vertex in the same cell"],
          "records": records}
assert (w.N, len(cells), len(records)) == (192, 36, 192)
assert lengths == {1: 84, 3: 108}
(ROOT / "d4_paths_result.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps({k: v for k, v in result.items() if k != "records"}))
