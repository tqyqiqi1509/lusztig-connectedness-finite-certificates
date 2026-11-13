// Direct finite implementation of cycles and extended cycles from fixed squares.
const d=require('./domino_runtime.cjs');
function cells(p){let [n,r,c,v]=p;return [[r,c],[r+v,c+1-v]];}
function sk(s){return s.join(',');}
function primePositions(t){
 const L=d.list(t),grid=new Map();for(const p of L)for(const s of cells(p))grid.set(sk(s),p[0]);
 function entry(r,c){return r<=0||c<=0?0:(grid.get(sk([r,c]))??Infinity);}
 return L.map(p=>{const n=p[0],ss=cells(p),[r,c]=ss.find(([r,c])=>r%2===c%2),[u,v]=ss.find(([u,v])=>u!==r||v!==c);let z;
  if(u>r||v<c)z=n<entry(r-1,c+1)?[r-1,c]:[r,c+1];
  else z=n<entry(r+1,c-1)?[r,c-1]:[r+1,c];
  return [n,Math.min(r,z[0]),Math.min(c,z[1]),c===z[1]?1:0];
 });
}
function cycleData(t){
 const L=d.list(t),P=primePositions(t),owner=new Map();for(const p of L)for(const s of cells(p))owner.set(sk(s),p[0]-1);
 const par=L.map((_,i)=>i);function find(i){while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;}
 for(let i=0;i<P.length;i++)for(const s of cells(P[i]))if(owner.has(sk(s))){let j=owner.get(sk(s));par[find(i)]=find(j);}
 const comps=new Map();for(let i=0;i<L.length;i++){let k=find(i);if(!comps.has(k))comps.set(k,[]);comps.get(k).push(i+1);}
 const out=[];
 for(const labels of comps.values()){
  const old=new Set(labels.flatMap(n=>cells(L[n-1]).map(sk))),neu=new Set(labels.flatMap(n=>cells(P[n-1]).map(sk)));
  const back=[...old].filter(x=>!neu.has(x)),forward=[...neu].filter(x=>!old.has(x));
  if(back.length!==forward.length||back.length>1)throw Error('Invalid cycle boundary '+JSON.stringify({L,P,labels,back,forward}));
  out.push({labels,back:back[0]??null,forward:forward[0]??null});
 }
 return {cycles:out,prime:P};
}
function move(t,labels){const S=new Set(labels),P=primePositions(t);return d.fromList(d.list(t).map((p,i)=>S.has(p[0])?P[i]:p));}
function extended(pair,label){
 const L=cycleData(pair.left).cycles,R=cycleData(pair.right).cycles,c=L.find(c=>c.labels.includes(label));
 if(!c.back)return {left:c.labels,right:[]};
 const ls=new Set([L.indexOf(c)]),rs=new Set();let changed=true;
 while(changed){changed=false;const boundary=new Set([...ls].flatMap(i=>[L[i].back,L[i].forward]).concat([...rs].flatMap(i=>[R[i].back,R[i].forward])));
  for(let i=0;i<L.length;i++)if(L[i].back&&!ls.has(i)&&(boundary.has(L[i].back)||boundary.has(L[i].forward))){ls.add(i);changed=true;}
  for(let i=0;i<R.length;i++)if(R[i].back&&!rs.has(i)&&(boundary.has(R[i].back)||boundary.has(R[i].forward))){rs.add(i);changed=true;}
 }
 return {left:[...ls].flatMap(i=>L[i].labels),right:[...rs].flatMap(i=>R[i].labels)};
}
function E(pair,label){const c=extended(pair,label);return new d.TableauPair({left:move(pair.left,c.left),right:move(pair.right,c.right)});}
module.exports={cells,primePositions,cycleData,move,extended,E};
