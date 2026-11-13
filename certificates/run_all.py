#!/usr/bin/env python3
"""Recompute and check every finite input supplied with the finite-type proof."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import os
import platform
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
NODE = shutil.which("node")
if NODE is None:
    raise SystemExit("Node.js is required; no npm packages are required.")
LOGS = ROOT / "logs"
LOGS.mkdir(exist_ok=True)
env = os.environ.copy()
env["PYTHONDONTWRITEBYTECODE"] = "1"
jobs = [
    ("d4_paths", [sys.executable, "-B", "verify_d4_paths.py"], "d4_paths_result.json"),
    ("kl_bar_characterization", [sys.executable, "-B", "verify_kl_bar.py"],
     "verify_kl_bar.json"),
    ("fork_compatibility", [NODE, "finite_d_domino/fork_star_compatibility.cjs"],
     "finite_d_domino/fork_star_compatibility.json"),
    ("d4_tableau_compatibility", [NODE, "finite_d_domino/d4_tableau_compatibility.cjs"],
     "finite_d_domino/d4_tableau_compatibility.json"),
    ("induction_bases", [NODE, "finite_d_domino/induction_base_certificate.cjs"],
     "finite_d_domino/induction_base_certificate.json"),
    ("normalization_exceptions", [NODE, "finite_d_domino/prop458_exception_certificate.cjs"],
     "finite_d_domino/prop458_exception_certificate.json"),
    ("boxed_paths", [NODE, "computation/boxed459_finite_replay.cjs"],
     "computation/boxed459_finite_replay.json"),
    ("boxed_input_coverage", [NODE, "computation/verify_boxed_coverage.cjs"],
     "computation/boxed_coverage_result.json"),
    ("fixed_corner_templates", [sys.executable, "-B", "verify_fixed_corner_graphs.py"],
     "fixed_corner_graphs_result.json"),
    ("finite_interfaces", [NODE, "verify_finite_interfaces.cjs"],
     "finite_interfaces_result.json"),
]
manifest = {
    "started_utc": datetime.now(timezone.utc).isoformat(),
    "python_version": platform.python_version(),
    "node_version": subprocess.check_output([NODE, "--version"], text=True).strip(),
    "scope": "Finite inputs of the type D induction; no extrapolation to larger ranks",
    "jobs": [],
}

def check(name, data):
    if name == "d4_paths":
        assert data["failures"] == 0
        assert (data["group_order"], data["left_cells"], data["directed_operator_arrows"]) == (192, 36, 192)
        assert data["path_lengths"] == {"1": 84, "3": 108}
        return {k: data[k] for k in ("group_order", "left_cells", "kl_polynomial_pairs", "directed_operator_arrows", "path_lengths", "failures")}
    if name == "fork_compatibility":
        assert not data["failures"]
        assert (data["elements"], data["domainElements"], data["closureArrows"]) == (48, 32, 32)
        assert (data["descentValues"], data["transposePairs"]) == (144, 48)
        return {k: data[k] for k in ("elements", "descentValues", "transposePairs", "domainElements", "directCases", "closureArrows", "failures")}
    if name == "d4_tableau_compatibility":
        assert not data["failures"]
        assert (data["signCycleChecks"], data["operatorInputs"], data["operatorArrows"]) == (384, 60, 96)
        assert (data["descentValues"], data["transposePairs"]) == (1536, 384)
        return {k: data[k] for k in ("signCycleChecks", "descentValues", "transposePairs", "operatorInputs", "operatorArrows", "failures")}
    if name == "induction_bases":
        assert len(data) == 3
        for row, expected in zip(data, [(2, 8, 8), (3, 48, 20), (4, 384, 72)]):
            assert (row["rank"], row["elements"], row["components"]) == expected
            assert row["components"] == row["S_parity_fibers"]
            assert row["split_fibers"] == row["mixed_components"] == 0
            assert not row["failures"]
        return data
    if name == "normalization_exceptions":
        assert [r["name"] for r in data["results"]] == ["3prime_a", "6prime_a"]
        for row, shape, last, before, after, reduced in zip(data["results"],
                                   [[5, 5, 3, 1], [3, 3, 3, 3, 1, 1]],
                                   [[7, 3, 2, 0], [7, 3, 3, 1]],
                                   [[7, 2, 4, 1], [7, 4, 2, 1]],
                                   [[7, 3, 3, 0], [7, 2, 3, 1]],
                                   [[5, 5, 1, 1], [3, 3, 2, 2, 1, 1]]):
            assert row["tested"] == 1050 and row["flipped"] == 490
            assert not row["failures"]
            assert row["states"] == [{"shape": shape, "largest": last, "count": 1050}]
            assert sum(step["count"] for step in row["intermediate"]) == 1050
            assert all(step["beforeStar"] == before and step["afterStar"] == after
                       and step["normalizedReducedShape"] == reduced
                       for step in row["intermediate"])
        return data["results"]
    if name == "boxed_paths":
        assert data["failures"] == 0
        assert (data["pairs"], data["steps"], data["ordinary_star_steps"], data["D4_steps"]) == (3549, 25259, 17445, 7814)
        assert [r["pairs"] for r in data["statistics"]] == [8, 16, 60, 1995, 1470]
        return {k: data[k] for k in ("pairs", "steps", "ordinary_star_steps", "D4_steps", "statistics", "failures")}
    if name == "boxed_input_coverage":
        assert data["pairs"] == 3549 and data["failures"] == 0
        assert [r["expected_pairs"] for r in data["results"]] == [8, 16, 60, 1995, 1470]
        assert all(r["missing"] == r["extraneous"] == 0 and r["expected_pairs"] == r["recorded_pairs"] for r in data["results"])
        return data
    if name == "fixed_corner_templates":
        assert data["configurations"] == 8 and data["failures"] == 0
        assert [len(r["components"]) for r in data["results"]] == [1, 3, 1, 2, 2, 1, 1, 2]
        return {"configurations": 8, "failures": 0,
                "results": [{k: r[k] for k in ("shape", "residue", "corners", "components")}
                            for r in data["results"]]}
    if name == "kl_bar_characterization":
        assert data["failures"] == 0
        assert data["bar_invariant_triangular_KL_basis_elements"] == 192
        assert data["inverse_position_descent_comparisons"] == 768
        return data
    if name == "finite_interfaces":
        assert data["failures"] == 0
        assert (data["trace_inputs"], data["trace_operator_steps"],
                data["distinct_trace_permutations"]) == (3549, 25259, 4905)
        assert data["tableaux_with_independent_cycle_specialization"] == 607
        assert data["tableau_vs_group_descent_values"] == 1680
        assert data["insertion_transpose_pairs"] == 432
        assert len(data["rank7"]) == 2
        for row, shape, even, odd in zip(data["rank7"],
                                         [[5, 4, 4, 1], [3, 3, 3, 2, 2, 1]],
                                         [518, 532], [532, 518]):
            assert row["shape"] == shape
            assert (row["inputs"], row["even"], row["odd"], row["flips"]) == (1050, even, odd, 490)
            assert row["all_round_trips"] and row["all_prescribed_intermediates"]
        return data
    raise AssertionError("Unknown job: " + name)

for name, command, result_file in jobs:
    print("Checking " + name, flush=True)
    completed = subprocess.run(command, cwd=ROOT, env=env, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, text=True)
    (LOGS / (name + ".txt")).write_text(completed.stdout)
    if completed.returncode:
        raise RuntimeError(name + " failed; see logs/" + name + ".txt")
    data = json.loads((ROOT / result_file).read_text())
    summary = check(name, data)
    manifest["jobs"].append({"name": name, "status": "passed", "result_file": result_file,
                             "summary": summary})

inputs = [p for p in ROOT.rglob("*") if p.is_file() and
          (p.suffix in (".py", ".cjs", ".js") or p.name == "boxed459_finite_complete.json")]
manifest["input_sha256"] = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
                            for p in sorted(inputs)}
manifest["completed_utc"] = datetime.now(timezone.utc).isoformat()
manifest["status"] = "all passed"
(ROOT / "verification_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"All {len(jobs)} finite-input checks passed. See verification_manifest.json.")
