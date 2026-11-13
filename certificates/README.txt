FINITE INPUTS FOR LUSZTIG'S CONNECTEDNESS CONJECTURE IN FINITE TYPE

Recompute every supplied finite check with:

    python3 run_all.py

This command may be run from any working directory by giving run_all.py its
path. Requirements: Python 3.9 or later and Node.js 18 or later on PATH.
Only their standard libraries are used. There are no network requests, npm
packages, Python packages, or computer-algebra-system dependencies.

The command writes verification_manifest.json, ten detailed result files,
and logs/. Assertions check the stated counts and every recorded failure list;
an unsuccessful check terminates the command with a nonzero exit status.
The manifest records runtime versions and SHA-256 hashes of every program
and the finite path certificate used.

CONVENTIONS

A signed permutation is an array [w(1),...,w(n)]. Simple generators multiply
on values on the left. In program arrays their indices are

    0 = s'_1, 1 = s_2, 2 = s_3, 3 = s_4, ..., n-1 = s_n.

The central generator in the D4 subsystem is index 2. A multiplication word
[a,b,c] denotes s_a s_b s_c w and is therefore executed from right to left.
An explicit path-execution list is instead executed from left to right.

A domino is [label,row,column,orientation], where rows and columns begin at
1, orientation 0 is horizontal, and orientation 1 is vertical. The position
is the left square of a horizontal domino or the upper square of a vertical
domino. The D-grid fixed squares have row+column even.

CHECKS

1. verify_d4_paths.py recomputes W(D4), its lengths and Bruhat intervals, all
   9,817 relevant KL polynomials, and the left-cell strongly connected
   components. It independently enumerates all operator type predicates and
   all four candidate words; it reads no precomputed arrow or cell list.
   There are 192 group elements, 36 left cells, and 192 directed operator
   arrows. The prescribed paths have 84 lengths of one and 108 lengths of
   three. Every intermediate vertex is checked to remain in its left cell.
   Result: d4_paths_result.json, including all paths in signed permutations.

2. finite_d_domino/fork_star_compatibility.cjs checks all 48 signed rank-three
   permutations. The 32 fork-star domain elements are covered by 14 direct
   configurations and their inverse/transpose closures, giving 32 arrows.
   Before domain selection it checks all 144 tableau/group descent values,
   including the fork patterns, and all 48 insertion-transpose identities.

3. finite_d_domino/d4_tableau_compatibility.cjs checks the sign-change/extended-
   cycle identity on all 384 signed rank-four permutations, and the complete
   C-to-B tableau rule on 60 input/outer-root pairs (20 distinct signed
   permutations), with 96 outputs. Inverse reciprocity and
   the insertion-transpose identity give the other directions, as proved in
   the paper. All 1,536 tableau/group descent values and 384 transpose
   identities are checked before domain selection.

4. finite_d_domino/induction_base_certificate.cjs checks BOTH signed-parity
   sectors in ranks 2, 3, 4, with 8, 48, 384 signed permutations respectively.
   Operator components agree exactly with (special recording tableau,
   signed parity) fibers: respectively 8, 20, 72 components. Insertion/inverse
   insertion and the total-vertical-count congruence are also checked.

5. finite_d_domino/prop458_exception_certificate.cjs exhausts both fixed
   rank-seven normalization configurations. Each has 30 reduced insertion
   tableaux times 35 full recording tableaux, hence 1,050 inputs. In each
   configuration 490 inputs require the auxiliary sign-change correction.
   This program checks the specific auxiliary endpoint and its subsequent
   operation/reconstruction. Every input is checked against the prescribed
   largest-domino positions before and after the high star and the prescribed
   reduced special shape; run_all.py also checks these complete intermediate
   records. The existence of the lower-rank connecting
   paths is supplied by the rank-six induction hypothesis in the paper;
   the program does not claim to replace that hypothesis by a rank-seven
   connectivity computation.

