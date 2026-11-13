"""Independent check of the stored recurrence through the defining bar involution."""
from collections import defaultdict
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'computation'))
from kl_compute import Coxeter

w = Coxeter('D', 4)
w.kl(False)

def clean(a):
    return {k: v for k, v in a.items() if v}

# An element of the Hecke algebra is represented by coefficients of v^e T_x.
# bar(T_s) = T_s - v + v^-1; the normalized multiplication law gives
# bar(T_s)T_x = T_sx if sx < x, else T_sx - (v-v^-1)T_x.
bars = [{(0, 0): 1}]
for x in range(1, w.N):
    s = next(s for s in range(4) if w.lengths[w.left[s][x]] < w.lengths[x])
    sx = w.left[s][x]
    ans = defaultdict(int)
    for (y, e), value in bars[sx].items():
        ans[(w.left[s][y], e)] += value
        if w.lengths[w.left[s][y]] > w.lengths[y]:
            ans[(y, e + 1)] -= value
            ans[(y, e - 1)] += value
    bars.append(clean(ans))

checks = 0
for y in range(w.N):
    ordinary = defaultdict(int)
    involuted = defaultdict(int)
    for x, p in w.polys[y].items():
        for j, coeff in enumerate(p):
            e = w.lengths[x] - w.lengths[y] + 2 * j
            ordinary[(x, e)] += coeff
            for (z, b), bc in bars[x].items():
                involuted[(z, b - e)] += coeff * bc
    assert clean(ordinary) == clean(involuted), ('bar invariance', w.elems[y])
    assert ordinary[(y, 0)] == 1
    assert all(x == y or e < 0 for (x, e), a in ordinary.items() if a)
    checks += 1

# Compare the inverse-position descent rule with the separately BFS-computed length.
descent_checks = 0
for x, perm in enumerate(w.elems):
    inv = [0] * 4
    for i, a in enumerate(perm):
        inv[abs(a) - 1] = (i + 1) * (1 if a > 0 else -1)
    ds = [inv[0] + inv[1] < 0] + [inv[i] > inv[i+1] for i in range(3)]
    assert ds == [w.lengths[w.left[s][x]] < w.lengths[x] for s in range(4)]
    descent_checks += 4

result = {'bar_invariant_triangular_KL_basis_elements': checks,
          'inverse_position_descent_comparisons': descent_checks,
          'method': 'Hecke bar involution; no second KL recurrence used',
          'failures': 0}
(Path(__file__).with_suffix('.json')).write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
