// Independent interface checks: direct cycle specialization versus runtime,
// rank-seven input round trips and direct E_1 auxiliary corrections.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = __dirname;
const d = require(path.join(root, 'finite_d_domino/domino_runtime.cjs'));
const cy = require(path.join(root, 'finite_d_domino/domino_cycles.cjs'));
const eq = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const specialSeen = new Map();
function directSpecial(t) {
  const key=d.key(t);
  if (specialSeen.has(key)) return specialSeen.get(key);
  const list=d.list(t), cd=cy.cycleData(t), labels=[];
  for (const c of cd.cycles) {
    const boxed = c.labels.map(n=>{const p=list[n-1];return p[3]?p[1]%2===1:p[2]%2===0;});
    assert(boxed.every(b=>b===boxed[0]), 'mixed boxed status');
    if (c.back && !boxed[0]) labels.push(...c.labels);
  }
  const out=cy.move(t,labels);
  assert(d.isSpecialShape(d.shape(out)));
  assert(d.key(out)===d.key(d.special(t)), 'runtime vs simultaneous open-unboxed cycles');
  specialSeen.set(key,out);
  return out;
}

const cert=JSON.parse(fs.readFileSync(path.join(root,'computation/boxed459_finite_complete.json')));
let traceSteps=0, traceInputs=0;
const permutations=new Map();
for(const c of cert.cases)for(const tr of c.traces){
  traceInputs++;
  for(const w of [tr.initial,...tr.path.map(o=>o.output)])permutations.set(w.join(','),w);
  traceSteps+=tr.path.length;
}
for(const w of permutations.values()){
  const r=d.rs(w);
  directSpecial(r.right);
}

// Enumerate rim dominoes from squares and the Young-ideal property.
const memo=new Map();
function tableaux(s){
  const k=s.join(',');if(memo.has(k))return memo.get(k);
  if(!s.length)return [[]];
  const cells=[];s.forEach((n,i)=>{for(let j=1;j<=n;j++)cells.push([i+1,j]);});
  const set=new Set(cells.map(x=>x.join(','))), out=[], n=cells.length/2;
  for(const [r,c] of cells)for(const [u,v] of [[r,c+1],[r+1,c]]){
    if(!set.has([u,v].join(',')))continue;
    const rem=new Set(cells.filter(([a,b])=>!(a===r&&b===c)&&!(a===u&&b===v)).map(x=>x.join(',')));
    let valid=true;
    for(const z of rem){const [a,b]=z.split(',').map(Number);if((a>1&&!rem.has([a-1,b].join(',')))||(b>1&&!rem.has([a,b-1].join(','))))valid=false;}
    if(!valid)continue;
    const small=[];
    for(const z of rem){const [a,b]=z.split(',').map(Number);small[a-1]=Math.max(small[a-1]||0,b);}
    for(const t of tableaux(small))out.push([...t,[n,r,c,u===r?0:1]]);
  }
  assert(new Set(out.map(JSON.stringify)).size===out.length);
  memo.set(k,out);return out;
}
const specs=[
  {shape:[5,4,4,1],bar:[5,3,3,1],largest:[7,2,4,1],star:[6,5],after:[7,3,3,0],norm:[5,5,1,1],
   aux:[[1,1,1,1],[2,1,2,0],[3,3,1,1],[4,1,4,0],[5,2,2,0],[6,3,2,0]]},
  {shape:[3,3,3,2,2,1],bar:[3,3,3,1,1,1],largest:[7,4,2,1],star:[5,6],after:[7,2,3,1],norm:[3,3,2,2,1,1],
   aux:[[1,1,1,1],[2,3,1,1],[3,1,2,0],[4,5,1,1],[5,2,2,1],[6,2,3,1]]}
];
const rank7=[];
for(const c of specs){
  const ps=tableaux(c.bar), qs=tableaux(c.shape), seen=new Set();
  let inputs=0, even=0, odd=0, flips=0;
  assert(ps.length===30&&qs.length===35);
  for(const p of ps)for(const q of qs){
    const input=new d.TableauPair({left:d.fromList([...p,c.largest]),right:d.fromList(q)});
    const w=d.invrs(input);assert(!seen.has(w.join(',')));seen.add(w.join(','));
    const rt=d.rs(w);assert(d.key(rt.left)===d.key(input.left)&&d.key(rt.right)===d.key(input.right));
    if(w.filter(a=>a<0).length%2)odd++;else even++;
    const datum=d.removeLargest(w), reduced=d.rs(datum.w);
    assert(eq(d.list(reduced.left),p));
    let aux=new d.TableauPair({left:d.fromList(c.aux),right:reduced.right});
    if((d.vcount(aux.left)-d.vcount(reduced.left))%4!==0){
      const signed=d.rs(d.sign1(d.invrs(aux)));
      aux=cy.E(aux,1);flips++;
      assert(d.key(aux.left)===d.key(signed.left)&&d.key(aux.right)===d.key(signed.right));
    }
    assert(d.key(directSpecial(aux.right))===d.key(directSpecial(reduced.right)));
    assert((d.vcount(aux.left)+d.vcount(aux.right)-d.vcount(reduced.left)-d.vcount(reduced.right))%4===0);
    const u=d.addLargest(d.invrs(aux),datum);
    assert(eq(d.list(d.rs(u).left).at(-1),c.largest));
    const after=d.star(u,...c.star);
    assert(eq(d.list(d.rs(after).left).at(-1),c.after));
    const reducedAfter=d.rs(d.removeLargest(after).w);
    assert(eq(d.shape(directSpecial(reducedAfter.right)),c.norm));
    inputs++;
  }
  assert(inputs===1050&&flips===490&&even>0&&odd>0);
  rank7.push({shape:c.shape,inputs,even,odd,flips,all_round_trips:true,all_prescribed_intermediates:true});
}
const result={trace_inputs:traceInputs,trace_operator_steps:traceSteps,
  distinct_trace_permutations:permutations.size,
  tableaux_with_independent_cycle_specialization:specialSeen.size,
  rank7,failures:0};
function perms(a){return a.length?a.flatMap((x,i)=>perms(a.filter((_,j)=>i!==j)).map(p=>[x,...p])):[[]];}
const forks=[[[1,1,1,1],[2,1,2,1]],[[1,1,1,0],[2,2,1,1]],[[1,1,1,1],[2,3,1,1]]];
function transpose(list){return list.map(([n,r,c,v])=>[n,c,r,1-v]);}
let descentValues=0,transposePairs=0;
for(const n of [3,4])for(const p of perms(Array.from({length:n},(_,i)=>i+1)))for(let b=0;b<(1<<n);b++){
  const w=p.map((x,i)=>b>>i&1?-x:x), rt=d.rs(w), L=d.list(rt.left), got=[];
  got.push(forks.some(f=>eq(f,L.slice(0,2))));
  for(let i=1;i<n;i++)got.push(L[i-1][1]+L[i-1][3]<L[i][1]);
  assert(eq(got,d.desc(w)), 'tableau vs group descents');descentValues+=n;
  const neg=d.rs(w.map(a=>-a));
  assert(eq(d.list(neg.left),transpose(L))&&eq(d.list(neg.right),transpose(d.list(rt.right))));
  transposePairs++;
}
result.tableau_vs_group_descent_values=descentValues;
result.insertion_transpose_pairs=transposePairs;
fs.writeFileSync(path.join(__dirname,'finite_interfaces_result.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