6. computation/boxed459_finite_replay.cjs replays the complete supplied paths
   for five transfers in four shapes. It checks exact signed-permutation
   transitions, legal operator kinds, adjacent star roots, star domains and
   inverses, D4 types/words/reciprocity, signed
   parity, the special recording tableau throughout, and the exact recording
   tableau and desired largest-domino position at the endpoint. The paths
   have 3,549 inputs and 25,259 steps (17,445 ordinary, 7,814 D4).

7. computation/verify_boxed_coverage.cjs independently generates all standard
   domino tableaux of the four shapes by deleting adjacent square pairs
   that leave a Young diagram. It imports neither the path generator nor
   its tableau enumeration. All admissible (P,Q) inputs are converted by
   inverse insertion, checked by a full round trip, and compared as exact
   sets with the recorded path inputs. There are no missing or extra inputs.

8. verify_fixed_corner_graphs.py independently constructs the eight small
   shape/residue template graphs in the other-residue coverage table. Its
   only rules are pure swaps with a boxed auxiliary domino and the two local
   F patterns. It imports no insertion, signed-permutation, or case-template
   code, and supplies a full tableau witness for every edge. The respective
   component counts are 1,3; 1,2; 2,1; 1,2 in increasing residue order within
   the four shapes. The disconnected entries describe this selected template
   graph, not the full graph of all ordinary stars. The supplied finite paths
   join its remaining components.

9. verify_kl_bar.py checks the defining bar invariance and strict triangularity
   of all 192 rank-four KL basis elements using direct integral Hecke
   multiplication. This verification uses the bar involution instead of a
   second KL recurrence. It also compares 768 inverse-position descent
   values with the BFS length function.

10. verify_finite_interfaces.cjs compares simultaneous movement through all
    open unboxed cycles with the specialization algorithm on 607 distinct
    tableaux. Its inputs include the recording tableaux from all 4,905
    distinct signed permutations in the stored paths. It independently
    enumerates the two rank-seven input sets from adjacent squares and the
    Young-diagram condition, checks insertion round trips, compares each
    needed auxiliary sign change with the actual E_1 cycle move, and asserts
    every prescribed intermediate position and reduced special shape.
    The two configurations have 518/532 and 532/518 even/odd inputs.
    Initial-rank tableau descents and transpose identities are also checked
    directly from the displayed coordinate patterns.

The fixed-transfer input counts are:

 shape               v(P) mod 4   source    target     #P   #Q   #pairs
 (3,3,1,1)                2      V(1,3)    H(2,2)      1    8       8
 (3,3,1,1)                2      H(2,2)    V(3,1)      2    8      16
 (3,3,2,2)                3      V(1,3)    V(3,2)      3   20      60
 (5,5,3,1)                0      H(3,2)    H(2,4)     19  105    1995
 (3,3,3,3,1,1)            3      H(4,2)    V(3,3)     14  105    1470

OPTIONAL REGENERATION OF THE FINITE PATH DATA

The supplied finite path certificate is
computation/boxed459_finite_complete.json. It can also be regenerated by:

    node computation/boxed459_finite_complete.cjs
    python3 run_all.py

The generator performs breadth-first search using only group-defined
ordinary stars and D4 words. It does not call the normalization theorem,
largest-position theorem, or lower-rank transitivity. The replay and the
independent coverage check do not perform that search.

SCOPE AND SOURCE CODE

These are finite inputs to the written induction, not a bounded-rank argument
for all n. The induction, deletion compatibility, persistence, parity routing,
and special-representation count are proved in the manuscript. No exceptional
E-type cell computation is repeated here; that part uses Geck and Halls's
published verification cited in the paper.

finite_d_domino/sources/Tableau.js contains the documented domino insertion
and inverse-insertion implementation. Its original MIT license and copyright
notices are retained unchanged. domino_runtime.cjs is the small interface to
that implementation. domino_cycles.cjs directly implements fixed-square
alternative positions, cycles, and matched extended cycles. The independent
KL path computation uses none of these tableau programs.

All arithmetic in the checks is integral. The routines are transparent finite
verification programs, not a proof-assistant formalization of the manuscript.
