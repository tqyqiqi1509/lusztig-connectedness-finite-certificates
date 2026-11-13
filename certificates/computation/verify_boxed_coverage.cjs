// Independent input-set coverage check. No template or path-generator import.
// Enumerate candidate adjacent pairs of squares, retain precisely those whose
// deletion is a Young diagram, and recursively label each deleted rim domino.
const fs = require('fs');
const assert = require('assert');
const d = require('../finite_d_domino/domino_runtime.cjs');
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const memo = new Map();
function tableaux(shape) {
  const key = shape.join(',');
  if (memo.has(key)) return memo.get(key);
  if (!shape.length) return [[]];
  const cells = [];
  for (let r=1;r<=shape.length;r++)
    for (let c=1;c<=shape[r-1];c++) cells.push([r,c]);
  const squareSet = new Set(cells.map(s=>s.join(',')));
  const out = [], n = cells.length/2;
  assert(Number.isInteger(n));
  for (const [r,c] of cells) for (const [u,v] of [[r,c+1],[r+1,c]]) {
    if (!squareSet.has([u,v].join(','))) continue;
    const rem = cells.filter(([a,b])=>!(a===r&&b===c)&&!(a===u&&b===v));
    const reduced = Array(shape.length).fill(0);
    for (const [a,b] of rem) reduced[a-1]++;
    while (reduced.length && reduced.at(-1)===0) reduced.pop();
    if (reduced.some((a,i)=>a<=0||(i&&a>reduced[i-1]))) continue;
    if (rem.some(([a,b])=>b>reduced[a-1])) continue;
    const domino = [n,r,c,u===r?0:1];
    for (const smaller of tableaux(reduced)) out.push([...smaller,domino]);
  }
  assert(new Set(out.map(JSON.stringify)).size===out.length);
  memo.set(key,out);
  return out;
}
// These five claims are the fixed inputs in the manuscript, independent of
// the self-reported counts and case metadata of the archived trace file.
const claims = [
 {shape:[3,3,1,1],residue:2,source:[4,1,3,1],target:[4,2,2,0]},
 {shape:[3,3,1,1],residue:2,source:[4,2,2,0],target:[4,3,1,1]},
 {shape:[3,3,2,2],residue:3,source:[5,1,3,1],target:[5,3,2,1]},
 {shape:[5,5,3,1],residue:0,source:[7,3,2,0],target:[7,2,4,0]},
 {shape:[3,3,3,3,1,1],residue:3,source:[7,4,2,0],target:[7,3,3,1]}
];
const certificate = JSON.parse(fs.readFileSync(__dirname+'/boxed459_finite_complete.json'));
assert(certificate.cases.length===claims.length);
const results = [];
for (let i=0;i<claims.length;i++) {
  const claim=claims[i],recorded=certificate.cases[i];
  for (const k of ['shape','residue','source','target']) assert(equal(claim[k],recorded[k]));
  const all=tableaux(claim.shape);
  const insertions=all.filter(a=>equal(a.at(-1),claim.source)&&a.reduce((s,x)=>s+x[3],0)%4===claim.residue);
  const expected=new Set(),parities={even:0,odd:0};
  for (const p of insertions) for (const q of all) {
    const pair=new d.TableauPair({left:d.fromList(p),right:d.fromList(q)});
    const w=d.invrs(pair), key=w.join(',');
    assert(!expected.has(key),'inverse insertion collision');
    expected.add(key);
    const back=d.rs(w);
    assert(equal(d.list(back.left),p)&&equal(d.list(back.right),q),'inverse insertion round trip');
    parities[w.filter(x=>x<0).length%2?'odd':'even']++;
  }
  const actual=new Set(recorded.traces.map(t=>t.initial.join(',')));
  assert(actual.size===recorded.traces.length,'duplicate trace initial state');
  const missing=[...expected].filter(x=>!actual.has(x));
  const extraneous=[...actual].filter(x=>!expected.has(x));
  assert(missing.length===0&&extraneous.length===0,JSON.stringify({claim,missing,extraneous}));
  results.push({...claim,source_tableaux:insertions.length,recording_tableaux:all.length,
    expected_pairs:expected.size,recorded_pairs:actual.size,missing:missing.length,
    extraneous:extraneous.length,parity_counts:parities});
}
const result={pairs:results.reduce((s,c)=>s+c.expected_pairs,0),failures:0,
  method:'Independent adjacent-square deletion recursion; all inverse-RS inputs compared as exact sets',results};
assert(result.pairs===3549);
fs.writeFileSync(__dirname+'/boxed_coverage_result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
