const d=require('./domino_runtime.cjs'),fs=require('fs');
function perms(n){if(!n)return [[]];return perms(n-1).flatMap(a=>Array.from({length:n},(_,i)=>[...a.slice(0,i),n,...a.slice(i)]));}
function allSigned(n){return perms(n).flatMap(a=>Array.from({length:1<<n},(_,b)=>a.map((x,i)=>b>>i&1?-x:x)));}
function type(w){
 const D=d.desc(w),c=2,outer=[0,1,3];
 for(const b of outer){const [g,e]=outer.filter(x=>x!==b);
  if(D[b]&&D[c]&&!D[g]&&!D[e]&&d.star(w,g,c).join()!=d.star(w,e,c).join())return ['A',b];
  if(D[g]&&D[e]&&!D[b]&&!D[c]&&d.star(w,c,g).join()!=d.star(w,c,e).join())return ['B',b];
 }
 if(outer.every(b=>D[b])&&!D[c]&&new Set(outer.map(b=>d.star(w,c,b).join())).size===1)return ['C',null];
 if(D[c]&&outer.every(b=>!D[b])&&new Set(outer.map(b=>d.star(w,b,c).join())).size===1)return ['D',null];
 return null;
}
function mul(w,word){for(const s of word.slice().reverse())w=d.left(w,s);return w;}
function d4outputs(w){
 const tx=type(w);if(!tx)return[];const [t,b0]=tx,c=2,outer=[0,1,3],out=[];
 for(const b of ['A','B'].includes(t)?[b0]:outer){const [g,e]=outer.filter(x=>x!==b);
  const words=[[b],['C','D'].includes(t)?[g,e,c]:[c,g,e],[c,e,c],[c,g,c]];
  const target=t==='A'?['D',null]:t==='B'?['C',null]:t==='C'?['B',b]:['A',b];
  out.push(...words.map(z=>mul(w,z)).filter(z=>JSON.stringify(type(z))===JSON.stringify(target)));
 }return out;
}
const results=[];
for(const n of [2,3,4]){
 const W=allSigned(n),ids=new Map(W.map((w,i)=>[w.join(),i])),p=W.map((_,i)=>i);
 function find(i){while(p[i]!==i){p[i]=p[p[i]];i=p[i];}return i;}
 function join(i,j){p[find(i)]=find(j);}
 const adjacent=[];if(n>=3)adjacent.push([0,2],[1,2]);for(let i=2;i<n-1;i++)adjacent.push([i,i+1]);
 let arrows=0;const bad=[];
 for(let i=0;i<W.length;i++){const w=W[i],D=d.desc(w);let out=[];
  for(const [a,b] of adjacent)if(D[a]!==D[b])out.push(d.star(w,D[a]?b:a,D[a]?a:b));
  if(n===4)out.push(...d4outputs(w));
  for(const v of out){arrows++;join(i,ids.get(v.join()));}
 }
 const comps=new Map(),fibers=new Map();
 for(let i=0;i<W.length;i++){
  const w=W[i],r=d.rs(w),par=w.filter(x=>x<0).length%2,k=par+'|'+d.key(d.special(r.right)),c=find(i);
  if(!comps.has(c))comps.set(c,new Set());comps.get(c).add(k);
  if(!fibers.has(k))fibers.set(k,new Set());fibers.get(k).add(c);
  if(d.invrs(r).join()!==w.join())bad.push({w,error:'inverse RS'});
  if((d.vcount(r.left)+d.vcount(r.right))%4!==2*par)bad.push({w,error:'parity'});
 }
 results.push({rank:n,elements:W.length,operator_arrows:arrows,components:comps.size,S_parity_fibers:fibers.size,split_fibers:[...fibers].filter(([k,s])=>s.size>1).length,mixed_components:[...comps].filter(([k,s])=>s.size>1).length,failures:bad});
}
fs.writeFileSync(__dirname+'/induction_base_certificate.json',JSON.stringify(results,null,2));console.log(results);
module.exports={d4outputs,type};
