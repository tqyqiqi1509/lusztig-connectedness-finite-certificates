#!/usr/bin/env python3
"""Small corner graphs using the local templates selected in the paper.

This check uses no insertion code, signed permutations, or case-template code.
It supplies explicit tableau witnesses for the other-residue coverage table.
Pure swaps here require the auxiliary domino R to be boxed. Thus the graphs
are sufficient template graphs, not maximal graphs of all ordinary stars.
"""
from functools import lru_cache
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent

def squares(p):
    r, c, vertical = p
    return {(r, c), (r + vertical, c + 1 - vertical)}

@lru_cache(None)
def tableaux(shape):
    if not shape:
        return ((),)
    out = []
    for i, length in enumerate(shape):
        if length - (shape[i+1] if i+1 < len(shape) else 0) >= 2:
            smaller = list(shape)
            smaller[i] -= 2
            while smaller and not smaller[-1]:
                smaller.pop()
            out.extend(t + ((i+1, length-1, 0),) for t in tableaux(tuple(smaller)))
        if i+1 < len(shape) and length == shape[i+1] and (i+2 == len(shape) or shape[i+2] < length):
            smaller = list(shape)
            smaller[i] -= 1
            smaller[i+1] -= 1
            while smaller and not smaller[-1]:
                smaller.pop()
            out.extend(t + ((i+1, length, 1),) for t in tableaux(tuple(smaller)))
    assert len(set(out)) == len(out)
    return tuple(out)

def boxed(p):
    r, c, vertical = p
    return r % 2 == 1 if vertical else c % 2 == 0

def precedes(a, b):
    return int(a[0] + a[2] < b[0])

def transposed(p):
    r, c, vertical = p
    return c, r, 1-vertical

def notation(p):
    r, c, vertical = p
    return ("V" if vertical else "H") + f"({r},{c})"

specifications = [((3,3,1,1), {0:1,2:3}),
                  ((3,3,2,2), {1:1,3:2}),
                  ((5,5,3,1), {0:2,2:1}),
                  ((3,3,3,3,1,1), {1:1,3:2})]
results = []
for shape, counts in specifications:
    all_tableaux = tableaux(shape)
    all_set = set(all_tableaux)
    patterns = []
    for r in range(1,len(shape)+1):
        for c in range(1,shape[0]+1):
            before = ((r,c,1),(r,c+1,0),(r+1,c+1,0))
            after = ((r,c,0),(r+1,c,0),(r,c+2,1))
            patterns.extend(((before,after),(after,before)))
            tb,ta=tuple(map(transposed,before)),tuple(map(transposed,after))
            patterns.extend(((tb,ta),(ta,tb)))
    for residue, expected_components in counts.items():
        ts = [t for t in all_tableaux if sum(p[2] for p in t)%4==residue]
        nodes = {t[-1] for t in ts if boxed(t[-1])}
        adjacency = {p:set() for p in nodes}
        witnesses = {}
        def add(t, u, rule):
            if u not in all_set or t[-1] not in nodes or u[-1] not in nodes or t[-1]==u[-1]:
                return
            assert sum(p[2] for p in t)%4==sum(p[2] for p in u)%4
            a,b=t[-1],u[-1]
            adjacency[a].add(b);adjacency[b].add(a)
            key=tuple(sorted((a,b)))
            witnesses.setdefault(key,{"source":notation(a),"target":notation(b),"rule":rule,
                                      "before":[[i+1,*p] for i,p in enumerate(t)],
                                      "after":[[i+1,*p] for i,p in enumerate(u)]})
        for t in ts:
            r,q,p=t[-3:]
            # The pure-swap lemma requires BOTH P and Q to be removable in the
            # original shape. Membership among all final positions checks this.
            # Retain the boxed-auxiliary templates used in the written reduction.
            if p in nodes and q in nodes and boxed(r) and not squares(p)&squares(q):
                triple=(precedes(r,q),precedes(q,p),precedes(r,p))
                if triple in ((0,1,1),(1,0,0)):
                    add(t,t[:-2]+(p,q),"pure swap")
            for before,after in patterns:
                if t[-3:]==before:
                    add(t,t[:-3]+after,"F pattern")
        components=[];remaining=set(nodes)
        while remaining:
            stack=[min(remaining)];component=set()
            while stack:
                p=stack.pop()
                if p in component:
                    continue
                component.add(p);stack.extend(adjacency[p]-component)
            remaining-=component
            components.append(sorted(notation(p) for p in component))
        assert len(components)==expected_components,(shape,residue,components)
        results.append({"shape":shape,"residue":residue,"tableaux":len(ts),
                        "corners":sorted(map(notation,nodes)),"components":components,
                        "witnesses":list(witnesses.values())})
result={"configurations":len(results),"failures":0,"results":results}
(ROOT/"fixed_corner_graphs_result.json").write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({"configurations":len(results),"failures":0,
                  "component_counts":[len(r["components"]) for r in results]}))
